import { useState, type FormEvent } from 'react';
import type { ReadingCheckpoint, ReadingSession } from './storage';

type Props = {
  checkpoints: ReadingCheckpoint[];
  sessions: ReadingSession[];
  projectId: string;
  onChange: (next: ReadingCheckpoint[]) => boolean;
  onOpenSession: (id: string) => void;
};

export function ReadingCheckpoints({ checkpoints, sessions, projectId, onChange, onOpenSession }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const ordered = [...checkpoints].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  const completed = ordered.filter(c => c.completed).length;
  const percent = ordered.length ? Math.round(100 * completed / ordered.length) : 0;

  function edit(checkpoint?: ReadingCheckpoint) {
    setEditingId(checkpoint?.id ?? 'new');
    setTitle(checkpoint?.title ?? '');
    setSessionId(checkpoint?.sessionId && sessions.some(s => s.id === checkpoint.sessionId) ? checkpoint.sessionId : '');
    setDeleteId(null);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = title.trim();
    if (!name) return;
    const now = new Date().toISOString();
    const link = sessionId && sessions.some(s => s.id === sessionId) ? sessionId : undefined;
    let next: ReadingCheckpoint[];
    if (editingId === 'new') {
      next = [...checkpoints, { id: crypto.randomUUID(), projectId, title: name,
        completed: false, sessionId: link, order: Math.max(-1, ...checkpoints.map(c => c.order)) + 1, createdAt: now }];
    } else {
      next = checkpoints.map(c => c.id === editingId ? { ...c, title: name, sessionId: link } : c);
    }
    if (onChange(next)) { setEditingId(null); setTitle(''); setSessionId(''); }
  }

  function toggle(id: string, checked: boolean) {
    const now = new Date().toISOString();
    onChange(checkpoints.map(c => c.id === id ? { ...c, completed: checked,
      completedAt: checked ? now : undefined } : c));
  }

  function remove(id: string) {
    if (onChange(checkpoints.filter(c => c.id !== id))) {
      setDeleteId(null);
      if (editingId === id) setEditingId(null);
    }
  }

  function editor() {
    return <form className="checkpoint-editor" onSubmit={save}>
      <label>Checkpoint title<input autoFocus required maxLength={180} value={title}
        onChange={e => setTitle(e.target.value)} placeholder="e.g. Understand van Kampen's theorem" /></label>
      <label>Linked reading session <span className="muted">(optional)</span>
        <select value={sessionId} onChange={e => setSessionId(e.target.value)}>
          <option value="">No linked session</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.title} — {s.target}</option>)}
        </select>
      </label>
      <div className="checkpoint-editor-actions">
        {editingId !== 'new' && <button type="button" className="checkpoint-delete" onClick={() => setDeleteId(editingId)}>Delete</button>}
        <button type="button" className="secondary" onClick={() => { setEditingId(null); setDeleteId(null); }}>Cancel</button>
        <button type="submit" className="primary" disabled={!title.trim()}>Save</button>
      </div>
      {deleteId === editingId && <div className="checkpoint-confirm">
        <span>Delete this checkpoint?</span>
        <button type="button" className="secondary" onClick={() => setDeleteId(null)}>Cancel</button>
        <button type="button" className="danger" onClick={() => { if (deleteId) remove(deleteId); }}>Delete</button>
      </div>}
    </form>;
  }

  return <section className="card checkpoints-card">
    <div className="checkpoints-heading">
      <h2>Reading checkpoints</h2>
      <button type="button" className="secondary" onClick={() => edit()}>+ Add checkpoint</button>
    </div>
    <div className="checkpoints-summary">
      <span>{completed} of {ordered.length} completed</span><strong>{percent}%</strong>
    </div>
    <div className="checkpoints-progress" role="progressbar" aria-label="Reading checkpoints completed"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div style={{ width: percent + '%' }} />
    </div>
    {ordered.length === 0 && editingId !== 'new' &&
      <p className="muted checkpoint-empty">Add a checkpoint to track a reading goal, theorem, or exercise.</p>}
    <div className="checkpoint-list">
      {ordered.map(c => {
        const linked = sessions.find(s => s.id === c.sessionId);
        return <div key={c.id} className="checkpoint-item">
          <div className="checkpoint-item-main">
            <input type="checkbox" checked={c.completed} aria-label={'Mark ' + c.title + ' complete'}
              onChange={e => toggle(c.id, e.target.checked)} />
            <div className="checkpoint-item-title">
              {linked ? <button type="button" className={'checkpoint-session-link' + (c.completed ? ' is-complete' : '')}
                title={'Open session: ' + linked.title} onClick={() => onOpenSession(linked.id)}>{c.title}</button>
                : <span className={c.completed ? 'is-complete' : ''}>{c.title}</span>}
            </div>
            <button type="button" className="checkpoint-edit" aria-label={'Edit ' + c.title}
              title="Edit checkpoint" onClick={() => edit(c)}>✎</button>
          </div>
          {editingId === c.id && editor()}
        </div>;
      })}
    </div>
    {editingId === 'new' && editor()}
  </section>;
}
