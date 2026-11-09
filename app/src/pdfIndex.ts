import {getDocument,GlobalWorkerOptions,type PDFDocumentProxy} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {getSavedPdf} from './PdfReader';

GlobalWorkerOptions.workerSrc=workerUrl;
type PageText={page:number;text:string};
type PdfIndex={pages:PageText[];name:string};
const cache=new Map<string,Promise<PdfIndex>>();
const INDEX_DB='higher-math-pdf-text-index';
function openIndexDb():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(INDEX_DB,1);
  req.onupgradeneeded=()=>req.result.createObjectStore('indexes');
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function readIndex(id:string):Promise<PdfIndex|undefined>{
 const db=await openIndexDb();
 try{return await new Promise((resolve,reject)=>{
  const req=db.transaction('indexes','readonly').objectStore('indexes').get(id);
  req.onsuccess=()=>resolve(req.result as PdfIndex|undefined);
  req.onerror=()=>reject(req.error);
 });}finally{db.close();}
}
async function saveIndex(id:string,index:PdfIndex):Promise<void>{
 const db=await openIndexDb();
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('indexes','readwrite');
  tx.objectStore('indexes').put(index,id);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error);
  tx.onabort=()=>reject(tx.error);
 });}finally{db.close();}
}
export async function deletePdfIndex(id:string):Promise<void>{
 cache.delete(id);
 const db=await openIndexDb();
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('indexes','readwrite');
  tx.objectStore('indexes').delete(id);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error);
 });}finally{db.close();}
}
const words=(text:string)=>text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)??[];
async function extract(id:string):Promise<PdfIndex>{
 const saved=await getSavedPdf(id);
 if(!saved)throw new Error('The PDF is not available in this browser.');
 const task=getDocument({data:new Uint8Array(saved.bytes.slice(0))});
 let pdf:PDFDocumentProxy|undefined;
 try{
  pdf=await task.promise;
  const pages:PageText[]=[];
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i);
   const content=await page.getTextContent();
   const text=content.items.map(item=>'str' in item?item.str:'').filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
   pages.push({page:i,text});
   page.cleanup();
  }
  return {name:saved.name,pages};
 }finally{if(pdf)await pdf.destroy();}
}
export function forgetPdfIndex(id:string){cache.delete(id);}
export function getPdfIndex(id:string):Promise<PdfIndex>{
 if(!cache.has(id))cache.set(id,(async()=>{const saved=await readIndex(id).catch(()=>undefined);if(saved)return saved;const index=await extract(id);await saveIndex(id,index).catch(()=>undefined);return index;})().catch(err=>{cache.delete(id);throw err;}));
 return cache.get(id)!;
}
export async function retrievePdfContext(id:string,query:string,currentPage?:number):Promise<string>{
 const index=await getPdfIndex(id);
 const terms=[...new Set(words(query).filter(w=>w.length>2))];
 const scored=index.pages.filter(p=>p.text).map(p=>{
  const text=p.text.toLowerCase();
  const score=terms.reduce((total,term)=>total+Math.min(5,text.split(term).length-1),0);
  return {p,score,near:currentPage?Math.abs(p.page-currentPage):Infinity};
 });
 scored.sort((a,b)=>(b.score-a.score)||a.near-b.near);
 const selected=new Map<number,PageText>();
 if(currentPage&&index.pages[currentPage-1]?.text)selected.set(currentPage,index.pages[currentPage-1]);
 for(const {p,score} of scored){if(selected.size>=5)break;if(score>0)selected.set(p.page,p);}
 if(!selected.size)for(const {p} of scored.slice(0,2))selected.set(p.page,p);
 const snippets=[...selected.values()].map(p=>'[PDF page '+p.page+'] '+p.text.slice(0,2600));
 return 'Document: '+index.name+' ('+index.pages.length+' PDF pages).\n'+
  'Retrieved excerpts (text extracted from PDF; equation layout may be imperfect):\n'+snippets.join('\n\n');
}
