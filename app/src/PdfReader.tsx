import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { getDocument, GlobalWorkerOptions, TextLayer, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';

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
type PageProps = { pdf: PDFDocumentProxy; number: number; scale: number; root: HTMLDivElement | null; citations: Citation[] };

function ContinuousPage({ pdf, number, scale, root, citations }: PageProps) {
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
    {!visible && <span className="pdf-page-loading">Page {number}</span>}
  </div>;
}

// Most pages in a document have the same dimensions. Each page replaces the
// approximate reserved height with its actual ratio when it becomes visible.
let pdfPageWidth = 612;

type Props = { sessionId: string; initialPage: number; onPageChange: (page: number) => void; toolbarHostId?: string };
export function PdfReader({ sessionId, initialPage, onPageChange, toolbarHostId }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [filename, setFilename] = useState('');
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [availableWidth, setAvailableWidth] = useState(700);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [citations, setCitations] = useState<Citation[]>(() => readRefs(sessionId));
  const [pending, setPending] = useState<Omit<Citation,'id'> | null>(null);
  const [selectionPoint, setSelectionPoint] = useState<{x:number;y:number} | null>(null);
  const [showCitations, setShowCitations] = useState(false);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onPageChange);
  onChangeRef.current = onPageChange;
  const lastPageRef = useRef(initialPage);
  const ignoreScrollRef = useRef(true);
  const zoomAnchor = useRef<{page:number; fraction:number; viewportY:number} | null>(null);
  const previousScale = useRef<number | null>(null);

  useEffect(() => {
    setToolbarHost(toolbarHostId ? window.document.getElementById(toolbarHostId) : null);
  }, [toolbarHostId]);

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
    setCitations(readRefs(sessionId)); setPending(null); setSelectionPoint(null);
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
    setPending({filename,page:Number(page.dataset.pdfPage),text:text.slice(0,2000),boxes});
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
    };
    window.document.addEventListener('pointerdown', dismiss);
    return () => window.document.removeEventListener('pointerdown', dismiss);
  }, [pending]);

  function saveCitation() {
    if (!pending) return;
    const next = [...citations, {...pending,id:crypto.randomUUID()}];
    try {localStorage.setItem(refsKey(sessionId),JSON.stringify(next));setCitations(next);
      setPending(null);setSelectionPoint(null);window.getSelection()?.removeAllRanges();setShowCitations(true);}
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
      setZoom(1); setFitWidth(true); setPending(null); setSelectionPoint(null);
      onChangeRef.current(1);
    } catch {
      setMessage('The PDF could not be imported or saved. Check the file and your browser storage.');
    } finally { setBusy(false); }
  }

  const controls = <div className="pdf-toolbar">
    <button className="secondary" onClick={() => setShowCitations(v => !v)}>Sources ({citations.length})</button>
    <label className="secondary pdf-import">{filename ? 'Replace PDF' : 'Import PDF'}
      <input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e => {
        const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = '';
      }} />
    </label>
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
      <span className="page-indicator">{fitWidth ? 'Fit width' : Math.round(zoom * 100) + '%'}</span>
      <button className="secondary" onClick={() => changeZoom(1)} aria-label="Zoom in">+</button>
      <button className="secondary" onClick={fitPageWidth} aria-label="Fit PDF to available width">↔</button>
      </div>
    </>}
  </div>;

  return <div className="pdf-reader">
    {toolbarHost ? createPortal(controls, toolbarHost) : (!toolbarHostId ? controls : null)}
    {message && <p role="alert" className="pdf-error">{message}</p>}
    {busy && <p className="muted">Importing PDF…</p>}
    {showCitations && <aside className="sources-drawer" aria-label="Saved source references">
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
      <div className="pdf-canvas-scroll continuous-scroll" ref={setScrollRoot} onScroll={onScroll} onMouseUp={() => window.setTimeout(captureSelection,0)} onKeyUp={() => window.setTimeout(captureSelection,0)}>
    {pending && selectionPoint && <div className="floating-citation-action" style={{left:selectionPoint.x,top:selectionPoint.y}}>
      <button type="button" className="primary" onClick={saveCitation}>Save Citation</button>
    </div>}
        {Array.from({ length: pdf.numPages }, (_, i) =>
          <ContinuousPage key={i + 1} pdf={pdf} number={i + 1} scale={scale} root={scrollRoot} citations={citations.filter(c=>c.page===i+1 && c.filename===filename)} />)}
      </div> :
      <div className="pdf-placeholder"><div className="eyebrow">Real PDF reader</div><h3>Choose a PDF to begin</h3>
        <p>The file is stored locally in this browser for this session. It is not uploaded to a server.</p>
        <p className="muted">PDF page numbers may differ from printed textbook page numbers.</p></div>}
  </div>;
}
