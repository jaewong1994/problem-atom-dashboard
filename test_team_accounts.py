"""Fixed teacher accounts and ownership checks. Passwords below are disposable test fixtures."""
import unittest
from test_model import run_js

SETUP = r"""
const T=require('./server/team-store.cjs'),crypto=require('node:crypto');
const quick=async(p,s)=>crypto.createHash('sha512').update(s+p).digest('hex');
const questions=[{id:'q1',legacyIds:['old-q1']},{id:'q2'},{id:'q3'}];
let now=Date.parse('2026-09-21T00:00:00Z');
const store=T.createTeamStore({file:':memory:',questions,derive:quick,now:()=>now});
const password='disposable-test-password';
async function setup(name){return store.authenticate({name,password,invite:store.issueInvite(name)});}
"""

class TeamAccountTests(unittest.TestCase):
    def test_invite_only_setup_session_mode_and_expiration(self):
        run_js(SETUP + r"""
        assert.equal(store.members().length,4);assert.throws(()=>store.issueInvite('다른 이름'));
        await assert.rejects(store.authenticate({name:'김연수',password,invite:'wrong'}));
        const invite=store.issueInvite('김연수');
        await assert.rejects(store.authenticate({name:'김연수',password:'short',invite}));
        const a=await store.authenticate({name:'김연수',password,invite});assert.equal(a.mode,null);
        assert.equal(store.session(a.token).user.id,'kim-yeonsu');assert.notEqual(a.token,a.csrf);
        assert.equal(store.mode(a.token,'web').mode,'web');assert.throws(()=>store.mode(a.token,'unknown'));
        assert.throws(()=>store.issueInvite('김연수'));await assert.rejects(store.authenticate({name:'김연수',password:'wrong-password',invite}));
        const b=await store.authenticate({name:'김연수',password});assert.equal(b.mode,null);assert.notEqual(a.token,b.token);
        store.logout(a.token);assert.equal(store.session(a.token),null);assert.ok(store.session(b.token));
        now+=13*3600000;assert.equal(store.session(b.token),null);store.close();
        """)

    def test_only_owner_can_complete_reopen_or_release(self):
        run_js(SETUP + r"""
        const a=(await setup('김연수')).user,b=(await setup('이광훈')).user;
        store.updateClaim(a,'q1','claim');assert.throws(()=>store.updateClaim(b,'q1','complete'),/본인/);
        assert.throws(()=>store.updateClaim(b,'q1','release'),/본인/);assert.throws(()=>store.updateClaim(a,'unknown','claim'));
        store.updateClaim(a,'q1','complete');assert.throws(()=>store.updateClaim(a,'q1','release'));
        store.updateClaim(b,'q1','claim');assert.equal(store.claims().length,2);
        store.updateClaim(a,'q1','reopen');store.updateClaim(b,'q1','complete');
        assert.equal(store.claims().find(r=>r.owner_id===a.id).status,'claimed');
        assert.equal(store.claims().find(r=>r.owner_id===b.id).status,'completed');
        store.updateClaim(a,'q1','release');assert.equal(store.claims().length,1);store.close();
        """)

    def test_legacy_names_map_to_fixed_ids_without_overwriting_live_work(self):
        run_js(SETUP + r"""
        const payload={claims:[{question_id:'old-q1',owner_name:'민재웅T',status:'completed',updated_at:'2026-09-20T00:00:00Z'},
          {question_id:'q1',owner_name:'민재웅',status:'claimed',updated_at:'2026-09-19T00:00:00Z'},
          {question_id:'q2',owner_name:'김상범',status:'completed'},
          {question_id:'q3',owner_name:'이광훈',status:'claimed'},
          {question_id:'unknown',owner_name:'김연수',status:'completed'},
          {question_id:'q2',owner_name:'알 수 없는 이름',status:'completed'}],sources:[{actor:'김연수',events:[{questionId:'q3',done:true,updatedAt:'2026-09-18T00:00:00Z'}]}]};
        let report=store.importLegacy(payload);assert.equal(report.matched,4);assert.equal(report.unmatched.length,2);assert.equal(store.claims().length,0);
        report=store.importLegacy(payload,{dryRun:false});assert.equal(report.inserted,4);assert.equal(store.claims().find(r=>r.owner_id==='min-jaewoong').status,'completed');
        const a=(await setup('민재웅')).user;store.updateClaim(a,'q1','reopen');
        report=store.importLegacy(payload,{dryRun:false});assert.equal(report.inserted,0);assert.equal(store.claims().find(r=>r.owner_id===a.id).status,'claimed');
        store.updateClaim(a,'q1','release');report=store.importLegacy(payload,{dryRun:false});assert.equal(report.inserted,0);assert.ok(!store.claims().some(r=>r.owner_id===a.id));store.close();
        """)

    def test_rate_limit_and_real_password_derivation(self):
        run_js(SETUP + r"""
        for(let i=0;i<8;i++)await assert.rejects(store.authenticate({name:'김상범',password,invite:'invalid'},'test-ip'));
        await assert.rejects(store.authenticate({name:'김상범',password,invite:'invalid'},'test-ip'),e=>e.status===429);
        now+=16*60000;const a=await setup('김상범');assert.ok(a.token);
        const real=await T.passwordHash(password,'test-salt');assert.equal(real.length,128);assert.notEqual(real,await quick(password,'test-salt'));
        assert.equal(real,await T.passwordHash(password,'test-salt'));assert.notEqual(real,await T.passwordHash(password+'changed','test-salt'));store.close();
        """)

    def test_accounts_and_sessions_survive_database_restart(self):
        run_js(SETUP + r"""
        const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-team-persistence-')),file=path.join(folder,'team.sqlite');
        let disk;
        try{
          disk=T.createTeamStore({file,questions,derive:quick,now:()=>now});
          const a=await disk.authenticate({name:'김연수',password,invite:disk.issueInvite('김연수')});
          disk.mode(a.token,'web');disk.updateClaim(a.user,'q1','claim');disk.updateClaim(a.user,'q1','complete');disk.close();
          disk=T.createTeamStore({file,questions,derive:quick,now:()=>now});
          assert.equal(disk.members().find(m=>m.name==='김연수').needsSetup,false);
          assert.equal(disk.session(a.token).mode,'web');assert.equal(disk.claims()[0].status,'completed');
          const b=await disk.authenticate({name:'김연수',password});assert.equal(b.mode,null);
          disk.logout(a.token);disk.close();disk=T.createTeamStore({file,questions,derive:quick,now:()=>now});
          assert.equal(disk.session(a.token),null);assert.ok(disk.session(b.token));
        }finally{disk?.close();store.close();fs.rmSync(folder,{recursive:true,force:true});}
        """)

    def test_http_cookie_csrf_and_forged_actor_are_enforced(self):
        run_js(SETUP + r"""
        const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
        const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pa-team-test-'));
        const probe=http.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
        const base='http://127.0.0.1:'+port,{createTeamService}=require('./server/team-service.cjs');
        const app=createTeamService({origin:base,siteDir:process.cwd(),stateDir:folder,store});await new Promise(r=>app.listen(port,'127.0.0.1',r));
        const post=(route,p,cookie='',csrf='',origin=base)=>fetch(base+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-PA-Team':'1',Cookie:cookie,'X-PA-CSRF':csrf},body:JSON.stringify(p)});
        try{
          assert.equal((await fetch(base+'/team/claims')).status,401);
          assert.equal((await fetch(base+'/connections.html',{redirect:'manual'})).status,302);
          const invite=store.issueInvite('김연수');
          assert.equal((await post('/team/login',{name:'김연수',password,invite},'','','https://evil.test')).status,403);
          const r=await post('/team/login',{name:'김연수',password,invite});assert.equal(r.status,200);
          const setCookie=r.headers.get('set-cookie'),cookie=setCookie.split(';')[0],login=await r.json();assert.ok(setCookie.includes('HttpOnly'));assert.ok(setCookie.includes('SameSite=Lax'));assert.equal(login.token,undefined);
          assert.equal((await post('/team/mode',{mode:'web'},cookie)).status,403);
          assert.equal((await post('/team/mode',{mode:'web'},cookie,login.csrf)).status,200);
          assert.equal((await fetch(base+'/connections.html',{headers:{Cookie:cookie},redirect:'manual'})).status,200);
          assert.equal((await post('/team/claims',{action:'claim',questionId:'q1',actor:'이광훈'},cookie,login.csrf)).status,400);
          assert.equal((await post('/team/claims',{action:'complete',questionId:'q1'},cookie,login.csrf)).status,403);
          assert.equal((await post('/team/claims',{action:'claim',questionId:'q1'},cookie,login.csrf)).status,200);
          assert.equal((await post('/team/claims',{action:'complete',questionId:'q1'},cookie,login.csrf)).status,200);
          assert.equal((await post('/team/reviews',{actor:'이광훈',groups:[]},cookie,login.csrf)).status,403);
          await post('/team/logout',{},cookie,login.csrf);assert.equal((await fetch(base+'/team/claims',{headers:{Cookie:cookie}})).status,401);
        }finally{app.closeAllConnections();await new Promise(r=>app.close(r));store.close();fs.rmSync(folder,{recursive:true,force:true});}
        """)

if __name__=='__main__':
    unittest.main()
