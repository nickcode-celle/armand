import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEntityStorage } from '../server/entity-storage.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'entity-storage-'));
try {
  const storage=createEntityStorage({root});
  assert.equal(storage.mode,'local-sharded');
  const id='entity-test-123';
  assert.equal(await storage.get(id,'state',null),null);
  await storage.put(id,'state',{revision:1,hello:'world'});
  assert.deepEqual(await storage.get(id,'state',null),{revision:1,hello:'world'});
  await storage.mutate(id,'state',{},x=>({...x,revision:x.revision+1}));
  assert.equal((await storage.get(id,'state',null)).revision,2);
  const physical=storage.localFile(id,'state');
  assert.ok(fs.existsSync(physical));
  assert.ok(path.relative(path.join(root,'.entity-store'),physical).split(path.sep).length>=3,'record must be sharded');
  await storage.del(id,'state');
  assert.equal(await storage.get(id,'state',null),null);
  console.log('Entity storage runtime test: OK');
} finally {
  fs.rmSync(root,{recursive:true,force:true});
}
