"""Control persistence, contract closure and bounded generation: no paid model calls."""
import unittest
from test_model import run_js

TUNED = r"""
const D=require('./problem-design.js'),T=require('./design-controls.js'),U=require('./curriculum-model.js');
const design={...D.defaults(),curriculum_scope:U.scope('m2-derivatives'),tuning:T.defaults()};
design.tuning.values.disclosure='linked';
const req=C.makeRequest(R,{revision:R.revision,facts:[],nodes:[]},'설계 구조를 검토한다',job.request_id,design);
function tuned(){const v=sample();v.design_coverage=[];v.design_evidence={
 control_checks:[{parameter:'disclosure',requested:'linked',achieved:'linked',solution_evidence:v.solution[0],explanation:'형식검사 전용 값. 수학 검산이 아님.'}],
 derivation:v.used_operations.map((id,i)=>({step_id:'S'+i,kind:'registered',source_ids:[id],depends_on:i?['S'+(i-1)]:[],premises:['형식 검사 전용 전제'],scope:'F on R',statement:'형식 검사 전용 결과',argument:'실제 수학 증명이 아닌 형식 fixture',runtime_supported:true})),
 condition_tests:v.condition_roles.map(c=>({condition:c.condition,status:'changed_answer',construction:'메모리 형식 표본',alternative_target:'다른 답의 형식 표본'})),
 shortcut_audit:{route:'형식 표본',preserves_core:true,reason:'독립 수학 검산과 구분'},
 structure:{hidden_family:'cubic',information_flow:'composite to intersections',branch_points:['tangent'],target_role:'count',variation_from_previous:'첫 형식 표본'}
};return v;}
"""

class DesignControlsTests(unittest.TestCase):
    def test_proof_sources_include_content_and_quarantine_known_conflict(self):
        run_js(TUNED+r"""
        const W=require('./web-handoff.js');
        const row=req.knowledge.sources.find(s=>s.id==='PA-CAND-CON-20260910-031');
        assert(row.definitions.some(s=>s.includes('항등식')));assert(row.prerequisites.length);
        assert(W.prompt(req).includes(row.definitions[0]));
        assert.equal(req.knowledge.sources.find(s=>s.id==='PA-CAND-CON-20260910-008').usable_as_proof_source,false);
        assert.equal(T.sourceReference({id:'reference-only',name:'empty'}).usable_as_proof_source,false);
        const bad=tuned();bad.design_evidence.derivation[0].source_ids.push('PA-CAND-CON-20260910-008');
        assert.equal(C.validateResult(bad,req,R,E).accepted,false);
        """)

    def test_integer_answer_claim_is_checked_against_actual_answer(self):
        run_js(TUNED+r"""
        const d=structuredClone(design);d.tuning.values.answer_form='exam_integer';
        const r=C.makeRequest(R,{revision:R.revision,facts:[],nodes:[]},'test',job.request_id,d);
        for(const answer of ['0','-2','1000','3/2','3 또는 4',''] ){
         const v=tuned();v.answer=answer;v.design_evidence.control_checks.push({parameter:'answer_form',requested:'exam_integer',achieved:'exam_integer',solution_evidence:v.solution[0],explanation:'잘못된 자기보고'});
         assert.equal(C.validateResult(v,r,R,E).accepted,false);
        }
        """)
    def test_every_choice_is_valid_and_conflicts_cannot_be_sent(self):
        run_js(TUNED+r"""
        assert.equal(T.controls.length,10);
        for(const c of T.controls)for(const o of c.options){const t=T.defaults();t.values[c.id]=o.value;assert.equal(T.normalize(t).values[c.id],o.value);}
        for(const pair of [{candidates:'filter',branching:'none'},{candidates:'keep_many',target:'value'},{candidates:'single',target:'invariant'},{boundary:'decisive',branching:'none'},{target:'range',answer_form:'exam_integer'}]){
          const d=structuredClone(design);Object.assign(d.tuning.values,pair);assert(T.conflicts(d.tuning).length);assert.throws(()=>C.makeRequest(R,{revision:R.revision,facts:[],nodes:[]},'test','REQ-invalid',d));
        }
        assert.throws(()=>T.normalize({version:1,values:{unknown:'auto'}}));
        assert.throws(()=>T.normalize({version:1,values:{branching:'lots'}}));
        assert.throws(()=>T.normalize({version:2,values:{}}));
        """)

    def test_controls_and_evidence_schema_survive_canonical_routes(self):
        run_js(TUNED+r"""
        const W=require('./web-handoff.js');
        for(const request of [W.canonicalRequest(req,R),JSON.parse(A.requestBody(req,R).input)]){
          assert.deepEqual(request.design_intent.tuning,design.tuning);
          assert.equal(request.knowledge.problem_design.controls.selected[0].parameter,'disclosure');
        }
        assert(req.response_schema.required.includes('design_evidence'));
        assert(A.requestBody(req,R).text.format.schema.required.includes('design_evidence'));
        assert(W.prompt(req).includes('잠재결과'));
        assert.equal(C.resultSchema(R,true).required.includes('design_evidence'),false);
        assert.equal(C.validateResult(tuned(),req,R,E).accepted,true);
        assert.equal(C.validateResult(tuned(),req,R,E).release_ready,false);
        """)

    def test_claims_do_not_bypass_traceability_and_required_evidence(self):
        run_js(TUNED+r"""
        const mutations=[v=>delete v.design_evidence,v=>v.design_evidence.control_checks=[],v=>v.design_evidence.control_checks[0].achieved='unmet',v=>v.design_evidence.control_checks[0].solution_evidence='not in solution',v=>v.design_evidence.control_checks.push(v.design_evidence.control_checks[0]),v=>v.design_evidence.derivation[0].source_ids=['invented'],v=>v.design_evidence.derivation[0].depends_on=['S1'],v=>v.design_evidence.derivation[0].runtime_supported=false,v=>v.design_evidence.derivation[0].kind='potential',v=>v.design_evidence.derivation[0].argument='',v=>v.design_evidence.derivation=[],v=>v.design_evidence.condition_tests=[],v=>v.design_evidence.condition_tests[0].status='not_necessary',v=>v.design_evidence.shortcut_audit.preserves_core=false,v=>v.design_evidence.structure.hidden_family=''];
        for(const mutate of mutations){const v=tuned();mutate(v);assert.equal(C.validateResult(v,req,R,E).accepted,false);}
        """)

    def test_bounded_loop_deduplicates_and_requires_independent_math(self):
        run_js(TUNED+r"""
        const B=require('./design-batch.js');let calls=0;const d=structuredClone(design);d.tuning.values.variation='structure';
        const compose=async request=>{calls++;const v=tuned();v.request_id=request.request_id;v.design_evidence.control_checks.push({parameter:'variation',requested:'structure',achieved:'structure',solution_evidence:v.solution[0],explanation:'표본'});return v;};
        const config={registry:R,design:d,brief:'test',batchId:'B-test',count:2,maxAttempts:3,compose,verify:async()=>({verdict:'pass',independent:true,instance_key:'i'+calls,structural_key:'same'})};
        const out=await B.run(config);assert.equal(calls,3);assert.equal(out.accepted.length,1);assert.equal(out.status,'attempt_limit_reached');assert.equal(out.attempts[1].status,'duplicate_structure');assert.equal(out.release_ready,false);
        const hold=await B.run({...config,count:1,maxAttempts:1,verify:async()=>({verdict:'pass',independent:false})});assert.equal(hold.accepted.length,0);assert.equal(hold.attempts[0].status,'math_review_pending');
        const failed=await B.run({...config,count:1,maxAttempts:1,verify:async()=>({verdict:'fail',errors:['조건을 만족하지만 답이 다른 함수가 있다']})});assert.equal(failed.attempts[0].status,'math_rejected');assert.equal(failed.attempts[0].reasons[0],'조건을 만족하지만 답이 다른 함수가 있다');
        const dup=await B.run({...config,count:1,maxAttempts:1,previous:[{instance_key:'old',structural_key:'old'}],verify:async()=>({verdict:'pass',independent:true,instance_key:'old',structural_key:'different'})});assert.equal(dup.attempts[0].status,'duplicate_instance');
        const ab=new AbortController();ab.abort();const cancel=await B.run({...config,signal:ab.signal});assert.equal(cancel.status,'cancelled');assert.equal(cancel.attempts.length,0);
        const numeric=structuredClone(design);numeric.tuning.values.variation='numbers';
        const numericCompose=async r=>{const v=await compose(r);v.design_evidence.control_checks[1].requested='numbers';v.design_evidence.control_checks[1].achieved='numbers';return v;};
        const changed=await B.run({...config,design:numeric,compose:numericCompose,count:1,maxAttempts:1,referenceStructure:'original',verify:async()=>({verdict:'pass',independent:true,instance_key:'new',structural_key:'different'})});assert.equal(changed.attempts[0].status,'structure_changed');
        await assert.rejects(B.run({...config,count:0}));await assert.rejects(B.run({...config,maxAttempts:31}));await assert.rejects(B.run({...config,verify:null}));
        """)

if __name__=='__main__':unittest.main()
