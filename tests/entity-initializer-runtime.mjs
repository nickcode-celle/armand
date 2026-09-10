import assert from 'node:assert/strict';
import {createInitialMarbleAssignments} from '../server/entity-marble-allocation.mjs';
import {initializeMarbleValues,INITIAL_DOMAIN_RANGES,initialHistoryLevel} from '../server/entity-initializer.mjs';
import {MARBLE_DOMAIN_CATALOG,PER_MARBLE_DOMAINS} from '../server/entity-marble-catalog.mjs';

const assignments=createInitialMarbleAssignments({seed:'emaea-init-test'});
const a=initializeMarbleValues(assignments,{seed:'emaea-init-test'});
const b=initializeMarbleValues(assignments,{seed:'emaea-init-test'});
const c=initializeMarbleValues(assignments,{seed:'emaea-init-test-2'});

assert.equal(a.marbles.length,200);
assert.equal(a.capacities_level,0);
assert.deepEqual(a,b,'une même seed doit reconstruire exactement le même caractère initial');
assert.notDeepEqual(a.durable_levels,c.durable_levels,'deux seeds doivent pouvoir produire des caractères différents');

for(const domain of PER_MARBLE_DOMAINS){
  const [min,max]=INITIAL_DOMAIN_RANGES[domain];
  for(const subdomain of MARBLE_DOMAIN_CATALOG[domain]){
    const members=a.marbles.filter(m=>m.domains?.[domain]?.subdomain===subdomain);
    assert.equal(members.length,20);
    const values=members.map(m=>m.domains[domain].value);
    assert.ok(values.every(v=>Number.isFinite(v)&&v>=0&&v<=100));
    const mean=Math.round(values.reduce((x,y)=>x+y,0)/values.length*1e6)/1e6;
    assert.equal(mean,a.durable_levels[domain][subdomain],`${domain}/${subdomain}: moyenne bille != niveau global`);
    assert.ok(mean>=min-1e-6&&mean<=max+1e-6,`${domain}/${subdomain}: hors plage initiale`);
    if(domain==='Relation')assert.ok(values.every(v=>v===0));
  }
}

assert.equal(initialHistoryLevel(50),25);
assert.equal(initialHistoryLevel(18),9);
assert.equal(initialHistoryLevel(null),null);
assert.throws(()=>initialHistoryLevel(-1));

console.log('Entity initializer runtime tests: OK');
