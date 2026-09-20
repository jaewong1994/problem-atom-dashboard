// Uses the local editable-math authoring kit. No model call and no credential access.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
const C=require('../model-contract.js'),{create}=require('../connection-engine.js');
function python(){const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');return process.env.PA_PYTHON||(fs.existsSync(bundled)?bundled:'python');}
function skills(){return process.env.PA_MATH_SKILLS||path.join(os.homedir(),'.codex/skills');}
function status(){const ready=['math-ocr-hwpx/scripts/equation_bridge.py','math-ocr-hwpx/assets/hwpx_template/first_para_prefix.xml','korean-hwp-math-typesetting/scripts/normalize_math.py'].every(p=>fs.existsSync(path.join(skills(),p)));return {ready,format:'hwpx',reason:ready?'수식·해설 미주를 포함한 HWPX 출력 가능':'이 PC에 한글 수식 작성기가 필요합니다. PA_MATH_SKILLS 경로를 설정하세요.'};}
function validateBundle(body,registry){
 if(body?.schema!=='problem-atom/document-bundle/1'||!Array.isArray(body.items)||body.items.length<1||body.items.length>20)throw Error('한 번에 1~20문항을 출력할 수 있습니다.');
 const seen=new Set(),engine=create(registry);
 return body.items.map((item,index)=>{
  const r=item?.request;if(r?.schema!=='problem-atom/model-request/1'||r.registry_revision!==registry.revision)throw Error((index+1)+'번 문항의 요청 판본이 다릅니다.');
  const request=C.makeRequest(registry,r.seed_plan,r.brief,r.request_id,r.design_intent),result=item.result;
  const check=C.validateResult(result,request,registry,engine);if(!check.accepted)throw Error((index+1)+'번 문항은 연결 검사를 통과하지 못했습니다. '+check.errors[0]);
  if(seen.has(request.request_id))throw Error('같은 요청의 문항이 중복됐습니다.');seen.add(request.request_id);
  return {question:result.question,answer:result.answer,solution:result.solution};
 });
}
async function exportHwpx(body,registry,{spawnImpl=spawn,skipAvailability=false}={}){
 const items=validateBundle(body,registry);if(!skipAvailability&&!status().ready)throw Error(status().reason);
 const folder=await fsp.mkdtemp(path.join(os.tmpdir(),'pa-hwpx-'));
 try{
  const input=path.join(folder,'input.json'),output=path.join(folder,'문항.hwpx');await fsp.writeFile(input,JSON.stringify({items}));
  await new Promise((resolve,reject)=>{
   let error='',settled=false;const child=spawnImpl(python(),['-X','utf8',path.join(__dirname,'export_hwpx.py'),input,output,'--skills',skills()],{cwd:folder,windowsHide:true,stdio:['ignore','ignore','pipe']});
   const done=err=>{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolve();};
   const timer=setTimeout(()=>{child.kill();done(Error('한글 출력 시간이 초과됐습니다.'));},60000);
   child.stderr.on('data',d=>{if(error.length<2000)error+=d.toString();});
   child.on('error',()=>done(Error('한글 작성기를 실행하지 못했습니다. Python 설치를 확인하세요.')));
   child.on('close',code=>done(code===0?null:Error(error.startsWith('EXPORT: ')?error.slice(8).trim():'한글 수식 변환에 실패했습니다. 문항의 수식 표기를 확인하세요.')));
  });
  const buffer=await fsp.readFile(output);if(buffer.length<500||buffer.length>20000000||buffer.readUInt32LE(0)!==0x04034b50)throw Error('한글 파일 검사가 실패했습니다.');return buffer;
 }finally{if(path.dirname(path.resolve(folder))===path.resolve(os.tmpdir())&&path.basename(folder).startsWith('pa-hwpx-'))await fsp.rm(folder,{recursive:true,force:true});}
}
module.exports={status,validateBundle,exportHwpx};
