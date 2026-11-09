import {useEffect,useRef,useState,type FormEvent,type MouseEvent as ReactMouseEvent} from 'react';
import {read,write,createTangent,CHANGED_EVENT,type TangentData,type Thread,type Entry} from './tangentStore';

type SelectState={messageId:string;start:number;end:number;text:string;x:number;y:number};
const ancestorsOf=(thread:Thread,data:TangentData)=>{const result:Thread[]=[];let node:Thread|undefined=thread;while(node){result.unshift(node);node=node.parentId?data.threads.find(t=>t.id===node!.parentId):undefined;}return result;};

export function TangentWorkspace({sessionId,onNavigate}:{sessionId:string;currentPdfPage?:number;onNavigate:(page:number)=>void}){
 const [data,setData]=useState<TangentData>(()=>read(sessionId));
 const [draft,setDraft]=useState('');
 const [selection,setSelection]=useState<SelectState|null>(null);
 const [branchesOpen,setBranchesOpen]=useState(false);
 const [settings,setSettings]=useState(false);
 const [nameDraft,setNameDraft]=useState('');
 const [finish,setFinish]=useState(false);
 const [summary,setSummary]=useState('');
 const [chooser,setChooser]=useState<{ids:string[];x:number;y:number}|null>(null);
 const [breadOpen,setBreadOpen]=useState(false);
 const [breadcrumbCompact,setBreadcrumbCompact]=useState(false);
 const breadcrumbRef=useRef<HTMLDivElement>(null);
 const breadcrumbMeasureRef=useRef<HTMLDivElement>(null);
 const [hoverPreview,setHoverPreview]=useState<{ids:string[];x:number;y:number}|null>(null);
 const [error,setError]=useState('');
 const dropdownRef=useRef<HTMLDivElement>(null);
 const conversationRef=useRef<HTMLDivElement>(null);
 const savedScroll=useRef<Record<string,number>>({});
 const branch=data.threads.find(t=>t.id===data.activeId)??data.threads[0];
 const ancestry=ancestorsOf(branch,data);
 useEffect(()=>{const container=breadcrumbRef.current,measure=breadcrumbMeasureRef.current;if(!container||!measure)return;const check=()=>setBreadcrumbCompact(measure.scrollWidth>container.clientWidth+1);check();const observer=new ResizeObserver(check);observer.observe(container);observer.observe(measure);return()=>observer.disconnect();},[data.activeId,data.threads]);
 const anchorsFor=(id:string)=>data.anchors.filter(a=>a.kind==='chat'&&a.targetId===id);
 function persist(next:TangentData){try{write(sessionId,next);setData(next);setError('');}catch{setError('Unable to save this tangent.');}}
 useEffect(()=>{const sync=(event:Event)=>{const e=event as CustomEvent<{session:string}>;if(e.detail?.session===sessionId)setData(read(sessionId));};
 window.addEventListener(CHANGED_EVENT,sync);return()=>window.removeEventListener(CHANGED_EVENT,sync);},[sessionId]);
 useEffect(()=>{function onDown(e:MouseEvent){if(dropdownRef.current&&!dropdownRef.current.contains(e.target as Node))setBranchesOpen(false);}
 function esc(e:KeyboardEvent){if(e.key==='Escape'){setBranchesOpen(false);setChooser(null);setSelection(null);setBreadOpen(false);}}
 document.addEventListener('mousedown',onDown);document.addEventListener('keydown',esc);return()=>{document.removeEventListener('mousedown',onDown);document.removeEventListener('keydown',esc);};},[]);
 useEffect(()=>{if(conversationRef.current)conversationRef.current.scrollTop=savedScroll.current[branch.id]??0;},[branch.id,settings]);
 function go(id:string){setHoverPreview(null);if(!data.threads.some(t=>t.id===id))return;if(conversationRef.current)savedScroll.current[branch.id]=conversationRef.current.scrollTop;persist({...data,activeId:id});setSelection(null);setChooser(null);setSettings(false);setFinish(false);setBranchesOpen(false);setBreadOpen(false);}
 function saveNote(event:FormEvent){event.preventDefault();if(!draft.trim())return;const entry:Entry={id:crypto.randomUUID(),role:'user',text:draft.trim(),createdAt:new Date().toISOString()};
 persist({...data,threads:data.threads.map(t=>t.id===branch.id?{...t,messages:[...t.messages,entry],status:'in-progress'}:t)});
 setDraft('');requestAnimationFrame(()=>{if(conversationRef.current)conversationRef.current.scrollTop=conversationRef.current.scrollHeight;});}
 function captureSelection(){
  const selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount){setSelection(null);return;}
  const range=selection.getRangeAt(0);const start=range.startContainer.parentElement?.closest<HTMLElement>('[data-chat-message]');
  const end=range.endContainer.parentElement?.closest<HTMLElement>('[data-chat-message]');
  if(!start||start!==end||!conversationRef.current?.contains(start)){setSelection(null);return;}
  const messageId=start.dataset.chatMessage!;const message=branch.messages.find(m=>m.id===messageId);
  const textNode=start.querySelector<HTMLElement>('[data-message-content]');if(!message||!textNode||!textNode.contains(range.commonAncestorContainer)){setSelection(null);return;}
  const pre=document.createRange();pre.selectNodeContents(textNode);pre.setEnd(range.startContainer,range.startOffset);
  const pos=pre.toString().length;const selected=selection.toString();if(!selected.trim()){setSelection(null);return;}
  const rect=range.getBoundingClientRect();setSelection({messageId,start:pos,end:pos+selected.length,text:selected,x:rect.left+rect.width/2,y:rect.bottom+7});
 }
 function makeTangent(){if(!selection)return;createTangent(sessionId,{kind:'chat',targetId:selection.messageId,start:selection.start,end:selection.end,text:selection.text});setSelection(null);window.getSelection()?.removeAllRanges();}
 function openAnchors(ids:string[],event:ReactMouseEvent){event.preventDefault();event.stopPropagation();if(ids.length===1)go(data.anchors.find(a=>a.id===ids[0])!.branchId);else setChooser({ids,x:event.clientX,y:event.clientY});}
 function linkedText(message:Entry){
  const references=anchorsFor(message.id).filter(a=>a.start!==undefined&&a.end!==undefined&&a.end>a.start);
  if(!references.length)return <span data-message-content>{message.text}</span>;
  const points=new Set<number>([0,message.text.length]);references.forEach(a=>{points.add(Math.min(message.text.length,a.start!));points.add(Math.min(message.text.length,a.end!));});
  const edges=[...points].sort((a,b)=>a-b);
  return <span data-message-content>{edges.slice(0,-1).map((start,i)=>{const end=edges[i+1],slice=message.text.slice(start,end);const matches=references.filter(a=>a.start!<end&&a.end!>start);if(!matches.length)return <span key={i}>{slice}</span>;
   return <button key={i} type="button" className="t2-link" onClick={e=>openAnchors(matches.map(a=>a.id),e)} onMouseEnter={e=>{const rect=e.currentTarget.getBoundingClientRect();setHoverPreview({ids:matches.map(a=>a.id),x:Math.max(12,Math.min(rect.left,window.innerWidth-260)),y:rect.top>120?rect.top-9:rect.bottom+9});}} onMouseLeave={()=>setHoverPreview(null)} onFocus={e=>{const rect=e.currentTarget.getBoundingClientRect();setHoverPreview({ids:matches.map(a=>a.id),x:Math.max(12,Math.min(rect.left,window.innerWidth-260)),y:rect.top>120?rect.top-9:rect.bottom+9});}} onBlur={()=>setHoverPreview(null)}>{slice}</button>;
  })}</span>;
 }
 function renderTree(id:string,depth:number):React.ReactNode{
  const node=data.threads.find(t=>t.id===id);if(!node)return null;
  const kids=data.threads.filter(t=>t.parentId===id);
  const expanded=data.expandedIds.includes(id);
  return <div key={id} className="t2-tree-node" style={{paddingLeft:depth*13}}>
   <div className="t2-tree-row">{kids.length?<button aria-label={(expanded?'Collapse ':'Expand ')+node.title} onClick={()=>persist({...data,expandedIds:expanded?data.expandedIds.filter(x=>x!==id):[...data.expandedIds,id]})}>{expanded?'▾':'▸'}</button>:<span className="t2-tree-spacer"/>}
    <button className={'t2-tree-title'+(id===branch.id?' current':'')} onClick={()=>go(id)}>{node.title}</button>{id!=='main'&&<span className={node.status==='completed'?'t2-done':'t2-pending'} title={node.status}>{node.status==='completed'?'✓':'●'}</span>}
   </div>{expanded&&kids.map(k=>renderTree(k.id,depth+1))}</div>;
 }
 function saveSettings(){const value=nameDraft.trim()||branch.title;persist({...data,threads:data.threads.map(t=>t.id===branch.id?{...t,title:value}:t)});setSettings(false);}
 function finishSave(){const parent=branch.parentId;if(!parent)return;persist({...data,activeId:parent,threads:data.threads.map(t=>t.id===branch.id?{...t,status:'completed',summary:summary.trim()}:t)});setFinish(false);if(branch.originPage)onNavigate(branch.originPage);}
 function saveSummary(){setSummary(branch.summary);setFinish(true);}
 return <section className="t2-workspace">
  <header className="t2-header">
   <div className="t2-breadcrumb" ref={breadcrumbRef}>
    <div className="t2-breadcrumb-measure" ref={breadcrumbMeasureRef} aria-hidden="true">{ancestry.map((t,i)=><span key={t.id}>{i>0?' › ':''}{t.title}</span>)}</div>
    {!breadcrumbCompact||ancestry.length<=2?<>{ancestry.map((t,i)=><span key={t.id}>{i>0&&' › '}<button className={t.id===branch.id?'active':''} onClick={()=>go(t.id)}>{t.title}</button></span>)}</>:
     <><button onClick={()=>go('main')}>Main reading</button><span> › </span><button onClick={()=>setBreadOpen(v=>!v)}>…</button><span> › </span><button className="active" onClick={()=>go(branch.id)}>{branch.title}</button>
      {breadOpen&&<div className="t2-ellipsis-menu">{ancestry.slice(1,-1).map(t=><button key={t.id} onClick={()=>go(t.id)}>{t.title}</button>)}</div>}</>}
   </div>
   {branch.id!=='main'&&<button className="t2-gear" title="Tangent settings" aria-label="Tangent settings" onClick={()=>{setNameDraft(branch.title);setSettings(true);}}>⚙</button>}
   <div className="t2-branch-holder" ref={dropdownRef}><button className="secondary" aria-expanded={branchesOpen} onClick={()=>setBranchesOpen(v=>!v)}>Branches ▾</button>
    {branchesOpen&&<div className="t2-tree-pop" role="navigation" aria-label="Conversation branches">{renderTree('main',0)}</div>}</div>
  </header>
  {branch.parentId&&!settings&&<button className="t2-return" onClick={()=>go(branch.parentId!)}>← Return to parent</button>}
  {settings?<div className="t2-settings">
    <button className="secondary" onClick={()=>setSettings(false)}>← Back to tangent</button><h3>Tangent settings</h3>
    <label>Title<input value={nameDraft} onChange={e=>setNameDraft(e.target.value)}/></label>
    <h4>Starting point</h4><p className="muted">{data.anchors.find(a=>a.id===branch.originId)?.kind==='pdf'?'PDF passage':'Conversation excerpt'}</p>
    <blockquote>{data.anchors.find(a=>a.id===branch.originId)?.text}</blockquote>
    <h4>Source context</h4><p>Available sources: parent conversation and current reading PDF.</p>
    <p>Attached references: {branch.sourceIds.length} specific PDF passage(s).</p>
    <p className="muted">Fine-grained context and source editing will be added with the AI integration.</p>
    <button className="primary" onClick={saveSettings}>Save changes</button>
   </div>:<>
   <div className="t2-conversation" ref={conversationRef} onMouseUp={()=>window.setTimeout(captureSelection,0)} onKeyUp={()=>window.setTimeout(captureSelection,0)}>
    {branch.contextText&&<blockquote className="t2-origin"><strong>From {data.threads.find(t=>t.id===branch.parentId)?.title??'parent conversation'}</strong><p>{branch.contextText}</p></blockquote>}
    {branch.messages.map(message=><div className={'t2-message '+(message.role==='system'?'system':'user')} data-chat-message={message.id} key={message.id}>
     {message.role==='system'&&message.anchorId?<span>↗ Created tangent: <button className="t2-notification-link" onClick={()=>{const anchor=data.anchors.find(a=>a.id===message.anchorId);if(anchor)go(anchor.branchId);}}>{data.threads.find(t=>t.originId===message.anchorId)?.title??'Tangent'}</button></span>:linkedText(message)}
    </div>)}
    {!branch.messages.length&&!branch.contextText&&<p className="muted">Start the discussion whenever you're ready.</p>}
   </div>
   {selection&&<div className="t2-selection-pop" style={{left:selection.x,top:selection.y}}><button className="primary" onMouseDown={e=>e.preventDefault()} onClick={makeTangent}>↗ Create Tangent</button></div>}
   {hoverPreview&&<div className="t2-viewport-preview" role="tooltip" style={{left:hoverPreview.x,top:hoverPreview.y,transform:hoverPreview.y>120?'translateY(-100%)':'none'}}>{hoverPreview.ids.map(id=>{const anchor=data.anchors.find(a=>a.id===id);const t=data.threads.find(x=>x.id===anchor?.branchId);return t?<div key={id}><strong>{t.title}</strong><small>{t.status==='completed'?'✓ Completed':'● In progress'} · {t.messages.length} messages</small></div>:null;})}</div>}
   {chooser&&<div className="t2-chooser" style={{left:Math.min(window.innerWidth-265,chooser.x),top:Math.min(window.innerHeight-180,chooser.y)}}><strong>Related tangents</strong>{chooser.ids.map(id=>{const a=data.anchors.find(x=>x.id===id);const t=data.threads.find(x=>x.id===a?.branchId);return t?<button key={id} onClick={()=>go(t.id)}>{t.title} · {t.status}</button>:null;})}<button onClick={()=>setChooser(null)}>Close</button></div>}
   {finish?<div className="t2-finish"><h3>Finish tangent & return</h3><p className="muted">Write or edit your summary. AI summary generation is not connected yet.</p><textarea rows={4} value={summary} onChange={e=>setSummary(e.target.value)}/><button className="primary" onClick={finishSave}>Save summary & return</button><button className="secondary" onClick={()=>setFinish(false)}>Cancel</button></div>:
    <form className="t2-composer" onSubmit={saveNote}><textarea rows={3} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}} placeholder="Ask a question or write a note…" aria-label="Reading note"/><div className="t2-compose-actions">{branch.id!=='main'&&<button type="button" className="secondary" onClick={saveSummary}>✓ Finish tangent & return</button>}<button type="submit" className="primary" disabled={!draft.trim()}>Save note</button></div></form>}
  </>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
