(function(){'use strict';
 const $=id=>document.getElementById(id),el=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
 function download(value,name,type='application/json'){const url=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function mathText(text){const p=el('p'),re=/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;let at=0;
  for(const match of text.matchAll(re)){p.append(document.createTextNode(text.slice(at,match.index)));const span=el('span');katex.render(match[1]||match[2],span,{displayMode:Boolean(match[1]),throwOnError:false,trust:false,maxExpand:1000});p.append(span);at=match.index+match[0].length;}p.append(document.createTextNode(text.slice(at)));return p;
 }
 async function mount({registry,engine,getPlan}){
  const root=el('section');root.id='modelStudio';root.className='model-studio';root.setAttribute('aria-labelledby','modelTitle');
  // Static interface only. Model text is always inserted through text nodes / KaTeX.
  root.innerHTML=`<div class="section-heading"><div><p class="eyebrow">선택한 원자 → 모델 제작 → 결과 검토</p><h2 id="modelTitle">이 연결로 문항 만들기</h2></div><span>API 기본 모델 · Sol</span></div>
   <p id="providerStatus" class="muted" role="status">제작 연결을 확인하는 중입니다.</p>
   <div class="model-layout"><div class="model-brief"><label for="modelBrief">어떤 문제를 만들까요?</label><textarea id="modelBrief" rows="4" maxlength="5500">위에서 선택한 원자를 함께 사용한 고등학교 수학 문항 한 개를 만들어 주세요. 각 조건이 풀이에서 필요한 이유가 드러나게 해 주세요.</textarea>
   <div class="model-targets"><label>계산 부담<select id="calculationGoal"><option>가볍게 — 복잡한 전개와 큰 수 계산을 줄이기</option><option>보통 — 핵심 식을 세운 뒤 계산하기</option><option>충분히 — 여러 단계의 계산을 허용하기</option></select></label><label>추론 요구<select id="reasoningGoal"><option>연결형 — 두 가지 생각을 이어야 풀리게</option><option>기본형 — 필요한 방법이 바로 보이게</option><option>도전형 — 숨은 관계와 경우를 찾아야 풀리게</option></select></label></div>
   <p class="muted">제작 방향을 전달합니다. 난도 등급은 아직 실증 보정 전이며, 생성 뒤 실제 풀이로 다시 평가합니다.</p>
   <button id="prepareModel" class="primary" type="button">선택한 원자로 제작 요청 준비</button><p id="modelStatus" role="status" aria-live="polite"></p>
   <div id="requestActions" hidden><p id="requestSummary"></p><div class="model-actions"><button id="downloadRequest" type="button">요청 JSON 저장</button><button id="downloadHandoff" type="button">Codex 전달문 저장</button></div>
    <div id="apiSettings" hidden><label>제작 서비스 접근 토큰<input id="serviceToken" type="password" autocomplete="off" placeholder="서버 운영자가 발급한 토큰"></label><p class="muted">OpenAI API 키가 아닙니다. 접근 토큰은 이 화면을 닫으면 남기지 않습니다.</p></div>
    <button id="callModel" class="primary" type="button" disabled>Sol API로 1문항 제작</button><p id="apiReason" class="muted"></p></div>
   <details><summary>저장한 제작 요청 다시 열기</summary><label>요청 JSON<input id="openRequest" type="file" accept=".json,application/json"></label></details></div>
   <div class="model-review"><h3>모델이 만든 결과 검토</h3><p class="muted">문항·풀이·사용 원자·조건의 역할을 함께 확인합니다. 연결 검사 통과 후에도 독립 검산과 사람 검토가 필요합니다.</p><label>결과 JSON 열기<input id="openResult" type="file" accept=".json,application/json"></label><div id="modelResult"><p class="model-empty">먼저 제작 요청을 준비하세요.<br>Codex에서 만든 결과 파일을 열거나, 서버 연결 후 Sol API로 제작할 수 있습니다.</p></div></div></div>`;
  $('assets').before(root);
  let pending=null,busy=false,provider=null;
  try{const r=await fetch('model-provider.json',{cache:'no-store'});if(!r.ok)throw Error('설정 읽기 실패');provider=await r.json();}catch(_){provider={mode:'codex_handoff',api_endpoint:null,status:'API 설정을 읽지 못했습니다. 요청 파일 전달은 사용할 수 있습니다.'};}
  const apiReady=provider.mode==='api'&&typeof provider.api_endpoint==='string'&&/^https:\/\//.test(provider.api_endpoint)&&provider.api_model==='gpt-5.6-sol';
  $('providerStatus').textContent=apiReady?'Sol API 연결 설정됨 · 실제 호출 성공 여부는 제작 때 확인합니다.':provider.status||'API 서버 연결 전 · Codex 요청 파일로 제작할 수 있습니다.';
  $('apiReason').textContent=apiReady?'한 번 누르면 1회 호출합니다. 실패 시 자동 재시도나 고가 모델 전환은 하지 않습니다.':'API 서버와 서버의 키 설정이 필요합니다. 현재는 요청 파일 전달과 결과 검토가 가능합니다.';
  $('apiSettings').hidden=!apiReady;
  function activate(job){pending=job;$('requestActions').hidden=false;$('callModel').disabled=!apiReady||busy;$('requestSummary').textContent=`요청 ${job.request_id} · 선택 ${job.seed_plan.nodes.length}단계 · 통합 연결 ${registry.operations.length}개 참조`;$('modelResult').replaceChildren(el('p','제작 요청이 준비되었습니다. 모델 결과를 기다립니다.'));}
  function status(text){$('modelStatus').textContent=text;}
  $('prepareModel').onclick=()=>{try{if(busy)throw Error('진행 중인 제작이 끝난 뒤 새 요청을 준비하세요.');const plan=getPlan();if(engine.run(plan).status==='blocked')throw Error('금지 연결과 충돌한 조건을 먼저 수정해 주세요.');activate(PAModelContract.makeRequest(registry,plan,$('modelBrief').value+'\n계산 부담: '+$('calculationGoal').value+'\n추론 요구: '+$('reasoningGoal').value,'REQ-'+crypto.randomUUID()));status('현재 선택을 요청에 담았습니다. 원자를 바꾸면 요청을 다시 준비하세요.');}catch(e){status(e.message);}};
  $('downloadRequest').onclick=()=>download(pending,'제작요청_'+pending.request_id+'.json');
  $('downloadHandoff').onclick=()=>download(PAModelContract.handoff(pending),'Codex_제작요청_'+pending.request_id+'.md','text/markdown;charset=utf-8');
  async function readFile(input){const file=input.files[0];if(!file)return null;if(file.size>2000000)throw Error('2MB 이하 JSON 파일만 열 수 있습니다.');return JSON.parse(await file.text());}
  $('openRequest').onchange=async()=>{try{if(busy)throw Error('제작 중에는 요청을 바꿀 수 없습니다.');const j=await readFile($('openRequest'));if(!j)return;if(j.schema!=='problem-atom/model-request/1'||j.registry_revision!==registry.revision)throw Error('요청 파일 형식 또는 자산 판본이 다릅니다.');const rebuilt=PAModelContract.makeRequest(registry,j.seed_plan,j.brief,j.request_id);if(engine.run(rebuilt.seed_plan).status==='blocked')throw Error('요청에 금지 연결이 있습니다.');activate(rebuilt);status('요청을 열었습니다. 같은 요청 번호의 결과를 검사할 수 있습니다.');}catch(e){status(e.message);}};
  function showResult(payload){
   if(!pending)throw Error('먼저 해당 결과의 제작 요청 JSON을 열어 주세요.');
   const data=payload?.result||payload,verdict=PAModelContract.validateResult(data,pending,registry,engine),host=$('modelResult');host.replaceChildren();
   const notice=el('p',verdict.accepted?'형식·연결 검사 통과 · 수학 검산 대기':'결과 수정 필요 · 검토 내용을 확인하세요.');notice.className='result-notice '+(verdict.accepted?'passed':'needs-work');host.append(notice);
   if(verdict.errors.length){const ul=el('ul');verdict.errors.forEach(e=>ul.append(el('li',e)));host.append(ul);}
   if(PAModelContract.schemaErrors(data,PAModelContract.RESULT_SCHEMA).length)return;
   host.append(el('h3',data.title));data.question.forEach(t=>host.append(mathText(t)));
   function details(title,lines){const d=el('details');d.append(el('summary',title));lines.forEach(t=>d.append(mathText(t)));host.append(d);}
   details('정답과 풀이',[data.answer,...data.solution]);
   details('조건을 넣은 이유',data.condition_roles.map(c=>c.condition+' → '+c.used_in+' / 빼면: '+c.removal_effect));
   details('계산과 추론 예상',[data.work_estimate.calculation,data.work_estimate.reasoning,data.work_estimate.bottleneck]);
   details('사용 원자와 연결 검사',data.plan.nodes.map(n=>(registry.operations.find(o=>o.id===n.id)?.name||n.id)+' · '+n.scope));
   details('모델 자체 점검 · 독립 검산 아님',data.self_checks.map(c=>c.check+': '+c.result));
   if(data.new_bridge_proposals.length)details('새 가교 제안 · 등록 전',data.new_bridge_proposals.map(p=>p.name+': '+p.mathematical_argument));
   const save=el('button','결과와 검사 기록 저장');save.type='button';save.onclick=()=>download({result:data,validation:verdict},'제작결과_'+pending.request_id+'.json');host.append(save);
   status('모델 결과를 열어 현재 자산으로 검사했습니다. 수학 검산·사람 승인 상태는 대기로 유지합니다.');
  }
  $('openResult').onchange=async()=>{try{if(busy)throw Error('제작 중에는 다른 결과를 열 수 없습니다.');const data=await readFile($('openResult'));if(data)showResult(data);}catch(e){status(e.message);}};
  $('callModel').onclick=async()=>{if(!apiReady||!pending||busy)return;const token=$('serviceToken').value.trim();if(!token){status('제작 서비스 접근 토큰을 입력하세요.');return;}
   busy=true;$('callModel').disabled=true;$('prepareModel').disabled=true;status('Sol이 문항과 풀이를 제작하고 있습니다. 완료 후 연결 규칙을 검사합니다.');
   try{const response=await fetch(provider.api_endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(pending),signal:AbortSignal.timeout(330000)});const payload=await response.json();if(!response.ok)throw Error(payload.error||'제작 요청 실패');showResult(payload);}catch(e){status('제작 요청을 완료하지 못했습니다: '+e.message+' 자동 재시도는 하지 않았습니다.');}finally{busy=false;$('callModel').disabled=false;$('prepareModel').disabled=false;}
  };
 }
 window.PAModelWorkspace={mount};
})();
