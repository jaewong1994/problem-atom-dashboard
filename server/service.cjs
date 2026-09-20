// Deployable API service. Secrets belong to the server environment, never to GitHub Pages.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {generate}=require('./model-adapter.cjs');
function createService({apiKey,serviceToken,allowedOrigin,registry,generateItem=generate}){
 if(!apiKey||!serviceToken||!allowedOrigin)throw Error('서버 API 키·서비스 접근 토큰·허용 사이트 주소가 필요합니다.');
 let busy=false;
 return http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin&&origin!==allowedOrigin){res.writeHead(403);return res.end();}
  if(origin)res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
  res.setHeader('Vary','Origin');res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST');res.writeHead(204);return res.end();}
  const supplied=Buffer.from(req.headers.authorization||''),wanted=Buffer.from('Bearer '+serviceToken);
  if(supplied.length!==wanted.length||!crypto.timingSafeEqual(supplied,wanted)){res.writeHead(401);return res.end();}
  const send=(status,payload)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(payload));};
  if(req.method!=='POST'||req.url!=='/v1/compose')return send(404,{error:'지원하지 않는 경로'});
  if(busy)return send(429,{error:'현재 제작 중입니다. 중복 호출은 보내지 않았습니다.'});
  busy=true;
  try{
   const parts=[];let bytes=0;
   for await(const chunk of req){bytes+=chunk.length;if(bytes>1024*1024)throw Error('요청 크기 초과');parts.push(chunk);}
   const job=JSON.parse(Buffer.concat(parts).toString('utf8'));
   const result=await generateItem(job,registry,{apiKey});send(200,result);
  }catch(e){send(400,{error:e.message});}finally{busy=false;}
 });
}
if(require.main===module){
 try{
  const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'../connection-registry.json'),'utf8'));
  const app=createService({apiKey:process.env.OPENAI_API_KEY,serviceToken:process.env.PA_SERVICE_TOKEN,allowedOrigin:process.env.PA_ALLOWED_ORIGIN,registry});
  app.listen(Number(process.env.PORT||8788),process.env.HOST||'127.0.0.1',()=>console.log('Sol 제작 API 서비스 준비 완료'));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={createService};
