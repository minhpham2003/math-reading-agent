import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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

type RenderTask = ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>;
type PageProps = { pdf: PDFDocumentProxy; number: number; scale: number; root: HTMLDivElement | null };

function ContinuousPage({ pdf, number, scale, root }: PageProps) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
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
      } catch (error) {
        if (!disposed && !(error instanceof Error && error.name === 'RenderingCancelledException'))
          console.error('PDF page render failed', number, error);
      }
    })();
    return () => { disposed = true; task?.cancel(); };
  }, [pdf, number, scale, visible]);

  const width = pdfPageWidth * scale;
  return <div ref={holder} className="continuous-pdf-page" data-pdf-page={number}
    style={{ width, minHeight: width * ratio }} aria-label={`PDF page ${number}`}>
    <canvas ref={canvas} aria-hidden="true" style={{ display: visible ? 'block' : 'none' }} />
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
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onPageChange);
  onChangeRef.current = onPageChange;
  const lastPageRef = useRef(initialPage);
  const ignoreScrollRef = useRef(true);

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

  function jump(next: number) {
    if (!pdf || !scrollRoot) return;
    const safe = Math.min(pdf.numPages, Math.max(1, next));
    const el = scrollRoot.querySelector<HTMLElement>(`[data-pdf-page="${safe}"]`);
    if (el) scrollRoot.scrollTo({ top: el.offsetTop - scrollRoot.offsetTop, behavior: 'instant' });
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
      setZoom(1); setFitWidth(true);
      onChangeRef.current(1);
    } catch {
      setMessage('The PDF could not be imported or saved. Check the file and your browser storage.');
    } finally { setBusy(false); }
  }

  const controls = <div className="pdf-toolbar">
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
        <span>PDF </span><input name="page" type="number" min={1} max={pdf.numPages} value={pageInput}
          onChange={e => setPageInput(e.target.value)} aria-label="Jump to PDF page"
          onBlur={() => setPageInput(String(pageNumber))} />
        <span> / {pdf.numPages}</span>
      </form>
      <button className="secondary" onClick={() => jump(pageNumber + 1)} disabled={pageNumber >= pdf.numPages} aria-label="Next PDF page">→</button>
      </div>
      <div className="pdf-control-group pdf-zoom-group">
      <button className="secondary" onClick={() => { setFitWidth(false); setZoom(z => Math.max(.4, +(z - .2).toFixed(1))); }} aria-label="Zoom out">−</button>
      <span className="page-indicator">{fitWidth ? 'Fit width' : Math.round(zoom * 100) + '%'}</span>
      <button className="secondary" onClick={() => { setFitWidth(false); setZoom(z => Math.min(2.4, +(z + .2).toFixed(1))); }} aria-label="Zoom in">+</button>
      <button className="secondary" onClick={() => setFitWidth(true)} aria-label="Fit PDF to available width">↔</button>
      </div>
    </>}
  </div>;

  return <div className="pdf-reader">
    {toolbarHost ? createPortal(controls, toolbarHost) : (!toolbarHostId ? controls : null)}
    {message && <p role="alert" className="pdf-error">{message}</p>}
    {busy && <p className="muted">Importing PDF…</p>}
    {pdf ?
      <div className="pdf-canvas-scroll continuous-scroll" ref={setScrollRoot} onScroll={onScroll}>
        {Array.from({ length: pdf.numPages }, (_, i) =>
          <ContinuousPage key={i + 1} pdf={pdf} number={i + 1} scale={scale} root={scrollRoot} />)}
      </div> :
      <div className="pdf-placeholder"><div className="eyebrow">Real PDF reader</div><h3>Choose a PDF to begin</h3>
        <p>The file is stored locally in this browser for this session. It is not uploaded to a server.</p>
        <p className="muted">PDF page numbers may differ from printed textbook page numbers.</p></div>}
  </div>;
}
