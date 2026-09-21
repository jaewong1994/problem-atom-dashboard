// Deployed with gateway JWT verification off. Every protected route verifies the JWT with Auth
// and then rechecks the active teacher account in the service-only database function.
import './review-model.js';
const URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUBLIC = Deno.env.get('SUPABASE_ANON_KEY')!;
const hash = async (value:string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');
// Shared initial setup code requested by the team; only pending accounts accept it.
const code = () => '000000';
function fail(status:number,message:string):never {throw Object.assign(new Error(message),{status});}
async function request(path:string,body?:unknown,{key=SERVICE,token=key,method=body?'POST':'GET'}={}) {
 const response=await fetch(URL+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=response.status===204?{}:await response.json();return {response,data};
}
async function rpc(action:string,body:unknown={},actor:string|null=null){
 const {response,data}=await request('/rest/v1/rpc/pa_team_rpc',{p_actor:actor,p_action:action,p_body:body});
 if(!response.ok)fail(500,'공유 저장소에서 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
 if(data.error)fail(data.status||400,data.error);return data;
}
export async function handle(req:Request):Promise<Response>{
 const origin=req.headers.get('origin')||'';
 const allowed=!origin||origin==='https://jaewong1994.github.io'||/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(allowed&&origin?{'Access-Control-Allow-Origin':origin}:{}),'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const send=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
 if(!allowed)return send(403,{error:'허용되지 않은 사이트입니다.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return send(405,{error:'지원하지 않는 요청입니다.'});
 try{
  const raw=await req.text();if(raw.length>1000000)fail(413,'요청이 너무 큽니다.');
  const {route,payload}=JSON.parse(raw),body=payload||{};
  if(route==='members')return send(200,await rpc('members'));
  if(route==='login'){
   if(typeof body.name!=='string'||body.name.length>20||typeof body.password!=='string'||body.password.length>256)fail(400,'이름과 비밀번호를 확인해 주세요.');
   // Auth applies its own IP limits; this durable per-account guard also covers setup attempts.
   await rpc('rate',{key:await hash('login:'+body.name)});
   const members=await rpc('members'),member=members.members.find((m:{name:string})=>m.name===body.name);
   if(!member)fail(401,'이름 또는 비밀번호를 확인해 주세요.');
   const email=member.id+'@problem-atom.invalid';
   if(member.needsSetup){
    if(typeof body.invite!=='string'||body.invite.length>128||body.password.length<6)fail(400,'초대 코드 000000과 6자 이상의 새 비밀번호를 입력해 주세요.');
    const digest=await hash(body.invite.trim()),lock=await rpc('setup-lock',{name:body.name,hash:digest});
    const created=lock.auth_id?await request('/auth/v1/admin/users/'+lock.auth_id,{password:body.password},{method:'PUT'}):await request('/auth/v1/admin/users',{email,password:body.password,email_confirm:true});
    if(!created.response.ok)fail(400,'비밀번호를 설정하지 못했습니다. 2분 후 다시 시도하거나 관리자에게 알려 주세요.');
    await rpc('setup-finish',{id:member.id,hash:digest,authId:created.data.id});
   }
   const auth=await request('/auth/v1/token?grant_type=password',{email,password:body.password},{key:PUBLIC});
   if(!auth.response.ok)fail(401,'이름 또는 비밀번호를 확인해 주세요.');
   const me=await rpc('me',{},auth.data.user.id);
   return send(200,{...me,session:{access_token:auth.data.access_token,refresh_token:auth.data.refresh_token,expires_at:Math.floor(Date.now()/1000)+auth.data.expires_in},mode:null});
  }
  const bearer=req.headers.get('authorization')?.replace(/^Bearer /i,'');
  if(!bearer){if(route==='me')return send(200,{user:null,mode:null});fail(401,'로그인한 뒤 사용해 주세요.');}
  const auth=await request('/auth/v1/user',undefined,{token:bearer,key:PUBLIC});
  if(!auth.response.ok)fail(401,'로그인이 만료됐습니다. 다시 로그인해 주세요.');
  const me=await rpc('me',{},auth.data.id);
  if(route==='me')return send(200,me);
  if(route==='logout'){await request('/auth/v1/logout',{}, {token:bearer,key:PUBLIC});return send(200,{ok:true});}
  if(route==='mode'){if(!['codex','web'].includes(body.mode))fail(400,'제작 방식을 골라 주세요.');return send(200,{...me,mode:body.mode});}
  if(route==='admin'){
   if(me.user.role!=='admin')fail(403,'관리자만 계정을 관리할 수 있습니다.');
   if(!['list','create','delete','restore','invite'].includes(body.action))fail(400,'지원하지 않는 계정 관리 요청입니다.');
   const invite=['create','invite'].includes(body.action)?code():null;
   const result=await rpc('admin-'+body.action,{...body,...(invite?{hash:await hash(invite)}:{})},auth.data.id);
   return send(200,{...result,...(invite?{invite,expiresInDays:null}:{})});
  }
  if(['claims','comments','reviews'].includes(route)){
   if(route==='reviews'&&payload){const snapshot=await rpc('reviews',{},auth.data.id);body.groups=(globalThis as any).PAReviewModel.validate(body,snapshot.catalog);}
   return send(200,await rpc(route+(payload?'-write':''),body,auth.data.id));
  }
  return send(404,{error:'지원하지 않는 요청입니다.'});
 }catch(error){return send(error.status||400,{error:error.status?error.message:'요청 내용을 확인하고 다시 시도해 주세요.'});}
}
Deno.serve(handle);
