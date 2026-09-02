const RESPONSE_URL='https://api.openai.com/v1/responses';
const EMBEDDING_URL='https://api.openai.com/v1/embeddings';
export function createEntityAI(key){
  const metrics={calls:0,response_calls:0,embedding_calls:0,input_tokens:0,output_tokens:0,total_tokens:0,retries:0,errors:0,timeouts:0};
  async function request(url,options,timeoutMs){
    let last;
    for(let attempt=0;attempt<2;attempt++){
      try{
        const r=await fetch(url,{...options,signal:AbortSignal.timeout(timeoutMs)});let d={};try{d=await r.json()}catch{}
        if(r.ok)return{r,d};
        const retryable=r.status===429||r.status>=500;if(!retryable)throw Error(`OpenAI ${r.status}`);last=Error(`OpenAI ${r.status}`);
      }catch(e){last=e;if(e?.name==='TimeoutError'||e?.name==='AbortError')metrics.timeouts++;if(attempt===1||(!/OpenAI (429|5\d\d)/.test(String(e?.message))&&e?.name!=='TypeError'&&e?.name!=='TimeoutError'&&e?.name!=='AbortError'))break}
      if(attempt===0){metrics.retries++;await new Promise(r=>setTimeout(r,120))}
    }
    metrics.errors++;throw last||Error('OpenAI indisponible');
  }
  async function response(input,max=1200,temp=.7){
    const {r,d}=await request(RESPONSE_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.ENTITY_OPENAI_MODEL||'gpt-5.4',input,max_output_tokens:max,temperature:temp})},45000);
    metrics.calls++;metrics.response_calls++;metrics.input_tokens+=Number(d?.usage?.input_tokens||0);metrics.output_tokens+=Number(d?.usage?.output_tokens||0);metrics.total_tokens+=Number(d?.usage?.total_tokens||0);
    if(!r.ok)throw Error(`OpenAI ${r.status}`);const x=d?.output?.flatMap(y=>y.content||[]).filter(y=>y.type==='output_text').map(y=>y.text).join('').trim();if(!x){metrics.errors++;throw Error('Réponse OpenAI vide')}return x;
  }
  async function embedding(input){
    const {r,d}=await request(EMBEDDING_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.ENTITY_EMBEDDING_MODEL||'text-embedding-3-small',input})},20000);metrics.calls++;metrics.embedding_calls++;metrics.total_tokens+=Number(d?.usage?.total_tokens||d?.usage?.prompt_tokens||0);if(!r.ok)throw Error(`Embedding ${r.status}`);const v=d.data?.[0]?.embedding;if(!Array.isArray(v)||!v.length){metrics.errors++;throw Error('Embedding OpenAI vide')}return v;
  }
  return{response,embedding,metrics};
}
