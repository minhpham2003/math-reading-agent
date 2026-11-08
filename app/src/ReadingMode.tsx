import { useState, type FormEvent } from 'react';

export type ReadingUnit = {id:string; title:string; page:number; endPage?:number; description:string; done:boolean};

const notesKey=(sessionId:string)=>'higher-math:reading-notes:v1:'+sessionId;
function loadNotes(sessionId:string):string[] {
 try {const v:unknown=JSON.parse(localStorage.getItem(notesKey(sessionId))||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[];}
 catch{return [];}
}
function location(unit:ReadingUnit){
 const end=unit.endPage??unit.page;
 return end===unit.page?'PDF page '+unit.page:'PDF pages '+unit.page+'–'+end;
}
export function ReadingMode({sessionId,title,units,onNavigate,onToggle,onSetup}:
 {sessionId:string;title:string;units:ReadingUnit[];onNavigate:(page:number)=>void;onToggle:(id:string)=>void;onSetup:()=>void}) {
 const [listOpen,setListOpen]=useState(true);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [notes,setNotes]=useState<string[]>(()=>loadNotes(sessionId));
 const [draft,setDraft]=useState('');
 const [error,setError]=useState('');
 const selected=units.find(u=>u.id===selectedId)??units.find(u=>!u.done)??units[0];
 function addNote(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const value=draft.trim();if(!value)return;
  const next=[...notes,value];
  try{localStorage.setItem(notesKey(sessionId),JSON.stringify(next));setNotes(next);setDraft('');setError('');}
  catch{setError('Unable to save your note in this browser.');}
 }
 return <div className="reading-mode">
  <div className="eyebrow">Reading mode · Mock agent (AI not connected)</div>
  <div className="reading-mode-top"><h2>{title}</h2><button className="secondary" onClick={onSetup}>⚙ Session setup</button></div>
  <section className="reading-navigator">
   <div className="reading-nav-heading"><strong>Reading plan · {units.filter(u=>u.done).length}/{units.length} completed</strong>
    <button className="secondary" aria-expanded={listOpen} onClick={()=>setListOpen(v=>!v)}>{listOpen?'Collapse ▴':'Expand ▾'}</button></div>
   {listOpen&&<div className="reading-nav-list">{units.map((unit,i)=><div className={'reading-nav-item'+(selected?.id===unit.id?' is-current':'')} key={unit.id}>
    <button className="reading-nav-link" onClick={()=>{setSelectedId(unit.id);onNavigate(unit.page)}}><span>{unit.done?'✓':selected?.id===unit.id?'●':'○'} {i+1}. {unit.title}</span><small>{location(unit)}</small></button>
    <button className={'secondary unit-completed-toggle'+(unit.done?' is-completed':'')} aria-pressed={unit.done} onClick={()=>onToggle(unit.id)}>{unit.done?'✓ Completed':'Completed'}</button>
   </div>)}</div>}
  </section>
  {selected&&<section className="current-reading-unit">
    <div className="eyebrow">Currently reading</div><h3>{selected.title}</h3><p>{location(selected)}</p>
    {selected.description&&<p>{selected.description}</p>}
    <div className="flow-actions"><button className="secondary" onClick={()=>onNavigate(selected.page)}>Go to PDF ↗</button>
    <button className={'secondary unit-completed-toggle'+(selected.done?' is-completed':'')} aria-pressed={selected.done} onClick={()=>onToggle(selected.id)}>{selected.done?'✓ Completed':'Completed'}</button></div>
  </section>}
  <section className="reading-conversation">
   <h3>Reading agent</h3><p className="muted">This is the conversation layout preview. No AI replies yet—questions and observations are saved as local notes.</p>
   <div className="reading-note-list">{notes.length===0?<p className="muted">No notes yet. Add a question or observation as you read.</p>:notes.map((note,i)=><div className="reading-note" key={i}>{note}</div>)}</div>
   <form onSubmit={addNote}><textarea rows={3} aria-label="Question or reading note" placeholder="Ask a question or write a note…" value={draft} onChange={e=>setDraft(e.target.value)}/>
    <button className="primary" type="submit" disabled={!draft.trim()}>Save note</button></form>
   {error&&<p role="alert">{error}</p>}
  </section>
 </div>;
}
