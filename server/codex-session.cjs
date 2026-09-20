// Uses the official Codex CLI's existing ChatGPT login. No token extraction or API key.
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const C=require('../model-contract.js'),{create}=require('../connection-engine.js');
const MODEL='gpt-5.6-sol';
function environment(){const env={...process.env};delete env.OPENAI_API_KEY;delete env.CODEX_API_KEY;return env;}
function command(){return process.env.PA_CODEX_BIN||'codex';}
async function loginStatus({spawnImpl=spawn}={}){
 return new Promise(resolve=>{let text='',done=false;const child=spawnImpl(command(),['login','status'],{windowsHide:true,env:environment(),stdio:['ignore','pipe','pipe']});
  const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
  const timer=setTimeout(()=>{child.kill();finish({ready:false,reason:'Codex 로그인 확인 시간이 초과됐습니다.'});},10000);
  child.stdout.on('data',d=>text+=d);child.stderr.on('data',d=>text+=d);
  child.on('error',()=>finish({ready:false,reason:'Codex를 찾지 못했습니다. Codex 설치와 로그인을 확인하세요.'}));
  child.on('close',code=>finish({ready:code===0&&/Logged in using ChatGPT/i.test(text),reason:code===0&&/Logged in using ChatGPT/i.test(text)?'ChatGPT 로그인 연결됨':'Codex에서 ChatGPT 계정으로 로그인하세요. API 키 로그인은 사용하지 않습니다.'}));
 });
}
function makeArgs(folder){return ['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--disable','shell_tool','--disable','unified_exec','--disable','multi_agent','-c','web_search="disabled"','-c','model_reasoning_effort="high"','-c','project_doc_max_bytes=0','--model',MODEL,'--color','never','--json','--output-schema',path.join(folder,'schema.json'),'--output-last-message',path.join(folder,'result.json'),'-'];}
async function generateSession(job,registry,{signal,onProgress=()=>{},spawnImpl=spawn,checkLogin=loginStatus}={}){
 if(job.schema!=='problem-atom/model-request/1'||job.registry_revision!==registry.revision)throw Error('자산 판본이 다릅니다. 화면을 새로고침하세요.');
 const canonical=C.makeRequest(registry,job.seed_plan,job.brief,job.request_id);
 if(create(registry).run(canonical.seed_plan).status==='blocked')throw Error('충돌한 조건을 먼저 수정해 주세요.');
 const auth=await checkLogin();if(!auth.ready)throw Error(auth.reason);
 if(signal?.aborted)throw Error('제작을 취소했습니다.');
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'pa-codex-compose-'));
 try{
  await fs.writeFile(path.join(folder,'schema.json'),JSON.stringify(canonical.response_schema));
  onProgress('Codex Sol이 풀이 경로와 문항을 만들고 있습니다.');
  await new Promise((resolve,reject)=>{
   let done=false,stopped=null;const child=spawnImpl(command(),makeArgs(folder),{cwd:folder,windowsHide:true,env:environment(),stdio:['pipe','pipe','pipe']});
   const settle=(error)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
   const stop=message=>{stopped=Error(message);child.kill();};
   const abort=()=>stop('제작을 취소했습니다.');
   const timer=setTimeout(()=>stop('제작 시간이 10분을 넘었습니다. 자동 재시도하지 않았습니다.'),600000);
   signal?.addEventListener('abort',abort,{once:true});
   child.on('error',()=>settle(Error('Codex 실행에 실패했습니다. 설치와 로그인 상태를 확인하세요.')));
   // Drain process output without exposing auth details, prompts, or internal reasoning to the site.
   child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
   child.stdin.on('error',()=>{});
   child.on('close',code=>settle(stopped||(code===0?null:Error('Codex 제작이 완료되지 않았습니다. 로그인·사용 한도를 확인하세요. 자동 재시도하지 않았습니다.'))));
   child.stdin.end(C.INSTRUCTIONS+'\n문항 제작만 수행한다. 도구 실행, 파일 탐색, 다른 에이전트 호출은 하지 않는다. 제공된 정보만으로 수학적으로 풀고 최종 결과 JSON을 반환한다.\n'+JSON.stringify({request_id:canonical.request_id,registry_revision:canonical.registry_revision,brief:canonical.brief,seed_plan:canonical.seed_plan,knowledge:canonical.knowledge}));
   if(signal?.aborted)abort();
  });
  const result=JSON.parse(await fs.readFile(path.join(folder,'result.json'),'utf8'));
  const validation=C.validateResult(result,canonical,registry,create(registry));
  return {result,validation,model:MODEL,provider:'codex-chatgpt-session',mathematical_verification:'pending_independent_review'};
 }finally{
  const resolved=path.resolve(folder),parent=path.resolve(os.tmpdir());
  if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('pa-codex-compose-'))throw Error('임시 폴더 경로 오류');
  await fs.rm(resolved,{recursive:true,force:true});
 }
}
module.exports={generateSession,loginStatus,makeArgs,environment,MODEL};
