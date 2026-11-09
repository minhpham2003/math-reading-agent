import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import {createTangent,read as readTangents,CHANGED_EVENT,type Anchor} from './tangentStore';

GlobalWorkerOptions.workerSrc = workerUrl;

const DB_NAME = 'higher-math-pdf-files';
const STORE = 'session-pdfs';
type StoredPdf = { id: string; name: string; bytes: ArrayBuffer };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getSavedPdf(id: string): Promise<StoredPdf | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as StoredPdf | undefined);
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}
async function savePdf(id: string, name: string, bytes: ArrayBuffer): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ id, name, bytes });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
/** Validate and attach the uploaded PDF to the new session before opening it. */
export async function importSessionPdf(id: string, file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error('Please choose a PDF file.');
  }
  const bytes = await file.arrayBuffer();
  const task = getDocument({ data: new Uint8Array(bytes.slice(0)) });
  const document = await task.promise;
  try {
    await savePdf(id, file.name, bytes);
  } finally {
    await document.destroy();
  }
}

export async function deleteSavedPdf(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

type Citation = { id: string; filename: string; page: number; text: string; boxes: { x:number;y:number;w:number;h:number }[] };
const refsKey = (sessionId:string) => 'higher-math:citations:' + sessionId;
function readRefs(sessionId:string): Citation[] {
  try { const v:unknown = JSON.parse(localStorage.getItem(refsKey(sessionId)) || '[]'); return Array.isArray(v) ? v as Citation[] : []; }
  catch { return []; }
}
type Box = Citation['boxes'][number];
function tidyBoxes(boxes: Box[]): Box[] {
  // One continuous, glyph-height rectangle per visual line, not one per PDF span.
  const lines: Box[] = [];
  const ordered=boxes.filter(b=>[b.x,b.y,b.w,b.h].every(Number.isFinite)&&b.w>0&&b.h>0)
    .sort((a,b)=>(a.y+a.h/2)-(b.y+b.h/2)||a.x-b.x);
  for(const b of ordered){
    const center=b.y+b.h/2;
    const line=lines.find(r=>Math.abs((r.y+r.h/2)-center)<Math.max(r.h,b.h)*.65);
    if(!line){lines.push({...b});continue;}
    const left=Math.min(line.x,b.x),top=Math.min(line.y,b.y);
    line.w=Math.max(line.x+line.w,b.x+b.w)-left;
    line.h=Math.max(line.y+line.h,b.y+b.h)-top;
    line.x=left;line.y=top;
  }
  return lines.map(b=>({x:b.x,y:b.y+b.h*.22,w:b.w,h:b.h*.56}));
}
type RenderTask = ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>;
type PageProps = { pdf: PDFDocumentProxy; number: number; scale: number; root: HTMLDivElement | null; citations: Citation[]; tangentAnchors: Anchor[]; onTangentClick:(ids:string[],x:number,y:number)=>void; selectionBoxes?: Box[] };

function ContinuousPage({ pdf, number, scale, root, citations, tangentAnchors, onTangentClick, selectionBoxes }: PageProps) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(1.414);

  useEffect(() => {
    if (!root || !holder.current) return;
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false), {
      root, rootMargin: '700px 0px'
    });
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    if (!visible || !canvas.current) return;
    let disposed = false;
    let task: RenderTask | undefined;
    let layer: TextLayer | undefined;
    (async () => {
      try {
        const page = await pdf.getPage(number);
        if (disposed) return;
        const base = page.getViewport({ scale: 1 });
        setRatio(base.height / base.width);
        const viewport = page.getViewport({ scale });
        const element = canvas.current;
        if (!element) return;
        const context = element.getContext('2d');
        if (!context) return;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        element.width = Math.round(viewport.width * pixelRatio);
        element.height = Math.round(viewport.height * pixelRatio);
        element.style.width = viewport.width + 'px';
        element.style.height = viewport.height + 'px';
        task = page.render({ canvasContext: context, viewport: page.getViewport({ scale: scale * pixelRatio }) });
        await task.promise;
        if (disposed || !layerRef.current) return;
        layerRef.current.replaceChildren();
        layer = new TextLayer({ textContentSource: page.streamTextContent(), container: layerRef.current, viewport });
        await layer.render();
      } catch (error) {
        if (!disposed && !(error instanceof Error && error.name === 'RenderingCancelledException'))
          console.error('PDF page render failed', number, error);
      }
    })();
    return () => { disposed = true; task?.cancel(); layer?.cancel(); };
  }, [pdf, number, scale, visible]);

  const width = pdfPageWidth * scale;
  return <div ref={holder} className="continuous-pdf-page" data-pdf-page={number}
    style={{ width, minHeight: width * ratio, '--scale-factor': scale } as CSSProperties} aria-label={`PDF page ${number}`}>
    <canvas ref={canvas} aria-hidden="true" style={{ display: visible ? 'block' : 'none' }} />
    <div ref={layerRef} className="textLayer" />
    {citations.flatMap(ref => tidyBoxes(ref.boxes).map((b, i) =>
      <div key={ref.id + '-' + i} className="source-highlight" title={ref.text}
        style={{left:(b.x*100)+'%',top:(b.y*100)+'%',width:(b.w*100)+'%',height:(b.h*100)+'%'}} />))}
    {tangentAnchors.flatMap(a=>tidyBoxes(a.boxes??[]).map((b,i)=><button key={a.id+'-'+i} type="button" className="t2-pdf-highlight" title={'↗ '+a.text.slice(0,120)} onClick={event=>{event.stopPropagation();const rect=event.currentTarget.getBoundingClientRect();onTangentClick(tangentAnchors.filter(other=>other.boxes?.some(c=>c.x<b.x+b.w&&c.x+c.w>b.x&&c.y<b.y+b.h&&c.y+c.h>b.y)).map(x=>x.id),rect.right,rect.bottom);}} style={{left:b.x*100+'%',top:b.y*100+'%',width:b.w*100+'%',height:b.h*100+'%'}} />))}
    {selectionBoxes?.length ? tidyBoxes(selectionBoxes).map((b,i) => <div key={'selected-'+i} className="visual-selection-highlight" style={{left:(b.x*100)+'%',top:(b.y*100)+'%',width:(b.w*100)+'%',height:(b.h*100)+'%'}} />) : null}
    {!visible && <span className="pdf-page-loading">Page {number}</span>}
  </div>;
}

// Most pages in a document have the same dimensions. Each page replaces the
// approximate reserved height with its actual ratio when it becomes visible.
let pdfPageWidth = 612;

type Props = { sessionId: string; initialPage: number; onPageChange: (page: number) => void; toolbarHostId?: string; actionsHostId?:string; pageJump?: {page:number;seq:number}|null };
export function PdfReader({ sessionId, initialPage, onPageChange, toolbarHostId, actionsHostId, pageJump }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [filename, setFilename] = useState('');
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [availableWidth, setAvailableWidth] = useState(700);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const [actionsHost,setActionsHost]=useState<HTMLElement|null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [citations, setCitations] = useState<Citation[]>(() => readRefs(sessionId));
  const [tangentAnchors,setTangentAnchors]=useState<Anchor[]>(()=>readTangents(sessionId).anchors.filter(a=>a.kind==='pdf'));
  const [tangentMenu,setTangentMenu]=useState<{ids:string[];x:number;y:number}|null>(null);
  const [pending, setPending] = useState<Omit<Citation,'id'> | null>(null);
  const [selectionPoint, setSelectionPoint] = useState<{x:number;y:number} | null>(null);
  const [visualSelection, setVisualSelection] = useState<{page:number;boxes:Box[]} | null>(null);
  const [showCitations, setShowCitations] = useState(false);
  const sourcesRef = useRef<HTMLElement>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onPageChange);
  onChangeRef.current = onPageChange;
  const lastPageRef = useRef(initialPage);
  const ignoreScrollRef = useRef(true);
  const zoomAnchor = useRef<{page:number; fraction:number; viewportY:number} | null>(null);
  const previousScale = useRef<number | null>(null);
  const dragStart = useRef<{x:number;y:number;page:number} | null>(null);

  useEffect(()=>{const sync=(event:Event)=>{const e=event as CustomEvent<{session:string}>;if(e.detail?.session===sessionId)setTangentAnchors(readTangents(sessionId).anchors.filter(a=>a.kind==='pdf'));};window.addEventListener(CHANGED_EVENT,sync);return()=>window.removeEventListener(CHANGED_EVENT,sync);},[sessionId]);
  function openTangentAnchor(ids:string[],x:number,y:number){if(ids.length===1){const a=tangentAnchors.find(a=>a.id===ids[0]);if(a){const data=readTangents(sessionId);writeActive(data,a.branchId);}return;}setTangentMenu({ids,x,y});}
  function writeActive(data:ReturnType<typeof readTangents>,id:string){localStorage.setItem('higher-math:tangents:v2:'+sessionId,JSON.stringify({...data,activeId:id}));window.dispatchEvent(new CustomEvent(CHANGED_EVENT,{detail:{session:sessionId}}));setTangentMenu(null);}
  function createPdfTangent(){if(!pending)return;try{createTangent(sessionId,{kind:'pdf',targetId:filename,page:pending.page,filename:pending.filename,text:pending.text,boxes:pending.boxes});setPending(null);setSelectionPoint(null);setVisualSelection(null);window.getSelection()?.removeAllRanges();}catch{setMessage('Could not create tangent. Check local browser storage.');}}
  useEffect(() => {
    setToolbarHost(toolbarHostId ? window.document.getElementById(toolbarHostId) : null);
    setActionsHost(actionsHostId ? window.document.getElementById(actionsHostId) : null);
  }, [toolbarHostId,actionsHostId]);

  useEffect(() => {
    if (!scrollRoot) return;
    const measure = () => setAvailableWidth(Math.max(100, scrollRoot.clientWidth - 8));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scrollRoot);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    let cancelled = false;
    ignoreScrollRef.current = true;
    lastPageRef.current = initialPage;
    setCitations(readRefs(sessionId)); setPending(null); setSelectionPoint(null); setVisualSelection(null);
    setPdf(null); setFilename(''); setPageNumber(initialPage);
    setPageInput(String(initialPage)); setMessage('');
    getSavedPdf(sessionId).then(async saved => {
      if (!saved || cancelled) return;
      const loaded = await getDocument({ data: new Uint8Array(saved.bytes.slice(0)) }).promise;
      if (cancelled) { await loaded.destroy(); return; }
      setPdf(loaded); setFilename(saved.name);
      const restored = Math.min(Math.max(1, initialPage), loaded.numPages);
      lastPageRef.current = restored;
      setPageNumber(restored); setPageInput(String(restored));
    }).catch(() => {
      if (!cancelled) setMessage('Saved PDF could not be opened. Please import it again.');
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (!pdf || !scrollRoot) return;
    ignoreScrollRef.current = true;
    const target = Math.min(Math.max(1, lastPageRef.current), pdf.numPages);
    const timer = window.setTimeout(() => {
      const el = scrollRoot.querySelector<HTMLElement>(`[data-pdf-page="${target}"]`);
      if (el) scrollRoot.scrollTop = el.offsetTop - scrollRoot.offsetTop;
      window.setTimeout(() => { ignoreScrollRef.current = false; }, 120);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pdf, scrollRoot]);

  const scale = fitWidth ? availableWidth / pdfPageWidth : 1.35 * zoom;

  function pageScrollTop(page:number, fraction=0) {
    if (!scrollRoot) return null;
    const el=scrollRoot.querySelector<HTMLElement>('[data-pdf-page="'+page+'"]');
    if (!el) return null;
    return scrollRoot.scrollTop+el.getBoundingClientRect().top-scrollRoot.getBoundingClientRect().top+fraction*el.offsetHeight;
  }
  function captureZoomAnchor(){
    if(!scrollRoot)return;
    const top=scrollRoot.getBoundingClientRect().top+20;
    const pages=Array.from(scrollRoot.querySelectorAll<HTMLElement>('[data-pdf-page]'));
    const el=pages.find(e=>e.getBoundingClientRect().bottom>top)??pages[pages.length-1];
    if(!el)return;
    const rect=el.getBoundingClientRect();
    zoomAnchor.current={page:Number(el.dataset.pdfPage),fraction:Math.max(0,Math.min(1,(top-rect.top)/rect.height)),viewportY:20};
    previousScale.current=scale;
    ignoreScrollRef.current=true;
  }
  function changeZoom(direction:-1|1){
    captureZoomAnchor();
    const current=fitWidth?scale/1.35:zoom;
    setFitWidth(false);
    setZoom(Math.max(.4,Math.min(2.4,+(current+direction*.2).toFixed(2))));
  }
  function fitPageWidth(){captureZoomAnchor();setFitWidth(true);}
  useLayoutEffect(()=>{
    const a=zoomAnchor.current;
    if(!a||!scrollRoot)return;
    const oldScale=previousScale.current;
    const pos=pageScrollTop(a.page,a.fraction);
    if(pos!==null){
      // Correct the browser's automatic scroll anchoring on scale changes.
      scrollRoot.scrollTop=Math.max(0,pos-a.viewportY);
      window.requestAnimationFrame(()=>{
        const corrected=pageScrollTop(a.page,a.fraction);
        if(corrected!==null)scrollRoot.scrollTop=Math.max(0,corrected-a.viewportY);
      });
    }
    void oldScale;
    zoomAnchor.current=null;
    window.setTimeout(()=>{ignoreScrollRef.current=false;},100);
  },[scale,scrollRoot]);
  function jump(next: number) {
    if (!pdf || !scrollRoot) return;
    const safe = Math.min(pdf.numPages, Math.max(1, next));
    const el = scrollRoot.querySelector<HTMLElement>(`[data-pdf-page="${safe}"]`);
    const pos=pageScrollTop(safe);
    if (el && pos!==null) scrollRoot.scrollTo({top:pos,behavior:'instant'});
    lastPageRef.current = safe;
    setPageNumber(safe);
    setPageInput(String(safe));
    onChangeRef.current(safe);
  }

  useEffect(() => {
    if (pdf && scrollRoot && pageJump) jump(pageJump.page);
  }, [pageJump?.seq, pdf, scrollRoot]);

  function onScroll() {
    if (!scrollRoot || !pdf || ignoreScrollRef.current) return;
    const top = scrollRoot.getBoundingClientRect().top;
    const pages = scrollRoot.querySelectorAll<HTMLElement>('[data-pdf-page]');
    let current = 1;
    for (const el of pages) {
      if (el.getBoundingClientRect().top <= top + 60) current = Number(el.dataset.pdfPage);
      else break;
    }
    if (current !== lastPageRef.current) {
      lastPageRef.current = current;
      setPageNumber(current); setPageInput(String(current));
      onChangeRef.current(current);
    }
  }


  // Visual-order selection: PDF text streams may store a sentence-ending period
  // before its preceding equation. Sort glyphs by their *screen* position instead.
  function captureVisualDrag(endX:number,endY:number) {
    const start=dragStart.current;
    dragStart.current=null;
    if(!start||!scrollRoot||Math.hypot(endX-start.x,endY-start.y)<4)return false;
    const layer=scrollRoot.querySelector<HTMLElement>('[data-pdf-page="'+start.page+'"]');
    if(!layer)return false;
    const pageRect=layer.getBoundingClientRect();
    type Glyph={value:string;rect:DOMRect;cx:number;cy:number};
    const glyphs:Glyph[]=[];
    for(const span of layer.querySelectorAll<HTMLElement>('.textLayer span')){
      const node=span.firstChild;
      if(!node || node.nodeType!==Node.TEXT_NODE || !node.textContent)continue;
      const content=node.textContent;
      const range=window.document.createRange();
      for(let i=0;i<content.length;i++){
        if(content[i]==='\n'||content[i]==='\r')continue;
        range.setStart(node,i);range.setEnd(node,i+1);
        const box=range.getBoundingClientRect();
        if(box.width<.2||box.height<1)continue;
        glyphs.push({value:content[i],rect:box,cx:(box.left+box.right)/2,cy:(box.top+box.bottom)/2});
      }
      range.detach();
    }
    if(!glyphs.length)return false;
    // Build explicit visual lines. A pairwise tolerance comparator is not
    // transitive and can scramble glyphs around superscripts and line ends.
    const rows:{center:number;height:number;items:Glyph[]}[]=[];
    for(const g of [...glyphs].sort((a,b)=>a.cy-b.cy)){
      const row=rows.find(row=>Math.abs(row.center-g.cy)<Math.max(row.height,g.rect.height)*.55);
      if(row){
        row.items.push(g);
        // Keep the row center anchored to dominant (normal-size) text.
        if(g.rect.height>=row.height*.85){
          row.center=(row.center*(row.items.length-1)+g.cy)/row.items.length;
          row.height=Math.max(row.height,g.rect.height);
        }
      } else rows.push({center:g.cy,height:g.rect.height,items:[g]});
    }
    rows.sort((a,b)=>a.center-b.center);
    for(const row of rows)row.items.sort((a,b)=>a.cx-b.cx);
    function nearestPoint(x:number,y:number){
      const row=rows.reduce((best,row)=>Math.abs(row.center-y)<Math.abs(best.center-y)?row:best,rows[0]);
      const items=row.items;
      // Use insertion boundary rather than closest glyph; the right end of a
      // line is after its final glyph, not at that glyph's midpoint.
      let index=items.findIndex(g=>x<g.cx);
      if(index<0)index=items.length;
      return {row:rows.indexOf(row),index};
    }
    const a=nearestPoint(start.x,start.y),b=nearestPoint(endX,endY);
    const forward=a.row<b.row||(a.row===b.row&&a.index<=b.index);
    const first=forward?a:b,last=forward?b:a;
    const chosen:Glyph[]=[];
    for(let row=first.row;row<=last.row;row++){
      const glyphsInRow=rows[row].items;
      const from=row===first.row?first.index:0;
      const to=row===last.row?last.index:glyphsInRow.length;
      chosen.push(...glyphsInRow.slice(from,to));
    }
    if(!chosen.length)return false;
    const boxes=chosen.filter(g=>g.value.trim()).map(g=>({
      x:(g.rect.left-pageRect.left)/pageRect.width,y:(g.rect.top-pageRect.top)/pageRect.height,
      w:g.rect.width/pageRect.width,h:g.rect.height/pageRect.height
    }));
    if(!boxes.length)return false;
    const text=chosen.map(g=>g.value).join('').slice(0,2000);
    setPending({filename,page:start.page,text,boxes});
    setVisualSelection({page:start.page,boxes});
    setSelectionPoint({x:Math.max(8,endX-scrollRoot.getBoundingClientRect().left+scrollRoot.scrollLeft),
      y:Math.max(8,endY-scrollRoot.getBoundingClientRect().top+scrollRoot.scrollTop+8)});
    window.getSelection()?.removeAllRanges();
    setMessage('');
    return true;
  }
  function onPdfMouseDown(event: ReactMouseEvent<HTMLDivElement>){
    if(event.button!==0 || !(event.target instanceof Element)){dragStart.current=null;return;}
    // The last character of a line may have no selectable DOM hit target just
    // beyond its right edge. Allow dragging from the page surface as well as text.
    const page=event.target.closest<HTMLElement>('[data-pdf-page]');
    if(!page || !event.currentTarget.contains(page)){dragStart.current=null;return;}
    dragStart.current={x:event.clientX,y:event.clientY,page:Number(page.dataset.pdfPage)};
  }
  function onPdfMouseUp(event: React.MouseEvent<HTMLDivElement>){
    if(captureVisualDrag(event.clientX,event.clientY))return;
    window.setTimeout(captureSelection,0);
  }

  function captureSelection() {
    if (!scrollRoot) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const text = sel.toString().trim();
    if (!text) return;
    const range = sel.getRangeAt(0);
    const origin = range.startContainer.nodeType === Node.ELEMENT_NODE ?
      range.startContainer as Element : range.startContainer.parentElement;
    const ending = range.endContainer.nodeType === Node.ELEMENT_NODE ?
      range.endContainer as Element : range.endContainer.parentElement;
    const page = origin?.closest<HTMLElement>('[data-pdf-page]');
    if (!page || page !== ending?.closest('[data-pdf-page]') || !scrollRoot.contains(page)) {
      setMessage('Please select a passage within one PDF page.'); return;
    }
    const bounds = page.getBoundingClientRect();
    // Browser selection rectangles include line boxes and trailing whitespace.
    // Intersect them with text spans and then consolidate them per visual line.
    const spans=Array.from(page.querySelectorAll<HTMLElement>('.textLayer span'))
      .filter(el=>range.intersectsNode(el) && !!el.textContent?.trim());
    const rects=Array.from(range.getClientRects()).filter(b=>b.width>0.3 && b.height>1);
    const fragments=rects.flatMap(b=>spans.flatMap(span=>{
      const t=span.getBoundingClientRect();
      const left=Math.max(b.left,t.left),right=Math.min(b.right,t.right);
      const top=Math.max(b.top,t.top),bottom=Math.min(b.bottom,t.bottom);
      if(right-left<.3 || bottom-top<1)return [];
      return [{x:(left-bounds.left)/bounds.width,y:(top-bounds.top)/bounds.height,
        w:(right-left)/bounds.width,h:(bottom-top)/bounds.height}];
    }));
    const boxes=fragments;
    if (!boxes.length) return;
    // If the selection stops just before the last punctuation mark, include
    // that glyph. PDFs frequently isolate the period into a separate span.
    const lastRect=rects.reduce((best,b)=>!best || b.right>best.right ? b : best, undefined as DOMRect | undefined);
    let punctuationSuffix = '';
    if (lastRect) {
      const punctuation=Array.from(page.querySelectorAll<HTMLElement>('.textLayer span'))
        .filter(span => /^[.!?;:,]+$/.test(span.textContent?.trim() ?? ''))
        .map(span=>({span,rect:span.getBoundingClientRect()}))
        .filter(item => {
          const mid=item.rect.top+item.rect.height/2, line=lastRect.top+lastRect.height/2;
          return Math.abs(mid-line)<Math.max(lastRect.height,item.rect.height)*.5 &&
            item.rect.left>=lastRect.right-2 && item.rect.left<=lastRect.right+18;
        }).sort((a,b)=>a.rect.left-b.rect.left)[0];
      if(punctuation && !/[.!?;:,]$/.test(text)) {
        punctuationSuffix=punctuation.span.textContent?.trim() ?? '';
        const b=punctuation.rect;
        boxes.push({x:(b.left-bounds.left)/bounds.width,y:(b.top-bounds.top)/bounds.height,
          w:b.width/bounds.width,h:b.height/bounds.height});
      }
    }
    setPending({filename,page:Number(page.dataset.pdfPage),text:(text + punctuationSuffix).slice(0,2000),boxes});
    setVisualSelection({page:Number(page.dataset.pdfPage),boxes});
    const selectionRects=range.getClientRects();
    const edge=selectionRects.item(selectionRects.length-1) ?? bounds;
    setSelectionPoint({
      x:Math.max(8,edge.right-scrollRoot.getBoundingClientRect().left+scrollRoot.scrollLeft),
      y:Math.max(8,edge.bottom-scrollRoot.getBoundingClientRect().top+scrollRoot.scrollTop+8)
    });
    setMessage('');
  }
  useEffect(() => {
    if (!pending) return;
    const dismiss = (event: PointerEvent) => {
      const element = event.target;
      if (element instanceof Element && element.closest('.floating-citation-action')) return;
      // Allow a new drag selection to replace the pending selection on mouse-up.
      setPending(null);
      setSelectionPoint(null);
      setVisualSelection(null);
    };
    window.document.addEventListener('pointerdown', dismiss);
    return () => window.document.removeEventListener('pointerdown', dismiss);
  }, [pending]);

  useEffect(() => {
    if (!showCitations) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (sourcesRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('.pdf-header-actions')) return;
      setShowCitations(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [showCitations]);

  function saveCitation() {
    if (!pending) return;
    const next = [...citations, {...pending,id:crypto.randomUUID()}];
    try {localStorage.setItem(refsKey(sessionId),JSON.stringify(next));setCitations(next);
      setPending(null);setSelectionPoint(null);setVisualSelection(null);window.getSelection()?.removeAllRanges();setShowCitations(true);}
    catch {setMessage('Could not save the citation in browser storage.');}
  }
  function deleteCitation(id:string) {
    const next = citations.filter(ref => ref.id !== id);
    try {localStorage.setItem(refsKey(sessionId),JSON.stringify(next));setCitations(next);}
    catch {setMessage('Could not delete citation.');}
  }
  function goCitation(ref:Citation) {
    if (ref.filename !== filename) {setMessage('This citation belongs to another imported PDF.');return;}
    const first=tidyBoxes(ref.boxes).sort((a,b)=>a.y-b.y)[0];
    const pos=pageScrollTop(ref.page,first?Math.max(0,first.y-.02):0);
    if(pos!==null && scrollRoot){
      ignoreScrollRef.current=true;
      scrollRoot.scrollTo({top:Math.max(0,pos),behavior:'instant'});
      lastPageRef.current=ref.page;setPageNumber(ref.page);setPageInput(String(ref.page));
      onChangeRef.current(ref.page);
      window.setTimeout(()=>{ignoreScrollRef.current=false;},120);
    } else jump(ref.page);
    setShowCitations(false);
  }

  function submitPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = Number(pageInput);
    if (Number.isInteger(next) && pdf && next >= 1 && next <= pdf.numPages) jump(next);
    else setPageInput(String(pageNumber));
    (event.currentTarget.elements.namedItem('page') as HTMLInputElement | null)?.blur();
  }

  async function importFile(file: File) {
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setMessage('Choose a PDF document.'); return;
    }
    setBusy(true); setMessage('');
    try {
      const bytes = await file.arrayBuffer();
      const loaded = await getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
      await savePdf(sessionId, file.name, bytes);
      ignoreScrollRef.current = true;
      lastPageRef.current = 1;
      setPdf(loaded); setFilename(file.name); setPageNumber(1); setPageInput('1');
      setZoom(1); setFitWidth(true); setPending(null); setSelectionPoint(null); setVisualSelection(null);
      onChangeRef.current(1);
    } catch {
      setMessage('The PDF could not be imported or saved. Check the file and your browser storage.');
    } finally { setBusy(false); }
  }

  const actions=<div className="pdf-header-actions">    <button className="secondary" onClick={() => setShowCitations(v => !v)}>Sources ({citations.length})</button>

  </div>;
  const controls = <div className="pdf-toolbar">
    {filename && <span className="pdf-filename" title={filename}>{filename}</span>}
    {pdf && <>
      <div className="pdf-control-group pdf-navigation-group">
      <button className="secondary" onClick={() => jump(pageNumber - 1)} disabled={pageNumber <= 1} aria-label="Previous PDF page">←</button>
      <form className="pdf-page-form" onSubmit={submitPage}>
        <input name="page" type="number" min={1} max={pdf.numPages} value={pageInput}
          onChange={e => setPageInput(e.target.value)} aria-label="Jump to PDF page"
          onBlur={() => setPageInput(String(pageNumber))} />
        <span> / {pdf.numPages}</span>
      </form>
      <button className="secondary" onClick={() => jump(pageNumber + 1)} disabled={pageNumber >= pdf.numPages} aria-label="Next PDF page">→</button>
      </div>
      <div className="pdf-control-group pdf-zoom-group">
      <button className="secondary" onClick={() => changeZoom(-1)} aria-label="Zoom out">−</button>
      <span className="page-indicator">{Math.round(scale * 100) + '%'}</span>
      <button className="secondary" onClick={() => changeZoom(1)} aria-label="Zoom in">+</button>
      <button className="secondary" onClick={fitPageWidth} aria-label="Fit PDF to available width">↔</button>
      </div>
    </>}
  </div>;

  return <div className={visualSelection ? "pdf-reader has-visual-selection" : "pdf-reader"}>
    {toolbarHost ? createPortal(controls, toolbarHost) : (!toolbarHostId ? controls : null)}
    {actionsHost ? createPortal(actions,actionsHost) : (!actionsHostId ? actions : null)}
    {message && <p role="alert" className="pdf-error">{message}</p>}
    {busy && <p className="muted">Importing PDF…</p>}
    {showCitations && <aside ref={sourcesRef} className="sources-drawer" aria-label="Saved source references">
      <div className="sources-heading"><strong>Saved citations</strong><button onClick={() => setShowCitations(false)}>×</button></div>
      {citations.length===0 && <p>Select text in your PDF to create a citation.</p>}
      {citations.map(ref => <div className="source-entry" key={ref.id}>
        <button className="source-entry-link" onClick={() => goCitation(ref)}>
          <strong>{ref.filename} · p. {ref.page}</strong><span>“{ref.text}”</span></button>
        <button className="secondary" onClick={() => void navigator.clipboard.writeText(ref.filename+', PDF p. '+ref.page+': “'+ref.text+'”').catch(()=>setMessage('Clipboard unavailable.'))}>Copy</button>
        <button className="secondary" onClick={() => deleteCitation(ref.id)}>Remove</button>
      </div>)}
    </aside>}
    {pdf ?
      <div className="pdf-canvas-scroll continuous-scroll" ref={setScrollRoot} onScroll={onScroll} onMouseDown={onPdfMouseDown} onMouseUp={onPdfMouseUp} onKeyUp={() => window.setTimeout(captureSelection,0)}>
    {tangentMenu&&<div className="t2-pdf-menu" style={{left:tangentMenu.x,top:tangentMenu.y}}><strong>Related tangents</strong>{tangentMenu.ids.map(id=>{const a=tangentAnchors.find(x=>x.id===id);const state=readTangents(sessionId);const t=state.threads.find(t=>t.id===a?.branchId);return t?<button key={id} type="button" onClick={()=>writeActive(state,t.id)}>{t.title} · {t.status}</button>:null;})}<button type="button" onClick={()=>setTangentMenu(null)}>Close</button></div>}
    {pending && selectionPoint && <div className="floating-citation-action" style={{left:selectionPoint.x,top:selectionPoint.y}}>
      <button type="button" className="primary" onClick={saveCitation}>Save Citation</button><button type="button" className="primary" onClick={createPdfTangent}>↗ Create Tangent</button>
    </div>}
        {Array.from({ length: pdf.numPages }, (_, i) =>
          <ContinuousPage key={i + 1} pdf={pdf} number={i + 1} scale={scale} root={scrollRoot} citations={citations.filter(c=>c.page===i+1 && c.filename===filename)} tangentAnchors={tangentAnchors.filter(a=>a.page===i+1 && a.filename===filename)} onTangentClick={openTangentAnchor} selectionBoxes={visualSelection?.page===i+1 ? visualSelection.boxes : undefined} />)}
      </div> :
      <div className="pdf-placeholder"><div className="eyebrow">Real PDF reader</div><h3>Choose a PDF to begin</h3>
        <label className="primary pdf-import pdf-empty-import">Import PDF
          <input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e => {
            const file=e.target.files?.[0]; if(file) void importFile(file); e.target.value='';
          }} />
        </label>
        <p>The file is stored locally in this browser for this session. It is not uploaded to a server.</p>
        <p className="muted">PDF page numbers may differ from printed textbook page numbers.</p></div>}
  </div>;
}
