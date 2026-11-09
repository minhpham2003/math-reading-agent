const endpoint=(import.meta.env.VITE_AI_API_URL||'').replace(/\/$/,'');
export type ChatMessage={role:'user'|'assistant';content:string};
export function aiConfigured(){return !!endpoint;}
const tokenKey='higher-math:ai-access-token';
export const getAccessToken=()=>sessionStorage.getItem(tokenKey)||'';
export const setAccessToken=(value:string)=>{if(value.trim())sessionStorage.setItem(tokenKey,value.trim());else sessionStorage.removeItem(tokenKey);};
export async function requestAiReply(messages:ChatMessage[]):Promise<string>{
 if(!endpoint)throw new Error('AI is not connected yet. Configure VITE_AI_API_URL to use chat.');
 const token=getAccessToken();if(!token)throw new Error('Enter your private AI access token to enable replies.');
 const response=await fetch(endpoint+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({messages})});
 const body=await response.json().catch(()=>({})) as {reply?:string;error?:string};
 if(!response.ok)throw new Error(body.error||'Could not reach the AI backend.');
 if(!body.reply?.trim())throw new Error('The AI backend returned an empty reply.');
 return body.reply.trim();
}
