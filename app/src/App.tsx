import { useEffect, useState, useRef, type PointerEvent as ReactPointerEvent, type FormEvent } from 'react';
import { loadSessions, saveSessions, type ReadingSession } from './storage';
import { PdfReader, deleteSavedPdf, importSessionPdf } from './PdfReader';
import { ReadingFlow } from './ReadingFlow';
import {deletePdfIndex} from './pdfIndex';
import {buildCommit} from './tangentStore';
import {getDocument,GlobalWorkerOptions,type PDFDocumentProxy} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerUrl;

type SessionFormState = {
  title: string; target: string; firstPage: string; lastPage: string; durationMinutes: string;
};
const initialForm: SessionFormState = { title: '', target: '', firstPage: '', lastPage: '', durationMinutes: '60' };

export function App() {
  const [sessions, setSessions] = useState<ReadingSession[]>(loadSessions);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const value = window.location.hash;
    return value.startsWith('#session-') ? decodeURIComponent(value.slice(9)) : null;
  });
  const [surface,setSurface]=useState<'library'|'project'>(()=>window.location.hash==='#project-hatcher'?'project':'library');
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [newProjectOpen,setNewProjectOpen]=useState(false);
  const [form, setForm] = useState<SessionFormState>(initialForm);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [pdfPageCount,setPdfPageCount]=useState<number|null>(null);
  const [checkingPdf,setCheckingPdf]=useState(false);
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pageJump, setPageJump] = useState<{page:number;seq:number;quote?:string}|null>(null);
  const [agentOpen, setAgentOpen] = useState(true);
  const [theme,setTheme]=useState<'dark'|'light'>(()=>localStorage.getItem('higher-math:theme')==='light'?'light':'dark');
  useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;localStorage.setItem('higher-math:theme',theme);},[theme]);
  const [agentFraction,setAgentFraction]=useState(()=>{const n=Number(localStorage.getItem('higher-math:agent-pane-fraction'));return n>=.25&&n<=.75?n:.46;});
  const gridRef=useRef<HTMLDivElement>(null);
  const dragFractionRef=useRef(agentFraction);
  const dragFrameRef=useRef<number|null>(null);
  useEffect(()=>()=>{if(dragFrameRef.current!==null)cancelAnimationFrame(dragFrameRef.current);},[]);
  function resizeStart(e:ReactPointerEvent<HTMLDivElement>){if(e.button!==0||!gridRef.current)return;e.preventDefault();dragFractionRef.current=agentFraction;e.currentTarget.setPointerCapture(e.pointerId);gridRef.current.classList.add('is-resizing');}
  function resizeMove(e:ReactPointerEvent<HTMLDivElement>){
    if(!e.currentTarget.hasPointerCapture(e.pointerId)||!gridRef.current)return;
    const box=gridRef.current.getBoundingClientRect();
    const frac=Math.min(.75,Math.max(.25,1-(e.clientX-box.left)/box.width));
    dragFractionRef.current=frac;
    if(dragFrameRef.current!==null)return;
    dragFrameRef.current=requestAnimationFrame(()=>{
      dragFrameRef.current=null;
      if(gridRef.current)gridRef.current.style.gridTemplateColumns=`minmax(0, ${1-dragFractionRef.current}fr) 8px minmax(0, ${dragFractionRef.current}fr)`;
    });
  }
  function resizeEnd(e:ReactPointerEvent<HTMLDivElement>){
    if(!e.currentTarget.hasPointerCapture(e.pointerId))return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if(dragFrameRef.current!==null){cancelAnimationFrame(dragFrameRef.current);dragFrameRef.current=null;}
    gridRef.current?.classList.remove('is-resizing');
    setAgentFraction(dragFractionRef.current);
    localStorage.setItem('higher-math:agent-pane-fraction',String(dragFractionRef.current));
  }

  const active = sessions.find(s => s.id === activeId) ?? null;
  const pendingDelete = sessions.find(s => s.id === deleteId);
  const latestSession=[...sessions].sort((x,y)=>new Date(y.updatedAt).getTime()-new Date(x.updatedAt).getTime())[0];
  const completedSessions=sessions.filter(s=>s.status==='complete').length;
  const activeSessions=sessions.filter(s=>s.status==='in-progress'||s.status==='paused').length;
  const formatActivity=(value:string)=>new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:new Date(value).getFullYear()===new Date().getFullYear()?undefined:'numeric'});

  function persist(next: ReadingSession[]): boolean {
    try { saveSessions(next); setSessions(next); setStorageError(''); return true; }
    catch { setStorageError('Could not save changes to this browser. Check storage permissions.'); return false; }
  }
  function navigate(id: string | null) {
    setActiveId(id);
    setSurface('project');
    window.history.replaceState(null, '', id ? '#session-' + encodeURIComponent(id) : '#project-hatcher');
  }
  function openLibrary(){
    setActiveId(null);setSurface('library');
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
  }
  function openProject(){
    setActiveId(null);setSurface('project');
    window.history.replaceState(null,'','#project-hatcher');
  }
  async function choosePdf(file:File|null){
    setNewPdf(file);setPdfPageCount(null);setFormError('');
    if(!file)return;
    setCheckingPdf(true);
    let doc:PDFDocumentProxy|undefined;
    try{
      const task=getDocument({data:new Uint8Array(await file.arrayBuffer())});
      doc=await task.promise;
      setPdfPageCount(doc.numPages);
      setForm(prev=>({...prev,firstPage:prev.firstPage&&Number(prev.firstPage)<=doc!.numPages?prev.firstPage:'1',lastPage:prev.lastPage&&Number(prev.lastPage)<=doc!.numPages?prev.lastPage:String(doc!.numPages)}));
    }catch{setFormError('Could not read the PDF page count. Please choose a valid PDF.');}
    finally{if(doc)await doc.destroy();setCheckingPdf(false);}
  }
  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = Number(form.firstPage), last = Number(form.lastPage);
    if (!form.title.trim() || !form.target.trim() || !Number.isInteger(first) || first < 1 || !Number.isInteger(last) || last < first) {
      setFormError('Enter a title, reading target, and a valid printed-page range.'); return;
    }
    if (!newPdf) { setFormError('Choose the PDF for this reading session.'); return; }
    if(checkingPdf||!pdfPageCount){setFormError('The PDF page count must be verified before creating the session.');return;}
    if(first>pdfPageCount||last>pdfPageCount){setFormError('Select a page range between 1 and '+pdfPageCount+'.');return;}
    setCreating(true);
    setFormError('');
    const now = new Date().toISOString();
    const session: ReadingSession = {
      id: crypto.randomUUID(), title: form.title.trim(), target: form.target.trim(),
      firstPage: first, lastPage: last, durationMinutes: Number(form.durationMinutes),
      createdAt: now, updatedAt: now, status: 'not-started', currentPrintedPage: first
    };
    try {
      await importSessionPdf(session.id, newPdf);
      if (!persist([...sessions, session])) {
        await deleteSavedPdf(session.id).catch(() => undefined);
        return;
      }
      setNewSessionOpen(false); setForm(initialForm); setNewPdf(null); setFormError(''); navigate(session.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not import this PDF. Try another file.');
    } finally {
      setCreating(false);
    }
  }
  function deleteSession() {
    if (!deleteId) return;
    if (persist(sessions.filter(s => s.id !== deleteId))) {
      if (activeId === deleteId) navigate(null);
      setDeleteId(null);
      localStorage.removeItem('higher-math:citations:' + deleteId);
      localStorage.removeItem('higher-math:reading-flow:v1:' + deleteId);
      localStorage.removeItem('higher-math:reading-notes:v1:' + deleteId);
      localStorage.removeItem('higher-math:tangents:v2:' + deleteId);
      void deleteSavedPdf(deleteId).catch(() => setStorageError('Session deleted, but its cached PDF could not be cleared.'));
      void deletePdfIndex(deleteId).catch(()=>undefined);
    }
  }
  function updatePage(page: number) {
    if (!active || page < 1) return;
    const now = new Date().toISOString();
    persist(sessions.map(s => s.id === active.id ? {
      ...s, pdfPage: page, updatedAt: now, status: 'in-progress'
    } : s));
  }
  useEffect(() => {
    function handleKeys(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (deleteId) setDeleteId(null);
      else if (newSessionOpen && !creating) { setNewSessionOpen(false); setFormError(''); }
    }
    document.addEventListener('keydown', handleKeys);
    return () => document.removeEventListener('keydown', handleKeys);
  }, [deleteId, newSessionOpen, creating]);

  return <div className="app-shell">
    {!active && <header className="topbar"><span className="brand">∑ &nbsp; Mathematical Reading Agent</span><button className="reader-theme-toggle" type="button" onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?'☀':'☾'}</button></header>}
    {storageError && <div role="alert" className="alert">{storageError}</div>}
    {!active ? (surface==='library' ? <main className="library-page">
      <div className="library-heading-row">
        <div><div className="eyebrow">Your workspace</div><h1>Library</h1><p>Continue a mathematical project or return to where you left off.</p></div>
        <button className="primary" onClick={()=>setNewProjectOpen(true)}>+ New Project</button>
      </div>
      <section className="library-projects">
        <article className="library-project-card">
          <div className="library-project-top">
            <div><div className="eyebrow">Book project</div><h2>Algebraic Topology</h2><p>Allen Hatcher</p></div>
            <span className="library-status">Active</span>
          </div>
          <div className="library-current">
            <span className="library-current-label">Current reading</span>
            {latestSession ? <>
              <strong>{latestSession.title}</strong>
              <span>{latestSession.target}</span>
              <small>Last activity {formatActivity(latestSession.updatedAt)}</small>
            </> : <>
              <strong>No reading session yet</strong>
              <span>Start with a section or reading target from Hatcher.</span>
            </>}
          </div>
          <div className="library-project-meta">
            <span><strong>{sessions.length}</strong> sessions</span>
            <span><strong>{activeSessions}</strong> active</span>
            <span><strong>{completedSessions}</strong> completed</span>
          </div>
          <div className="library-project-actions">
            {latestSession && <button className="primary" onClick={()=>navigate(latestSession.id)}>Resume reading</button>}
            <button className="secondary" onClick={openProject}>Open project →</button>
          </div>
        </article>
      </section>
    </main> : <main className="dashboard">
      <button className="breadcrumb breadcrumb-button" onClick={openLibrary}>← Library</button>
      <div className="hero"><div><div className="eyebrow">Book project</div><h1>Algebraic Topology <a className="project-build-id" href={'https://github.com/minhpham2003/math-reading-agent/commit/'+buildCommit} target="_blank" rel="noreferrer" title={'Open GitHub commit '+buildCommit}>GitHub {buildCommit}</a></h1><p>Allen Hatcher · Your reading workspace</p></div>
        <div className="project-hero-actions">{latestSession && <button className="secondary" onClick={()=>navigate(latestSession.id)}>Continue reading</button>}<button className="primary" onClick={() => setNewSessionOpen(true)}>+ New Session</button></div>
      </div>
      <div className="dashboard-grid">
        <section className="card"><h2>Reading sessions</h2>
          {!sessions.length ? <p className="muted">No reading sessions yet. Create your first one to get started.</p> :
            [...sessions].reverse().map(s => <div className="session-row" key={s.id}>
              <div><strong>{s.title}</strong><div className="muted">{s.target} · pp. {s.firstPage}–{s.lastPage} · {s.durationMinutes} min</div>
                <button className="text-button" onClick={() => navigate(s.id)}>Open →</button></div>
              <div className="session-actions"><span className="badge">{s.status.replace('-', ' ')}</span><button className="menu-button" aria-label={'Delete ' + s.title} title="Delete session" onClick={() => setDeleteId(s.id)}>⋯</button></div>
            </div>)}
        </section>
        <div className="side-stack"><section className="card"><div className="eyebrow">Your progress</div><div className="stat">{sessions.length}</div><p>sessions created in this browser</p><div className="progress"><div style={{width: Math.min(sessions.length * 12, 100) + '%'}} /></div><div className="muted">Local activity · not book completion</div></section>
          <section className="card"><h2>Project sources</h2><div className="source"><strong>Algebraic Topology — Hatcher</strong><span className="muted">Primary text · Primary text · used by your reading sessions</span></div></section></div>
      </div>
      <p className="notice">Project data, PDFs, reading plans, branches, and conversations are currently stored in this browser. Cloud sync is not yet connected.</p>
    </main>) : <section className="workspace">
      <div className="reader-header">
        <div className="reader-header-identity">
          <button className="reader-back" onClick={openProject} aria-label="Back to Hatcher dashboard" title="Back to dashboard">←</button>
          <span className="reader-session-name" title={active.title}>{active.title}</span><span className="reader-session-dot" aria-hidden="true">·</span><span className="reader-session-section" title={active.target}>{active.target}</span>

        </div>
        <div id="reader-toolbar-slot" className="reader-toolbar-slot" aria-label="PDF controls"></div>
        <div className="reader-header-right"><div id="reading-plan-toolbar-slot" className="reading-plan-toolbar-slot"/><div id="reader-actions-slot" className="reader-actions-slot" aria-label="Document actions"></div><button className="reader-agent-toggle" type="button" onClick={() => setAgentOpen(v => !v)} aria-pressed={agentOpen}>{agentOpen ? 'Hide agent' : 'Show agent'}</button><button className="reader-theme-toggle" type="button" onClick={()=>setTheme(v=>v==='dark'?'light':'dark')} aria-label={theme==='dark'?'Switch to light mode':'Switch to dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?'☀':'☾'}</button></div>
      </div>
      <div ref={gridRef} className={agentOpen ? "work-grid split-enabled" : "work-grid split-enabled agent-collapsed"} style={{gridTemplateColumns:agentOpen?`minmax(0, ${1-agentFraction}fr) 8px minmax(0, ${agentFraction}fr)`:'minmax(0, 1fr) 0px minmax(0, 0fr)'}}> 
        <article className="work-panel pdf-panel">
          <PdfReader key={active.id} sessionId={active.id} initialPage={active.pdfPage ?? 1} onPageChange={updatePage} toolbarHostId="reader-toolbar-slot" actionsHostId="reader-actions-slot" pageJump={pageJump} />
        </article>
        <div className="pane-resizer" role="separator" aria-label="Resize PDF and agent panels" aria-orientation="vertical" aria-valuenow={Math.round((1-agentFraction)*100)} tabIndex={0} onPointerDown={resizeStart} onPointerMove={resizeMove} onPointerUp={resizeEnd} onPointerCancel={resizeEnd} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();const next=Math.min(.75,Math.max(.25,agentFraction+(e.key==="ArrowRight"?-.03:.03)));setAgentFraction(next);localStorage.setItem("higher-math:agent-pane-fraction",String(next));}}}/>        <article className="work-panel agent-panel" aria-hidden={!agentOpen} inert={!agentOpen}>
          <ReadingFlow key={active.id} sessionId={active.id} title={active.target}
            firstPage={active.firstPage} lastPage={active.lastPage} duration={active.durationMinutes} currentPdfPage={active.pdfPage}
            onNavigate={(page,quote) => setPageJump(old=>({page,quote,seq:(old?.seq??0)+1}))}/>
        </article>
      </div>
    </section>}
    {newProjectOpen && <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setNewProjectOpen(false);}}>
      <div className="dialog new-project-dialog" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
        <h2 id="new-project-title">New project</h2>
        <p className="muted">Project creation is the next library workflow to design. For now, this draft shows where the action belongs without changing the current single-project data model.</p>
        <div className="dialog-actions"><button className="secondary" onClick={()=>setNewProjectOpen(false)}>Close</button></div>
      </div>
    </div>}
    {newSessionOpen && <div className="overlay" role="presentation" onMouseDown={e => {if (e.target === e.currentTarget && !creating) setNewSessionOpen(false);}}>
      <form className="dialog new-session-dialog" onSubmit={createSession} role="dialog" aria-modal="true" aria-labelledby="new-session-title"><h2 id="new-session-title">New reading session</h2>
        <label className="new-session-pdf-field">PDF document <span className="required-marker">Required</span>
          <input type="file" accept=".pdf,application/pdf" required disabled={creating}
            onChange={e => void choosePdf(e.target.files?.[0] ?? null)}/>
          <small>{newPdf ? newPdf.name+(pdfPageCount?' · '+pdfPageCount+' PDF pages':checkingPdf?' · Checking pages…':'') : 'Choose the document you want to read. The file stays in this browser.'}</small>
        </label>
        <label>Session title<input autoFocus required maxLength={120} placeholder="e.g. Homotopy equivalence" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label>Section or reading target<input required placeholder="e.g. Chapter 3, §3.1" value={form.target} onChange={e => setForm({...form,target:e.target.value})}/></label>
        <div className="form-row"><label>First PDF page<input type="number" min="1" max={pdfPageCount??undefined} required value={form.firstPage} onChange={e => setForm({...form,firstPage:e.target.value})}/></label><label>Last PDF page<input type="number" min={form.firstPage||"1"} max={pdfPageCount??undefined} required value={form.lastPage} onChange={e => setForm({...form,lastPage:e.target.value})}/></label></div>
        <label>Session duration<select value={form.durationMinutes} onChange={e => setForm({...form,durationMinutes:e.target.value})}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label>
        {formError && <p role="alert" className="form-error">{formError}</p>}
        <div className="dialog-actions"><button className="secondary" type="button" disabled={creating} onClick={() => {setNewSessionOpen(false);setFormError('');setNewPdf(null);}}>Cancel</button><button className="primary" type="submit" disabled={creating||checkingPdf||!pdfPageCount}>{creating ? 'Importing PDF…' : 'Create session'}</button></div>
      </form></div>}
    {pendingDelete && <div className="overlay" onMouseDown={e => {if (e.target === e.currentTarget) setDeleteId(null);}}><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete session?</h2><p>Delete “{pendingDelete.title}” from this browser? This cannot be undone.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="danger" onClick={deleteSession}>Delete session</button></div></div></div>}
  </div>;
}
