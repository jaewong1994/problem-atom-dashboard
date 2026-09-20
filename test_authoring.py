"""Purpose-constrained next decisions. Fixtures live in memory and never enter the bank."""
import unittest
from test_model import run_js


class AuthoringTests(unittest.TestCase):
    def test_intermediate_singletons_offer_their_bundle_instead_of_a_dead_end_start(self):
        run_js(r"""
        const B=require('./judgment-bundles.js'),A=require('./authoring-model.js');
        for(const b of B.catalog)assert.equal(A.startOptions(R,b.id).hasQuestion,true);
        const middle=A.startOptions(R,'PA-MOTIF-S01-01');assert.equal(middle.hasQuestion,false);assert.ok(middle.bundles.some(b=>b.id==='sign-cases'));
        assert.equal(A.startOptions(R,'PA-S02-JUMP-04').hasQuestion,true);
        assert.equal(A.startOptions(R,'PA-CAND-SKL-20260910-033').hasQuestion,false);
        """)

    def test_bundles_are_connected_strategies_and_every_member_reaches_an_answer(self):
        run_js(r"""
        const B=require('./judgment-bundles.js'),P=require('./composition-planner.js');
        assert.equal(B.catalog.length,7);
        for(const b of B.catalog){const s=B.seed(R,b.id),groups=B.groups(s.plan,R);
          assert.equal(groups.length,1);assert.equal(groups[0].id,b.id);
          assert.ok(groups[0].joins.length>=b.members.length-1);
          assert.ok(P.targets(s.plan,R,s.coreId).some(c=>P.analyze({...s.plan,nodes:[...s.plan.nodes,...c.route]},R,s.coreId,c.target).ready));
          assert.deepEqual(B.courses(R,b.id),[...new Set(b.members.flatMap(id=>R.operations.find(o=>o.id===id).curriculum))]);
          assert.deepEqual(B.placements(s.plan,R,b.id),[]);
        }
        // Every registered singleton is available without one of three calculus starters.
        for(const op of R.operations)assert.equal(B.seed(R,op.id).plan.nodes[0].id,op.id);
        const mixed=structuredClone(R);mixed.operations.find(o=>o.id==='PA-MOTIF-S01-02').curriculum=['확률과 통계'];assert.deepEqual(B.courses(mixed,'sign-cases'),[]);
        """)

    def test_bundle_attachment_reuses_information_without_adding_conditions(self):
        run_js(r"""
        const B=require('./judgment-bundles.js');
        for(const b of B.catalog){const full=B.seed(R,b.id).plan,partial={...structuredClone(full),nodes:full.nodes.slice(0,1)};
          const choices=B.placements(partial,R,b.id);assert.ok(choices.length);
          const next=B.attach(partial,R,choices[0]);assert.deepEqual(next.facts,partial.facts);assert.equal(next.nodes.length,full.nodes.length);
          const forged=structuredClone(choices[0]);forged.nodes[0].scope='unrelated';assert.throws(()=>B.attach(partial,R,forged));
          assert.throws(()=>B.attach(next,R,choices[0]));
          const renamed=structuredClone(partial);for(const f of renamed.facts){if(f.subject==='F')f.subject='Q';if(f.object==='F')f.object='Q';f.scope='case-a';}for(const n of renamed.nodes){n.bindings.f='Q';n.scope='case-a';}
          const option=B.placements(renamed,R,b.id)[0];assert.ok(option);assert.ok(option.nodes.every(n=>n.scope==='case-a'));assert.equal(B.groups(option.plan,R)[0].bindings.f,'Q');
        }
        """)

    def test_bundle_rejects_false_dependencies_wrong_objects_scopes_and_conflicts(self):
        run_js(r"""
        const B=require('./judgment-bundles.js');
        const full=B.seed(R,'range-filter').plan,partial={...structuredClone(full),nodes:full.nodes.slice(0,1)};
        for(const field of ['object','scope']){const bad=structuredClone(partial),f=bad.facts.find(f=>f.type==='height_identity');f[field]='UNRELATED';assert.equal(B.placements(bad,R,'range-filter').length,0);}
        const renamed=structuredClone(partial);renamed.facts.find(f=>f.type==='height_identity').subject='b';assert.equal(B.placements(renamed,R,'range-filter')[0].nodes[0].bindings.a,'b');
        const bypass=structuredClone(full);bypass.facts.push({type:'height_set',subject:'F',scope:'main',origin:'given'});assert.equal(B.groups(bypass,R).length,0);
        const mismatch=structuredClone(full);mismatch.nodes[1].bindings.f='OTHER';assert.equal(B.groups(mismatch,R).length,0);
        const candidate=B.seed(R,'view-candidates').plan;candidate.nodes=candidate.nodes.slice(0,1);candidate.facts.push({type:'zero_scale',subject:'F',scope:'main',origin:'given'});assert.equal(B.placements(candidate,R,'view-candidates').length,0);
        """)

    def test_bundle_diagram_collapse_preserves_all_external_edges_and_expands_losslessly(self):
        run_js(r"""
        const B=require('./judgment-bundles.js'),S=require('./selection-model.js'),G=require('./composition-graph.js');
        for(const plan of [...B.catalog.map(b=>B.seed(R,b.id).plan),S.preset(R,'old-new-integers')]){
          const view=B.view(plan,R),flat=B.view(plan,R,B.catalog.map(b=>b.id)),graph=G.compile(plan,R);
          assert.equal(flat.nodes.length,plan.nodes.length);assert.deepEqual(flat.graph.edges,graph.edges);
          for(const e of graph.edges){const from=view.owner.get(e.from)||e.from,to=view.owner.get(e.to)||e.to;if(from===to)assert.ok(view.bundles.some(b=>b.joins.some(j=>j.from===e.from&&j.to===e.to)));else assert.ok(view.edges.some(x=>x.from===from&&x.to===to&&e.via.every(v=>x.via.includes(v))));}
          const restored=JSON.parse(JSON.stringify(plan));assert.deepEqual(B.groups(restored,R),view.bundles);
        }
        """)

    def test_bundle_guidance_survives_canonical_request_and_does_not_force_single_core(self):
        run_js(r"""
        const B=require('./judgment-bundles.js'),P=require('./composition-planner.js'),G=require('./composition-graph.js'),W=require('./web-handoff.js');
        const s=B.seed(R,'sign-cases'),goal=P.targets(s.plan,R,s.coreId)[0].target;
        const spec={...P.intent(s.plan,R,s.coreId,goal,0,1,G.spec(s.plan,R,{})),core_role:'connection_anchor'};
        const request=C.makeRequest(R,s.plan,B.instruction(s.plan,R,s.coreId),'BUNDLE-TEST',spec);
        assert.equal(request.design_intent.core_role,'connection_anchor');assert.equal(request.knowledge.authoring.bundles[0].id,'sign-cases');
        const payload=JSON.parse(A.requestBody({...request,knowledge:{authoring:{bundles:['forged']}}},R).input);
        assert.deepEqual(payload.knowledge.authoring.bundles,request.knowledge.authoring.bundles);
        assert.equal(payload.design_intent.core_role,'connection_anchor');assert.ok(W.prompt(request).includes('sign-cases'));
        assert.throws(()=>P.normalizeIntent({...spec,core_role:'auto_approved'},s.plan,R));
        """)

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
