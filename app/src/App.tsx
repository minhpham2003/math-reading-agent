import { useEffect, useState, type FormEvent } from 'react';
import { loadSessions, saveSessions, type ReadingSession } from './storage';

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
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(true);
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
  function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const first = Number(form.firstPage), last = Number(form.lastPage);
    if (!form.title.trim() || !form.target.trim() || !Number.isInteger(first) || first < 1 || !Number.isInteger(last) || last < first) {
      setFormError('Enter a title, reading target, and a valid printed-page range.'); return;
    }
    const now = new Date().toISOString();
    const session: ReadingSession = {
      id: crypto.randomUUID(), title: form.title.trim(), target: form.target.trim(),
      firstPage: first, lastPage: last, durationMinutes: Number(form.durationMinutes),
      createdAt: now, updatedAt: now, status: 'not-started', currentPrintedPage: first
    };
    if (!persist([...sessions, session])) return;
    setNewSessionOpen(false); setForm(initialForm); setFormError(''); navigate(session.id);
  }
  function deleteSession() {
    if (!deleteId) return;
    if (persist(sessions.filter(s => s.id !== deleteId))) {
      if (activeId === deleteId) navigate(null);
      setDeleteId(null);
    }
  }
  function updatePage(page: number) {
    if (!active || page < active.firstPage || page > active.lastPage) return;
    const now = new Date().toISOString();
    persist(sessions.map(s => s.id === active.id ? {
      ...s, currentPrintedPage: page, updatedAt: now, status: 'in-progress'
    } : s));
  }
  useEffect(() => {
    function handleKeys(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (deleteId) setDeleteId(null);
      else if (newSessionOpen) { setNewSessionOpen(false); setFormError(''); }
    }
    document.addEventListener('keydown', handleKeys);
    return () => document.removeEventListener('keydown', handleKeys);
  }, [deleteId, newSessionOpen]);

  return <div className="app-shell">
    <header className="topbar"><span className="brand">∑ &nbsp; Mathematical Reading Agent</span><span className="topbar-tag">App foundation · no AI connected</span></header>
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
      <div className="workspace-top"><div><button className="text-button" onClick={() => navigate(null)}>← Back to Hatcher dashboard</button><h1>{active.title}</h1><p>{active.target} · pp. {active.firstPage}–{active.lastPage} · {active.durationMinutes} min</p></div><span className="badge">Session setup</span></div>
      <div className="work-grid">
        <article className="work-panel"><div className="eyebrow">Reading agent · left panel</div><h2>Your session</h2><div className="agent-placeholder"><div className="eyebrow">Agent not connected</div><strong>Let's plan your reading session</strong><p>You selected {active.target}, printed pages {active.firstPage}–{active.lastPage}. Source analysis will be added after the real PDF reader is connected.</p></div>
          <div className="plan-heading"><strong>Reading plan</strong><button className="secondary" aria-expanded={planOpen} onClick={() => setPlanOpen(!planOpen)}>{planOpen ? 'Collapse ▴' : 'Expand ▾'}</button></div>
          {planOpen && <div className="plan-body"><p>No plan has been generated. The S07 assessment → plan approval flow is part of a later implementation milestone.</p></div>}
        </article>
        <article className="work-panel pdf-panel"><div className="eyebrow">Primary source · right panel</div><h2>Hatcher — Algebraic Topology</h2><div className="muted">Selected printed pages: {active.firstPage}–{active.lastPage}</div>
          <div className="pdf-placeholder"><div className="eyebrow">PDF reader integration pending</div><h3>Printed page {active.currentPrintedPage}</h3><p>This is a position tracker, not a rendered PDF page.</p><div className="page-controls"><button className="secondary" disabled={active.currentPrintedPage <= active.firstPage} onClick={() => updatePage(active.currentPrintedPage - 1)}>← Previous</button><button className="secondary" disabled={active.currentPrintedPage >= active.lastPage} onClick={() => updatePage(active.currentPrintedPage + 1)}>Next →</button></div></div>
        </article>
      </div>
    </section>}
    {newSessionOpen && <div className="overlay" role="presentation" onMouseDown={e => {if (e.target === e.currentTarget) setNewSessionOpen(false);}}>
      <form className="dialog" onSubmit={createSession} role="dialog" aria-modal="true" aria-labelledby="new-session-title"><h2 id="new-session-title">New reading session</h2><p>Choose a scope and time. We will refine the plan inside the workspace.</p>
        <label>Session title<input autoFocus required maxLength={120} placeholder="e.g. Homotopy equivalence" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label>Section or reading target<input required placeholder="e.g. Chapter 3, §3.1" value={form.target} onChange={e => setForm({...form,target:e.target.value})}/></label>
        <div className="form-row"><label>First printed page<input type="number" min="1" required value={form.firstPage} onChange={e => setForm({...form,firstPage:e.target.value})}/></label><label>Last printed page<input type="number" min="1" required value={form.lastPage} onChange={e => setForm({...form,lastPage:e.target.value})}/></label></div>
        <label>Available time<select value={form.durationMinutes} onChange={e => setForm({...form,durationMinutes:e.target.value})}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select></label>
        {formError && <p role="alert" className="form-error">{formError}</p>}
        <div className="dialog-actions"><button className="secondary" type="button" onClick={() => {setNewSessionOpen(false);setFormError('');}}>Cancel</button><button className="primary" type="submit">Create session</button></div>
      </form></div>}
    {pendingDelete && <div className="overlay" onMouseDown={e => {if (e.target === e.currentTarget) setDeleteId(null);}}><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete session?</h2><p>Delete “{pendingDelete.title}” from this browser? This cannot be undone.</p><div className="dialog-actions"><button className="secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="danger" onClick={deleteSession}>Delete session</button></div></div></div>}
  </div>;
}
