const remote=()=>String(process.env.ENTITY_RECALL_URL||'').replace(/\/$/,'');
const token=()=>process.env.ENTITY_RECALL_TOKEN||'';
const headers=()=>({'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`}:{})});
function cos(a,b){if(!a?.length||a.length!==b?.length)return 0;let d=0,x=0,y=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];x+=a[i]*a[i];y+=b[i]*b[i]}return x&&y?d/Math.sqrt(x*y):0}
async function request(url,options){let last;for(let attempt=0;attempt<2;attempt++){try{const r=await fetch(url,{...options,signal:AbortSignal.timeout(12000)});if(r.ok)return r;if(r.status<500)throw Error(`Entity recall ${r.status}`);last=Error(`Entity recall ${r.status}`)}catch(e){last=e}if(attempt===0)await new Promise(r=>setTimeout(r,80))}throw last}
export function createRecallEngine(){
  const metrics={searches:0,hits:0,misses:0,upserts:0,deletes:0,remote_failures:0};
  return {
    mode:remote()?'remote-vector':'local-bounded',metrics,
    async search({entityId,queryVector,candidates,cache,budget,policy,salience}){
      metrics.searches++;
      if(remote()){
        try{const r=await request(`${remote()}/v1/recall/search`,{method:'POST',headers:headers(),body:JSON.stringify({entity_id:entityId,vector:queryVector,limit:budget*2,policy,include_payload:true})});const d=await r.json(),byPath=new Map((candidates||[]).map(c=>[c.path,c]));const out=(d.matches||[]).map(m=>m.item?{path:m.path,type:m.type,item:m.item,text:m.text||JSON.stringify(m.item),score:m.score}:byPath.get(m.path)).filter(Boolean).slice(0,budget);metrics.hits+=out.length;metrics.misses+=Math.max(0,budget-out.length);return out}catch(e){metrics.remote_failures++;throw e}
      }
      const out=[],counts={};
      for(const c of candidates){const score=cos(queryVector,cache[c.path]?.v)*.66+salience(c.item)*.25+(policy[c.type]?.[0]||1)*.09,max=policy[c.type]?.[1]||3;if((counts[c.type]||0)>=max&&out.length>=budget)continue;const x={...c,score};let i=out.findIndex(y=>score>y.score);if(i<0)i=out.length;out.splice(i,0,x);if(out.length>budget*2)out.pop()}
      const selected=[];for(const c of out){const max=policy[c.type]?.[1]||3;if((counts[c.type]||0)>=max)continue;selected.push(c);counts[c.type]=(counts[c.type]||0)+1;if(selected.length>=budget)break}metrics.hits+=selected.length;metrics.misses+=Math.max(0,budget-selected.length);return selected;
    },
    async upsert({entityId,entries}){if(!remote()||!entries.length)return;const r=await request(`${remote()}/v1/recall/upsert`,{method:'POST',headers:headers(),body:JSON.stringify({entity_id:entityId,entries:entries.map(e=>({path:e.path,type:e.type,vector:e.vector,item:e.item}))})});metrics.upserts+=entries.length;return r},
    async remove({entityId,paths}){if(!remote()||!paths.length)return;const r=await request(`${remote()}/v1/recall/delete`,{method:'POST',headers:headers(),body:JSON.stringify({entity_id:entityId,paths})});metrics.deletes+=paths.length;return r}
  };
}
