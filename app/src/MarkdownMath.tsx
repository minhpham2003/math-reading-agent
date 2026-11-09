import Markdown, {defaultUrlTransform} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

function normalizeMath(input:string){
 const normalized=input.split(/(```[\s\S]*?```|`[^`\n]*`)/g).map((segment,i)=>{
  if(i%2===1)return segment;
  return segment.replace(/\\\[([\s\S]*?)\\\]/g,(_all,tex:string)=>'\n\n$$'+tex+'$$\n\n')
    .replace(/\\\(([\s\S]*?)\\\)/g,(_all,tex:string)=>'$'+tex+'$');
 }).join('');
 // A stray display-math delimiter must not consume the rest of the answer.
 return (normalized.match(/\$\$/g)??[]).length%2===0
   ? normalized
   : normalized.replace(/\$\$/g, String.fromCharCode(92)+'$'+String.fromCharCode(92)+'$');
}

export function MarkdownMath({text,onPdfNavigate,allowedPages}:{text:string;onPdfNavigate?:(page:number,quote?:string)=>void;allowedPages?:number[]}){
 const chunks=normalizeMath(text).split(/(\[[^\]\n]+\]\(pdf-page:\d+(?:\?quote=[^)]*)?\))/g);
 return <div className="t2-rich-text">{chunks.map((chunk,i)=><Markdown key={i}
   urlTransform={url=>/^pdf-page:\d+(?:\?quote=[^)]*)?$/.test(url)?url:defaultUrlTransform(url)}
   remarkPlugins={[remarkGfm,remarkMath]}
   rehypePlugins={[[rehypeKatex,{trust:false,strict:'ignore',errorColor:'#718096'}]]}
   components={{a:({href,children})=>{
     const match=/^pdf-page:(\d+)(?:\?quote=(.+))?$/.exec(href??'');
     const label=String(children).trim();
     // Repair old model outputs that incorrectly linked "PDF page 7" to
     // an external website. Never open external URLs as PDF citations.
     const pageLabel=/^(?:PDF page|p\.)\s*(\d+)$/i.exec(label);
     const page=match?Number(match[1]):pageLabel?Number(pageLabel[1]):null;
     if(page!==null && onPdfNavigate && allowedPages?.includes(page)){
       let quote:string|undefined;
       try{quote=match?.[2]?decodeURIComponent(match[2]):undefined;}catch{quote=undefined;}
       return <button type="button" className="t2-pdf-citation" onClick={()=>onPdfNavigate(page,quote)} title={'Go to PDF '+(quote?'passage':'page')+' '+page}>{children} ↗</button>;
     }
     // Unsupported, unverified, or external links are text only. In
     // particular, an empty href must not navigate to this web app.
     return <span>{children}</span>;
   }}}>{chunk}</Markdown>)}</div>;
}
