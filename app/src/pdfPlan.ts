import {getPdfIndex} from './pdfIndex';
import {requestAiReply} from './aiChat';
import type {SourceAssessment} from './pdfAssessment';

export type GeneratedPlanUnit={
 id:string;title:string;page:number;endPage?:number;description:string;done:boolean;
};
export type GeneratedPlan={units:GeneratedPlanUnit[];coverage:string;sourcePages:number[]};

function parsePlan(text:string):unknown{
 const clean=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try{return JSON.parse(clean) as unknown;}catch{
  const start=clean.indexOf('{'),end=clean.lastIndexOf('}');
  if(start<0||end<=start)throw new Error('The AI did not produce a structured reading plan.');
  try{return JSON.parse(clean.slice(start,end+1)) as unknown;}
  catch{throw new Error('Could not parse the generated reading plan. Please try again.');}
 }
}

/** The plan must be sourced from the actual selected PDF pages, not imagined locations. */
export async function generatePdfPlan(
 sessionId:string,assessment:SourceAssessment,firstPage:number,lastPage:number,duration:number
):Promise<GeneratedPlan>{
 const pdf=await getPdfIndex(sessionId);
 if(!Number.isInteger(firstPage)||!Number.isInteger(lastPage)||firstPage<1||lastPage<firstPage||lastPage>pdf.pages.length)
  throw new Error('The session range is outside the PDF. Please verify the page numbers.');
 const pages=pdf.pages.filter(p=>p.page>=firstPage&&p.page<=lastPage&&p.text.trim());
 if(!pages.length)throw new Error('No selectable PDF text was found in this reading range.');
 // Provide coverage across longer ranges within the backend's 16k source limit.
 const chosen=pages.length<=12?pages:Array.from({length:12},(_,i)=>pages[Math.floor(i*(pages.length-1)/11)]);
 const excerpt=chosen.map(p=>'[PDF page '+p.page+'] '+p.text.slice(0,Math.floor(11900/chosen.length))).join('\n\n');
 const supplied=new Set(chosen.map(p=>p.page));
 const instructions=[
  'Create an achievable, conceptually organized MATHEMATICAL READING PLAN using the approved assessment and only the supplied PDF excerpts as evidence.',
  'Return ONLY a JSON object with key "units": an array of 2–6 items. Each item must have "title" (short), "page" (integer PDF page), optional "endPage" (integer PDF page), and "description" (1–2 sentences).',
  'Every item must represent a concrete mathematical content goal AND a learning objective (what the reader should understand or be able to explain). State both clearly in its description.',
  'Make units fit the available '+duration+' minutes. Fewer focused units for shorter sessions; do not overload the reader.',
  'Source scope: PDF pages '+firstPage+' through '+lastPage+'. Use only page numbers shown as [PDF page N] in the evidence. Never invent locations, named results, or section headings.',
  'For page and endPage, use an explicitly supplied excerpt page containing the relevant material. If uncertain, choose a single supported page and say the unit needs source verification.',
  'Arrange the units in a meaningful reading order. Prefer definitions, motivating questions, proof structure and examples when they actually occur in the source.',
  'The reader prefers collaborative, intuition-oriented discussion, structural proof explanations, and no unsolicited exercise hints.',
  'If the PDF text is scrambled or cannot verify a claim, keep the title modest rather than inventing details.',
  'Do not include markdown fences or commentary outside JSON.',
  'Approved assessment:\n'+JSON.stringify(assessment)
 ].join('\n');
 const raw=await requestAiReply([{role:'user',content:instructions}],'Document: '+pdf.name+'\nPDF evidence:\n'+excerpt);
 const parsed=parsePlan(raw);
 if(!parsed||typeof parsed!=='object'||!Array.isArray((parsed as {units?:unknown}).units))
  throw new Error('The AI returned an invalid reading plan.');
 const items=(parsed as {units:unknown[]}).units;
 if(items.length<1||items.length>8)throw new Error('The AI returned an unexpected number of reading goals.');
 const units=items.map((rawItem,index):GeneratedPlanUnit=>{
  if(!rawItem||typeof rawItem!=='object')throw new Error('Reading goal '+(index+1)+' is invalid.');
  const u=rawItem as Record<string,unknown>;
  const title=typeof u.title==='string'?u.title.trim():'';
  const description=typeof u.description==='string'?u.description.trim():'';
  if(!title||!description||title.length>160||description.length>1000)
   throw new Error('Reading goal '+(index+1)+' is missing a clear title or learning objective.');
  if(typeof u.page!=='number'||!Number.isInteger(u.page)||!supplied.has(u.page))
   throw new Error('Reading goal '+(index+1)+' cites an unverified PDF page. Regenerate the plan.');
  const endPage=u.endPage==null?undefined:u.endPage;
  if(endPage!==undefined&&(typeof endPage!=='number'||!Number.isInteger(endPage)||!supplied.has(endPage)||endPage<u.page))
   throw new Error('Reading goal '+(index+1)+' has an invalid end page.');
  return {id:crypto.randomUUID(),title,page:u.page,endPage:endPage as number|undefined,description,done:false};
 });
 return {units,sourcePages:[...supplied].sort((a,b)=>a-b),
  coverage:chosen.length===pages.length
   ? 'Generated from extracted text on all '+pages.length+' selected PDF pages.'
   : 'Generated from '+chosen.length+' sampled pages out of '+pages.length+' readable pages. Check unexamined pages before accepting.'};
}
