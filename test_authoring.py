"""Purpose-constrained next decisions. Fixtures live in memory and never enter the bank."""
import unittest
from test_model import run_js


class AuthoringTests(unittest.TestCase):
    def test_every_asset_has_specific_production_guidance_without_new_ontology_ids(self):
        run_js(r"""
        const A=require('./authoring-model.js'),lessons=require('./authoring-lessons.json');
        assert.deepEqual(Object.keys(A.profiles).sort(),R.operations.map(o=>o.id).sort());
        for(const p of Object.values(A.profiles))for(const k of ['stage','signal','decision','action','pitfall'])assert.ok(p[k]?.length>1);
        assert.equal(A.profile('unregistered'),null);assert.equal(lessons.revision,A.REVISION);
        assert.ok(lessons.sources.every(s=>/^[a-f0-9]{64}$/.test(s.sha256)));
        assert.equal(A.blueprint(plan,R).classification,'production_guidance_not_ontology_approval');
        """)

    def test_question_narrows_choices_and_no_final_question_means_no_broad_recommendations(self):
        run_js(r"""
        const A=require('./authoring-model.js'),S=require('./selection-model.js');
        const seed=S.coreStart(R,'PA-BRIDGE-04'),distance={type:'distance_result',subject:'F',scope:'main'},roots={type:'distinct_roots',subject:'F',scope:'main'};
        assert.deepEqual(A.next(seed.plan,R,seed.coreId,null),[]);
        assert.deepEqual(A.next(seed.plan,R,seed.coreId,distance).map(x=>x.id),['PA-BRIDGE-02']);
        assert.deepEqual(A.next(seed.plan,R,seed.coreId,roots).map(x=>x.id),['PA-BRIDGE-06']);
        assert.deepEqual(A.next(seed.plan,R,seed.coreId,{...distance,subject:'OTHER'}),[]);
        assert.deepEqual(A.next(seed.plan,R,seed.coreId,{...distance,scope:'other'}),[]);
        """)

    def test_every_core_and_question_can_be_completed_stepwise_without_extra_givens(self):
        run_js(r"""
        const A=require('./authoring-model.js'),S=require('./selection-model.js'),P=require('./composition-planner.js');
        let completed=0;
        for(const start of S.coreStarts){const seed=S.coreStart(R,start.id);
          for(const goal of A.routes(seed.plan,R,seed.coreId)){
            let p=structuredClone(seed.plan),guard=0;
            while(!P.analyze(p,R,seed.coreId,goal.target).ready&&guard++<20){
              const next=A.next(p,R,seed.coreId,goal.target);assert.ok(next.length,'no progress '+start.id+' '+goal.target.type);
              assert.ok(next.every(n=>!p.nodes.some(p=>p.id===n.id)));
              p=A.attach(p,R,seed.coreId,goal.target,next[0]);assert.deepEqual(p.facts,seed.plan.facts);
            }
            assert.ok(P.analyze(p,R,seed.coreId,goal.target).ready);completed++;
          }
        }assert.ok(completed>=6);
        """)

    def test_transparent_transfer_is_bundled_and_cannot_be_forged_or_repeated(self):
        run_js(r"""
        const A=require('./authoring-model.js'),S=require('./selection-model.js');
        const seed=S.coreStart(R,'PA-MOTIF-S01-03'),target={type:'integer_answer',subject:'a',scope:'main'};
        const item=A.next(seed.plan,R,seed.coreId,target,seed.coreId)[0];assert.equal(item.id,'PA-S02-LEVELS-03');
        assert.deepEqual(item.nodes.map(n=>n.id),['PA-BRIDGE-03','PA-S02-LEVELS-03']);
        const fake=structuredClone(item);fake.nodes[0].bindings.f='OTHER';assert.throws(()=>A.attach(seed.plan,R,seed.coreId,target,fake));
        const next=A.attach(seed.plan,R,seed.coreId,target,item);assert.throws(()=>A.attach(next,R,seed.coreId,target,item));
        assert.deepEqual(A.next(next,R,seed.coreId,target),[]);
        """)

    def test_selected_branch_must_feed_next_action_and_conflicts_never_recommend(self):
        run_js(r"""
        const A=require('./authoring-model.js'),S=require('./selection-model.js');
        const seed=S.coreStart(R,'PA-MOTIF-S01-10'),target={type:'level_counts',subject:'H',scope:'main'};
        assert.deepEqual(A.next(seed.plan,R,seed.coreId,target,'unselected'),[]);
        const conflicting=structuredClone(seed.plan);conflicting.facts.push({type:'zero_scale',subject:'F',scope:'main',origin:'given'});
        assert.deepEqual(A.next(conflicting,R,seed.coreId,target),[]);
        const next=A.complete(seed.plan,R,seed.coreId,target),layout=A.layers(next,R);
        const incoming=layout.graph.edges.filter(e=>e.to==='PA-OP-FIXED-LEVELS');assert.equal(incoming.length,2);
        assert.deepEqual(new Set(incoming.map(e=>e.from)),new Set(['PA-BRIDGE-01','PA-BRIDGE-02']));
        """)

    def test_known_mathematical_route_with_no_production_profile_stays_out_of_guided_choices(self):
        run_js(r"""
        const A=require('./authoring-model.js'),S=require('./selection-model.js');
        const copy=structuredClone(R),op=copy.operations.find(o=>o.id==='PA-BRIDGE-06');op.id='PA-NEW-UNREVIEWED';
        const seed=S.coreStart(copy,'PA-BRIDGE-04'),goal={type:'distinct_roots',subject:'F',scope:'main'};
        assert.deepEqual(A.next(seed.plan,copy,seed.coreId,goal),[]);
        assert.throws(()=>A.complete(seed.plan,copy,seed.coreId,goal));
        """)

    def test_blueprint_survives_canonical_api_web_and_legacy_result_import(self):
        run_js(r"""
        const M=require('./authoring-model.js'),W=require('./web-handoff.js'),P=require('./composition-planner.js'),G=require('./composition-graph.js');
        const spec=P.intent(plan,R,'PA-MOTIF-S01-10',{type:'level_counts',subject:'H',scope:'main'},0,1,G.spec(plan,R,{}));
        const strict=C.makeRequest(R,plan,job.brief,job.request_id,spec),input=JSON.parse(A.requestBody({...strict,knowledge:{authoring:'forged'}},R).input);
        assert.deepEqual(input.knowledge.authoring,strict.knowledge.authoring);
        assert.ok(input.knowledge.authoring.steps.some(s=>s.core&&s.decision));
        assert.ok(W.prompt(strict).includes('authoring-blueprint/1'));assert.ok(W.prompt(strict).includes('단순 정보 전달'));
        assert.equal(C.validateResult(sample(),strict,R,E).accepted,true);
        assert.equal(C.validateResult(sample(),strict,R,E).release_ready,false);
        assert.equal(M.blueprint(plan,R,spec.core.id,spec.target).steps.length,plan.nodes.length);
        """)
