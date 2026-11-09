export type ChatCitation={id:string;sessionId:string;threadId:string;messageId:string;text:string;start:number;end:number};
export const CHAT_CITATIONS_EVENT='higher-math:chat-citations-changed';
const key=(sessionId:string)=>'higher-math:chat-citations:'+sessionId;
export function readChatCitations(sessionId:string):ChatCitation[]{
 try{const entries:unknown=JSON.parse(localStorage.getItem(key(sessionId))||'[]');return Array.isArray(entries)?entries as ChatCitation[]:[];}catch{return [];}
}
export function saveChatCitation(ref:ChatCitation):void{
 const entries=readChatCitations(ref.sessionId);
 localStorage.setItem(key(ref.sessionId),JSON.stringify([...entries,ref]));
 window.dispatchEvent(new CustomEvent(CHAT_CITATIONS_EVENT,{detail:{sessionId:ref.sessionId}}));
}
export function removeChatCitation(sessionId:string,id:string):void{
 localStorage.setItem(key(sessionId),JSON.stringify(readChatCitations(sessionId).filter(c=>c.id!==id)));
 window.dispatchEvent(new CustomEvent(CHAT_CITATIONS_EVENT,{detail:{sessionId}}));
}
export function citationDeepLink(sessionId:string,id:string,kind:'pdf'|'chat'):string{
 const url=new URL(window.location.href);
 url.searchParams.delete('v');
 url.searchParams.delete('citation');
 url.searchParams.delete('chatCitation');
 url.searchParams.set(kind==='pdf'?'citation':'chatCitation',id);
 url.hash='session-'+encodeURIComponent(sessionId);
 return url.toString();
}
