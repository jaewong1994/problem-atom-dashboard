"""Cloud session transport and deployed Edge boundary regressions (network mocked)."""
import subprocess
import unittest
from pathlib import Path
from test_connections import NODE

ROOT=Path(__file__).resolve().parent
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

if __name__=='__main__':unittest.main()
