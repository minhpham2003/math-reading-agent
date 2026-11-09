/** Read the live session assessment and reading plan at reply time.
 * This context is user-approved workspace state, not evidence from the PDF.
 */
type Assessment={scope?:string;structure?:string;difficulty?:string;dependencies?:string;minutes?:string;recommendation?:string};
type Unit={id:string;title:string;page:number;endPage?:number;description:string;done:boolean};
type Flow={assessmentApproved?:boolean;planApproved?:boolean;assessment?:Assessment;units?:Unit[];assessmentSource?:{pages:number[]};planSource?:{pages:number[]}};
export function getReadingSessionContext(sessionId:string,currentPdfPage?:number):string{
 let flow:Flow|null=null;
 try{flow=JSON.parse(localStorage.getItem('higher-math:reading-flow:v1:'+sessionId)||'null') as Flow|null;}catch{return '';}
 if(!flow||(!flow.assessmentApproved&&!flow.planApproved))return '';
 const lines=[
  'CURRENT READING SESSION STATE (user-approved and editable app data; not a quotation or evidence from the PDF).',
  'Use this to answer questions about the reading plan and its numbered units. Never claim this plan is text contained in the PDF.',
  'PDF references in the plan are navigation targets, not independently verified passages. Ground claims about mathematics in actual PDF excerpts.',
 ];
 if(flow.assessmentApproved&&flow.assessment){
  lines.push('Approved reading assessment:');
  for(const field of ['scope','structure','difficulty','dependencies','minutes','recommendation'] as const){
   const text=flow.assessment[field];if(text)lines.push(field+': '+text.slice(0,1100));
  }
 }
 if(flow.planApproved&&flow.units?.length){
  lines.push('Approved reading plan ('+flow.units.filter(u=>u.done).length+'/'+flow.units.length+' complete):');
  flow.units.forEach((u,i)=>{
   lines.push('Unit '+(i+1)+': '+u.title+' | PDF page'+(u.endPage&&u.endPage!==u.page?'s '+u.page+'–'+u.endPage:' '+u.page)+' | '+(u.done?'Completed':'Not completed'));
   lines.push('Learning objective: '+u.description.slice(0,850));
  });
  if(currentPdfPage){
   const matching=flow.units.find(u=>currentPdfPage>=u.page&&currentPdfPage<=(u.endPage??u.page));
   lines.push('Current PDF page: '+currentPdfPage+(matching?' (within unit '+(flow.units.indexOf(matching)+1)+')':' (not necessarily a particular unit)'));
  }
 }else if(flow.assessmentApproved){
  lines.push('A reading plan has not yet been approved. Do not invent numbered units.');
 }
 return lines.join('\n').slice(0,11500);
}
