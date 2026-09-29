"""Cloud session transport and deployed Edge boundary regressions (network mocked)."""
import subprocess
import unittest
from pathlib import Path
from test_connections import NODE

ROOT=Path(__file__).resolve().parent
SESSION_FIXTURE = r"""
const assert=require('node:assert/strict'),M=require('./account-supabase.js');
const key='pa-teacher-session-v1',config={url:'https://test.invalid',publishableKey:'test-public'};
function store(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
const user={id:'fixture-teacher',name:'Fixture',role:'member'};
function saved(expires_at=3600){return {session:{access_token:'fixture-access',refresh_token:'fixture-refresh',expires_at},mode:'web',userId:user.id};}
const me=async(url,o)=>Response.json({user:o.headers.Authorization?user:null});
"""

class SupabaseAccountTests(unittest.TestCase):
    def run_js(self,source):
        p=subprocess.run([NODE,'-e',source],cwd=ROOT,text=True,encoding='utf-8',capture_output=True)
        self.assertEqual(p.returncode,0,p.stdout+p.stderr)

    def test_login_mode_reload_refresh_and_revocation(self):
        self.run_js(r"""
const assert=require('node:assert/strict'),M=require('./account-supabase.js');
(async()=>{
 let t=1000000,refreshes=0,revoked=false,calls=[];const storage={value:null,getItem(){return this.value},setItem(_,v){this.value=v},removeItem(){this.value=null}};
 const config={url:'https://test.invalid',publishableKey:'public'};
 const fetcher=async(url,o)=>{const b=JSON.parse(o.body);calls.push({url,headers:o.headers,b});
  if(url.includes('refresh_token')){refreshes++;return Response.json({access_token:'new',refresh_token:'r2',expires_in:3600});}
  if(b.route==='login')return Response.json({user:{id:'a',name:'Teacher',role:'admin'},session:{access_token:'old',refresh_token:'r1',expires_at:t/1000+3600}});
  if(revoked)return Response.json({error:'deleted'},{status:401});
  if(b.route==='logout')return Response.json({ok:true});
  return Response.json({user:{id:'a',name:'Teacher',role:'admin'},mode:b.payload?.mode});
 };
 let c=M.create(config,{fetcher,storage,now:()=>t});assert.equal((await c.call('login',{name:'Teacher',password:'secret'})).mode,null);assert.equal(calls[0].headers.Authorization,undefined);
 assert.ok(!storage.value.includes('secret'));assert.equal((await c.call('mode',{mode:'web'})).mode,'web');
 c=M.create(config,{fetcher,storage,now:()=>t});assert.equal((await c.call('me')).mode,'web');
 t+=3600000;await Promise.all([c.call('me'),c.call('claims')]);assert.equal(refreshes,1);assert.equal(calls.at(-1).headers.Authorization,'Bearer new');
 assert.equal((await c.call('login',{name:'Teacher',password:'secret'})).mode,null);
 revoked=true;await assert.rejects(c.call('claims'),/deleted/);assert.equal(storage.value,null);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_browser_restart_defaults_to_persistent_storage_without_password(self):
        self.run_js(SESSION_FIXTURE + r"""
(async()=>{
 globalThis.localStorage=store();globalThis.sessionStorage=store();
 let logins=0;const fetcher=async(url,o)=>{const b=JSON.parse(o.body);
  if(b.route==='login'){logins++;return Response.json({user,session:saved().session});}
  if(b.route==='mode')return Response.json({user,mode:b.payload.mode});return me(url,o);
 };
 let c=M.create(config,{fetcher,now:()=>0});
 await c.call('login',{name:'Fixture',password:'synthetic-password'});await c.call('mode',{mode:'web'});
 assert.ok(!localStorage.getItem(key).includes('synthetic-password'));assert.equal(sessionStorage.getItem(key),null);
 globalThis.sessionStorage=store(); // Closing a browser destroys tab storage, but keeps local storage.
 c=M.create(config,{fetcher,now:()=>0});const resumed=await c.call('me');
 assert.equal(resumed.user.id,user.id);assert.equal(resumed.mode,'web');assert.equal(logins,1);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_legacy_migration_cannot_revive_session_after_logout(self):
        self.run_js(SESSION_FIXTURE + r"""
(async()=>{
 const persistent=store(),tabA=store(),staleTab=store();
 M.create(config,{storage:persistent,legacyStorage:store(),fetcher:me,now:()=>0});
 assert.equal(persistent.getItem(key+':migrated'),null); // An empty new tab must not block a still-logged-in old tab.
 for(const tab of [tabA,staleTab])tab.setItem(key,JSON.stringify(saved()));
 const a=M.create(config,{storage:persistent,legacyStorage:tabA,fetcher:me,now:()=>0});
 assert.equal((await a.call('me')).mode,'web');assert.equal(tabA.getItem(key),null);
 a.clear();assert.equal(persistent.getItem(key),null);
 const b=M.create(config,{storage:persistent,legacyStorage:staleTab,fetcher:me,now:()=>0});
 assert.equal((await b.call('me')).user,null);assert.equal(staleTab.getItem(key),null);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_temporary_refresh_failures_keep_login_but_revocation_clears_it(self):
        self.run_js(SESSION_FIXTURE + r"""
(async()=>{
 const persistent=store();persistent.setItem(key,JSON.stringify(saved(0)));let failure=503;
 const fetcher=async(url,o)=>{if(!url.includes('refresh_token'))return me(url,o);
  if(failure==='network')throw new TypeError('offline');
  if(failure)return Response.json({error:'fixture error'},{status:failure});
  return Response.json({access_token:'renewed',refresh_token:'renewed-refresh',expires_in:3600});
 };
 const c=M.create(config,{storage:persistent,fetcher,now:()=>1000});
 for(const f of [503,429,'network']){failure=f;await assert.rejects(c.call('me'));assert.ok(persistent.getItem(key));}
 failure=0;assert.equal((await c.call('me')).mode,'web');
 persistent.setItem(key,JSON.stringify(saved(0)));failure=400;
 assert.equal((await c.call('me')).user,null);assert.equal(persistent.getItem(key),null);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_two_tabs_refresh_once_and_use_the_latest_saved_session(self):
        self.run_js(SESSION_FIXTURE + r"""
(async()=>{
 const persistent=store();persistent.setItem(key,JSON.stringify(saved(0)));let refreshes=0,queue=Promise.resolve();
 const locks={request:(_key,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}};
 const fetcher=async(url,o)=>{if(url.includes('refresh_token')){refreshes++;return Response.json({access_token:'renewed',refresh_token:'renewed-refresh',expires_in:3600});}assert.equal(o.headers.Authorization,'Bearer renewed');return me(url,o);};
 const a=M.create(config,{storage:persistent,fetcher,locks,now:()=>1000});
 const b=M.create(config,{storage:persistent,fetcher,locks,now:()=>1000});
 await Promise.all([a.call('me'),b.call('me')]);assert.equal(refreshes,1);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_logout_during_refresh_cannot_restore_credentials(self):
        self.run_js(SESSION_FIXTURE + r"""
(async()=>{
 const persistent=store();persistent.setItem(key,JSON.stringify(saved(0)));let release,started;
 const ready=new Promise(r=>started=r);
 const fetcher=async(url,o)=>{if(url.includes('refresh_token')){started();return new Promise(r=>release=()=>r(Response.json({access_token:'too-late',refresh_token:'too-late',expires_in:3600})));}return me(url,o);};
 const a=M.create(config,{storage:persistent,fetcher,now:()=>1000});
 const pending=a.call('me');await ready;
 const b=M.create(config,{storage:persistent,fetcher,now:()=>1000});await b.call('logout');release();
 assert.equal((await pending).user,null);assert.equal(persistent.getItem(key),null);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_logout_clears_device_even_when_network_fails(self):
        self.run_js(SESSION_FIXTURE + r"""
(async()=>{
 const persistent=store();persistent.setItem(key,JSON.stringify(saved()));
 const c=M.create(config,{storage:persistent,fetcher:async()=>{throw new TypeError('offline');},now:()=>0});
 await assert.rejects(c.call('logout'));assert.equal(persistent.getItem(key),null);
 const reopened=M.create(config,{storage:persistent,fetcher:me,now:()=>0});assert.equal((await reopened.call('me')).user,null);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_edge_denies_spoofed_identity_and_unapproved_origins(self):
        self.run_js(r"""
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{stripTypeScriptTypes}=require('node:module');
(async()=>{
 let handle,actions=[],role='member',valid=true;const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/pa-team/index.ts','utf8').replace("import './review-model.js';",'').replace('export async function','async function'));
 const context={Deno:{env:{get:n=>n==='SUPABASE_URL'?'https://test.invalid':'private'},serve:f=>handle=f},crypto,TextEncoder,Request,Response,Date,JSON,Error,Array,Object,console,
 fetch:async(url,o)=>{if(url.endsWith('/auth/v1/user'))return Response.json(valid?{id:'real-auth-id'}:{error:'bad'},{status:valid?200:401});
  const b=JSON.parse(o.body);actions.push(b);if(b.p_action==='me')return Response.json({user:{id:'real-account',name:'Real Teacher',role}});
  if(b.p_action==='admin-list')return Response.json({members:[]});return Response.json({claims:[]});}};
 vm.runInNewContext(source,context);
 const req=(route,payload,token='token',origin='https://jaewong1994.github.io')=>new Request('https://test.invalid/functions/v1/pa-team',{method:'POST',headers:{origin,...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify({route,payload})});
 assert.equal((await handle(req('admin',{action:'list',actor:'admin',role:'admin'}))).status,403);
 assert.ok(!actions.some(a=>a.p_action==='admin-list'));
 assert.equal((await handle(req('claims',null,null))).status,401);
 assert.equal((await handle(req('claims',null,'token','https://evil.invalid'))).status,403);
 valid=false;assert.equal((await handle(req('claims'))).status,401);valid=true;
 role='admin';assert.equal((await handle(req('admin',{action:'list'}))).status,200);assert.equal(actions.at(-1).p_actor,'real-auth-id');
 assert.equal((await handle(req('setup-finish',{id:'forged'}))).status,404);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_edge_requires_invite_before_creating_auth_user(self):
        self.run_js(r"""
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{stripTypeScriptTypes}=require('node:module');
(async()=>{let handle,created=0;const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/pa-team/index.ts','utf8').replace("import './review-model.js';",'').replace('export async function','async function'));
vm.runInNewContext(source,{Deno:{env:{get:()=>''},serve:f=>handle=f},crypto,TextEncoder,Response,Date,JSON,Error,Array,Object,fetch:async(url,o)=>{if(url.includes('/admin/users')){created++;return Response.json({id:'auth-id'});}const b=JSON.parse(o.body);if(b.p_action==='members')return Response.json({members:[{id:'one',name:'Teacher',needsSetup:true}]});if(b.p_action==='setup-lock')return Response.json({error:'invalid invite',status:401});return Response.json({ok:true});}});
const response=await handle(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({route:'login',payload:{name:'Teacher',password:'long-enough-password',invite:'wrong-code'}})}));assert.equal(response.status,401);assert.equal(created,0);
})().catch(e=>{console.error(e);process.exit(1)});
""")

    def test_six_character_setup_and_code_cannot_reset_active_password(self):
        self.run_js(r"""
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{stripTypeScriptTypes}=require('node:module');
(async()=>{let handle,pending=true,created=0,savedPassword,issuedHash;
const digest=async s=>Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))).toString('hex'),expected=await digest('000000');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/pa-team/index.ts','utf8').replace("import './review-model.js';",'').replace('export async function','async function'));
vm.runInNewContext(source,{Deno:{env:{get:()=>''},serve:f=>handle=f},crypto,TextEncoder,Response,Date,JSON,Error,Array,Object,fetch:async(url,o)=>{
 const b=o.body?JSON.parse(o.body):{};
 if(url.includes('/admin/users')){created++;savedPassword=b.password;return Response.json({id:'auth-id'});}
 if(url.includes('/token?'))return b.password===savedPassword?Response.json({user:{id:'auth-id'},access_token:'test-only',refresh_token:'test-only',expires_in:3600}):Response.json({error:'invalid'},{status:400});
 if(url.endsWith('/auth/v1/user'))return Response.json({id:'auth-id'});
 if(b.p_action==='members')return Response.json({members:[{id:'one',name:'Teacher',needsSetup:pending}]});
 if(b.p_action==='setup-lock')return pending&&b.p_body.hash===expected?Response.json({id:'one',auth_id:null}):Response.json({error:'invalid invite',status:401});
 if(b.p_action==='setup-finish'){pending=false;return Response.json({ok:true});}
 if(b.p_action==='me')return Response.json({user:{id:'one',name:'Teacher',role:'admin'}});
 if(b.p_action==='admin-create'){issuedHash=b.p_body.hash;return Response.json({members:[]});}
 return Response.json({ok:true});
}});
const login=(password,invite='000000')=>handle(new Request('https://test.invalid',{method:'POST',body:JSON.stringify({route:'login',payload:{name:'Teacher',password,invite}})}));
assert.equal((await login('abcde')).status,400);assert.equal(created,0);
assert.equal((await login('abcdef','wrong')).status,401);assert.equal(created,0);
assert.equal((await login('abcdef',' 000000\n')).status,200);assert.equal(created,1);assert.equal(pending,false);
assert.equal((await login('ghijkl')).status,401);assert.equal(created,1);assert.equal(savedPassword,'abcdef');
assert.equal((await login('abcdef','')).status,200);assert.equal(created,1);
const admin=await handle(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer test-only'},body:JSON.stringify({route:'admin',payload:{action:'create',name:'New teacher'}})}));
const result=await admin.json();assert.equal(admin.status,200);assert.equal(result.invite,'000000');assert.equal(result.expiresInDays,null);assert.equal(issuedHash,expected);
})().catch(e=>{console.error(e);process.exit(1)});
""")

if __name__=='__main__':unittest.main()
