export type RectBox={x:number;y:number;w:number;h:number};
export type Anchor={id:string;branchId:string;kind:'chat'|'pdf';targetId:string;start?:number;end?:number;page?:number;filename?:string;boxes?:RectBox[];text:string;createdAt:string};
export type Entry={id:string;role:'user'|'assistant'|'system';text:string;createdAt:string;anchorId?:string};
export type Thread={id:string;parentId:string|null;title:string;status:'in-progress'|'completed';messages:Entry[];summary:string;originId?:string;originPage?:number;contextText?:string;sourceIds:string[]};
export type TangentData={version:2;activeId:string;threads:Thread[];anchors:Anchor[];expandedIds:string[]};
export const TANGENT_EVENT='higher-math:tangent-created';
export const CHANGED_EVENT='higher-math:tangents-changed';
export const key=(session:string)=>'higher-math:tangents:v2:'+session;
export const initial=():TangentData=>({version:2,activeId:'main',anchors:[],expandedIds:[],threads:[{id:'main',parentId:null,title:'Otter',status:'in-progress',messages:[],summary:'',sourceIds:[]}]});
export function read(session:string):TangentData{try{const v=JSON.parse(localStorage.getItem(key(session))||'null') as TangentData|null;if(v?.version===2&&Array.isArray(v.threads)&&Array.isArray(v.anchors)&&v.threads.some(t=>t.id==='main'))return {...v,threads:v.threads.map(t=>t.id==='main'&&t.title==='Main reading'?{...t,title:'Otter'}:t)};}catch{}return initial();}
export function write(session:string,v:TangentData){localStorage.setItem(key(session),JSON.stringify(v));window.dispatchEvent(new CustomEvent(CHANGED_EVENT,{detail:{session}}));}
const titleFor=(text:string)=>text.trim().replace(/\s+/g,' ').slice(0,52)||'New tangent';
export function createTangent(session:string,origin:Omit<Anchor,'id'|'branchId'|'createdAt'>):string{
 const state=read(session),parent=state.threads.find(t=>t.id===state.activeId)??state.threads[0];
 const id=crypto.randomUUID(),anchorId=crypto.randomUUID(),stamp=new Date().toISOString();
 const anchor:Anchor={...origin,id:anchorId,branchId:id,createdAt:stamp};
 const child:Thread={id,parentId:parent.id,title:titleFor(origin.text),status:'in-progress',messages:[],summary:'',originId:anchorId,originPage:origin.page,contextText:origin.kind==='chat'?origin.text:undefined,sourceIds:origin.kind==='pdf'?[anchorId]:[]};
 const creation:Entry[] = origin.kind==='pdf'?[{id:crypto.randomUUID(),role:'system',text:'Created tangent',createdAt:stamp,anchorId}]:[];
 write(session,{...state,activeId:id,anchors:[...state.anchors,anchor],threads:state.threads.map(t=>t.id===parent.id?{...t,messages:[...t.messages,...creation]}:t).concat(child),expandedIds:[...new Set([...state.expandedIds,parent.id])]});
 window.dispatchEvent(new CustomEvent(TANGENT_EVENT,{detail:{session,id,origin}}));
 return id;
}
