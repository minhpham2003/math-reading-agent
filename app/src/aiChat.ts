const endpoint=(import.meta.env.VITE_AI_API_URL||'').replace(/\/$/,'');
export type ChatMessage={role:'user'|'assistant';content:string};
export function aiConfigured(){return !!endpoint;}
export async function requestAiReply(messages:ChatMessage[]):Promise<string>{
 if(!endpoint)throw new Error('AI is not connected yet. Configure VITE_AI_API_URL to use chat.');
 const response=await fetch(endpoint+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages})});
 const body=await response.json().catch(()=>({})) as {reply?:string;error?:string};
 if(!response.ok)throw new Error(body.error||'Could not reach the AI backend.');
 if(!body.reply?.trim())throw new Error('The AI backend returned an empty reply.');
 return body.reply.trim();
}
