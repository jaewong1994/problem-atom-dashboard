"""Review-to-authoring lifecycle. All approvals use disposable fixtures, never the real ledger."""
import unittest
from test_model import run_js


SETUP = r"""
const M=require('./review-model.js'),X=require('./box-examples.js'),catalog=M.catalog(R,require('./review-groups.json'),X);
const g=catalog.groups.find(g=>g.id==='derivative');
const row={groupId:g.id,revision:g.revision,actor:'회귀검증 전용',at:'2026-09-21T01:00:00Z',parts:[{memberIds:g.members.map(m=>m.id),proposal:'검수한 차형 적분 공식',verdict:'approve'}]};
const reviewPlan=require('./judgment-bundles.js').seed(R,'sign-cases').plan;
const payload={schema:'problem-atom/group-review/1.0',actor:row.actor,groups:[row]};
"""


class ReviewLinkTests(unittest.TestCase):
    def test_all_operations_are_reviewable_and_approval_is_source_scoped(self):
        run_js(SETUP + r"""
        assert.deepEqual([...new Set(catalog.groups.flatMap(g=>g.operations))].sort(),R.operations.map(o=>o.id).sort());
        const before=JSON.stringify(R),assets=M.assets(R,catalog,{groups:[row]});
        assert.equal(assets.length,1);assert.ok(assets[0].operation_ids.includes('PA-MOTIF-S01-01'));
        assert.deepEqual(assets[0].member_ids,row.parts[0].memberIds);assert.equal(JSON.stringify(R),before);
        const rr={...R,reviewed_assets:assets},request=C.makeRequest(rr,reviewPlan,'회귀검증 문항','REQ-reviewed');
        assert.equal(request.knowledge.reviewed_assets.length,1);assert.equal(request.knowledge.reviewed_assets[0].summary,row.parts[0].proposal);
        assert.ok(request.knowledge.operations.every(o=>o.review_status==='ai_candidate'));
        const api=JSON.parse(A.requestBody(request,rr).input);assert.deepEqual(api.knowledge.reviewed_assets,request.knowledge.reviewed_assets);
        const other=structuredClone(reviewPlan);other.nodes=other.nodes.filter(n=>n.id!=='PA-MOTIF-S01-01');
        assert.equal(M.forPlan(rr,other).length,0);
        """)

    def test_edits_holds_splits_and_source_changes_do_not_reuse_old_approval(self):
        run_js(SETUP + r"""
        for(const verdict of ['pending','hold']){const next={...row,actor:'다른 검토자',at:'2026-09-21T02:00:00Z',parts:[{...row.parts[0],verdict}]};assert.equal(M.assets(R,catalog,{groups:[row,next]}).length,0);}
        const stale={...row,revision:'old'};assert.equal(M.assets(R,catalog,{groups:[stale]}).length,0);
        const split=structuredClone(row);split.parts=[{memberIds:[g.members[0].id],proposal:'이 항목만 승인',verdict:'approve'},{memberIds:g.members.slice(1).map(m=>m.id),proposal:'별도 검수',verdict:'pending'}];
        assert.deepEqual(M.assets(R,catalog,{groups:[split]})[0].member_ids,[g.members[0].id]);
        for(const change of [p=>p.groups[0].parts[0].memberIds.push('unknown'),p=>p.groups[0].parts[0].memberIds.pop(),p=>p.groups[0].parts[0].memberIds.push(g.members[0].id),p=>p.groups[0].actor='다름',p=>p.groups[0].revision='old']){const bad=structuredClone(payload);change(bad);assert.throws(()=>M.validate(bad,catalog));}
        const changed=structuredClone(R);changed.revision='new-unrelated-assets';assert.equal(M.assets(changed,M.catalog(changed,require('./review-groups.json'),X),{groups:[row]}).length,1);
        changed.operations.find(o=>o.id==='PA-MOTIF-S01-01').guard_note+=' 조건 변경';assert.equal(M.assets(changed,M.catalog(changed,require('./review-groups.json'),X),{groups:[row]}).length,0);
        """)

    def test_durable_review_store_conflict_protection_and_restart(self):
        run_js(SETUP + r"""
        const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{createReviewStore}=require('./server/review-store.cjs');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-review-test-'));
        try{const store=createReviewStore({registry:R,catalog,stateDir:folder}),v=store.snapshot().version;
          store.save({...payload,baseVersion:v});assert.equal(store.reviewedRegistry().reviewed_assets.length,1);
          assert.throws(()=>store.save({...payload,baseVersion:v}),/다른 화면/);
          const next=createReviewStore({registry:R,catalog,stateDir:folder});assert.equal(next.reviewedRegistry().reviewed_assets.length,1);
          const hold=structuredClone(payload);hold.groups[0].parts[0].verdict='hold';next.save({...hold,baseVersion:next.snapshot().version});
          assert.equal(store.reviewedRegistry().reviewed_assets.length,0);assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'asset-reviews.json'))).history.length,2);
        }finally{assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('pa-review-test-'));fs.rmSync(folder,{recursive:true,force:true});}
        """)

    def test_session_submission_uses_persisted_review_and_rejects_forged_or_stale_text(self):
        run_js(SETUP + r"""
        const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{createReviewStore}=require('./server/review-store.cjs'),{createSessionService}=require('./server/session-service.cjs');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-review-test-')),store=createReviewStore({registry:R,catalog,stateDir:folder});let received,calls=0;
        const app=createSessionService({registry:R,reviewStore:store,stateDir:folder,siteDir:folder,port:0,token:'test-only',auth:async()=>({ready:true}),generate:async(job,registry)=>{calls++;received={job,registry};return {result:{}};}});await new Promise(r=>app.listen(0,'127.0.0.1',r));
        const base='http://127.0.0.1:'+app.address().port,headers={'X-PA-Session':'test-only','Content-Type':'application/json'},post=(url,body)=>fetch(base+url,{method:'POST',headers,body:JSON.stringify(body)});
        try{
         assert.equal((await fetch(base+'/session/reviews')).status,401);
         assert.equal((await fetch(base+'/session/reviews',{headers:{...headers,Origin:'https://bad.test'}})).status,403);
         const snap=await(await fetch(base+'/session/reviews',{headers})).json();assert.equal((await post('/session/reviews',{...payload,baseVersion:snap.version})).status,200);
         const request=C.makeRequest(store.reviewedRegistry(),reviewPlan,'검수 연결 확인','REQ-review-link');
         const forged=structuredClone(request);forged.knowledge.reviewed_assets[0].summary='forged';assert.equal((await post('/session/jobs',forged)).status,409);assert.equal(calls,0);
         assert.equal((await post('/session/jobs',request)).status,202);
         for(let i=0;i<30&&!received;i++)await new Promise(r=>setTimeout(r,5));
         assert.deepEqual(received.job.knowledge.reviewed_assets,request.knowledge.reviewed_assets);assert.equal(received.registry.reviewed_assets.length,1);
         const hold=structuredClone(payload);hold.groups[0].parts[0].verdict='hold';assert.equal((await post('/session/reviews',{...hold,baseVersion:store.snapshot().version})).status,200);
         request.request_id='REQ-stale-review';assert.equal((await post('/session/jobs',request)).status,409);assert.equal(calls,1);
        }finally{app.closeAllConnections();await new Promise(r=>app.close(r));assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('pa-review-test-'));fs.rmSync(folder,{recursive:true,force:true});}
        """)


if __name__ == '__main__':
    unittest.main()
