import { useEffect, useRef, useState } from 'react';
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

type Props = { sessionId: string; initialPage: number; onPageChange: (page: number) => void; toolbarHostId?: string };
export function PdfReader({ sessionId, initialPage, onPageChange, toolbarHostId }: Props) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [filename, setFilename] = useState('');
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [availableWidth, setAvailableWidth] = useState(700);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToolbarHost(toolbarHostId ? window.document.getElementById(toolbarHostId) : null);
  }, [toolbarHostId]);
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const measure = () => setAvailableWidth(Math.max(100, scroll.clientWidth - 4));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [document]);

  useEffect(() => {
    let cancelled = false;
    setDocument(null); setFilename(''); setPageNumber(initialPage); setMessage('');
    getSavedPdf(sessionId).then(async saved => {
      if (!saved || cancelled) return;
      const pdf = await getDocument({ data: new Uint8Array(saved.bytes.slice(0)) }).promise;
      if (cancelled) { await pdf.destroy(); return; }
      setDocument(pdf); setFilename(saved.name);
      setPageNumber(Math.min(Math.max(1, initialPage), pdf.numPages));
    }).catch(() => {
      if (!cancelled) setMessage('Saved PDF could not be opened. Please import it again.');
    });
    return () => { cancelled = true; };
  }, [sessionId]); // Initial position is intentionally restored when the session changes.

  useEffect(() => {
    if (!document || !canvasRef.current) return;
    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    const draw = async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        const baseWidth = page.getViewport({ scale: 1 }).width;
        const renderScale = fitWidth ? availableWidth / baseWidth : 1.35 * zoom;
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable');
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = viewport.width + 'px';
        canvas.style.height = viewport.height + 'px';
        renderTask = page.render({ canvasContext: context, viewport: page.getViewport({ scale: renderScale * ratio }) });
        await renderTask.promise;
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === 'RenderingCancelledException')) {
          setMessage('Unable to render this page.');
        }
      }
    };
    void draw();
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [document, pageNumber, zoom, fitWidth, availableWidth]);

  function jump(next: number) {
    if (!document) return;
    const safe = Math.min(document.numPages, Math.max(1, next));
    setPageNumber(safe);
    onPageChange(safe);
  }

  async function importFile(file: File) {
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setMessage('Choose a PDF document.'); return;
    }
    setBusy(true); setMessage('');
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
      await savePdf(sessionId, file.name, bytes);
      setDocument(pdf); setFilename(file.name); setPageNumber(1); setZoom(1); setFitWidth(true);
      onPageChange(1);
    } catch {
      setMessage('The PDF could not be imported or saved. Check the file and your browser storage.');
    } finally { setBusy(false); }
  }

  const controls = <div className="pdf-toolbar">
      <label className="secondary pdf-import">
        {filename ? 'Replace PDF' : 'Import PDF'}
        <input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e => {
          const file = e.target.files?.[0]; if (file) void importFile(file); e.target.value = '';
        }} />
      </label>
      {filename && <span className="pdf-filename" title={filename}>{filename}</span>}
      {document && <>
        <button className="secondary" onClick={() => jump(pageNumber - 1)} disabled={pageNumber <= 1} aria-label="Previous PDF page">←</button>
        <span className="page-indicator">PDF {pageNumber} / {document.numPages}</span>
        <button className="secondary" onClick={() => jump(pageNumber + 1)} disabled={pageNumber >= document.numPages} aria-label="Next PDF page">→</button>
        <button className="secondary" onClick={() => { setFitWidth(false); setZoom(z => Math.max(.4, +(z - .2).toFixed(1))); }} aria-label="Zoom out">−</button>
        <span className="page-indicator">{fitWidth ? "Fit width" : Math.round(zoom * 100) + "%"}</span>
        <button className="secondary" onClick={() => { setFitWidth(false); setZoom(z => Math.min(2.4, +(z + .2).toFixed(1))); }} aria-label="Zoom in">+</button>
        <button className="secondary" onClick={() => setFitWidth(true)} aria-label="Fit PDF to available width" title="Fit width">↔</button>
      </>}
    </div>;
  return <div className="pdf-reader">
    {toolbarHost ? createPortal(controls, toolbarHost) : (!toolbarHostId ? controls : null)}
    {message && <p role="alert" className="pdf-error">{message}</p>}
    {busy && <p className="muted">Importing PDF…</p>}
    {document ?
      <div className="pdf-canvas-scroll" ref={scrollRef}><canvas ref={canvasRef} aria-label={`PDF page ${pageNumber}`} /></div> :
      <div className="pdf-placeholder"><div className="eyebrow">Real PDF reader</div><h3>Choose a PDF to begin</h3><p>The file is stored locally in this browser for this session. It is not uploaded to a server.</p><p className="muted">PDF page numbers may differ from printed textbook page numbers.</p></div>}
  </div>;
}
