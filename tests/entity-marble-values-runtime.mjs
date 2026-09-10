import assert from 'node:assert/strict';
import {averageIndividualValues,evolveIndividualValues} from '../server/entity-marble-values.mjs';

const seq=(values)=>{let i=0;return()=>values[i++%values.length]};

{
  const before=[10,30,50,70,90];
  const after=evolveIndividualValues(before,55,{rng:seq([.1,.8,.3,.6,.2,.9])});
  assert.ok(Math.abs(averageIndividualValues(after)-55)<1e-9);
  after.forEach((v,i)=>assert.ok(v>=before[i]-1e-9,'une progression ne doit jamais faire baisser une bille'));
  assert.ok(after.some((v,i)=>Math.abs(v-before[i])>1e-9));
}

{
  const before=[10,30,50,70,90];
  const after=evolveIndividualValues(before,45,{rng:seq([.7,.2,.9,.4,.1,.6])});
  assert.ok(Math.abs(averageIndividualValues(after)-45)<1e-9);
  after.forEach((v,i)=>assert.ok(v<=before[i]+1e-9,'une régression ne doit jamais faire monter une bille'));
}

{
  const before=[0,0,100,100];
  const after=evolveIndividualValues(before,50,{rng:()=>.5});
  assert.deepEqual(after,before,'si la moyenne est déjà correcte, aucune valeur ne doit être redistribuée');
}

{
  const before=[99,100,100];
  const after=evolveIndividualValues(before,100,{rng:()=>.5});
  assert.ok(Math.abs(averageIndividualValues(after)-100)<1e-9);
  assert.deepEqual(after,[100,100,100]);
}

{
  const before=[0,0,1];
  const after=evolveIndividualValues(before,0,{rng:()=>.5});
  assert.ok(Math.abs(averageIndividualValues(after))<1e-9);
  assert.deepEqual(after,[0,0,0]);
}

console.log('Entity per-marble value evolution tests: OK');
