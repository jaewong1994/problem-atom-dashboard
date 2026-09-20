"""Session/box regressions: mocks only, private temporary fixtures always removed."""
from test_model import run_js
from test_connections import ROOT
import unittest


class SessionTests(unittest.TestCase):
    def test_box_selection_presets_and_no_invented_conditions(self):
        run_js(r"""
        const S=require('./selection-model.js');
        for(const p of R.presets){const selected=S.preset(R,p.id);assert.equal(E.run(selected).status,'connected');assert.equal(selected.facts.length,p.facts.length);}
        const p=S.blank(R),id=R.operations[0].id;
        S.toggle(p,id,R);assert.equal(p.nodes.length,1);assert.equal(p.facts.length,0);
        S.toggle(p,id,R);assert.equal(p.nodes.length,0);assert.throws(()=>S.toggle(p,'not-an-atom',R));
        for(const op of R.operations){assert.ok(S.categories.some(([id])=>S.category(op)===id));assert.ok(S.describe(op,R)[0]);}
        const q=structuredClone(R.presets[0]);q.revision=R.revision;const before=JSON.stringify(q),advice=S.advice(q,E);
        assert.ok(advice.nodes.length);assert.equal(JSON.stringify(q),before);
        q.nodes.splice(advice.at,0,...advice.nodes);assert.equal(E.run(q).status,'connected');
        S.declare(p,{...R.presets[0].facts[0],origin:'derived'});S.declare(p,p.facts[0]);assert.equal(p.facts.length,1);assert.equal(p.facts[0].origin,'given');
        """)

    def test_cli_uses_chatgpt_auth_and_restricted_sol_execution(self):
        run_js(r"""
        const A=require('./server/codex-session.cjs'),{EventEmitter}=require('node:events');
        const args=A.makeArgs('temporary-fixture');
        for(const required of ['--ephemeral','--ignore-user-config','read-only','shell_tool','unified_exec','multi_agent','gpt-5.6-sol','--output-schema'])assert.ok(args.includes(required));
        assert.ok(!args.includes('--dangerously-bypass-approvals-and-sandbox'));
        const previous=process.env.OPENAI_API_KEY;try{process.env.OPENAI_API_KEY='fixture';assert.equal(A.environment().OPENAI_API_KEY,undefined);}finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
        function mockLogin(text,code=0){return ()=>{const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();c.kill=()=>{};setImmediate(()=>{c.stdout.emit('data',text);c.emit('close',code);});return c;};}
        assert.equal((await A.loginStatus({spawnImpl:mockLogin('Logged in using ChatGPT')})).ready,true);
        assert.equal((await A.loginStatus({spawnImpl:mockLogin('Logged in using an API key')})).ready,false);
        assert.equal((await A.loginStatus({spawnImpl:mockLogin('not logged in',1)})).ready,false);
        """)

    def test_cli_result_validation_abort_and_temporary_cleanup(self):
        run_js(r"""
        const A=require('./server/codex-session.cjs'),fs=require('node:fs'),path=require('node:path'),{EventEmitter}=require('node:events');let folder,prompt='',calls=0;
        const mock=(cmd,args,options)=>{calls++;folder=options.cwd;const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();c.stdin=new EventEmitter();c.stdin.end=text=>{prompt=text;setImmediate(()=>{fs.writeFileSync(path.join(folder,'result.json'),JSON.stringify(sample()));c.emit('close',0);});};c.kill=()=>c.emit('close',1);return c;};
        const out=await A.generateSession(job,R,{spawnImpl:mock,checkLogin:async()=>({ready:true})});
        assert.equal(out.provider,'codex-chatgpt-session');assert.equal(out.validation.accepted,true);assert.equal(out.validation.release_ready,false);
        assert.ok(prompt.includes(job.request_id));assert.equal(fs.existsSync(folder),false);assert.equal(calls,1);
        const signal=new AbortController();signal.abort();await assert.rejects(()=>A.generateSession(job,R,{signal:signal.signal,spawnImpl:mock,checkLogin:async()=>({ready:true})}));assert.equal(calls,1);
        const abort=new AbortController();
        const hanging=(cmd,args,options)=>{folder=options.cwd;const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();c.stdin=new EventEmitter();c.stdin.end=()=>setImmediate(()=>abort.abort());c.kill=()=>setImmediate(()=>c.emit('close',1));return c;};
        await assert.rejects(()=>A.generateSession(job,R,{signal:abort.signal,spawnImpl:hanging,checkLogin:async()=>({ready:true})}),/취소/);assert.equal(fs.existsSync(folder),false);
        """)

    def test_result_cannot_silently_drop_selected_boxes(self):
        run_js(r"""
        const value=sample();value.used_operations=value.used_operations.slice(1);value.plan.nodes=value.plan.nodes.slice(1);
        const check=C.validateResult(value,job,R,E);assert.equal(check.accepted,false);assert.ok(check.errors.some(e=>e.includes('선택한 재료')));
        """)

    def test_live_observed_annotation_and_subject_errors_are_rejected(self):
        run_js(r"""
        const schema=C.resultSchema(R),annotated=sample();annotated.used_operations[0]+=': 설명';
        assert.ok(C.schemaErrors(annotated,schema).some(e=>e.includes('허용 값')));
        const objectNote=sample();objectNote.plan.facts[0].object='수식과 설명';assert.equal(C.validateResult(objectNote,job,R,E).accepted,false);
        const wrongTarget=sample();wrongTarget.plan.facts[0].subject='different-function';assert.equal(C.validateResult(wrongTarget,job,R,E).accepted,false);
        assert.ok(C.INSTRUCTIONS.includes('실제로 제외되는 실수 후보'));
        """)

    def test_companion_access_idempotency_cancel_and_history(self):
        run_js(r"""
        const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createSessionService}=require('./server/session-service.cjs');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-service-test-')),site=path.join(folder,'site'),state=path.join(folder,'private');fs.mkdirSync(site);fs.writeFileSync(path.join(site,'connections.html'),'<!doctype html><!--SESSION_BOOTSTRAP--><main>test</main>');
        let calls=0,release,started;const began=new Promise(r=>started=r);
        const app=createSessionService({registry:R,siteDir:site,stateDir:state,port:0,token:'unit-test-token',auth:async()=>({ready:true}),generate:async(j,r,{signal})=>{calls++;started();await new Promise((resolve,reject)=>{release=resolve;signal.addEventListener('abort',()=>reject(Error('취소')),{once:true});});return {result:sample()};}});
        await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port,headers={'X-PA-Session':'unit-test-token','Content-Type':'application/json',Origin:base};
        const post=(body,h=headers)=>fetch(base+'/session/jobs',{method:'POST',headers:h,body:JSON.stringify(body)});
        try{
          assert.equal((await fetch(base+'/health')).status,200);
          const html=await(await fetch(base+'/connections.html')).text();assert.ok(html.includes('sessionBootstrap'));
          assert.equal((await fetch(base+'/session/status')).status,401);
          assert.equal((await fetch(base+'/session/status',{headers:{...headers,Origin:'https://untrusted.test'}})).status,403);
          const hostStatus=await new Promise((resolve,reject)=>{const request=require('node:http').get(base+'/session/status',{headers:{...headers,Host:'untrusted.test'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);});assert.equal(hostStatus,403);
          assert.equal((await fetch(base+'/%FF')).status,400);
          assert.equal((await fetch(base+'/%2e%2e%2fprivate')).status,404);
          assert.equal((await post({...job,schema:'wrong'})).status,400);
          assert.equal((await post({...job,registry_revision:'old'})).status,409);assert.equal(calls,0);
          assert.equal((await post(job)).status,202);await began;
          assert.equal((await post(job)).status,200);assert.equal(calls,1);
          assert.equal((await post({...job,brief:'different'})).status,409);
          assert.equal((await post({...job,request_id:'REQ-other'})).status,409);
          const history=await(await fetch(base+'/session/jobs',{headers})).json();assert.equal(history.jobs.length,1);assert.ok(!Object.hasOwn(history.jobs[0],'request'));
          assert.equal((await fetch(base+'/session/jobs/'+job.request_id+'/cancel',{method:'POST',headers})).status,200);
          let current;for(let i=0;i<20;i++){current=await(await fetch(base+'/session/jobs/'+job.request_id,{headers})).json();if(current.status!=='running')break;await new Promise(r=>setTimeout(r,10));}
          assert.equal(current.status,'cancelled');assert.equal(calls,1);
          assert.ok(fs.existsSync(path.join(state,job.request_id+'.json')));
          assert.equal((await fetch(base+'/.pa-session/'+job.request_id+'.json')).status,404);
        }finally{release?.();app.closeAllConnections();await new Promise(r=>app.close(r));assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('pa-service-test-'));fs.rmSync(folder,{recursive:true,force:true});}
        """)

    def test_restart_marks_interrupted_job_and_keeps_completed_result(self):
        run_js(r"""
        const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createSessionService}=require('./server/session-service.cjs');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-service-test-'));
        fs.writeFileSync(path.join(folder,'REQ-old.json'),JSON.stringify({id:'REQ-old',status:'running',request:job}));
        fs.writeFileSync(path.join(folder,'REQ-done.json'),JSON.stringify({id:'REQ-done',status:'completed',request:job,output:{result:sample()}}));
        const app=createSessionService({registry:R,stateDir:folder,siteDir:folder,port:0,token:'test',auth:async()=>({ready:true})});await new Promise(r=>app.listen(0,'127.0.0.1',r));
        const base='http://127.0.0.1:'+app.address().port,headers={'X-PA-Session':'test'};
        try{assert.equal((await(await fetch(base+'/session/jobs/REQ-old',{headers})).json()).status,'interrupted');assert.equal((await(await fetch(base+'/session/jobs/REQ-done',{headers})).json()).output.result.answer,sample().answer);}
        finally{app.closeAllConnections();await new Promise(r=>app.close(r));assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));assert.ok(path.basename(folder).startsWith('pa-service-test-'));fs.rmSync(folder,{recursive:true,force:true});}
        """)

    def test_public_build_has_no_session_data_or_long_select(self):
        from prepare_pages import STATIC_FILES, STATIC_DIRS
        self.assertIn('selection-model.js', STATIC_FILES)
        self.assertIn('session-client.js', STATIC_FILES)
        self.assertNotIn('.pa-session', STATIC_DIRS)
        self.assertNotIn('model-workspace.js', STATIC_FILES)
        html = (ROOT/'connections.html').read_text(encoding='utf-8')
        self.assertNotIn('<select', html)
        self.assertIn('SESSION_BOOTSTRAP', html)
        self.assertNotIn('type="password"', html)


if __name__ == '__main__':
    unittest.main()
