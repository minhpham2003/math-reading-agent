import {getPdfIndex} from './pdfIndex';
import {requestAiReply} from './aiChat';

export type SourceAssessment={
 scope:string;structure:string;difficulty:string;dependencies:string;minutes:string;recommendation:string;
};
export type AssessmentResult={assessment:SourceAssessment;sourcePages:number[];documentName:string;coverage:string;};

function parseStructuredResponse(raw:string):unknown{
 const stripped=raw.trim().replace(/^\x60{3}(?:json)?\s*/i,'').replace(/\s*\x60{3}$/,'');
 try{return JSON.parse(stripped) as unknown;}catch{
  const from=stripped.indexOf('{'),to=stripped.lastIndexOf('}');
  if(from<0||to<=from)throw new Error('The AI did not return a structured assessment. Please retry.');
  try{return JSON.parse(stripped.slice(from,to+1)) as unknown;}
  catch{throw new Error('The assessment could not be parsed. Please retry.');}
 }
}
const keys=['scope','structure','difficulty','dependencies','minutes','recommendation'] as const;
function validateAssessment(value:unknown):SourceAssessment{
 if(!value||typeof value!=='object')throw new Error('The AI returned an invalid assessment.');
 const record=value as Record<string,unknown>,result={} as Record<string,string>;
 for(const key of keys){
  if(typeof record[key]!=='string'||!record[key].trim())throw new Error('The assessment is missing '+key+'. Please retry.');
  result[key]=(record[key] as string).trim().slice(0,1400);
 }
 return result as SourceAssessment;
}
export async function generatePdfAssessment(sessionId:string,title:string,target:string,firstPage:number,lastPage:number,minutes:number):Promise<AssessmentResult>{
 const index=await getPdfIndex(sessionId);
 if(!index.pages.length)throw new Error('The PDF contains no pages.');
 // User session ranges refer to PDF pages in the current reader. Never silently
 // swap them for printed page numbers.
 if(firstPage<1||lastPage<firstPage||firstPage>index.pages.length)
  throw new Error('The selected page range is outside this PDF ('+index.pages.length+' pages).');
 const end=Math.min(lastPage,index.pages.length);
 const scoped=index.pages.filter(p=>p.page>=firstPage&&p.page<=end);
 const limit=14;
 const selected=scoped.length<=limit?scoped:Array.from({length:limit},(_,i)=>scoped[Math.floor(i*(scoped.length-1)/(limit-1))]);
 const pages=selected.filter(p=>p.text.trim());
 if(!pages.length)throw new Error('No readable text was extracted from these PDF pages. This PDF may require OCR.');
 const excerpts=pages.map(p=>'[PDF page '+p.page+'] '+p.text.slice(0,Math.max(400,Math.floor(12500/pages.length)))).join('\n\n').slice(0,14000);
 const request=[
  'Analyze the supplied mathematical PDF excerpts for a reading-session scope assessment.',
  'Session title: '+title+'. Target: '+target+'. Requested PDF pages: '+firstPage+'–'+end+'. Available time: '+minutes+' minutes.',
  'Return ONLY a JSON object with keys: scope, structure, difficulty, dependencies, minutes, recommendation, sourcePages.',
  'All six first fields MUST be nonempty strings. minutes should be the estimated number of minutes as a string.',
  'sourcePages MUST be an array of PDF page numbers drawn ONLY from the provided excerpts and actually relevant to your conclusions.',
  'Distinguish explicit source facts from your inference using wording such as "The excerpts state..." vs "Likely..." or "Estimated...".',
  'Do not invent theorem numbers, proof details, page locations, prerequisites or difficulty claims absent from excerpts.',
  'In structure, identify the actual definitions, results and conceptual progression visible in the excerpts, with PDF page numbers.',
  'In dependencies, separate explicitly referenced prerequisites from suggested background.',
  'In difficulty and recommendations, explicitly mark your judgments as estimates.',
  'The document may have additional material on unexamined pages. Acknowledge incomplete coverage if appropriate.',
  'Do not generate a reading plan yet. Do not include Markdown fences.'
 ].join('\n');
 const raw=await requestAiReply([{role:'user',content:request}], 'Document: '+index.name+' ('+index.pages.length+' PDF pages).\nAssessment excerpts:\n'+excerpts);
 const parsed=parseStructuredResponse(raw);
 if(!parsed||typeof parsed!=='object')throw new Error('The AI returned an invalid assessment.');
 const value=parsed as Record<string,unknown>;
 const assessment=validateAssessment(value);
 const supplied=new Set(pages.map(p=>p.page));
 const sourcePages=Array.isArray(value.sourcePages)?[...new Set(value.sourcePages.filter((p):p is number=>typeof p==='number'&&Number.isInteger(p)&&supplied.has(p)))].sort((a,b)=>a-b):[];
 if(!sourcePages.length)throw new Error('The assessment did not provide valid source page references. Please retry.');
 const coverage=pages.length===scoped.length
  ? 'Analyzed extracted text from all '+pages.length+' selected PDF pages.'
  : 'Analyzed '+pages.length+' sampled pages out of '+scoped.length+' selected PDF pages; other pages were not assessed.';
 return {assessment,sourcePages,documentName:index.name,coverage};
}
