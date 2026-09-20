// A loopback-only companion for the public site. It never exposes Codex credentials.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../model-contract.js'),{create}=require('../connection-engine.js');
const {generateSession,loginStatus,MODEL}=require('./codex-session.cjs');
const ROOT=path.resolve(__dirname,'..');
function createSessionService({registry,siteDir=path.join(ROOT,'_site'),stateDir=path.join(ROOT,'.pa-session'),token=crypto.randomBytes(32).toString('hex'),generate=generateSession,auth=loginStatus,port=8987}={}){
 const jobs=new Map();let active=null;
 fs.mkdirSync(stateDir,{recursive:true});
 for(const name of fs.readdirSync(stateDir).filter(n=>/^REQ-[a-zA-Z0-9-]+\.json$/.test(n))){try{const j=JSON.parse(fs.readFileSync(path.join(stateDir,name),'utf8'));if(j.status==='running'){j.status='interrupted';j.message='연결 도우미가 종료되어 제작이 중단됐습니다.';}jobs.set(j.id,j);}catch(_){}}
 const persist=j=>fs.writeFileSync(path.join(stateDir,j.id+'.json'),JSON.stringify(j,null,2));
 const publicJob=j=>({id:j.id,status:j.status,message:j.message,createdAt:j.createdAt,updatedAt:j.updatedAt,request:j.request,...(j.output?{output:j.output}:{})});
 const app=http.createServer((req,res)=>{handle(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});if(!res.writableEnded)res.end(JSON.stringify({error:'연결 도우미에서 요청을 처리하지 못했습니다.'}));});});
 async function handle(req,res){
  const host=req.headers.host,origin=req.headers.origin,actualPort=app.address()?.port||port;
  if(!['127.0.0.1:'+actualPort,'localhost:'+actualPort].includes(host)){res.writeHead(403);return res.end();}
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  // No CORS credential bridge: the public page opens this same-origin companion UI.
  if(origin&&!['http://127.0.0.1:'+actualPort,'http://localhost:'+actualPort].includes(origin))return send(403,{error:'연결 도우미 화면에서 요청해 주세요.'});
  const url=new URL(req.url,'http://'+host);
  if(req.method==='GET'&&url.pathname==='/health')return send(200,{service:'problem-atom-codex-companion',revision:registry.revision,design_intent_version:1,reasoning_graph_version:1});
  if(url.pathname.startsWith('/session/')){
   const given=Buffer.from(req.headers['x-pa-session']||''),expected=Buffer.from(token);
   if(given.length!==expected.length||!crypto.timingSafeEqual(given,expected))return send(401,{error:'연결 도우미에서 화면을 다시 열어 주세요.'});
   if(req.method==='GET'&&url.pathname==='/session/status')return send(200,{...(await auth()),model:MODEL,revision:registry.revision,design_intent_version:1,reasoning_graph_version:1,activeJob:active});
   if(req.method==='GET'&&url.pathname==='/session/jobs')return send(200,{jobs:[...jobs.values()].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)).slice(0,30).map(j=>({id:j.id,status:j.status,createdAt:j.createdAt,updatedAt:j.updatedAt}))});
   const match=url.pathname.match(/^\/session\/jobs\/(REQ-[a-zA-Z0-9-]+)(\/cancel)?$/);
   if(match){const j=jobs.get(match[1]);if(!j)return send(404,{error:'제작 기록이 없습니다.'});if(req.method==='GET'&&!match[2])return send(200,publicJob(j));if(req.method==='POST'&&match[2]){j.controller?.abort();return send(200,{status:j.status});}return send(405,{error:'지원하지 않는 요청'});}
   if(req.method==='POST'&&url.pathname==='/session/jobs'){
    try{
     let bytes=0;const chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>1000000)return send(413,{error:'요청 크기가 너무 큽니다.'});chunks.push(chunk);}
     const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
     if(body.schema!=='problem-atom/model-request/1')return send(400,{error:'제작 요청 형식이 다릅니다.'});
     if(!/^REQ-[a-zA-Z0-9-]{1,90}$/.test(body.request_id))return send(400,{error:'제작 요청 번호 오류'});
     if(body.registry_revision!==registry.revision)return send(409,{error:'자산이 바뀌었습니다. 새로고침 후 요청해 주세요.'});
     const job=C.makeRequest(registry,body.seed_plan,body.brief,body.request_id,body.design_intent);
     if(create(registry).run(job.seed_plan).status==='blocked')return send(400,{error:'금지 연결을 먼저 수정해 주세요.'});
     const digest=crypto.createHash('sha256').update(JSON.stringify(job)).digest('hex'),old=jobs.get(job.request_id);
     if(old)return old.digest===digest?send(200,publicJob(old)):send(409,{error:'같은 요청 번호의 내용이 달라졌습니다.'});
     if(active)return send(409,{error:'현재 제작이 끝난 뒤 새 문항을 요청하세요.'});
     const login=await auth();if(!login.ready)return send(409,{error:login.reason});
     // Recheck after the asynchronous auth call to serialize concurrent submissions.
     if(active)return send(409,{error:'현재 제작 중입니다.'});
     const j={id:job.request_id,digest,status:'running',message:'제작을 시작했습니다.',createdAt:new Date().toISOString(),request:job};
     Object.defineProperty(j,'controller',{value:new AbortController(),enumerable:false});persist(j);jobs.set(j.id,j);active=j.id;send(202,publicJob(j));
     Promise.resolve().then(()=>generate(job,registry,{signal:j.controller.signal,onProgress:message=>{j.message=message;persist(j);}})).then(output=>{j.output=output;j.status='completed';j.message='문항이 도착했습니다. 풀이와 조건을 검토해 주세요.';}).catch(e=>{j.status=j.controller.signal.aborted?'cancelled':'failed';j.message=e.message;}).finally(()=>{j.updatedAt=new Date().toISOString();active=null;persist(j);});
    }catch(_){send(400,{error:'제작 요청 형식이 다릅니다.'});}return;
   }return send(404,{error:'지원하지 않는 경로'});
  }
  if(req.method!=='GET')return send(405,{error:'지원하지 않는 요청'});
  let relative;try{relative=decodeURIComponent(url.pathname==='/'?'/connections.html':url.pathname).replace(/^\/+/, '');}catch(_){return send(400,{error:'잘못된 파일 경로입니다.'});}
  const file=path.resolve(siteDir,relative);
  if(!file.startsWith(path.resolve(siteDir)+path.sep)||relative.includes('..')||!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,{error:'파일이 없습니다.'});
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.png':'image/png','.svg':'image/svg+xml'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(relative==='connections.html'){let html=fs.readFileSync(file,'utf8');html=html.replace('<!--SESSION_BOOTSTRAP-->',`<script id="sessionBootstrap" type="application/json">${JSON.stringify({token,model:MODEL})}</script>`);return res.end(html);}
  res.end(fs.readFileSync(file));
 }
 app.on('close',()=>{for(const j of jobs.values())j.controller?.abort();});return app;
}
if(require.main===module){const port=Number(process.env.PA_SESSION_PORT||8987);const registry=JSON.parse(fs.readFileSync(path.join(ROOT,'connection-registry.json'),'utf8'));const server=createSessionService({registry,port});server.listen(port,'127.0.0.1',()=>console.log('문항 제작 연결 도우미: http://127.0.0.1:'+port+'/connections.html'));}
module.exports={createSessionService};
