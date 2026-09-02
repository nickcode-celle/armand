const remote=()=>String(process.env.ENTITY_RECALL_URL||'').replace(/\/$/,'');
const token=()=>process.env.ENTITY_RECALL_TOKEN||'';
const headers=()=>({'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`}:{})});
function cos(a,b){if(!a?.length||a.length!==b?.length)return 0;let d=0,x=0,y=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];x+=a[i]*a[i];y+=b[i]*b[i]}return x&&y?d/Math.sqrt(x*y):0}
export function createRecallEngine(){
  return {
    mode:remote()?'remote-vector':'local-bounded',
    async search({entityId,queryVector,candidates,cache,budget,policy,salience}){
      if(remote()){
        const r=await fetch(`${remote()}/v1/recall/search`,{method:'POST',headers:headers(),body:JSON.stringify({entity_id:entityId,vector:queryVector,limit:budget*2,policy})});
        if(!r.ok)throw Error(`Entity recall ${r.status}`);
        const d=await r.json(),byPath=new Map(candidates.map(c=>[c.path,c]));
        return (d.matches||[]).map(m=>byPath.get(m.path)).filter(Boolean).slice(0,budget);
      }
      const out=[],counts={};
      for(const c of candidates){const score=cos(queryVector,cache[c.path]?.v)*.66+salience(c.item)*.25+(policy[c.type]?.[0]||1)*.09,max=policy[c.type]?.[1]||3;if((counts[c.type]||0)>=max&&out.length>=budget)continue;const x={...c,score};let i=out.findIndex(y=>score>y.score);if(i<0)i=out.length;out.splice(i,0,x);if(out.length>budget*2)out.pop()}
      const selected=[];for(const c of out){const max=policy[c.type]?.[1]||3;if((counts[c.type]||0)>=max)continue;selected.push(c);counts[c.type]=(counts[c.type]||0)+1;if(selected.length>=budget)break}return selected;
    },
    async upsert({entityId,entries}){
      if(!remote())return;
      const r=await fetch(`${remote()}/v1/recall/upsert`,{method:'POST',headers:headers(),body:JSON.stringify({entity_id:entityId,entries:entries.map(e=>({path:e.path,type:e.type,vector:e.vector}))})});
      if(!r.ok)throw Error(`Entity recall upsert ${r.status}`);
    },
    async remove({entityId,paths}){
      if(!remote()||!paths.length)return;
      const r=await fetch(`${remote()}/v1/recall/delete`,{method:'POST',headers:headers(),body:JSON.stringify({entity_id:entityId,paths})});
      if(!r.ok)throw Error(`Entity recall delete ${r.status}`);
    }
  };
}
