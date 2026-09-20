(function(root,factory){const api=factory(typeof module==='object'?require('./model-contract.js'):root.PAModelContract);if(typeof module==='object')module.exports=api;else root.PAWebHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 const providers={gemini:{name:'Gemini 웹',url:'https://gemini.google.com/'},chatgpt:{name:'ChatGPT 웹',url:'https://chatgpt.com/'},claude:{name:'Claude 웹',url:'https://claude.ai/'}};
 function prompt(request,provider='gemini'){
  if(!providers[provider]||request?.schema!=='problem-atom/model-request/1')throw Error('제작 요청을 먼저 준비하세요.');
  const ids=new Set(request.seed_plan.nodes.map(n=>n.id)),ops=request.knowledge.operations.filter(o=>ids.has(o.id));
  const types=new Set([...request.seed_plan.facts.map(f=>f.type),...ops.flatMap(o=>[...o.requires,...o.provides,...o.forbids].map(f=>f.type))]);
  const payload={schema:request.schema,request_id:request.request_id,registry_revision:request.registry_revision,brief:request.brief,design_intent:request.design_intent,seed_plan:request.seed_plan,
   knowledge:{operations:ops,types:Object.fromEntries(Object.entries(request.knowledge.types).filter(([k])=>types.has(k))),rules:request.knowledge.rules,language:request.knowledge.language,curriculum:request.knowledge.curriculum,authoring:request.knowledge.authoring},response_schema:C.RESULT_SCHEMA};
  return `고등학교 수학 문항 한 개를 제작해 주세요. 아래 데이터의 선택된 풀이 지도를 유지하세요. 사용 중인 AI로 답하고 다른 모델을 호출하지 마세요.\n${C.INSTRUCTIONS}\n이 웹 요청에는 선택한 재료만 담았습니다. 다른 원자가 꼭 필요하면 unresolved에 이유를 적고 임의 ID를 만들지 마세요.\n답변은 response_schema에 맞는 JSON 객체 하나만 출력하세요. JSON 문자열 속 LaTeX의 역슬래시는 반드시 두 번 쓰세요. 질문과 해설은 문단별 문자열 배열로 작성하세요. 그림 없이 이해할 수 있는 텍스트·수식 문항으로 작성하세요.\n\n${JSON.stringify(payload,null,2)}`;
 }
 function parse(text){
  if(typeof text!=='string'||text.length>2000000)throw Error('답변은 2MB 이하로 붙여 넣으세요.');
  let value=text.replace(/^\uFEFF/,'').trim();const fence=value.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);if(fence)value=fence[1];
  try{const data=JSON.parse(value);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch(_){throw Error('JSON 답변 부분만 붙여 넣으세요. 잘렸거나 수식의 역슬래시가 손상된 답변은 자동 수정하지 않습니다.');}
 }
 function canonicalRequest(value,registry){if(value?.schema!=='problem-atom/model-request/1'||value.registry_revision!==registry.revision)throw Error('요청의 자산 판본이 다릅니다. 현재 자료로 다시 제작하세요.');return C.makeRequest(registry,value.seed_plan,value.brief,value.request_id,value.design_intent);}
 function bundle(items){return {schema:'problem-atom/document-bundle/1',items:items.map(({request,result})=>({request,result}))};}
 return {providers,prompt,parse,canonicalRequest,bundle};
});
