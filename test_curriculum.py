"""Chapter/fusion scope tests. New-course witnesses are in-memory contract fixtures only."""
import unittest
from test_model import run_js


class CurriculumTests(unittest.TestCase):
    def test_nine_chapters_and_explicit_classification_coverage(self):
        run_js(r"""
        const U=require('./curriculum-model.js');
        assert.equal(U.subjects.length,3);assert.equal(U.units.length,9);
        assert.equal(new Set(U.units.map(u=>u.id)).size,9);
        assert.deepEqual(Object.keys(U.classifications).sort(),R.operations.map(o=>o.id).sort());
        for(const unit of U.units){assert.ok(U.subjects.some(s=>s.id===unit.subject));assert.ok(unit.prerequisites.every(id=>U.get(id)));}
        for(const unit of U.units.filter(u=>u.subject!=='math2'))assert.equal(U.count(R,unit.id),0);
        """)

    def test_fusion_requires_different_subjects_and_preserves_selected_chapters(self):
        run_js(r"""
        const U=require('./curriculum-model.js');
        const fusion={mode:'fusion',units:['p-counting','m1-sequences'],supporting_units:[]};
        assert.deepEqual(U.mainUnits(fusion),['m1-sequences','p-counting']);
        assert.equal(U.guidance(fusion).mode,'fusion');assert.equal(U.guidance(fusion).main_units.length,2);
        for(const value of [
          {...fusion,units:['m2-integrals','m2-derivatives']},
          {...fusion,units:['m1-sequences']},
          {...fusion,units:['m1-sequences','m1-sequences','p-counting']},
          {...fusion,units:['unknown','p-counting']},
          {...fusion,supporting_units:['p-counting']},
          {...fusion,mode:'free-for-all'}])assert.throws(()=>U.normalize(value));
        assert.deepEqual(U.normalize(null),null);
        """)

    def test_scope_includes_prerequisites_but_does_not_silently_add_advanced_units(self):
        run_js(r"""
        const U=require('./curriculum-model.js'),B=require('./judgment-bundles.js');
        const integral=B.seed(R,'sign-cases').plan;
        assert.equal(U.audit(integral,R,U.scope('m2-integrals')).valid,true);
        assert.equal(U.audit(integral,R,U.scope('m2-derivatives')).valid,false);
        assert.equal(U.audit(integral,R,{unit:'m2-derivatives',supporting_units:['m2-integrals']}).valid,true);
        const boundary=B.seed(R,'boundary-check').plan;
        assert.equal(U.audit(boundary,R,U.scope('m2-limits')).valid,false);
        assert.equal(U.audit(boundary,R,U.scope('m2-derivatives')).valid,true);
        assert.equal(U.material(R,B.definition('sign-cases').members,U.scope('m2-limits')).visible,false);
        // An integral hidden in the givens is still outside a derivatives-only brief.
        const derivative=B.seed(R,'PA-BRIDGE-02').plan;derivative.facts.push({type:'difference_integral',subject:'F',scope:'main',origin:'given'});
        assert.ok(U.audit(derivative,R,U.scope('m2-derivatives')).outside.includes('m2-integrals'));
        """)

    def test_generic_candidate_counting_does_not_fake_an_unstocked_subject(self):
        run_js(r"""
        const U=require('./curriculum-model.js'),B=require('./judgment-bundles.js');
        const generic=B.seed(R,'PA-S02-LEVELS-03').plan;
        for(const unit of U.units)assert.equal(U.audit(generic,R,U.scope(unit.id)).hasMain,false);
        for(const unit of U.units)assert.equal(U.canStart(generic,R,U.scope(unit.id)),false);
        const fusion={mode:'fusion',units:['m1-sequences','p-counting'],supporting_units:[]};
        assert.equal(U.audit(generic,R,fusion).valid,false);
        const copy=structuredClone(generic);copy.nodes[0].id='NEW-UNCLASSIFIED';assert.equal(U.audit(copy,R,U.scope('p-counting')).valid,false);
        """)

    def test_fusion_needs_both_main_chapters_and_one_connected_answer(self):
        run_js(r"""
        const U=require('./curriculum-model.js'),P=require('./composition-planner.js'),G=require('./composition-graph.js');
        const copy=structuredClone(R),source=structuredClone(R.operations.find(o=>o.id==='PA-S02-LEVELS-03'));
        const a={...source,id:'TEST-SEQUENCE',requires:[{type:'root_lists',subject:'$f'}],provides:[{type:'admissible_set',subject:'$a'}]};
        const b={...source,id:'TEST-COUNTING'};copy.operations.push(a,b);
        U.classifications[a.id]={main:['m1-sequences'],requires:['m1-sequences']};U.classifications[b.id]={main:['p-counting'],requires:['p-counting']};
        const p={revision:copy.revision,facts:[{type:'root_lists',subject:'F',scope:'main',origin:'given'}],nodes:[a,b].map(o=>({id:o.id,bindings:{f:'F',a:'a',h:'H'},scope:'main'}))};
        const scope={mode:'fusion',units:['m1-sequences','p-counting'],supporting_units:[]},target={type:'integer_answer',subject:'a',scope:'main'};
        const spec={...P.intent(p,copy,a.id,target,0,1,G.spec(p,copy,{})),curriculum_scope:scope};
        assert.equal(U.audit(p,copy,scope).valid,true);assert.deepEqual(P.validateResult(p,copy,spec,p),[]);
        assert.equal(U.audit({...p,nodes:p.nodes.slice(0,1)},copy,scope).hasMain,false);
        // Fusion can begin with one subject, but cannot generate until both connect.
        const partial={...p,nodes:p.nodes.slice(0,1)};
        assert.equal(U.canStart(partial,copy,scope),true);
        assert.equal(U.audit(partial,copy,scope).valid,false);
        const bypass=structuredClone(p);bypass.facts.push({type:'admissible_set',subject:'a',scope:'main',origin:'given'});
        assert.ok(P.validateResult(bypass,copy,spec,p).length>0);
        """)

    def test_scope_survives_canonical_api_web_and_rejects_out_of_scope_generation(self):
        run_js(r"""
        const U=require('./curriculum-model.js'),P=require('./composition-planner.js'),W=require('./web-handoff.js'),G=require('./composition-graph.js');
        const spec={...P.intent(plan,R,'PA-MOTIF-S01-10',{type:'level_counts',subject:'H',scope:'main'},0,1,G.spec(plan,R,{})),curriculum_scope:U.scope('m2-derivatives')};
        const request=C.makeRequest(R,plan,job.brief,job.request_id,spec);
        assert.equal(request.knowledge.curriculum.main_units[0].id,'m2-derivatives');
        const input=JSON.parse(A.requestBody({...request,knowledge:{curriculum:{mode:'forged'}}},R).input);
        assert.deepEqual(input.knowledge.curriculum,request.knowledge.curriculum);
        assert.ok(W.prompt(request).includes('m2-derivatives'));assert.equal(C.validateResult(sample(),request,R,E).accepted,true);
        assert.throws(()=>C.makeRequest(R,plan,job.brief,job.request_id,{...spec,curriculum_scope:U.scope('p-counting')}));
        const legacy=C.makeRequest(R,plan,job.brief,job.request_id);assert.equal(legacy.knowledge.curriculum,null);
        """)


if __name__ == '__main__':
    unittest.main()
