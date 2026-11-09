import katex from 'katex';
import 'katex/dist/katex.min.css';

// Explicit delimiters only: prose dollars and currency remain untouched.
const mathPattern=/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|(?<!\\)\$(?!\s)(?:\\.|[^$\\\n])+?\$)/g;
export function MathText({text}:{text:string}){
 const parts:React.ReactNode[]=[];
 let last=0;
 for(const match of text.matchAll(mathPattern)){
  const start=match.index,raw=match[0];
  if(start>last)parts.push(text.slice(last,start));
  const display=raw.startsWith('\\[')||raw.startsWith('$$');
  const latex=raw.slice(2,raw.length-2).trim();
  const formula=raw.startsWith('\\(')?raw.slice(2,-2).trim():display?latex:raw.slice(1,-1);
  try{
   const html=katex.renderToString(formula,{displayMode:display,throwOnError:true,trust:false,strict:'warn'});
   const Tag=display?'div':'span';
   parts.push(<Tag key={start} className={display?'chat-math-block':'chat-math-inline'} dangerouslySetInnerHTML={{__html:html}}/>);
  }catch{
   parts.push(raw);
  }
  last=start+raw.length;
 }
 if(last<text.length)parts.push(text.slice(last));
 return <>{parts.length?parts:text}</>;
}
