import assert from 'node:assert/strict';
import {
  allocationPlan200,allocationReport,createInitialMarbleAssignments,
  validateInitialMarbleAssignments,EMAEA_BODY_COUNT,EMAEA_INITIAL_GROUP_SIZE
} from '../server/entity-marble-allocation.mjs';
import {MARBLE_DOMAIN_CATALOG} from '../server/entity-marble-catalog.mjs';

assert.equal(EMAEA_BODY_COUNT,200);
assert.equal(EMAEA_INITIAL_GROUP_SIZE,20);
assert.deepEqual(allocationPlan200(10),{body_count:200,subdomain_count:10,per_subdomain:20,assigned:200,unassigned:0});
assert.deepEqual(allocationPlan200(9),{body_count:200,subdomain_count:9,per_subdomain:20,assigned:180,unassigned:20});
assert.deepEqual(allocationPlan200(8),{body_count:200,subdomain_count:8,per_subdomain:20,assigned:160,unassigned:40});
assert.throws(()=>allocationPlan200(11));

const a=createInitialMarbleAssignments({seed:'entity-A'});
const b=createInitialMarbleAssignments({seed:'entity-A'});
const c=createInitialMarbleAssignments({seed:'entity-B'});
assert.deepEqual(a,b,'une même Entity doit retrouver les mêmes affectations');
assert.notDeepEqual(a,c,'deux Entity peuvent avoir des affectations différentes');
assert.equal(validateInitialMarbleAssignments(a),true);
assert.equal(new Set(a.map(x=>x.id)).size,200);
assert.ok(a.every(x=>Object.values(x.domains).every(v=>v.value===null)),'aucune valeur individuelle ne doit être inventée avant validation de l’initialiseur numérique');

const report=allocationReport(a);
assert.equal(report.domains['Opinions/Valeurs'].unassigned,20);
assert.equal(report.domains['Monde propre'].unassigned,40);
assert.equal(report.domains['Personnalité'].unassigned,0);
for(const [domain,subdomains] of Object.entries(MARBLE_DOMAIN_CATALOG)){
  for(const subdomain of subdomains)assert.equal(report.domains[domain].counts[subdomain],20,`${domain}/${subdomain}`);
}

console.log('Entity 200-marble allocation runtime tests: OK');
