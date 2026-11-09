/**
 * Source URLs in model output are untrusted. Only allow internal PDF links
 * backed by pages actually retrieved for this response.
 */
export function citationExcerptsFromContext(context?:string):Map<number,string>{
 const excerpts=new Map<number,string>();
 if(!context)return excerpts;
 for(const match of context.matchAll(/\[PDF page (\d+)\]\s*([\s\S]*?)(?=\n\n\[PDF page \d+\]|$)/g)){
  const page=Number(match[1]);
  if(Number.isSafeInteger(page)&&page>0)excerpts.set(page,match[2].trim());
 }
 return excerpts;
}

export function stripLegacySourceList(text:string):string{
 // Remove only the unrelated list produced by the previous frontend.
 return text.replace(/\n\nPDF sources:\s*(?:\[p\.\s*\d+\]\(pdf-page:\d+\)(?:\s*·\s*)?){1,3}\s*$/,'');
}

function normalized(text:string):string{
 return text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function validQuote(quote:string,excerpt:string):boolean{
 const q=normalized(quote);
 return q.length>=5 && normalized(excerpt).includes(q);
}

export function preparePdfCitations(reply:string,context?:string):string{
 const excerpts=citationExcerptsFromContext(context);
 const clean=stripLegacySourceList(reply);
 const rewritten=clean.replace(/\[([^\]\n]{1,180})\]\(([^)\n]+)\)/g,(_all,label:string,url:string)=>{
  const internal=/^pdf-page:(\d+)(?:\?quote=(.*))?$/.exec(url);
  if(internal){
   const page=Number(internal[1]),excerpt=excerpts.get(page);
   if(!excerpt)return label;
   if(internal[2]){
    let quote:string;
    try{quote=decodeURIComponent(internal[2]);}
    catch{return '['+label+'](pdf-page:'+page+')';}
    return validQuote(quote,excerpt)
     ? '['+label+'](pdf-page:'+page+'?quote='+encodeURIComponent(quote).replace(/[()]/g,char=>char==='('? '%28':'%29')+')'
     : '['+label+'](pdf-page:'+page+')';
   }
   return '['+label+'](pdf-page:'+page+')';
  }
  // A PDF page label can be rescued from a mistaken external link;
  // ordinary external links must never masquerade as source citations.
  const pageLabel=/^PDF page (\d+)$/i.exec(label.trim());
  if(pageLabel&&excerpts.has(Number(pageLabel[1])))
   return '['+label+'](pdf-page:'+Number(pageLabel[1])+')';
  return label;
 });
 // Link bare PDF page mentions only if that page was retrieved.
 // Leave Markdown links and code spans/blocks untouched.
 return rewritten.split(/(\[[^\]\n]+\]\([^\)\n]*\)|\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]*\x60)/g).map((part,i)=>{
  if(i%2===1)return part;
  return part.replace(/\bPDF page (\d+)\b/gi,(full,pageString:string)=>{
   const page=Number(pageString);
   return excerpts.has(page)?'['+full+'](pdf-page:'+page+')':full;
  });
 }).join('');
}
