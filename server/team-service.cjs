'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {createTeamStore}=require('./team-store.cjs');
const {createReviewStore}=require('./review-store.cjs'),Review=require('../review-model.js');
const ROOT=path.resolve(__dirname,'..');
function createTeamService({siteDir=path.join(ROOT,'_site'),stateDir=path.join(ROOT,'.pa-team'),origin,store,reviewStore}={}){
 const expected=new URL(origin);if(expected.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(expected.hostname))throw Error('공용 서버는 HTTPS 주소를 설정해야 합니다.');
 if(path.resolve(stateDir)===path.resolve(siteDir)||path.resolve(stateDir).startsWith(path.resolve(siteDir)+path.sep))throw Error('계정 저장 폴더는 공개 파일 폴더 밖에 두어야 합니다.');
 fs.mkdirSync(stateDir,{recursive:true});
 const data=JSON.parse(fs.readFileSync(path.join(siteDir,'dashboard-data.json'),'utf8'));
 const account=store||createTeamStore({file:path.join(stateDir,'team.sqlite'),questions:data.exams.flatMap(e=>e.sections.flatMap(s=>s.questions))});
 const registry=JSON.parse(fs.readFileSync(path.join(siteDir,'connection-registry.json'),'utf8'));
 const reviews=reviewStore||createReviewStore({registry,stateDir,catalog:JSON.parse(fs.readFileSync(path.join(siteDir,'review-catalog.json'),'utf8')),baseLedger:JSON.parse(fs.readFileSync(path.join(siteDir,'group-review-ledger.json'),'utf8'))});
 const secure=expected.protocol==='https:',cookieName=secure?'__Host-pa_team':'pa_team';
 const cookie=(value,clear=false)=>`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}; Max-Age=${clear?0:12*3600}`;
 async function body(req){let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>1000000){const e=Error('요청이 너무 큽니다.');e.status=413;throw e;}chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{const e=Error('요청 형식을 확인해 주세요.');e.status=400;throw e;}}
 const app=http.createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  const redirect=to=>{res.writeHead(302,{Location:to});res.end();};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
  if(req.headers.host!==expected.host)return send(403,{error:'서버 주소가 일치하지 않습니다.'});
  if(req.headers.origin&&req.headers.origin!==expected.origin)return send(403,{error:'다른 사이트의 요청은 허용하지 않습니다.'});
  let url;try{url=new URL(req.url,expected);}catch{return send(400,{error:'주소를 확인해 주세요.'});}
  const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
  try{
   const current=account.session(token),user=current?.user;
   if(url.pathname.startsWith('/team/')){
    const write=req.method==='POST';if(req.method!=='GET'&&!write)return send(405,{error:'지원하지 않는 요청입니다.'});
    if(write&&(req.headers.origin!==expected.origin||req.headers['x-pa-team']!=='1'))return send(403,{error:'홈 화면에서 다시 시도해 주세요.'});
    if(req.method==='GET'&&url.pathname==='/team/me')return send(200,current||{user:null,mode:null});
    if(req.method==='GET'&&url.pathname==='/team/members')return send(200,{members:account.members()});
    if(write&&url.pathname==='/team/login'){
     const logged=await account.authenticate(await body(req),req.socket.remoteAddress||'unknown');account.logout(token);res.setHeader('Set-Cookie',cookie(logged.token));return send(200,{user:logged.user,csrf:logged.csrf,mode:logged.mode});
    }
    if(!user)return send(401,{error:'로그인한 뒤 사용해 주세요.'});
    if(write&&req.headers['x-pa-csrf']!==current.csrf)return send(403,{error:'로그인 상태가 바뀌었습니다. 새로고침해 주세요.'});
    if(write&&url.pathname==='/team/logout'){account.logout(token);res.setHeader('Set-Cookie',cookie('',true));return send(200,{ok:true});}
    if(write&&url.pathname==='/team/mode')return send(200,account.mode(token,(await body(req)).mode));
    if(req.method==='GET'&&url.pathname==='/team/claims')return send(200,{claims:account.claims()});
    if(write&&url.pathname==='/team/claims'){const p=await body(req);if('owner_id'in p||'owner_name'in p||'actor'in p)return send(400,{error:'로그인한 계정으로만 기록할 수 있습니다.'});return send(200,{claims:account.updateClaim(user,p.questionId,p.action)});}
    if(req.method==='GET'&&url.pathname==='/team/reviews')return send(200,{...reviews.snapshot(),storage:'team'});
    if(write&&url.pathname==='/team/reviews'){const p=await body(req);if(p.actor!==user.name||p.groups?.some(r=>r.actor!==user.name))return send(403,{error:'로그인한 검토자 이름으로만 저장할 수 있습니다.'});return send(200,{...reviews.save(p),storage:'team'});}
    if(req.method==='GET'&&url.pathname==='/team/comments')return send(200,{comments:account.comments()});
    if(write&&url.pathname==='/team/comments'){const p=await body(req);return send(200,{comments:p.action==='delete'?account.deleteComment(user,p.commentId):account.comment(user,p)});}
    return send(404,{error:'지원하지 않는 경로입니다.'});
   }
   if(req.method!=='GET')return send(405,{error:'지원하지 않는 요청입니다.'});
   if(url.pathname==='/account-config.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.end('window.PA_TEAM_CONFIG={enabled:true};');}
   let relative;try{relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname).replace(/^\/+/, '');}catch{return send(400,{error:'주소를 확인해 주세요.'});}
   const file=path.resolve(siteDir,relative),root=path.resolve(siteDir)+path.sep;
   if(!file.startsWith(root)||relative.split(/[\\/]/).some(p=>p.startsWith('.'))||!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(fs.realpathSync(siteDir)+path.sep))return send(404,{error:'파일이 없습니다.'});
   if(relative.endsWith('.html')&&relative!=='index.html'&&(!user||!current.mode))return redirect('/index.html?next='+encodeURIComponent(relative+url.search));
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.hwpx':'application/zip'};
   res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch(e){send(e.status||400,{error:e.status?e.message:'처리하지 못했습니다. 내용을 확인하고 다시 시도해 주세요.'});}
 });
 app.on('close',()=>{if(!store)account.close();});return app;
}
if(require.main===module){const port=Number(process.env.PA_TEAM_PORT||8992),origin=process.env.PA_TEAM_ORIGIN||'http://127.0.0.1:'+port,bind=process.env.PA_TEAM_BIND||'127.0.0.1';if(!['127.0.0.1','localhost'].includes(bind)&&!origin.startsWith('https://'))throw Error('외부 접속 서버는 HTTPS 공개 주소를 설정해야 합니다.');const app=createTeamService({origin,stateDir:process.env.PA_TEAM_DATA||path.join(ROOT,'.pa-team')});app.listen(port,bind,()=>console.log('공용 계정 서버 준비: '+origin));}
module.exports={createTeamService};
