"""Problem-facing choices -> canonical model request -> validated result.

No live model calls and no generated dummy assets are saved.
"""
import unittest
from pathlib import Path
from test_model import run_js

ROOT=Path(__file__).resolve().parent

class ProblemDesignTests(unittest.TestCase):
    def test_all_catalog_links_resolve_and_scope_is_honest(self):
        run_js(r"""
        const D=require('./problem-design.js'),U=require('./curriculum-model.js');
        assert.equal(new Set(D.all.map(e=>e.id)).size,D.all.length);
        for(const e of D.all){assert.ok(e.example&&e.why);for(const id of e.operations)assert.ok(R.operations.some(o=>o.id===id),id);}
        for(const unit of ['m2-limits','m2-derivatives','m2-integrals']){
          const d={...D.defaults(),curriculum_scope:U.scope(unit)};
          for(const e of D.all.filter(e=>D.available(e,d.curriculum_scope,R)))assert.ok(e.operations.some(id=>D.pool(R,d.curriculum_scope).some(o=>o.id===id)));
          assert.ok(D.normalize(d,R));
        }
        assert.throws(()=>D.normalize({...D.defaults(),curriculum_scope:U.scope('m1-sequences')},R));
        assert.throws(()=>D.normalize({...D.defaults(),curriculum_scope:U.scope('m2-limits'),elements:['integral-function']},R));
        for(const bad of [{elements:['invented']},{branches:['piecewise']},{elements:['absolute','absolute']},{calculation:3},{reasoning:-1},{version:99}])assert.throws(()=>D.normalize({...D.defaults(),...bad},R));
        """)

    def test_empty_selection_and_parameters_survive_all_request_routes(self):
        run_js(r"""
        const D=require('./problem-design.js'),W=require('./web-handoff.js');
        for(const calculation of [0,1,2])for(const reasoning of [0,1,2]){
          const design={...D.defaults(),calculation,reasoning};
          const req=C.makeRequest(R,{revision:R.revision,nodes:[],facts:[]},'핵심을 스스로 골라 제작','REQ-empty',design);
          assert.equal(req.seed_plan.nodes.length,0);assert.ok(req.knowledge.operations.length>0);
          assert.deepEqual(W.canonicalRequest(req,R).design_intent,design);
          const body=A.requestBody({...req,knowledge:{operations:[]}},R);
          assert.deepEqual(JSON.parse(body.input).design_intent,design);
          assert.ok(JSON.parse(body.input).knowledge.operations.length>0);
          const prompt=W.prompt(req),payload=JSON.parse(prompt.slice(prompt.indexOf('\n\n{')+2));
          assert.ok(payload.knowledge.operations.length>0);assert.deepEqual(payload.design_intent,design);
          assert.ok(payload.response_schema.required.includes('design_coverage'));
          assert.ok(prompt.includes(C.SOLUTION_GUIDANCE));
        }
        assert.throws(()=>C.makeRequest(R,{revision:R.revision,nodes:[],facts:[]},'제작','REQ-old'));
        assert.throws(()=>C.makeRequest(R,plan,'제작','REQ-fake',D.defaults()));
        """)

    def test_selected_conditions_and_reviewed_assets_are_preserved(self):
        run_js(r"""
        const D=require('./problem-design.js'),W=require('./web-handoff.js');
        const r=structuredClone(R);r.reviewed_assets=[{operation_ids:['PA-MOTIF-S01-01'],theorem:'검수된 정리문'}];
        const d={...D.defaults(),elements:['difference-integral','extrema-count'],branches:['one-sided']};
        const req=C.makeRequest(r,{revision:r.revision,nodes:[],facts:[]},'제작','REQ-feature',d);
        const guide=req.knowledge.problem_design;
        assert.deepEqual(guide.selected.map(s=>s.id).sort(),[...d.elements,...d.branches].sort());
        assert.equal(req.knowledge.reviewed_assets.length,1);
        assert.ok(W.prompt(req).includes('검수된 정리문'));
        const canonical=A.requestBody({...req,knowledge:{problem_design:{selected:[]}}},r);
        assert.equal(JSON.parse(canonical.input).knowledge.problem_design.selected.length,3);
        """)

    def test_result_coverage_scope_and_actual_plan_are_checked(self):
        run_js(r"""
        const D=require('./problem-design.js'),U=require('./curriculum-model.js');
        const d={...D.defaults(),curriculum_scope:U.scope('m2-derivatives'),elements:['composite']};
        const req=C.makeRequest(R,{revision:R.revision,nodes:[],facts:[]},'제작',job.request_id,d);
        const out=sample();out.design_coverage=[{element_id:'composite',question_evidence:out.question[0],solution_evidence:out.solution[0],operation_ids:['PA-MOTIF-S01-10']}];
        const checked=C.validateResult(out,req,R,E);assert.equal(checked.accepted,true,checked.errors.join(','));assert.equal(checked.human_approval,false);
        for(const mutate of [o=>o.design_coverage=[],o=>o.design_coverage[0].question_evidence='문면에 없음',o=>o.design_coverage[0].solution_evidence='해설에 없음',o=>o.design_coverage[0].operation_ids=['PA-S03-AREA-02'],o=>o.design_coverage.push(o.design_coverage[0]),o=>{o.plan.nodes=[];o.used_operations=[];}]){
          const bad=structuredClone(out);mutate(bad);assert.equal(C.validateResult(bad,req,R,E).accepted,false);
        }
        const integralReq=C.makeRequest(R,{revision:R.revision,nodes:[],facts:[]},'제작',job.request_id,D.defaults());
        const wrongScope={...sample(),design_coverage:[]};assert.equal(C.validateResult(wrongScope,integralReq,R,E).accepted,false);
        const H=require('./server/export-hwpx.cjs');assert.equal(H.validateBundle({schema:'problem-atom/document-bundle/1',items:[{request:req,result:out}]},R).length,1);
        """)

    def test_session_accepts_free_design_and_keeps_structured_parameters(self):
        run_js(r"""
        const D=require('./problem-design.js'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
        const {createSessionService}=require('./server/session-service.cjs'),folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-design-test-'));
        const d={...D.defaults(),calculation:0,reasoning:2,elements:['integral-function']};
        const req=C.makeRequest(R,{revision:R.revision,nodes:[],facts:[]},'제작','REQ-design-session',d);let received=null;
        const app=createSessionService({registry:R,stateDir:folder,siteDir:folder,port:0,token:'test',auth:async()=>({ready:true}),generate:async j=>{received=j;return {mock:true};}});
        await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.address().port,headers={'X-PA-Session':'test','Content-Type':'application/json',Origin:base};
        try{
          const status=await(await fetch(base+'/session/status',{headers})).json();assert.equal(status.problem_design_version,1);
          const posted=await fetch(base+'/session/jobs',{method:'POST',headers,body:JSON.stringify(req)});assert.equal(posted.status,202,await posted.text());
          for(let n=0;n<30&&!received;n++)await new Promise(r=>setTimeout(r,10));
          assert.deepEqual(received.design_intent,d);assert.equal(received.seed_plan.nodes.length,0);assert.ok(received.knowledge.operations.length>0);
        }finally{app.closeAllConnections();await new Promise(r=>app.close(r));assert.ok(path.basename(folder).startsWith('pa-design-test-'));fs.rmSync(folder,{recursive:true,force:true});}
        """)

    def test_private_report_is_not_part_of_publication(self):
        from prepare_pages import STATIC_FILES
        self.assertFalse(any('seminar-structure-report' in p for p in STATIC_FILES))
        self.assertFalse(any('production/' in p for p in STATIC_FILES))
        for name in ['index.html','connections.html']:
            self.assertNotIn('seminar-structure-report',(ROOT/name).read_text(encoding='utf-8'))
        self.assertIn('creator.js',STATIC_FILES)
        self.assertIn('problem-design.js',STATIC_FILES)

if __name__=='__main__':unittest.main()
