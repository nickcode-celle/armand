import assert from 'node:assert/strict';
import {applyChangesToMarbles} from '../server/entity-marble-evolution.mjs';

const marbles=[
  {id:'m1',domains:{'Personnalité':{subdomain:'Curiosité',value:20}}},
  {id:'m2',domains:{'Personnalité':{subdomain:'Curiosité',value:30}}},
  {id:'m3',domains:{'Personnalité':{subdomain:'Humour',value:40}}}
];
const up=applyChangesToMarbles(marbles,[{domaine:'Personnalité',sous_domaine:'Curiosité',evolution:2,before:25,after:26.5}],{seed:'r1'});
const vals=up.marbles.slice(0,2).map(x=>x.domains['Personnalité'].value);
assert.ok(vals[0]>=20&&vals[1]>=30);
assert.ok(Math.abs((vals[0]+vals[1])/2-26.5)<1e-9);
assert.equal(up.marbles[2].domains['Personnalité'].value,40);

const down=applyChangesToMarbles(up.marbles,[{domaine:'Personnalité',sous_domaine:'Curiosité',evolution:-1,before:26.5,after:26.235}],{seed:'r2'});
const vals2=down.marbles.slice(0,2).map(x=>x.domains['Personnalité'].value);
assert.ok(vals2[0]<=vals[0]&&vals2[1]<=vals[1]);
assert.ok(Math.abs((vals2[0]+vals2[1])/2-26.235)<1e-9);

const replay=applyChangesToMarbles(marbles,[{domaine:'Personnalité',sous_domaine:'Curiosité',evolution:2,before:25,after:26.5}],{seed:'r1'});
assert.deepEqual(replay.marbles,up.marbles);
console.log('Entity marble evolution runtime tests: OK');
