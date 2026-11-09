import { useState } from 'react';
import { createPortal } from 'react-dom';
import { TangentWorkspace } from './TangentWorkspace';

export type ReadingUnit = {id:string; title:string; page:number; endPage?:number; description:string; done:boolean};

function location(unit:ReadingUnit){
 const end=unit.endPage??unit.page;
 return end===unit.page?'PDF page '+unit.page:'PDF pages '+unit.page+'–'+end;
}
export function ReadingMode({sessionId,units,onNavigate,onToggle,currentPdfPage}:
 {sessionId:string;units:ReadingUnit[];currentPdfPage?:number;onNavigate:(page:number,quote?:string)=>void;onToggle:(id:string)=>void}) {
 const [listOpen,setListOpen]=useState(true);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [detailsId,setDetailsId]=useState<string|null>(null);
 const selected=units.find(u=>u.id===selectedId)??units.find(u=>!u.done)??units[0];
 const toolbarSlot=document.getElementById("reading-plan-toolbar-slot");
 return <div className="reading-mode">
  {toolbarSlot&&createPortal(<button type="button" className="reader-plan-toggle" aria-expanded={listOpen} onClick={()=>{setListOpen(v=>!v);setDetailsId(null);}}>Reading plan · {units.filter(u=>u.done).length}/{units.length}</button>,toolbarSlot)}

  {listOpen&&<section className="reading-navigator"><div className="reading-nav-list">{units.map((unit,i)=><div className={'reading-nav-item'+(selected?.id===unit.id?' is-current':'')+(unit.done?' is-completed':'')} key={unit.id}>
    <button className="reading-nav-link" aria-expanded={detailsId===unit.id} onClick={()=>{setSelectedId(unit.id);setDetailsId(current=>current===unit.id?null:unit.id);onNavigate(unit.page)}}><span>{unit.done?'✓':selected?.id===unit.id?'●':'○'} {i+1}. {unit.title}</span><small>{location(unit)}</small>{unit.description&&detailsId===unit.id&&<span className="reading-unit-description">{unit.description}</span>}</button>
    <button className={'secondary unit-completed-toggle'+(unit.done?' is-completed':'')} aria-pressed={unit.done} onClick={()=>onToggle(unit.id)}>{unit.done?'✓ Completed':'Completed'}</button>
   </div>)}</div></section>}
  <TangentWorkspace key={sessionId} sessionId={sessionId} currentPdfPage={currentPdfPage} onNavigate={onNavigate} />
 </div>;
}
