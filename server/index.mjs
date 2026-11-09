import {createServer} from 'node:http';

const port=Number(process.env.PORT||8787);
const apiKey=process.env.OPENAI_API_KEY;
const model=process.env.OPENAI_MODEL||'gpt-4.1-mini';
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'http://localhost:5173').split(',').map(s=>s.trim()).filter(Boolean);
const systemInstruction='You are a careful mathematical reading discussion partner. Follow the student\'s reasoning, answer the precise question, and do not reveal unsolicited hints, proof tricks, or solutions. Distinguish uncertainty from established facts. You have NOT been given the user\'s PDF unless its content is explicitly in the conversation. Keep responses concise by default.';

function respond(res,status,data,origin){
 const body=JSON.stringify(data);
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})});
 res.end(body);
}
const server=createServer(async(req,res)=>{
 const origin=req.headers.origin;
 const permitted=origin&&allowedOrigins.includes(origin)?origin:undefined;
 if(origin&&!permitted){respond(res,403,{error:'Origin not allowed'});return;}
 if(req.method==='OPTIONS'){
  res.writeHead(204,{...(permitted?{'Access-Control-Allow-Origin':permitted,'Vary':'Origin'}:{}),'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});res.end();return;
 }
 if(req.url==='/health'&&req.method==='GET'){respond(res,200,{status:'ok',configured:!!apiKey},permitted);return;}
 if(req.url!=='/api/chat'||req.method!=='POST'){respond(res,404,{error:'Not found'},permitted);return;}
 if(!apiKey){respond(res,503,{error:'AI backend is not configured.'},permitted);return;}
 try{
  let raw='';
  for await(const chunk of req){raw+=chunk;if(raw.length>100_000){respond(res,413,{error:'Request too large'},permitted);return;}}
  let payload;try{payload=JSON.parse(raw);}catch{respond(res,400,{error:'Invalid JSON'},permitted);return;}
  if(!Array.isArray(payload.messages)||!payload.messages.length){respond(res,400,{error:'Messages required'},permitted);return;}
  const messages=payload.messages.slice(-30);
  if(messages.some(m=>!['user','assistant'].includes(m?.role)||typeof m?.content!=='string'||m.content.length>12000)){
   respond(res,400,{error:'Invalid messages'},permitted);return;
  }
  const upstream=await fetch('https://api.openai.com/v1/responses',{
   method:'POST',headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
   body:JSON.stringify({model,instructions:systemInstruction,input:messages.map(m=>({role:m.role,content:m.content})),max_output_tokens:1200})
  });
  const result=await upstream.json().catch(()=>({}));
  if(!upstream.ok){console.error('AI upstream error status:',upstream.status);respond(res,502,{error:'The AI service could not complete this request.'},permitted);return;}
  const reply=(result.output||[]).flatMap(o=>o.type==='message'?(o.content||[]):[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n').trim();
  if(!reply){respond(res,502,{error:'No AI reply was returned.'},permitted);return;}
  respond(res,200,{reply},permitted);
 }catch(err){console.error('Chat backend failure:',err);respond(res,500,{error:'AI request failed. Please try again.'},permitted);}
});
server.listen(port,()=>console.log(`Math reading AI backend listening on ${port}`));
