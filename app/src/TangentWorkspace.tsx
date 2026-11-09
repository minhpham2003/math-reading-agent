import {useState, type FormEvent} from 'react';

type Message={id:string; text:string; createdAt:string};
type Branch={id:string; parentId:string|null; title:string; status:'in-progress'|'completed'|'archived'; messages:Message[]; summary:string; originMessageId:string|null; inherited:Message[]; includedIds:string[]; originalIncludedIds:string[]; savedPdfPage:number|null};
type Tree={branches:Branch[]; activeId:string; expandedSummaries:string[]};
const ROOT='main';
const storageKey=(sessionId:string)=>'higher-math:tangents:v1:'+sessionId;
function blank():Tree{return {activeId:ROOT,expandedSummaries:[],branches:[{id:ROOT,parentId:null,title:'Main reading',status:'in-progress',messages:[],summary:'',originMessageId:null,inherited:[],includedIds:[],originalIncludedIds:[],savedPdfPage:null}]};}
function load(id:string):Tree{
 try{
  const parsed=JSON.parse(localStorage.getItem(storageKey(id))??'null') as Tree|null;
  if(parsed&&Array.isArray(parsed.branches)&&parsed.branches.some(b=>b.id===ROOT)&&parsed.branches.some(b=>b.id===parsed.activeId))return parsed;
 }catch{/* use empty tree */}
 return blank();
}
function guessTitle(text:string){return text.replace(/\s+/g,' ').trim().slice(0,65)||'New tangent';}
function summaryOf(branch:Branch){
 const text=branch.messages.map(m=>m.text).join(' ').trim();
 return text?text.slice(0,240)+(text.length>240?'…':''):'Tangent on '+branch.title;
}
export function TangentWorkspace({sessionId,currentPdfPage,onNavigate}:
 {sessionId:string;currentPdfPage?:number;onNavigate:(page:number)=>void}){
 const [tree,setTree]=useState<Tree>(()=>load(sessionId));
 const [draft,setDraft]=useState('');
 const [editingSummary,setEditingSummary]=useState(false);
 const [summaryDraft,setSummaryDraft]=useState('');
 const [selecting,setSelecting]=useState(false);
 const [selectedIds,setSelectedIds]=useState<string[]>([]);
 const [treeOpen,setTreeOpen]=useState(false);
 const [showArchived,setShowArchived]=useState(false);
 const [error,setError]=useState('');
 const active=tree.branches.find(b=>b.id===tree.activeId)??tree.branches[0];
 const byId=new Map(tree.branches.map(b=>[b.id,b]));
 const ancestors:Branch[]=[];let cursor:Branch|undefined=active;
 while(cursor){ancestors.unshift(cursor);cursor=cursor.parentId?byId.get(cursor.parentId):undefined;}
 const children=(parentId:string)=>tree.branches.filter(b=>b.parentId===parentId);
 function save(next:Tree){try{localStorage.setItem(storageKey(sessionId),JSON.stringify(next));setTree(next);setError('');}catch{setError('Cannot save tangents in this browser.');}}
 function switchTo(id:string){const branch=byId.get(id);if(!branch)return;save({...tree,activeId:id});setEditingSummary(false);setSelecting(false);if(branch.savedPdfPage && branch.savedPdfPage>0)onNavigate(branch.savedPdfPage);}
 function appendMessage(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const content=draft.trim();if(!content)return;
  const message={id:crypto.randomUUID(),text:content,createdAt:new Date().toISOString()};
  save({...tree,branches:tree.branches.map(b=>b.id===active.id?{...b,status:b.id===ROOT?b.status:'in-progress' as const,messages:[...b.messages,message]}:b)});
  setDraft('');
 }
 function beginTangent(anchor?:Message){
  const id=crypto.randomUUID();
  const selected=anchor?[anchor]:active.messages.length?[active.messages[active.messages.length-1]]:[];
  const context=active.messages.slice(0,Math.max(0,active.messages.length-1)).slice(-2);
  const branch:Branch={id,parentId:active.id,title:guessTitle(anchor?.text??selected[0]?.text??'New tangent'),
   status:'in-progress',messages:[],summary:guessTitle(anchor?.text??'Tangent in progress'),originMessageId:anchor?.id??selected[0]?.id??null,
   inherited:context,includedIds:selected.map(m=>m.id),originalIncludedIds:selected.map(m=>m.id),
   savedPdfPage:currentPdfPage??null};
  save({...tree,activeId:id,branches:[...tree.branches,branch]});
  setSelecting(false);setEditingSummary(false);
 }
 function startFinish(){setSummaryDraft(summaryOf(active));setEditingSummary(true);}
 function finish(){
  if(active.id===ROOT||!active.parentId)return;
  const parentId=active.parentId;
  save({...tree,activeId:parentId,branches:tree.branches.map(b=>b.id===active.id?{...b,summary:summaryDraft.trim()||'Tangent completed',status:'completed'}:b)});
  setEditingSummary(false);setSelecting(false);
  if(active.savedPdfPage)onNavigate(active.savedPdfPage);
 }
 function toggleIncluded(id:string){setSelectedIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);}
 function applySelection(){
  save({...tree,branches:tree.branches.map(b=>b.id===active.id?{...b,includedIds:selectedIds}:b)});
  setSelecting(false);
 }
 function archive(){
  if(active.id===ROOT||!active.parentId)return;
  const parent=active.parentId;
  save({...tree,activeId:parent,branches:tree.branches.map(b=>b.id===active.id?{...b,status:'archived'}:b)});
 }
 function destroy(){
  if(active.id===ROOT||!active.parentId)return;
  if(!window.confirm('Delete this tangent and its notes? Child tangents will be kept and attached to its parent. This cannot be undone.'))return;
  const parent=active.parentId;
  save({...tree,activeId:parent,branches:tree.branches.filter(b=>b.id!==active.id).map(b=>b.parentId===active.id?{...b,parentId:parent}:b)});
 }
 function toggleSummary(id:string){
  const expanded=tree.expandedSummaries.includes(id);
  save({...tree,expandedSummaries:expanded?tree.expandedSummaries.filter(x=>x!==id):[...tree.expandedSummaries,id]});
 }
 function renderTree(parentId:string,depth=0):React.ReactNode{
  return children(parentId).filter(b=>b.status!=='archived'||showArchived).map(b=><div key={b.id} style={{paddingLeft:depth*12}}>
   <button className={'tangent-tree-link'+(active.id===b.id?' active':'')} onClick={()=>switchTo(b.id)}>{b.status==='completed'?'✓ ':b.status==='archived'?'◌ ':'↳ '}{b.title} <small>({b.status})</small></button>
   {renderTree(b.id,depth+1)}
  </div>);
 }
 return <section className="tangent-workspace" aria-label="Branching reading notes">
  <div className="tangent-nav">
   <div className="tangent-breadcrumbs">{ancestors.map((b,i)=><span key={b.id}>{i>0&&' › '}<button className={b.id===active.id?'active':''} onClick={()=>switchTo(b.id)}>{b.title}</button></span>)}</div>
   <button className="secondary" aria-expanded={treeOpen} onClick={()=>setTreeOpen(v=>!v)}>Branches {treeOpen?'▴':'▾'}</button>
  </div>
  {treeOpen&&<div className="tangent-tree"><button className="tangent-tree-link" onClick={()=>switchTo(ROOT)}>Main reading</button>{renderTree(ROOT)}<label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Show archived</label></div>}
  {active.id!==ROOT&&<div className="tangent-detail">
   <div className="tangent-title-line"><strong>Tangent · {active.status}</strong><button className="secondary" onClick={()=>switchTo(active.parentId!)}>Return to parent</button></div>
   <label>Title<input value={active.title} onChange={e=>save({...tree,branches:tree.branches.map(b=>b.id===active.id?{...b,title:e.target.value}:b)})}/></label>
   {!!active.inherited.length&&<details><summary>Earlier context (read-only)</summary>{active.inherited.map(m=><blockquote key={m.id}>{m.text}</blockquote>)}</details>}
   <div className="tangent-actions"><button className="secondary" onClick={()=>{setSelectedIds(active.includedIds);setSelecting(v=>!v)}}>Edit source selection</button>
    <button className="secondary" onClick={archive}>Archive</button><button className="secondary" onClick={destroy}>Delete</button></div>
   {selecting&&<div className="tangent-selection-editor"><strong>Select parent messages to reference</strong>
    {(byId.get(active.parentId!)?.messages??[]).map(m=><label key={m.id}><input type="checkbox" checked={selectedIds.includes(m.id)} onChange={()=>toggleIncluded(m.id)}/>{m.text}</label>)}
    <button className="primary" onClick={applySelection}>Apply changes</button><button className="secondary" onClick={()=>setSelecting(false)}>Cancel</button>
   </div>}
  </div>}
  <div className="tangent-messages">
   {active.id!==ROOT&&active.includedIds.length>0&&<div className="tangent-source-context"><strong>Referenced parent discussion</strong>
    {active.includedIds.map(id=>byId.get(active.parentId!)?.messages.find(m=>m.id===id)).filter((m):m is Message=>!!m).map(m=><blockquote key={m.id}>{m.text}</blockquote>)}
   </div>}
   {active.messages.map(m=>{
    const linked=children(active.id).filter(b=>b.includedIds.includes(m.id));
    return <div key={m.id} className={'tangent-message'+(linked.length?' has-linked-tangent':'')}>
     {linked.length===0&&<><span>{m.text}</span><button className="tangent-create" title="Create tangent from this message" aria-label="Create tangent from message" onClick={()=>beginTangent(m)}>↗</button></>}
     {linked.map(b=><div key={b.id} className="tangent-inline-summary">
      <strong>{b.status}</strong> · {b.summary} <button onClick={()=>switchTo(b.id)}>Open tangent ↗</button>
      <button onClick={()=>toggleSummary(b.id)}>{tree.expandedSummaries.includes(b.id)?'Hide original':'Show original'}</button>
      {tree.expandedSummaries.includes(b.id)&&<blockquote>{m.text}</blockquote>}
     </div>)}
    </div>;
   })}
   {children(active.id).filter(b=>b.includedIds.length===0).map(b=><div className="tangent-inline-summary" key={b.id}>
    <strong>{b.status}</strong> · {b.summary} <button onClick={()=>switchTo(b.id)}>Open tangent ↗</button>
   </div>)}
   {active.messages.length===0&&<p className="muted">No notes on this branch yet. Add a question or observation below.</p>}
  </div>
  {editingSummary?<div className="tangent-finish"><h3>Finish tangent & return</h3><p className="muted">Review this manually prepared draft. AI summaries are not connected yet.</p>
   <textarea value={summaryDraft} onChange={e=>setSummaryDraft(e.target.value)} rows={4}/>
   <button className="primary" onClick={finish}>Save summary & return</button><button className="secondary" onClick={()=>setEditingSummary(false)}>Cancel</button>
  </div>:<form className="tangent-compose" onSubmit={appendMessage}>
   <textarea rows={3} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask a question or write a note…" aria-label="Reading note"/>
   <div className="tangent-actions"><button className="secondary" type="button" onClick={()=>beginTangent()}>+ Tangent</button>
    {active.id!==ROOT&&<button className="secondary" type="button" onClick={startFinish}>Finish tangent & return</button>}
    <button className="primary" type="submit" disabled={!draft.trim()}>Save note</button></div>
  </form>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
