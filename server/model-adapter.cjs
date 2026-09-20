// Server-only model adapter. Never ship API credentials or this adapter to Pages.
const contract=require('../model-contract.js');
const {create}=require('../connection-engine.js');
const crypto=require('node:crypto');
function requestBody(job,registry){
 if(job.schema!=='problem-atom/model-request/1'||job.registry_revision!==registry.revision)throw Error('요청 또는 자산 판본 오류');
 const canonical=contract.makeRequest(registry,job.seed_plan,job.brief,job.request_id);
 if(create(registry).run(canonical.seed_plan).status==='blocked')throw Error('금지 연결 또는 충돌한 조건을 먼저 수정해 주세요.');
 // Rebuild all policy/knowledge on the server; client-supplied instructions are not trusted.
 return {model:'gpt-5.6-sol',reasoning:{effort:'high'},store:false,max_output_tokens:16000,
  instructions:contract.INSTRUCTIONS,
  input:JSON.stringify({request_id:canonical.request_id,registry_revision:canonical.registry_revision,
   brief:canonical.brief,seed_plan:canonical.seed_plan,knowledge:canonical.knowledge}),
  text:{format:{type:'json_schema',name:'math_item',strict:true,schema:contract.RESULT_SCHEMA}}};
}
async function generate(job,registry,{apiKey=process.env.OPENAI_API_KEY,fetcher=fetch}={}){
 if(!apiKey)throw Error('서버의 OPENAI_API_KEY 설정이 필요합니다.');
 const body=requestBody(job,registry);
 const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',
  headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(300000)});
 if(!response.ok)throw Error(`Sol API 요청 실패 (${response.status})`);
 const payload=await response.json();
 if(payload.status!=='completed')throw Error('모델 출력이 완료되지 않았습니다. 자동 재호출하지 않습니다.');
 const contents=(payload.output||[]).flatMap(x=>x.content||[]);
 if(contents.some(x=>x.type==='refusal'))throw Error('모델이 이 요청의 출력을 거절했습니다.');
 const text=contents.filter(x=>x.type==='output_text').map(x=>x.text).join('');
 let result;try{result=JSON.parse(text);}catch(_){throw Error('모델 결과가 요청한 JSON 형식이 아닙니다.');}
 const validation=contract.validateResult(result,job,registry,create(registry));
 return {result,validation,model:payload.model,response_id:payload.id,usage:payload.usage||null,
  request_hash:crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')};
}
module.exports={requestBody,generate};
