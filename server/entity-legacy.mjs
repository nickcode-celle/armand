import fs from 'node:fs';import path from 'node:path';
const safe=x=>String(x||'').replace(/[^a-zA-Z0-9_-]/g,'');
const read=f=>{try{return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null}catch{return null}};
export function createLegacyEntityReader(root=process.cwd()){
 const memories=path.join(root,'.entity-memories'),embeddings=path.join(root,'.entity-embeddings');
 return{
  memory:(id,type)=>read(path.join(memories,safe(id),`${type}.json`)),
  state:id=>read(path.join(memories,safe(id),'state.json')),
  pending:id=>read(path.join(memories,safe(id),'pending.json')),
  embedding:(id,kind)=>read(kind==='cache'?path.join(embeddings,`${safe(id)}.json`):path.join(embeddings,`${safe(id)}.index.json`)),
 };
}
