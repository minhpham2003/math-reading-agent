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

const numberedSourceLabel=/\b(theorem|definition|lemma|proposition|corollary|example|remark|exercise|section)\s+(\d+(?:\.\d+)*)\b/i;
const sectionSymbolLabel=/§\s*(\d+(?:\.\d+)*)\b/;

function sourceLabelParts(label:string):{kind:string;number:string}|undefined{
 const named=numberedSourceLabel.exec(label);
 if(named)return {kind:named[1].toLowerCase(),number:named[2]};
 const section=sectionSymbolLabel.exec(label);
 if(section)return {kind:'section',number:section[1]};
}
function sourceLabelMatch(label:string,excerpt:string):RegExpExecArray|null{
 const parts=sourceLabelParts(label);if(!parts)return null;
 const number=parts.number.replace(/\./g,'\\s*\\.\\s*');
 if(parts.kind==='section'){
  return new RegExp('(?:\\bsection\\s*|§\\s*)'+number+'\\b','i').exec(excerpt);
 }
 return new RegExp('\\b'+parts.kind+'\\s*'+number+'\\b','i').exec(excerpt);
}
function anchorForLabel(label:string,excerpt:string):string|undefined{
 const match=sourceLabelMatch(label,excerpt);
 if(!match)return;
 // Match a short, exact stretch from the extracted text, not a generated paraphrase.
 return excerpt.slice(match.index,Math.min(excerpt.length,match.index+70)).trim();
}
function pageCitation(label:string,page:number,excerpt:string):string{
 const quote=anchorForLabel(label,excerpt);
 return '['+label+'](pdf-page:'+page+(quote?'?quote='+encodeURIComponent(quote).replace(/[()]/g,ch=>ch==='('?'%28':'%29'):'')+')';
}
function uniqueSourcePage(label:string,excerpts:Map<number,string>):{page:number;excerpt:string}|undefined{
 const matches=[...excerpts.entries()].filter(([,excerpt])=>sourceLabelMatch(label,excerpt));
 return matches.length===1?{page:matches[0][0],excerpt:matches[0][1]}:undefined;
}
function proactivelyLinkSourceLabels(text:string,excerpts:Map<number,string>):string{
 // Leave existing Markdown links and code untouched. For plain text, only add a
 // link when an explicit numbered source label occurs on exactly one retrieved page.
 return text.split(/(\[[^\]\n]+\]\([^\)\n]*\)|\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]*\x60)/g).map((part,i)=>{
  if(i%2===1)return part;
  return part.replace(/\b(?:Theorem|Definition|Lemma|Proposition|Corollary|Example|Remark|Exercise|Section)\s+\d+(?:\.\d+)*\b|§\s*\d+(?:\.\d+)*/gi,label=>{
   const source=uniqueSourcePage(label,excerpts);
   return source?pageCitation(label,source.page,source.excerpt):label;
  });
 }).join('');
}

export function preparePdfCitations(reply:string,context?:string):string{
 const excerpts=citationExcerptsFromContext(context);
 const clean=stripLegacySourceList(reply);
 const rewritten=clean.replace(/\[([^\]\n]{1,180})\]\(((?:[^()\n]|\([^()\n]*\))*)\)/g,(_all,label:string,url:string)=>{
 const internal=/^pdf-page:(\d+)(?:\?quote=(.*))?$/.exec(url);
  if(internal){
   const page=Number(internal[1]),excerpt=excerpts.get(page);
   if(!excerpt)return label;
   if(internal[2]){
    let quote:string;
    try{quote=decodeURIComponent(internal[2]);}
    catch{return pageCitation(label,page,excerpt);}
    // Keep the original passage target: PDF extraction is not reliable enough
    // to reject a quote merely because normalization differs.
    return '['+label+'](pdf-page:'+page+'?quote='+encodeURIComponent(quote).replace(/[()]/g,char=>char==='('? '%28':'%29')+')';
   }
   return pageCitation(label,page,excerpt);
  }
  // A PDF page label can be rescued from a mistaken external link;
  // ordinary external links must never masquerade as source citations.
  const pageLabel=/^PDF page (\d+)$/i.exec(label.trim());
  if(pageLabel&&excerpts.has(Number(pageLabel[1])))
   return '['+label+'](pdf-page:'+Number(pageLabel[1])+')';
  return label;
 });
 const withSourceLabels=proactivelyLinkSourceLabels(rewritten,excerpts);
 // Link bare PDF page mentions only if that page was retrieved.
 // Leave Markdown links and code spans/blocks untouched.
 return withSourceLabels.split(/(\[[^\]\n]+\]\([^\)\n]*\)|\x60{3}[\s\S]*?\x60{3}|\x60[^\x60\n]*\x60)/g).map((part,i)=>{
  if(i%2===1)return part;
  return part.replace(/\bPDF page (\d+)\b/gi,(full,pageString:string)=>{
   const page=Number(pageString);
   return excerpts.has(page)?'['+full+'](pdf-page:'+page+')':full;
  });
 }).join('');
}
