import { useEffect, useState, type FormEvent } from 'react';
import { loadSessions, saveSessions, type ReadingSession } from './storage';
import { PdfReader, deleteSavedPdf, importSessionPdf } from './PdfReader';
import { ReadingFlow } from './ReadingFlow';

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
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [form, setForm] = useState<SessionFormState>(initialForm);
  const [newPdf, setNewPdf] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pageJump, setPageJump] = useState<{page:number;seq:number}|null>(null);
  const [agentOpen, setAgentOpen] = useState(true);
  const active = sessions.find(s => s.id === activeId) ?? null;
  const pendingDelete = sessions.find(s => s.id === deleteId);

  function persist(next: ReadingSession[]): boolean {
    try { saveSessions(next); setSessions(next); setStorageError(''); return true; }
    catch { setStorageError('Could not save changes to this browser. Check storage permissions.'); return false; }
  }
  function navigate(id: string | null) {
    setActiveId(id);
    window.history.replaceState(null, '', id ? '#session-' + encodeURIComponent(id) : window.location.pathname + window.location.search);
  }
  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = Number(form.firstPage), last = Number(form.lastPage);
    if (!form.title.trim() || !form.target.trim() || !Number.isInteger(first) || first < 1 || !Number.isInteger(last) || last < first) {
      setFormError('Enter a title, reading target, and a valid printed-page range.'); return;
    }
    if (!newPdf) { setFormError('Choose the PDF for this reading session.'); return; }
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
    }
  }
  function updatePage(page: number) {
    if (!active || page < 1) return;
    const now = new Date().toISOString();
    persist(sessions.map(s => s.id === active.id ? {
      ...s, pdfPage: page, updatedAt: now, status: 'in-progress'
    } : s));
  }
  useEffect(()=>{function dismissDetails(event:PointerEvent){const target=event.target;if(target instanceof Node && !document.querySelector('.reader-details')?.contains(target)){document.querySelector('details.reader-details')?.removeAttribute('open');}}document.addEventListener('pointerdown',dismissDetails);return()=>document.removeEventListener('pointerdown',dismissDetails);},[]);
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
    {!active && <header className="topbar"><span className="brand">∑ &nbsp; Mathematical Reading Agent</span><span className="topbar-tag">App foundation · no AI connected</span></header>}
    {storageError && <div role="alert" className="alert">{storageError}</div>}
    {!active ? <main className="dashboard">
      <div className="breadcrumb">← Library / Projects / Hatcher</div>
      <div className="hero"><div><div className="eyebrow">Book project</div><h1>Algebraic Topology</h1><p>Allen Hatcher · Your reading workspace</p></div>
        <button className="primary" onClick={() => setNewSessionOpen(true)}>+ New Session</button>
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
          <section className="card"><h2>Project sources</h2><div className="source"><strong>Algebraic Topology — Hatcher</strong><span className="muted">Primary text · PDF integration next milestone</span></div></section></div>
      </div>
      <p className="notice">Application foundation: sessions and printed-page position are saved in this browser. AI analysis, reading plans, PDF rendering, and cloud sync are not connected.</p>
    </main> : <section className="workspace">
      <div className="reader-header">
        <div className="reader-header-identity">
          <button className="reader-back" onClick={() => navigate(null)} aria-label="Back to Hatcher dashboard" title="Back to dashboard">←</button>
          <span className="reader-session-name" title={active.title}>{active.title}</span>
          <details className="reader-details"><summary title="Session details" aria-label="Session details">⋯</summary><div className="reader-details-pop"><strong>{active.title}</strong><p>{active.target}</p><p>Printed pp. {active.firstPage}–{active.lastPage} · {active.durationMinutes} min</p><p>PDF page numbers may differ from printed pages.</p><button type="button" className="secondary reader-setup-link" onClick={()=>{document.querySelector("details.reader-details")?.removeAttribute("open");window.dispatchEvent(new Event("higher-math:open-session-setup"));setAgentOpen(true);}}>⚙ Session setup</button></div></details>
        </div>
        <div id="reader-toolbar-slot" className="reader-toolbar-slot" aria-label="PDF controls"></div>
        <button className="reader-agent-toggle" type="button" onClick={() => setAgentOpen(v => !v)} aria-pressed={agentOpen}>{agentOpen ? 'Hide agent' : 'Show agent'}</button>
      </div>
      <div className={agentOpen ? "work-grid" : "work-grid agent-collapsed"}>
        {agentOpen && <article className="work-panel agent-panel">
          <ReadingFlow key={active.id} sessionId={active.id} title={active.target}
            firstPage={active.firstPage} lastPage={active.lastPage} duration={active.durationMinutes} currentPdfPage={active.pdfPage}
            onNavigate={page => setPageJump(old=>({page,seq:(old?.seq??0)+1}))}/>
        </article>}
        <article className="work-panel pdf-panel">
          <PdfReader key={active.id} sessionId={active.id} initialPage={active.pdfPage ?? 1} onPageChange={updatePage} toolbarHostId="reader-toolbar-slot" pageJump={pageJump} />
        </article>
      </div>
    </section>}
    {newSessionOpen && <div className="overlay" role="presentation" onMouseDown={e => {if (e.target === e.currentTarget && !creating) setNewSessionOpen(false);}}>
      <form className="dialog" onSubmit={createSession} role="dialog" aria-modal="true" aria-labelledby="new-session-title"><h2 id="new-session-title">New reading session</h2><p>Choose a scope and time. We will refine the plan inside the workspace.</p>
        <label className="new-session-pdf-field">PDF document <span className="required-marker">Required</span>
          <input type="file" accept=".pdf,application/pdf" required disabled={creating}
            onChange={e => setNewPdf(e.target.files?.[0] ?? null)}/>
          <small>{newPdf ? newPdf.name : 'Choose the document you want to read. The file stays in this browser.'}</small>
        </label>
        <label>Session title<input autoFocus required maxLength={120} placeholder="e.g. Homotopy equivalence" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label>Section or reading target<input required placeholder="e.g. Chapter 3, §3.1" value={form.target} onChange={e => setForm({...form,target:e.target.value})}/></label>
        <div className="form-row"><label>First printed page<input type="number" min="1" required value={form.firstPage} onChange={e => setForm({...form,firstPage:e.target.value})}/></label><label>Last printed page<input type="number" min="1" required value={form.lastPage} onChange={e => setForm({...form,lastPage:e.target.value})}/></label></div>
        <label>Available time<select value={form.durationMinutes} onChange={e => setForm({...form,durationMinutes:e.target.value})}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label>
        {formError && <p role="alert" className="form-error">{formError}</p>}
        <div className="dialog-actions"><button className="secondary" type="button" disabled={creating} onClick={() => {setNewSessionOpen(false);setFormError('');setNewPdf(null);}}>Cancel</button><button className="primary" type="submit" disabled={creating}>{creating ? 'Importing PDF…' : 'Create session'}</button></div>
      </form></div>}
    {pendingDelete && <div className="overlay" onMouseDown={e => {if (e.target === e.currentTarget) setDeleteId(null);}}><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete session?</h2><p>Delete “{pendingDelete.title}” from this browser? This cannot be undone.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="danger" onClick={deleteSession}>Delete session</button></div></div></div>}
  </div>;
}
