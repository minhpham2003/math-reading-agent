import {useEffect,useState} from 'react';
import {ReadingMode} from './ReadingMode';
import {generatePdfAssessment} from './pdfAssessment';
import {getAccessToken,setAccessToken,verifyAccessToken} from './aiChat';

type Assessment = {
 scope:string; structure:string; difficulty:string; dependencies:string;
 minutes:string; recommendation:string;
};
type Unit = {id:string; title:string; page:number; endPage?:number; description:string; done:boolean};
type State = {assessment:Assessment; assessmentApproved:boolean; planApproved:boolean; units:Unit[]; stage:'assessment'|'plan'|'reading'; assessmentSource?:{kind:'ai';pages:number[];name:string;coverage:string}};
const key=(id:string)=>'higher-math:reading-flow:v1:'+id;
function mockAssessment(title:string,first:number,last:number,minutes:number):Assessment {
 return {
 scope:title+' · selected printed pages '+first+'–'+last,
 structure:'Sample structure: introductory definitions → key propositions → examples and applications. Confirm these against the actual PDF.',
 difficulty:'Sample estimate: moderate, with some abstract definitions and proof techniques.',
 dependencies:'Sample prerequisites: relevant earlier definitions, basic topology, and familiarity with the notation used.',
 minutes:String(minutes),
 recommendation:'Sample recommendation: first map the definitions and statements, then read the structural proofs, pausing to test your intuition.'
 };
}
function mockUnits(first:number,last:number):Unit[] {
 const mid=Math.max(first,Math.min(last,first+Math.floor((last-first)/2)));
 return [
  {id:crypto.randomUUID(),title:'Definitions and motivating questions',page:first,endPage:Math.max(first,mid-1),description:'Demo unit: locate the central definitions and motivation in the source.',done:false},
  {id:crypto.randomUUID(),title:'Main results and proof structure',page:mid,endPage:Math.max(mid,last-1),description:'Demo unit: identify important claims and the role of their proofs.',done:false},
  {id:crypto.randomUUID(),title:'Examples, consequences, and recap',page:last,endPage:last,description:'Demo unit: connect the results to examples and consolidate understanding.',done:false}
 ];
}
function defaultState(title:string,first:number,last:number,minutes:number):State {
 return {assessment:mockAssessment(title,first,last,minutes),
 assessmentApproved:false,planApproved:false,units:mockUnits(first,last),stage:'assessment'};
}
function load(id:string,title:string,first:number,last:number,minutes:number):State {
 const fallback=defaultState(title,first,last,minutes);
 try {
  const parsed:unknown=JSON.parse(localStorage.getItem(key(id))||'null');
  if(!parsed || typeof parsed!=='object')return fallback;
  const value=parsed as Partial<State>;
  if(!value.assessment || !Array.isArray(value.units))return fallback;
  return {...fallback,...value,assessment:{...fallback.assessment,...value.assessment},units:value.units};
 }catch{return fallback;}
}
const fields:{id:keyof Assessment;label:string;placeholder:string}[]=[
 {id:'scope',label:'Scope',placeholder:'What does this reading range cover?'},
 {id:'structure',label:'Conceptual structure',placeholder:'Definitions, results, and conceptual transitions'},
 {id:'difficulty',label:'Difficulty',placeholder:'Expected conceptual and technical demands'},
 {id:'dependencies',label:'Dependencies',placeholder:'Prerequisites and earlier material'},
 {id:'minutes',label:'Estimated reading time (minutes)',placeholder:'Time available'},
 {id:'recommendation',label:'Recommendation',placeholder:'How should the reader approach this range?'}
];
export function ReadingFlow({sessionId,title,firstPage,lastPage,duration,onNavigate,currentPdfPage}:
 {sessionId:string;title:string;firstPage:number;lastPage:number;duration:number;currentPdfPage?:number;onNavigate:(page:number,quote?:string)=>void}) {
 const [state,setState]=useState<State>(()=>load(sessionId,title,firstPage,lastPage,duration));
 const [expanded,setExpanded]=useState(!state.planApproved);
 const [setupMode,setSetupMode]=useState(!(state.assessmentApproved&&state.planApproved));
 const [editingAssessment,setEditingAssessment]=useState(false);
 const [assessmentOpen,setAssessmentOpen]=useState(!state.assessmentApproved);
 const [error,setError]=useState('');
 const [analyzing,setAnalyzing]=useState(false);
 const [tokenDraft,setTokenDraft]=useState('');
 const [hasToken,setHasToken]=useState(!!getAccessToken());
 const [verifying,setVerifying]=useState(false);
 useEffect(()=>{setState(load(sessionId,title,firstPage,lastPage,duration));setEditingAssessment(false);setAssessmentOpen(!load(sessionId,title,firstPage,lastPage,duration).assessmentApproved);setExpanded(!load(sessionId,title,firstPage,lastPage,duration).planApproved);setSetupMode(!(load(sessionId,title,firstPage,lastPage,duration).assessmentApproved&&load(sessionId,title,firstPage,lastPage,duration).planApproved));},[sessionId]);
 useEffect(()=>{const open=()=>{setSetupMode(v=>!v);setAssessmentOpen(false);setExpanded(false);};window.addEventListener('higher-math:open-session-setup',open);return()=>window.removeEventListener('higher-math:open-session-setup',open);},[]);
 function change(next:State) {
  try {localStorage.setItem(key(sessionId),JSON.stringify(next));setState(next);setError('');}
  catch{setError('Unable to save this session. Check browser storage.');}
 }
 async function unlockAssessment(){
  if(!tokenDraft.trim()||verifying)return;
  setVerifying(true);setError('');
  try{await verifyAccessToken(tokenDraft.trim());setAccessToken(tokenDraft);setHasToken(true);setTokenDraft('');}
  catch(e){setError(e instanceof Error?e.message:'Could not verify access token.');}
  finally{setVerifying(false);}
 }
 async function analyzePdf(){
  if(analyzing)return;
  setAnalyzing(true);setError('');
  try{
   const result=await generatePdfAssessment(sessionId,title,title,firstPage,lastPage,duration);
   change({...state,assessment:result.assessment,assessmentSource:{kind:'ai',pages:result.sourcePages,name:result.documentName,coverage:result.coverage},assessmentApproved:false,planApproved:false,stage:'assessment'});
   setAssessmentOpen(true);setEditingAssessment(false);
  }catch(e){setError(e instanceof Error?e.message:'Unable to analyze the selected PDF pages.');}
  finally{setAnalyzing(false);}
 }
 function updateAssessment(field:keyof Assessment,value:string){
  change({...state,assessment:{...state.assessment,[field]:value},assessmentApproved:false,planApproved:false,stage:'assessment'});
 }
 function updateUnit(id:string,patch:Partial<Unit>){
  change({...state,units:state.units.map(unit=>unit.id===id?{...unit,...patch}:unit),planApproved:false,stage:'plan'});
 }
 function addUnit(){
  // Adding a unit creates its editable card immediately; approval validates the draft.
  change({...state,units:[...state.units,{
   id:crypto.randomUUID(),title:'',page:0,endPage:undefined,description:'',done:false
  }],planApproved:false,stage:'plan'});
 }
 function validatePlan():string|null {
  if(!state.units.length)return 'Add at least one conceptual unit before accepting the plan.';
  for(const [index,unit] of state.units.entries()){
   if(!unit.title.trim())return 'Unit '+(index+1)+' needs a title.';
   if(!Number.isInteger(unit.page)||unit.page<1)return 'Unit '+(index+1)+' needs a valid PDF start page.';
   if(unit.endPage!==undefined&&(!Number.isInteger(unit.endPage)||unit.endPage<unit.page))
     return 'Unit '+(index+1)+' needs an end page at or after its start page.';
  }
  return null;
 }
 function move(id:string,delta:number){
  const list=[...state.units],i=list.findIndex(unit=>unit.id===id),j=i+delta;
  if(i<0||j<0||j>=list.length)return;
  [list[i],list[j]]=[list[j],list[i]];
  change({...state,units:list,planApproved:false,stage:'plan'});
 }
 const canApprove=fields.every(f=>state.assessment[f.id].trim());
 if(state.assessmentApproved&&state.planApproved&&!setupMode) {
  return <ReadingMode sessionId={sessionId} units={state.units} currentPdfPage={currentPdfPage}
    onNavigate={onNavigate} onToggle={id=>change({...state,units:state.units.map(u=>u.id===id?{...u,done:!u.done}:u)})}
    />;
 }
 return <div className="reading-flow">
  <div className="session-setup-title-row"><h2 className="session-setup-heading">Session setup</h2>{state.assessmentApproved&&state.planApproved&&<button type="button" className="reading-plan-settings" aria-label="Close session setup" title="Close session setup" onClick={()=>setSetupMode(false)}>⚙</button>}</div>
  
  <div className="assessment-toggle-row"><h2 className={state.assessmentApproved?"approved-heading":""}>Reading assessment {state.assessmentApproved&&<span aria-label="Approved">✓</span>}</h2><button className="secondary" aria-expanded={assessmentOpen} onClick={()=>setAssessmentOpen(v=>!v)}>{assessmentOpen?'Collapse ▴':'Expand ▾'}</button></div>

  {assessmentOpen && <div className="assessment-source-panel">
    {!hasToken&&<div className="assessment-unlock"><label>AI access token <input type="password" autoComplete="off" value={tokenDraft} onChange={e=>setTokenDraft(e.target.value)} placeholder="Enter access token"/></label><button type="button" className="secondary" disabled={!tokenDraft.trim()||verifying} onClick={()=>void unlockAssessment()}>{verifying?'Verifying…':'Unlock AI'}</button></div>}
    <button className="primary" type="button" disabled={analyzing||!hasToken} onClick={()=>void analyzePdf()}>{analyzing?'Analyzing PDF…':state.assessmentSource?'Regenerate PDF assessment':'Generate assessment from PDF'}</button>
    {state.assessmentSource?<div><p><strong>AI assessment from {state.assessmentSource.name}</strong></p>
      <p className="muted">{state.assessmentSource.coverage} Text extraction may distort mathematical notation; verify all claims against the PDF before approving.</p>
      <div className="assessment-evidence">Source pages: {state.assessmentSource.pages.map(p=><button key={p} type="button" className="secondary" onClick={()=>onNavigate(p)}>p. {p} ↗</button>)}</div>
    </div>:<p className="muted">The assessment below is placeholder content, not a PDF analysis. Generate a source-grounded assessment before approving it.</p>}
   </div>}
  {assessmentOpen && editingAssessment && <div className="assessment-fields">
   {fields.map(field=><label key={field.id}>{field.label}
    {field.id==='minutes'?<input type="number" min="1" value={state.assessment[field.id]} onChange={e=>updateAssessment(field.id,e.target.value)}/>:
     <textarea rows={field.id==='structure'?3:2} placeholder={field.placeholder} value={state.assessment[field.id]} onChange={e=>updateAssessment(field.id,e.target.value)}/>}
   </label>)}
  </div>}
  {assessmentOpen && !editingAssessment&&<div className="assessment-summary">
    {fields.map(field=><p key={field.id}><strong>{field.label}:</strong> {state.assessment[field.id]}</p>)}
  </div>}
  {assessmentOpen && <div className="flow-actions">
   <button className="secondary" onClick={()=>setEditingAssessment(v=>!v)}>{editingAssessment?'Done editing':'Edit'}</button>
   <button className="secondary" onClick={()=>{change(defaultState(title,firstPage,lastPage,duration));setEditingAssessment(false);setAssessmentOpen(true);}}>Reset assessment</button>
   {!state.assessmentApproved&&<button className="primary" disabled={!canApprove||!state.assessmentSource||analyzing} onClick={()=>{
    change({...state,assessmentApproved:true,stage:'plan'});setEditingAssessment(false);setAssessmentOpen(false);
   }}>Agree to assessment →</button>}
  </div>}
  <div className="plan-heading"><strong className={state.planApproved?"approved-heading":""}>Reading plan {state.planApproved&&<span aria-label="Approved">✓</span>}</strong>
   <button className="secondary" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Collapse ▴':'Expand ▾'}</button>
  </div>
  {expanded&&<div className="flow-plan">
   {!state.assessmentApproved?<p className="muted">Approve the assessment before constructing the reading plan.</p>:
   <>
    <p className="muted">Suggested mock units are editable. Their PDF page ranges are placeholders, not verified source locations. Modify them before accepting.</p>
    {state.units.map((unit,i)=><div className="flow-unit" key={unit.id}>
      <div className="flow-unit-title"><span>{i+1}.</span><input placeholder="Unit title" autoFocus={unit.title===''&&i===state.units.length-1} aria-label={'Unit '+(i+1)+' title'} value={unit.title} onChange={e=>updateUnit(unit.id,{title:e.target.value})}/></div>

      <div className="flow-page-range">
       <label>PDF start page<input type="number" min="1" aria-label={'Unit '+(i+1)+' PDF start page'} value={unit.page||''} onChange={e=>updateUnit(unit.id,{page:e.target.value===''?0:Number(e.target.value)})}/></label>
       <label>PDF end page <span className="muted">(optional)</span><input type="number" min="1" aria-label={'Unit '+(i+1)+' PDF end page'} placeholder="Same page" value={unit.endPage===undefined?'':unit.endPage} onChange={e=>updateUnit(unit.id,{endPage:e.target.value===''?undefined:Number(e.target.value)})}/></label>
      </div>
      <label>Description<textarea rows={2} aria-label={'Unit '+(i+1)+' description'} value={unit.description} onChange={e=>updateUnit(unit.id,{description:e.target.value})}/></label>
      <div className="flow-actions">
       <button className="secondary" onClick={()=>onNavigate(unit.page)}>Go to PDF ↗</button>
       <button className="secondary" disabled={i===0} onClick={()=>move(unit.id,-1)} aria-label="Move unit up">↑</button>
       <button className="secondary" disabled={i===state.units.length-1} onClick={()=>move(unit.id,1)} aria-label="Move unit down">↓</button>
       <button className="secondary" onClick={()=>change({...state,units:state.units.filter(x=>x.id!==unit.id),planApproved:false,stage:'plan'})}>Remove</button>
       {state.planApproved&&<button type="button" className={'secondary unit-completed-toggle'+(unit.done?' is-completed':'')} aria-pressed={unit.done} onClick={()=>change({...state,units:state.units.map(x=>x.id===unit.id?{...x,done:!x.done}:x)})}>{unit.done?'✓ Completed':'Completed'}</button>}
      </div>
    </div>)}
    {!state.planApproved&&<button className="secondary add-unit-trigger" type="button" onClick={addUnit}>+ Add unit</button>}
    {!state.planApproved?<button className="primary" onClick={()=>{
     const problem=validatePlan();
     if(problem){setError(problem);return;}
     change({...state,planApproved:true,stage:'reading'});setExpanded(false);setSetupMode(false);onNavigate(state.units[0].page);
    }}>Accept reading plan →</button>:<div className="flow-stage">✓ Plan accepted · Reading in progress
       <p className="muted">Choose a unit to navigate to its source. Nothing is explained automatically.</p>
       <button className="secondary" onClick={()=>change({...state,planApproved:false,stage:'plan'})}>Edit plan</button>
     </div>}
   </>}
  </div>}
  {error&&<div className="flow-error-toast" role="alert" aria-live="assertive"><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={()=>setError('')}>×</button></div>}
 </div>;
}
