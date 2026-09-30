(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PADesignControls=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const option=(value,label,example)=>({value,label,example});
 const control=(id,label,description,options)=>({id,label,description,options:[option('auto','AI에게 맡기기','선택한 재료에 맞는 방식을 찾습니다.'),...options]});
 const controls=[
  control('disclosure','단서를 주는 방식','같은 정보를 바로 주거나, 다른 조건에서 알아내게 할 수 있어요.',[
   option('direct','바로 알려 주기','접하는 위치나 같은 함숫값을 조건에 직접 줍니다.'),
   option('one_step','한 번 바꿔 읽기','정적분과 넓이가 같다는 조건에서 구간의 부호를 알아냅니다.'),
   option('linked','여러 조건을 연결해 발견','극값 개수와 정수 조건을 연결해야 함수 후보가 나옵니다.')]),
  control('candidates','후보를 남기는 방식','풀이 중간에 남는 함수·상수 후보의 역할을 정합니다.',[
   option('single','바로 하나로 좁히기','후보를 여러 개 비교하는 과정을 요구하지 않습니다.'),
   option('filter','여러 후보 중 마지막에 고르기','서로 다른 답을 만드는 후보가 남고, 마지막 조건이 하나를 가릅니다.'),
   option('keep_many','여러 후보를 끝까지 남기기','함수는 여러 개여도 값의 합·범위 또는 공통값을 묻습니다.')]),
  control('branching','경우를 나누는 정도','조건에서 나눠야 하는 경우를 조절합니다. 풀이 문단 수가 아닙니다.',[
   option('none','경우 나누기 없이','하나의 풀이 흐름으로 답을 얻습니다.'),
   option('one','한 번 나누기','상수의 부호나 근의 위치로 한 번 나눕니다.'),
   option('nested','나눈 경우에서 다시 나누기','먼저 근의 배치를 나누고, 남은 경우에서 경계를 비교합니다.')]),
  control('boundary','경계값의 역할','등호가 되는 순간이나 열린 구간의 끝을 어떻게 쓸지 정합니다.',[
   option('avoid','경계 비교를 핵심으로 쓰지 않기','끝점은 확인하되 정답을 가르는 장치로 삼지 않습니다.'),
   option('check','끝값 포함 여부 확인','구한 값이 적용 구간 안에 실제로 들어가는지 확인합니다.'),
   option('decisive','경계에서 결과가 달라지기','두 근이 겹치거나 끝점을 포함할 때 후보 개수가 달라집니다.')]),
  control('representation','풀이를 바꾸어 보는 방식','식·그래프·넓이 사이에서 실제로 정보를 옮겨 쓰게 합니다.',[
   option('same','한 가지 방식으로','식으로 세운 관계를 식으로 마무리합니다.'),
   option('switch','식에서 그래프·넓이로','방정식을 교점의 개수 문제로 바꿉니다.'),
   option('return','바꿔 읽고 식으로 돌아오기','그래프에서 후보를 찾은 뒤 원래 식으로 검산합니다.')]),
  control('coupling','알아낸 사실을 쓰는 방식','앞에서 알아낸 정보가 다음 풀이에 얼마나 연결되는지 정합니다.',[
   option('chain','다음 단계에 이어 쓰기','구한 근의 위치로 적분 구간을 나눕니다.'),
   option('reuse','하나의 발견을 두 곳에 쓰기','같은 근의 위치로 연속 조건과 넓이 조건을 함께 해결합니다.')]),
  control('target','마지막에 물을 것','함수 자체를 하나로 정해야 하는지와 질문의 답이 하나인지는 다릅니다.',[
   option('value','하나로 정한 함수의 값','조건으로 함수를 정한 뒤 f(5)를 구합니다.'),
   option('aggregate','가능한 값들의 합·개수','함수 후보를 모두 남기고 서로 다른 답의 합이나 개수를 구합니다.'),
   option('invariant','함수가 달라도 같은 값','함수가 하나로 정해지지 않아도 적분값은 같음을 이용합니다.'),
   option('range','가능한 값의 범위','조건을 만족하는 상수의 범위와 끝값 포함 여부를 묻습니다.')]),
  control('numbers','수의 형태','큰 수를 쓰는 것과 높은 추론 난도는 다릅니다.',[
   option('integer','정수 중심','조건과 주요 중간값을 작은 정수 중심으로 구성합니다.'),
   option('rational','분수도 사용','함수의 계수·후보에 분수가 들어갈 수 있습니다.'),
   option('radical','근호도 사용','무리수 후보를 정수 조건으로 걸러내는 설계 등이 가능합니다.')]),
  control('answer_form','정답 형태','조건이 양립해도 선택한 정답 형태에 맞지 않으면 다시 설계합니다.',[
   option('exam_integer','1부터 999까지 정수','평가원형 단답 제작을 위한 내부 형식입니다.'),
   option('exact','분수·근호·집합도 허용','내신·연구용으로 정확한 값을 그대로 묻습니다.')]),
  control('variation','다음 문제에서 바꿀 것','숫자 변형과 풀이 구조의 변형을 구분해 기록합니다.',[
   option('numbers','같은 구조로 숫자 바꾸기','경우 분류와 조건의 역할이 유지되는지 다시 검사합니다.'),
   option('structure','풀이 구조도 바꾸기','정보를 주는 조건·후보를 가르는 단계·질문 중 하나 이상을 바꿉니다.')])
 ];
 const byId=new Map(controls.map(c=>[c.id,c]));
 function sourceReference(record){
  const p=record.payload||{},f=p.fields||{},definitions=[...new Set([record.definition,p.definition,f.statement].filter(s=>typeof s==='string'&&s.trim()))];
  const conflict=record.id==='PA-CAND-CON-20260910-008';
  return {id:record.id,name:record.name,kind:record.kind,origin:record.origin,status:record.source_status,
   definitions,prerequisites:Array.isArray(f.prerequisites)?f.prerequisites:[],common_confusions:Array.isArray(f.common_confusions)?f.common_confusions:[],
   source_questions:[...new Set([...(record.source_questions||[]),p.source_question_id,p.source_record].filter(v=>typeof v==='string'))],
   usable_as_proof_source:definitions.length>0&&!conflict,
   restriction:conflict?'이 기록의 홀수 중복도 설명은 그대로 적용할 수 없습니다. 단순근에 한정된 PA-GRAMMAR-03과 직접 좌우 미분 검사를 사용하세요.':definitions.length?'이름보다 본문 전제와 실행 연산의 적용 범위를 우선하며, 검수 상태를 그대로 유지합니다.':'내용이 없는 참고 ID입니다. 이름만으로 정리나 적용 범위를 추정하지 마세요.'};
 }
 const defaults=()=>({version:1,values:Object.fromEntries(controls.map(c=>[c.id,'auto']))});
 function normalize(value){
  if(!value||value.version!==1||!value.values||typeof value.values!=='object'||Array.isArray(value.values))throw Error('설계 세부 조절의 형식이 다릅니다.');
  if(Object.keys(value).some(k=>!['version','values'].includes(k)))throw Error('알 수 없는 설계 조절 항목입니다.');
  const out=defaults();for(const [k,v] of Object.entries(value.values)){const c=byId.get(k);if(!c||!c.options.some(o=>o.value===v))throw Error('설계 조절 값을 확인하세요: '+k);out.values[k]=v;}
  return out;
 }
 function conflicts(value){const v=normalize(value).values,errors=[];
  if(v.candidates==='filter'&&v.branching==='none')errors.push('마지막에 후보를 고르려면 후보를 비교하는 경우 나누기를 허용해 주세요.');
  if(v.candidates==='keep_many'&&v.target==='value')errors.push('여러 후보를 남길 때는 가능한 값들의 합·개수, 공통값 또는 범위를 물어 주세요.');
  if(v.candidates==='single'&&v.target==='invariant')errors.push('함수가 달라도 같은 값을 묻는 설정에는 여러 함수 후보가 필요합니다.');
  if(v.boundary==='decisive'&&v.branching==='none')errors.push('경계에서 결과가 달라지는 문제는 경계 전후를 나누어 확인해야 합니다.');
  if(v.target==='range'&&v.answer_form==='exam_integer')errors.push('범위 자체를 답으로 쓰려면 정답 형태에서 집합도 허용해 주세요.');
  return errors;
 }
 const RULES=`세미나 원자와 그 원자에서 증명한 잠재결과만으로 문항을 설계한다. 새 교재의 풀이를 새 원자라고 이름만 바꾸어 끼워 넣지 않는다.
먼저 내부 함수족, 남는 후보, 조건별 역할, 질문을 설계한 뒤 문면을 작성한다. 각 잠재결과에는 출발 PA ID, 전제, 대상·범위, 유도, 다음에 쓰이는 곳을 적는다. 이름이 같아도 함수·구간이 다르면 바로 연결하지 않는다.
등록 계약으로 실행할 수 없는 새 연결은 new_bridge_proposals와 unresolved에 남긴다. 잠재결과의 증명을 적었다는 이유만으로 검수된 실행 계약이라고 주장하지 않는다. 시작 사실에 결론을 몰래 넣지 않는다.
design_evidence.control_checks에는 auto 이외의 선택을 빠짐없이 기록하고 요청값과 달성값, 해설의 정확한 인용, 설명을 쓴다. 달성하지 못한 설정은 achieved에 unmet을 쓰고 unresolved에 이유를 적는다. 수치만 바꾼 것을 구조 변형이라고 부르지 않는다.
design_evidence.derivation에는 실제 사용한 모든 PA 연산을 포함한 순서 있는 유도 기록을 넣는다. potential 단계도 기존 PA ID와 앞 단계에서만 출발하며 증명하지 않은 가교는 승인하지 않는다. 전제·정의역·반례 가능성을 생략하지 않는다.
조건 제거 검사는 남은 조건을 만족하면서 질문의 답이 달라지는 구체적 예로 제시한다. 후보 개수만 늘었다는 설명으로 대신하지 않는다. 각 condition_roles 항목을 condition_tests에 대응시킨다. 미검증은 unresolved로 남긴다.
쉬운 우회 풀이를 별도로 시도한다. 핵심 추론을 거친 뒤 계산만 짧아지는 것은 허용하고, 핵심 결론이 주어진 조건만으로 바로 나오는 우회는 의도한 설계 실패로 기록한다.
새 문항의 구조를 핵심 연산·의존관계·정보 공개 방식·분기·질문으로 기록한다. 원자 목록만 같다는 이유로 같은 구조라고 하지 않고, 함수명이나 숫자만 다르다는 이유로 새 구조라고 하지 않는다.
모델 자체 보고는 수학 검산이나 학생 난도 실측이 아니다. 결과의 독립 검산·사람 승인 상태를 승격시키지 않는다.`;
 function guide(value){const n=normalize(value),errors=conflicts(n);if(errors.length)throw Error(errors.join(' '));return {version:1,selected:controls.filter(c=>n.values[c.id]!=='auto').map(c=>({parameter:c.id,label:c.label,value:n.values[c.id],...c.options.find(o=>o.value===n.values[c.id])})),rules:RULES};}
 const obj=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)}),str={type:'string'},arr=items=>({type:'array',items});
 const evidenceSchema=()=>obj({
  control_checks:arr(obj({parameter:str,requested:str,achieved:str,solution_evidence:str,explanation:str})),
  derivation:arr(obj({step_id:str,kind:{type:'string',enum:['registered','potential']},source_ids:arr(str),depends_on:arr(str),premises:arr(str),scope:str,statement:str,argument:str,runtime_supported:{type:'boolean'}})),
  condition_tests:arr(obj({condition:str,status:{type:'string',enum:['changed_answer','not_necessary','unresolved']},construction:str,alternative_target:str})),
  shortcut_audit:obj({route:str,preserves_core:{type:'boolean'},reason:str}),
  structure:obj({hidden_family:str,information_flow:str,branch_points:arr(str),target_role:str,variation_from_previous:str})
 });
 function validateEvidence(data,value,registry){
  const n=normalize(value),ev=data.design_evidence,errors=[];if(!ev)return ['설계 조건을 확인한 기록이 없습니다.'];
  const specified=controls.filter(c=>n.values[c.id]!=='auto'),seen=new Set();
  if(n.values.answer_form==='exam_integer'){
   const answer=data.answer.trim().replace(/^\$([^$\n]+)\$$/,'$1').replace(/^\\boxed\{([1-9]\d{0,2})\}$/,'$1').trim();
   if(!/^[1-9]\d{0,2}$/.test(answer))errors.push('정답을 1부터 999까지의 정수 하나로 적어 주세요.');
  }
  for(const row of ev.control_checks){if(seen.has(row.parameter))errors.push('설정 점검이 중복됐습니다: '+row.parameter);seen.add(row.parameter);if(!specified.some(c=>c.id===row.parameter)||row.requested!==n.values[row.parameter])errors.push('요청하지 않은 설계 설정이거나 요청값이 다릅니다.');if(row.achieved!==row.requested)errors.push('선택한 설계 설정을 충족하지 못했습니다: '+row.parameter);if(!row.solution_evidence.trim()||!data.solution.some(s=>s.includes(row.solution_evidence))||!row.explanation.trim())errors.push('설계 설정의 해설 근거를 확인하세요: '+row.parameter);}
  for(const c of specified)if(!seen.has(c.id))errors.push('설정 확인 누락: '+c.label);
  const known=new Set([...registry.records.filter(r=>sourceReference(r).usable_as_proof_source),...registry.operations].map(r=>r.id)),used=new Set(data.used_operations),covered=new Set(),steps=new Set();
  for(const row of ev.derivation){
   if(!row.step_id.trim()||steps.has(row.step_id)||row.depends_on.some(id=>!steps.has(id)))errors.push('유도 순서가 잘못됐거나 순환합니다: '+row.step_id);
   if(!row.source_ids.length||row.source_ids.some(id=>!known.has(id)))errors.push('유도에 미등록 출처가 있습니다: '+row.step_id);
   if(row.kind==='registered'&&!row.source_ids.some(id=>used.has(id)))errors.push('등록 단계가 실제 풀이 연산과 연결되지 않았습니다: '+row.step_id);
   row.source_ids.filter(id=>used.has(id)).forEach(id=>covered.add(id));
   if(!row.premises.length||row.premises.some(s=>!s.trim())||[row.scope,row.statement,row.argument].some(s=>!s.trim()))errors.push('잠재결과의 전제·범위·증명이 부족합니다: '+row.step_id);
   if(!row.runtime_supported)errors.push('실행 계약이 없는 잠재결과는 연결 검토가 필요합니다: '+row.step_id);
   if(row.kind==='potential')errors.push('새 잠재결과는 증명과 실행 계약을 검토한 뒤 등록해야 합니다: '+row.step_id);
   steps.add(row.step_id);
  }
  if(!steps.size||[...used].some(id=>!covered.has(id)))errors.push('실제 사용 원자의 유도 기록이 빠졌습니다.');
  const conditions=new Set(data.condition_roles.map(c=>c.condition)),tested=new Set();
  for(const row of ev.condition_tests){if(!conditions.has(row.condition)||tested.has(row.condition))errors.push('조건 제거 검사의 대상이 다르거나 중복입니다.');tested.add(row.condition);if(row.status!=='changed_answer')errors.push('조건의 필요성을 다시 검토해야 합니다: '+row.condition);if(!row.construction.trim()||!row.alternative_target.trim())errors.push('조건 제거 뒤 다른 답을 만드는 예가 없습니다.');}
  if([...conditions].some(c=>!tested.has(c)))errors.push('조건 제거 검사가 빠졌습니다.');
  if(!ev.shortcut_audit.preserves_core||!ev.shortcut_audit.route.trim()||!ev.shortcut_audit.reason.trim())errors.push('핵심 추론을 건너뛰는 풀이를 다시 검토하세요.');
  for(const [k,v] of Object.entries(ev.structure))if(typeof v==='string'&&!v.trim())errors.push('문항 구조 설명이 없습니다: '+k);
  return errors;
 }
 return {VERSION:1,controls,byId,defaults,normalize,conflicts,guide,RULES,evidenceSchema,validateEvidence,sourceReference};
});
