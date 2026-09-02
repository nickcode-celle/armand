const RESPONSE_URL='https://api.openai.com/v1/responses';
const EMBEDDING_URL='https://api.openai.com/v1/embeddings';
export function createEntityAI(key){
  const metrics={calls:0,response_calls:0,embedding_calls:0,input_tokens:0,output_tokens:0,total_tokens:0};
  async function response(input,max=1200,temp=.7){
    const r=await fetch(RESPONSE_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.ENTITY_OPENAI_MODEL||'gpt-5.4',input,max_output_tokens:max,temperature:temp})}),d=await r.json();
    metrics.calls++;metrics.response_calls++;metrics.input_tokens+=Number(d?.usage?.input_tokens||0);metrics.output_tokens+=Number(d?.usage?.output_tokens||0);metrics.total_tokens+=Number(d?.usage?.total_tokens||0);
    if(!r.ok)throw Error(`OpenAI ${r.status}`);const x=d?.output?.flatMap(y=>y.content||[]).filter(y=>y.type==='output_text').map(y=>y.text).join('').trim();if(!x)throw Error('Réponse OpenAI vide');return x;
  }
  async function embedding(input){
    const r=await fetch(EMBEDDING_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.ENTITY_EMBEDDING_MODEL||'text-embedding-3-small',input})}),d=await r.json();metrics.calls++;metrics.embedding_calls++;metrics.total_tokens+=Number(d?.usage?.total_tokens||d?.usage?.prompt_tokens||0);if(!r.ok)throw Error(`Embedding ${r.status}`);return d.data?.[0]?.embedding||[];
  }
  return{response,embedding,metrics};
}
