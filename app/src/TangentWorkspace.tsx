import {useEffect,useRef,useState,type FormEvent,type MouseEvent as ReactMouseEvent,type ClipboardEvent} from 'react';
import {read,write,createTangent,CHANGED_EVENT,type TangentData,type Thread,type Entry} from './tangentStore';
import {aiConfigured,requestAiReply,verifyAccessToken,getAccessToken,setAccessToken} from './aiChat';
import {MathText} from './MathText';
import {MarkdownMath} from './MarkdownMath';
import {retrievePdfContext} from './pdfIndex';
import {readChatCitations,saveChatCitation} from './chatCitations';
import {citationExcerptsFromContext,preparePdfCitations,stripLegacySourceList} from './pdfCitations';

type SelectState={messageId:string;start:number;end:number;text:string;x:number;y:number;visible?:boolean};
const ancestorsOf=(thread:Thread,data:TangentData)=>{const result:Thread[]=[];let node:Thread|undefined=thread;while(node){result.unshift(node);node=node.parentId?data.threads.find(t=>t.id===node!.parentId):undefined;}return result;};

export function TangentWorkspace({sessionId,currentPdfPage,onNavigate}:{sessionId:string;currentPdfPage?:number;onNavigate:(page:number,quote?:string)=>void}){
 const [data,setData]=useState<TangentData>(()=>read(sessionId));
 const [draft,setDraft]=useState('');
 const [sendingThread,setSendingThread]=useState<string|null>(null);
 const [accessDraft,setAccessDraft]=useState('');
 const [accessReady,setAccessReady]=useState(()=>!!getAccessToken());
 const [verifyingAccess,setVerifyingAccess]=useState(false);
 const [selection,setSelection]=useState<SelectState|null>(null);
 const [branchesOpen,setBranchesOpen]=useState(false);
 const [treeExpanded,setTreeExpanded]=useState<string[]>(['main']);
 const [settings,setSettings]=useState(false);
 const [nameDraft,setNameDraft]=useState('');
 const [finish,setFinish]=useState(false);
 const [summary,setSummary]=useState('');
 const [chooser,setChooser]=useState<{ids:string[];x:number;y:number;visible:boolean}|null>(null);
 const chooserAnchorRef=useRef<HTMLElement|null>(null);
 const chooserRef=useRef<HTMLDivElement>(null);
 const [breadOpen,setBreadOpen]=useState(false);
 const [breadcrumbCompact,setBreadcrumbCompact]=useState(false);
 const breadcrumbRef=useRef<HTMLDivElement>(null);
 const breadcrumbMeasureRef=useRef<HTMLDivElement>(null);
 const [hoverPreview,setHoverPreview]=useState<{ids:string[];x:number;y:number}|null>(null);
 const [error,setError]=useState('');
 const [citationNavigation,setCitationNavigation]=useState(0);
 const conversationRef=useRef<HTMLDivElement>(null);
 const inputRef=useRef<HTMLDivElement>(null);
 const selectedRangeRef=useRef<Range|null>(null);
 const selectionPopRef=useRef<HTMLDivElement>(null);
 const savedScroll=useRef<Record<string,number>>({});
 const branch=data.threads.find(t=>t.id===data.activeId)??data.threads[0];
 const ancestry=ancestorsOf(branch,data);
 useEffect(()=>{const container=breadcrumbRef.current,measure=breadcrumbMeasureRef.current;if(!container||!measure)return;const check=()=>setBreadcrumbCompact(measure.scrollWidth>container.clientWidth+1);check();const observer=new ResizeObserver(check);observer.observe(container);observer.observe(measure);return()=>observer.disconnect();},[data.activeId,data.threads]);
 const anchorsFor=(id:string)=>data.anchors.filter(a=>a.kind==='chat'&&a.targetId===id);
 function persist(next:TangentData){try{write(sessionId,next);setData(next);setError('');}catch{setError('Unable to save this tangent.');}}
 useEffect(()=>{const sync=(event:Event)=>{const e=event as CustomEvent<{session:string}>;if(e.detail?.session===sessionId)setData(read(sessionId));};
 window.addEventListener(CHANGED_EVENT,sync);return()=>window.removeEventListener(CHANGED_EVENT,sync);},[sessionId]);
 useEffect(()=>{function esc(e:KeyboardEvent){if(e.key==='Escape'){setBranchesOpen(false);setChooser(null);setSelection(null);setBreadOpen(false);}}document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc);},[]);
 useEffect(()=>{if(conversationRef.current)conversationRef.current.scrollTop=savedScroll.current[branch.id]??0;},[branch.id,settings]);
 function go(id:string){setHoverPreview(null);if(!data.threads.some(t=>t.id===id))return;if(conversationRef.current)savedScroll.current[branch.id]=conversationRef.current.scrollTop;persist({...data,activeId:id});setSelection(null);setChooser(null);setSettings(false);setFinish(false);setBranchesOpen(false);setBreadOpen(false);}

 function composerValue(node:Node):string{
  if(node instanceof HTMLElement&&node.dataset.citationMarkdown)return node.dataset.citationMarkdown;
  if(node.nodeType===Node.TEXT_NODE)return node.textContent??'';
  if(node instanceof HTMLBRElement)return '\n';
  let result=Array.from(node.childNodes).map(composerValue).join('');
  if(node instanceof HTMLElement&&/^(DIV|P)$/.test(node.tagName)&&node.nextSibling)result+='\n';
  return result;
 }
 function syncComposer(){if(inputRef.current)setDraft(composerValue(inputRef.current));}
 function pasteComposer(event:ClipboardEvent<HTMLDivElement>){
  const text=event.clipboardData.getData('text/plain');
  const pattern=/\[([^\]\n]+)\]\(((?:pdf|chat)-citation:[a-zA-Z0-9-]+)\)/g;
  if(!pattern.test(text))return;
  event.preventDefault();pattern.lastIndex=0;
  const fragment=document.createDocumentFragment();
  let last=0;
  for(const match of text.matchAll(pattern)){
   fragment.append(document.createTextNode(text.slice(last,match.index)));
   const chip=document.createElement('span');
   chip.className='t2-composer-citation';
   chip.contentEditable='false';
   chip.dataset.citationMarkdown=match[0];
   chip.textContent=match[1]+' ↗';
   fragment.append(chip);fragment.append(document.createTextNode(' '));
   last=(match.index??0)+match[0].length;
  }
  fragment.append(document.createTextNode(text.slice(last)));
  const sel=window.getSelection();
  if(!sel?.rangeCount)return;
  const range=sel.getRangeAt(0);range.deleteContents();
  const lastNode=fragment.lastChild;
  range.insertNode(fragment);
  if(lastNode){range.setStartAfter(lastNode);range.collapse(true);sel.removeAllRanges();sel.addRange(range);}
  syncComposer();
 }
 async function saveNote(event:FormEvent){
  event.preventDefault();if(!draft.trim()||sendingThread)return;
  const threadId=branch.id;
  const entry:Entry={id:crypto.randomUUID(),role:'user',text:draft.trim(),createdAt:new Date().toISOString()};
  const updated={...data,threads:data.threads.map(t=>t.id===threadId?{...t,messages:[...t.messages,entry],status:'in-progress' as const}:t)};
  persist(updated);setDraft('');if(inputRef.current)inputRef.current.textContent='';
  requestAnimationFrame(()=>{if(conversationRef.current)conversationRef.current.scrollTop=conversationRef.current.scrollHeight;});
  if(!aiConfigured())return;
  setSendingThread(threadId);
  try{
   const thread=updated.threads.find(t=>t.id===threadId)!;
   const messages=thread.messages.filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role as 'user'|'assistant',content:m.text}));
   const context=await retrievePdfContext(sessionId,entry.text,currentPdfPage).catch(()=>undefined);
   const citationPages=[...citationExcerptsFromContext(context).keys()];
   const reply=await requestAiReply(messages,context);
   const citedReply=preparePdfCitations(reply,context);
   // Read the latest stored state so branch navigation and PDF tangent updates are preserved.
   const latest=read(sessionId);
   const assistant:Entry={id:crypto.randomUUID(),role:'assistant',text:citedReply,citationPages,createdAt:new Date().toISOString()};
   persist({...latest,threads:latest.threads.map(t=>t.id===threadId?{...t,messages:[...t.messages,assistant]}:t)});
   requestAnimationFrame(()=>{if(conversationRef.current&&read(sessionId).activeId===threadId)conversationRef.current.scrollTop=conversationRef.current.scrollHeight;});
  }catch(e){
   if(e instanceof Error && /access token required or invalid|invalid access token/i.test(e.message)){
    setAccessToken('');setAccessReady(false);setAccessDraft('');
    setError('Invalid access token. Please enter it again.');
   }else setError(e instanceof Error?e.message:'AI request failed.');
  }
  finally{setSendingThread(null);}
 }
 function captureSelection(){
  const selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount){setSelection(null);return;}
  const range=selection.getRangeAt(0);const start=range.startContainer.parentElement?.closest<HTMLElement>('[data-chat-message]');
  const end=range.endContainer.parentElement?.closest<HTMLElement>('[data-chat-message]');
  if(!start||start!==end||!conversationRef.current?.contains(start)){setSelection(null);return;}
  const messageId=start.dataset.chatMessage!;const message=branch.messages.find(m=>m.id===messageId);
  const textNode=start.querySelector<HTMLElement>('[data-message-content]');if(!message||!textNode||!textNode.contains(range.commonAncestorContainer)){setSelection(null);return;}
  const pre=document.createRange();pre.selectNodeContents(textNode);pre.setEnd(range.startContainer,range.startOffset);
  const pos=pre.toString().length;const selected=selection.toString();if(!selected.trim()){setSelection(null);return;}
  selectedRangeRef.current=range.cloneRange();
  const rect=range.getBoundingClientRect();setSelection({messageId,start:pos,end:pos+selected.length,text:selected,x:rect.left+rect.width/2,y:rect.top-8,visible:true});
 }
 useEffect(()=>{
  if(!selection)return;
  const update=()=>{
   const range=selectedRangeRef.current;
   if(!range||!conversationRef.current){setSelection(null);return;}
   const rect=range.getBoundingClientRect(),box=conversationRef.current.getBoundingClientRect();
   const visible=rect.bottom>=box.top&&rect.top<=box.bottom;
   // Keep the selection for scroll-back; only hide the floating control.
   const popup=selectionPopRef.current;
   if(popup){
     const half=popup.getBoundingClientRect().width/2;
     const safeLeft=Math.max(box.left+half+8,Math.min(rect.left+rect.width/2,box.right-half-8));
     popup.style.left=Math.max(half+8,Math.min(safeLeft,window.innerWidth-half-8))+'px';
     popup.style.top=(rect.top-8)+'px';
     popup.style.visibility=visible?'visible':'hidden';
     popup.style.pointerEvents=visible?'auto':'none';
   }
  };
  const dismiss=(event:PointerEvent)=>{
   if(selectionPopRef.current?.contains(event.target as Node))return;
   selectedRangeRef.current=null;setSelection(null);
  };
  const container=conversationRef.current;
  update();
  container?.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  document.addEventListener('pointerdown',dismiss,true);
  return()=>{container?.removeEventListener('scroll',update);window.removeEventListener('resize',update);document.removeEventListener('pointerdown',dismiss,true);};
 },[selection?.messageId,selection?.start,selection?.end]);
 function saveSelectedCitation(){
  if(!selection)return;
  saveChatCitation({id:crypto.randomUUID(),sessionId,threadId:branch.id,messageId:selection.messageId,text:selection.text,start:selection.start,end:selection.end});
  selectedRangeRef.current=null;setSelection(null);window.getSelection()?.removeAllRanges();
 }
 useEffect(()=>{const open=(event:Event)=>{if((event as CustomEvent<{sessionId:string;id:string}>).detail?.sessionId===sessionId){const id=(event as CustomEvent<{id:string}>).detail.id;const url=new URL(window.location.href);url.searchParams.set('chatCitation',id);window.history.replaceState(null,'',url.pathname+url.search+url.hash);setCitationNavigation(n=>n+1);}};window.addEventListener('higher-math:open-chat-citation',open);return()=>window.removeEventListener('higher-math:open-chat-citation',open);},[sessionId]);
 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get('chatCitation');
  if(!id)return;
  const ref=readChatCitations(sessionId).find(c=>c.id===id);
  if(!ref)return;
  if(data.activeId!==ref.threadId){const latest=read(sessionId);write(sessionId,{...latest,activeId:ref.threadId});setData(read(sessionId));}
  let cancelled=false;
  const timer=window.setTimeout(()=>{
   if(cancelled)return;
   const msg=Array.from(conversationRef.current?.querySelectorAll<HTMLElement>('[data-chat-message]')??[]).find(node=>node.dataset.chatMessage===ref.messageId);
   if(!msg)return;
   msg.scrollIntoView({block:'center',behavior:'instant'});
   msg.classList.add('t2-cited-message-flash');
   window.setTimeout(()=>msg.classList.remove('t2-cited-message-flash'),4200);
   // Select exactly the saved excerpt when it is represented in the DOM.
   const container=msg.querySelector<HTMLElement>('[data-message-content]');
   if(!container)return;
   const nodes:Array<Text>=[];
   const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);
   while(walker.nextNode())nodes.push(walker.currentNode as Text);
   const full=nodes.map(n=>n.textContent??'').join('');
   const found=full.indexOf(ref.text);
   if(found<0)return;
   let at=0,first:Text|undefined,last:Text|undefined,start=0,end=0;
   for(const node of nodes){const len=node.textContent?.length??0;
    if(!first&&found>=at&&found<at+len){first=node;start=found-at;}
    if(first&&found+ref.text.length<=at+len){last=node;end=found+ref.text.length-at;break;}
    at+=len;
   }
   if(first&&last){const range=document.createRange();range.setStart(first,start);range.setEnd(last,end);const sel=window.getSelection();sel?.removeAllRanges();sel?.addRange(range);window.setTimeout(()=>{if(sel?.rangeCount&&sel.getRangeAt(0)===range)sel.removeAllRanges();},4200);}
  },220);
  return()=>{cancelled=true;window.clearTimeout(timer);};
 },[sessionId,data.activeId,data.threads.length,citationNavigation]);
 function makeTangent(){if(!selection)return;selectedRangeRef.current=null;createTangent(sessionId,{kind:'chat',targetId:selection.messageId,start:selection.start,end:selection.end,text:selection.text});setSelection(null);window.getSelection()?.removeAllRanges();}
 function openAnchors(ids:string[],event:ReactMouseEvent){event.preventDefault();event.stopPropagation();if(ids.length===1)go(data.anchors.find(a=>a.id===ids[0])!.branchId);else {chooserAnchorRef.current=event.currentTarget as HTMLElement;const rect=chooserAnchorRef.current.getBoundingClientRect();setChooser({ids,x:rect.left,y:rect.bottom+8,visible:true});}}
 useEffect(()=>{if(!chooser)return;const reposition=()=>{const anchor=chooserAnchorRef.current,container=conversationRef.current;if(!anchor||!container||!anchor.isConnected){setChooser(null);return;}const rect=anchor.getBoundingClientRect(),box=container.getBoundingClientRect();setChooser(prev=>prev?{...prev,x:Math.max(8,Math.min(rect.left,window.innerWidth-265)),y:rect.bottom+8,visible:rect.bottom>=box.top&&rect.top<=box.bottom}:null);};const outside=(e:PointerEvent)=>{if(chooserRef.current?.contains(e.target as Node)||chooserAnchorRef.current?.contains(e.target as Node))return;setChooser(null);chooserAnchorRef.current=null;};const container=conversationRef.current;container?.addEventListener('scroll',reposition,{passive:true});window.addEventListener('resize',reposition);document.addEventListener('pointerdown',outside,true);reposition();return()=>{container?.removeEventListener('scroll',reposition);window.removeEventListener('resize',reposition);document.removeEventListener('pointerdown',outside,true);};},[chooser?.ids.join('|')]);
 function linkedText(message:Entry){
  const references=anchorsFor(message.id).filter(a=>a.start!==undefined&&a.end!==undefined&&a.end>a.start);
  if(!references.length)return <div data-message-content>{message.role==='assistant'?<MarkdownMath text={stripLegacySourceList(message.text)} onPdfNavigate={onNavigate} allowedPages={message.citationPages} sessionId={sessionId}/>:<MarkdownMath text={message.text} onPdfNavigate={onNavigate} sessionId={sessionId}/>}</div>;
  const points=new Set<number>([0,message.text.length]);references.forEach(a=>{points.add(Math.min(message.text.length,a.start!));points.add(Math.min(message.text.length,a.end!));});
  const edges=[...points].sort((a,b)=>a-b);
  return <span data-message-content>{edges.slice(0,-1).map((start,i)=>{const end=edges[i+1],slice=message.text.slice(start,end);const matches=references.filter(a=>a.start!<end&&a.end!>start);if(!matches.length)return <span key={i}><MathText text={slice}/></span>;
   return <button key={i} type="button" className="t2-link" onClick={e=>openAnchors(matches.map(a=>a.id),e)} onMouseEnter={e=>{const rect=e.currentTarget.getBoundingClientRect();setHoverPreview({ids:matches.map(a=>a.id),x:Math.max(12,Math.min(rect.left,window.innerWidth-260)),y:rect.top>120?rect.top-9:rect.bottom+9});}} onMouseLeave={()=>setHoverPreview(null)} onFocus={e=>{const rect=e.currentTarget.getBoundingClientRect();setHoverPreview({ids:matches.map(a=>a.id),x:Math.max(12,Math.min(rect.left,window.innerWidth-260)),y:rect.top>120?rect.top-9:rect.bottom+9});}} onBlur={()=>setHoverPreview(null)}>{slice}</button>;
  })}</span>;
 }
 function renderTree(id:string,depth:number):React.ReactNode{
  const node=data.threads.find(t=>t.id===id);if(!node)return null;
  const kids=data.threads.filter(t=>t.parentId===id);
  const expanded=treeExpanded.includes(id);
  return <div key={id} className={'t2-tree-node'+(depth===0?' t2-tree-root':'')}>
   <div className="t2-tree-row">{kids.length?<button aria-label={(expanded?'Collapse ':'Expand ')+node.title} onClick={()=>setTreeExpanded(ids=>expanded?ids.filter(x=>x!==id):[...ids,id])}>{expanded?'▾':'▸'}</button>:<span className="t2-tree-spacer"/>}
    <button className={'t2-tree-title'+(id===branch.id?' current':'')} onClick={()=>go(id)}>{node.title}</button>{id!=='main'&&<span className={node.status==='completed'?'t2-done':'t2-pending'} title={node.status}>{node.status==='completed'?'✓':'●'}</span>}
   </div>{expanded&&kids.length>0&&<div className="t2-tree-children">{kids.map(k=>renderTree(k.id,depth+1))}</div>}</div>;
 }
 function saveSettings(){const value=nameDraft.trim()||branch.title;persist({...data,threads:data.threads.map(t=>t.id===branch.id?{...t,title:value}:t)});setSettings(false);}
 function finishSave(){const parent=branch.parentId;if(!parent)return;persist({...data,activeId:parent,threads:data.threads.map(t=>t.id===branch.id?{...t,status:'completed',summary:summary.trim()}:t)});setFinish(false);if(branch.originPage)onNavigate(branch.originPage);}
 function saveSummary(){setSummary(branch.summary);setFinish(true);}
 return <section className="t2-workspace">
  <header className="t2-header">
   <div className="t2-breadcrumb" ref={breadcrumbRef}>
    <div className="t2-breadcrumb-measure" ref={breadcrumbMeasureRef} aria-hidden="true">{ancestry.map((t,i)=><span key={t.id}>{i>0?' › ':''}{t.title}</span>)}</div>
    {!breadcrumbCompact||ancestry.length<=2?<>{ancestry.map((t,i)=><span key={t.id}>{i>0&&' › '}<button className={t.id===branch.id?'active':''} onClick={()=>go(t.id)}>{t.title}</button></span>)}</>:
     <><button onClick={()=>go('main')}>{data.threads.find(t=>t.id==='main')?.title??'local'}</button><span> › </span><button onClick={()=>setBreadOpen(v=>!v)}>…</button><span> › </span><button className="active" onClick={()=>go(branch.id)}>{branch.title}</button>
      {breadOpen&&<div className="t2-ellipsis-menu">{ancestry.slice(1,-1).map(t=><button key={t.id} onClick={()=>go(t.id)}>{t.title}</button>)}</div>}</>}
   </div>
   {branch.id!=='main'&&<button className="t2-gear" title="Tangent settings" aria-label="Tangent settings" onClick={()=>{setNameDraft(branch.title);setSettings(true);}}>⚙</button>}
   <button className="secondary" aria-pressed={branchesOpen} onClick={()=>{if(!branchesOpen)setTreeExpanded(['main']);setBranchesOpen(v=>!v);setSettings(false);setSelection(null);setHoverPreview(null);}}>Branches</button>
  </header>

  {branchesOpen?<div className="t2-branch-view"><div className="t2-branch-view-body" role="navigation" aria-label="Conversation branches">{renderTree('main',0)}</div></div>:settings?<div className="t2-settings">
    <h3>Tangent settings</h3>
    <label>Title<input value={nameDraft} onChange={e=>setNameDraft(e.target.value)}/></label>
    <h4>Starting point</h4><p className="muted">{data.anchors.find(a=>a.id===branch.originId)?.kind==='pdf'?'PDF passage':'Conversation excerpt'}</p>
    <blockquote>{data.anchors.find(a=>a.id===branch.originId)?.text}</blockquote>
    <h4>Source context</h4><p>Available sources: parent conversation and current reading PDF.</p>
    <p>Attached references: {branch.sourceIds.length} specific PDF passage(s).</p>
    <p className="muted">Fine-grained context and source editing will be added with the AI integration.</p>
    <button className="primary" onClick={saveSettings}>Save changes</button>
   </div>:<>
   <div className="t2-conversation" ref={conversationRef} onMouseUp={()=>window.setTimeout(captureSelection,0)} onKeyUp={()=>window.setTimeout(captureSelection,0)}>
    {branch.contextText&&<div className="t2-origin-compact"><span>From {data.threads.find(t=>t.id===branch.parentId)?.title??"parent"}:</span><p className="t2-origin-text">{branch.contextText}</p></div>}
    {branch.messages.map(message=><div className={'t2-message '+(message.role==='system'?'system':message.role==='assistant'?'assistant':'user')} data-chat-message={message.id} key={message.id}>
     {message.role==='system'&&message.anchorId?<span>↗ Created tangent: <button className="t2-notification-link" onClick={()=>{const anchor=data.anchors.find(a=>a.id===message.anchorId);if(anchor)go(anchor.branchId);}}>{data.threads.find(t=>t.originId===message.anchorId)?.title??'Tangent'}</button></span>:linkedText(message)}
    </div>)}
    {!branch.messages.length&&!branch.contextText&&<p className="muted">Start the discussion whenever you're ready.</p>}
    {sendingThread===branch.id&&<p className="muted" role="status">AI is responding…</p>}
   </div>
   {selection&&<div ref={selectionPopRef} className="t2-selection-pop" style={{left:selection.x,top:selection.y}}><button className="primary" onMouseDown={e=>e.preventDefault()} onClick={saveSelectedCitation}>Cite</button><button className="primary" onMouseDown={e=>e.preventDefault()} onClick={makeTangent}>Branch</button></div>}
   {hoverPreview&&<div className="t2-viewport-preview" role="tooltip" style={{left:hoverPreview.x,top:hoverPreview.y,transform:hoverPreview.y>120?'translateY(-100%)':'none'}}>{hoverPreview.ids.map(id=>{const anchor=data.anchors.find(a=>a.id===id);const t=data.threads.find(x=>x.id===anchor?.branchId);return t?<div key={id}><strong>{t.title}</strong><small>{t.status==='completed'?'✓ Completed':'● In progress'} · {t.messages.length} messages</small></div>:null;})}</div>}
   {chooser&&chooser.visible&&<div ref={chooserRef} className="t2-chooser" style={{left:chooser.x,top:Math.min(window.innerHeight-180,chooser.y)}}><strong>Related tangents</strong>{chooser.ids.map(id=>{const a=data.anchors.find(x=>x.id===id);const t=data.threads.find(x=>x.id===a?.branchId);return t?<button key={id} onClick={()=>go(t.id)}>{t.title} · {t.status}</button>:null;})}</div>}
   {finish?<div className="t2-finish"><h3>Finish tangent & return</h3><p className="muted">Write or edit your summary. AI summary generation is not connected yet.</p><textarea rows={4} value={summary} onChange={e=>setSummary(e.target.value)}/><button className="primary" onClick={finishSave}>Save summary & return</button><button className="secondary" onClick={()=>setFinish(false)}>Cancel</button></div>:
    <form className="t2-composer" onSubmit={saveNote}><div className="t2-input-wrap"><div ref={inputRef} className="t2-rich-composer" role="textbox" aria-multiline="true" contentEditable suppressContentEditableWarning data-placeholder="Ask a question or write a note…" aria-label="Reading note" onInput={syncComposer} onPaste={pasteComposer} onClick={e=>{const chip=(e.target as HTMLElement).closest<HTMLElement>('[data-citation-markdown]');if(!chip)return;const link=chip.dataset.citationMarkdown??'';const match=/\]\((pdf|chat)-citation:([a-zA-Z0-9-]+)\)/.exec(link);if(!match)return;window.dispatchEvent(new CustomEvent('higher-math:open-'+match[1]+'-citation',{detail:{sessionId,id:match[2]}}));}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.closest('form')?.requestSubmit();}}}/><button type="submit" className="t2-send-button" disabled={!draft.trim()||!!sendingThread} aria-label="Send message" title="Send message"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7"/></svg></button></div>{branch.id!=='main'&&<div className="t2-compose-actions"><button type="button" className="secondary" onClick={saveSummary}>✓ Finish tangent & return</button></div>}</form>}
  </>}
  {!branchesOpen&&aiConfigured()&&!accessReady&&<form className="t2-access-form" onSubmit={async e=>{e.preventDefault();if(!accessDraft.trim()||verifyingAccess)return;setVerifyingAccess(true);setError('');try{await verifyAccessToken(accessDraft.trim());setAccessToken(accessDraft);setAccessReady(true);setAccessDraft('');}catch(err){setAccessReady(false);setError(err instanceof Error?err.message:'Could not verify access token.');}finally{setVerifyingAccess(false);}}}><label htmlFor="chatAccessKey">Private chat access token</label><input id="chatAccessKey" type="password" value={accessDraft} onChange={e=>setAccessDraft(e.target.value)} autoComplete="off" placeholder="Enter access token" /><button type="submit" className="secondary" disabled={!accessDraft.trim()||verifyingAccess}>{verifyingAccess?"Verifying…":"Unlock AI"}</button></form>}
  {!branchesOpen&&!aiConfigured()&&<p className="muted" role="status">AI backend not connected — messages are saved as notes.</p>}
  {error&&<p role="alert">{error}</p>}
 </section>;
}
