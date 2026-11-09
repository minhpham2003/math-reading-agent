import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// The model uses both TeX \(…\), \[…\] and Markdown $…$, $$…$$.
// Convert TeX delimiters outside fenced and inline code to remark-math notation.
function normalizeMath(input:string){
 return input.split(/(```[\s\S]*?```|`[^`\n]*`)/g).map((segment,i)=>{
  if(i%2===1)return segment;
  return segment.replace(/\\\[([\s\S]*?)\\\]/g,(_all,tex:string)=>'\n\n$$'+tex+'$$\n\n')
    .replace(/\\\(([\s\S]*?)\\\)/g,(_all,tex:string)=>'$'+tex+'$');
 }).join('');
}

export function MarkdownMath({text,onPdfNavigate,allowedPages}:{text:string;onPdfNavigate?:(page:number)=>void;allowedPages?:number[]}){
 return <div className="t2-rich-text"><Markdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[[rehypeKatex,{trust:false,strict:'ignore'}]]} components={{a:({href,children})=>{const match=/^pdf-page:(\\d+)$/.exec(href??'');if(match){const page=Number(match[1]);return onPdfNavigate&&allowedPages?.includes(page)?<button type="button" className="t2-pdf-citation" onClick={()=>onPdfNavigate(page)} title={'Go to PDF page '+page}>{children} ↗</button>:<span>{children}</span>;}return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;}}}>{normalizeMath(text)}</Markdown></div>;
}
