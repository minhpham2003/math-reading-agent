import {citationDeepLink} from './chatCitations';

export async function copyLinkedCitation(sessionId:string,id:string,kind:'pdf'|'chat',label:string):Promise<void>{
 const url=citationDeepLink(sessionId,id,kind);
 const safeLabel=label.replace(/[\[\]\\]/g,'').trim()||(kind==='pdf'?'PDF citation':'Chat citation');
 const markdown='['+safeLabel+']('+kind+'-citation:'+id+')';
 // Rich-text editors receive an ordinary clickable hyperlink; Higher Math's
 // composer receives compact Markdown using the saved internal citation id.
 const html='<a href="'+url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">'+safeLabel.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</a>';
 if(typeof ClipboardItem!=='undefined'&&navigator.clipboard.write){
  try{
   await navigator.clipboard.write([new ClipboardItem({
    'text/plain':new Blob([markdown],{type:'text/plain'}),
    'text/html':new Blob([html],{type:'text/html'})
   })]);return;
  }catch{/* Plain-text clipboard fallback below. */}
 }
 await navigator.clipboard.writeText(markdown);
}
