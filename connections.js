(async()=>{'use strict';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
try{
 const response=await fetch('connection-registry.json?v=c2');if(!response.ok)throw Error('자산 파일을 읽지 못했습니다.');
 const registry=await response.json(),engine=PAConnections.create(registry),ops=new Map(registry.operations.map(o=>[o.id,o]));
 let plan={facts:[],nodes:[],revision:registry.revision},choices=[],active='',advice=null;
 const bindings=()=>({f:$('bindF').value.trim(),h:$('bindH').value.trim(),a:$('bindA').value.trim()});
 const scope=()=> $('bindScope').value.trim();
 const label=f=>`${registry.types[f.type]} · ${f.subject}${f.object?' ↔ '+f.object:''}${f.scope==='main'?'':' / '+f.scope}`;
 const kinds={concept:'개념',decision:'판단',skill:'방법',strategy:'풀이 전략',problem_pattern:'문제 골격',recipe:'원문 조합',motif:'풀이 묶음',condition:'조건 카드',skeleton:'설계 골격'};
 function chosenFacts(){return choices.filter(c=>c.enabled).map(c=>c.fact);}
 function loadPreset(id){const p=registry.presets.find(p=>p.id===id);active=id;choices=p.facts.map(f=>({fact:f,enabled:true}));plan={facts:chosenFacts(),nodes:structuredClone(p.nodes),revision:registry.revision};$('planTitle').textContent=p.description;renderGivens();render();}
 function renderGivens(){const host=$('givens');host.replaceChildren();choices.forEach((c,i)=>{const l=el('label',null,'given'),input=el('input');input.type='checkbox';input.checked=c.enabled;input.onchange=()=>{choices[i].enabled=input.checked;render();};const text=el('span',registry.types[c.fact.type]);text.append(el('small',`대상 ${c.fact.subject} · 가정 ${c.fact.scope}`));l.append(input,text);host.append(l);});if(!choices.length)host.append(el('p','시작 조건을 직접 추가하거나 위의 출발점을 선택하세요.','muted'));}
 function render(){
  plan.facts=chosenFacts();const result=engine.run(plan);advice=null;
  document.querySelectorAll('.preset').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===active)));
  $('verdict').className=result.status;
  $('verdict').textContent=result.status==='connected'?'연결 조건 충족 · 실제 식과 정답은 별도 검산':result.status==='blocked'?'연결 금지 또는 잘못된 대상 지정이 있습니다.':'필요한 조건이나 가교가 아직 빠져 있습니다.';
  const flow=$('flow');flow.replaceChildren();
  for(const [i,step]of result.trace.entries()){
   const op=ops.get(step.id),li=el('li',null,'flow-node'+(op?.kind==='bridge'?' bridge':'')),top=el('div',null,'node-top'),title=el('div',null,'node-title');
   title.append(el('span',String(i+1).padStart(2,'0'),'number'),el('h3',step.name));top.append(title,el('span',step.status==='direct'?(step.redundant?'이미 얻은 결과':'연결 조건 충족'):step.status==='conditional'?'조건 부족':'연결 금지','status '+step.status));li.append(top);
   if(step.outputs.length)li.append(el('p','다음에 건넬 정보: '+step.outputs.map(label).join(' / '),'node-result'));
   if(step.missing.length)li.append(el('p','필요한 정보: '+step.missing.map(label).join(' / '),'missing'));
   step.reasons.forEach(t=>{if(step.status==='blocked')li.append(el('p',t,'missing'));});
   const details=el('details');details.append(el('summary','이 단계의 조건과 대상'));details.append(el('p',op?.guard_note||'미등록 단계','muted'));
   const fields=el('div');const slots=[...new Set([...(op?.requires||[]),...(op?.provides||[]),...(op?.forbids||[])].map(p=>p.subject.slice(1)))];
   slots.forEach(slot=>{const l=el('label',slot==='f'?'이 단계에서 다룰 함수/식':slot==='h'?'변환한 함수 이름':'값을 찾을 매개변수'),input=el('input');input.value=plan.nodes[i].bindings[slot]||'';input.maxLength=100;input.onchange=()=>{plan.nodes[i].bindings[slot]=input.value.trim();render();};l.append(input);fields.append(l);});
   const sl=el('label','이 단계의 가정 범위'),si=el('input');si.value=plan.nodes[i].scope;si.onchange=()=>{plan.nodes[i].scope=si.value.trim();render();};sl.append(si);fields.append(sl);details.append(fields);li.append(details);
   const controls=el('div',null,'node-tools');const up=button('위로',()=>{[plan.nodes[i-1],plan.nodes[i]]=[plan.nodes[i],plan.nodes[i-1]];render();});up.disabled=i===0;up.setAttribute('aria-label',step.name+' 위로');
   const down=button('아래로',()=>{[plan.nodes[i+1],plan.nodes[i]]=[plan.nodes[i],plan.nodes[i+1]];render();});down.disabled=i===result.trace.length-1;down.setAttribute('aria-label',step.name+' 아래로');
   const remove=button('빼기',()=>{plan.nodes.splice(i,1);render();});remove.setAttribute('aria-label',step.name+' 빼기');controls.append(up,down,remove);li.append(controls);flow.append(li);
  }
  if(!plan.nodes.length)flow.append(el('li','아래 통합 자산에서 연결할 단계를 골라 넣으세요.','muted'));
  const adviceHost=$('bridgeAdvice');adviceHost.replaceChildren();
  if(result.errors.length)adviceHost.append(el('p',result.errors.join(' '),'missing'));
  const at=result.trace.findIndex(s=>s.status!=='direct');
  if(at>=0){
   let state=engine.prepare(plan.facts);for(let i=0;i<at;i++)state=engine.apply(state,plan.nodes[i]).facts;
   const found=engine.suggest(state,plan.nodes[at],{bindings:bindings(),maxDepth:3,limit:1});
   if(found.status==='bridge'){
    advice={at,nodes:found.paths[0]};const box=el('div',null,'bridge-advice');box.append(el('strong','사이에 이 가교를 넣으면 이어집니다.'),el('p',advice.nodes.map(n=>ops.get(n.id).name).join(' → ')));
    box.append(el('p','가교마다 필요한 계산이 추가됩니다. 아직 없는 조건은 자동으로 채우지 않습니다.','muted'),button('추천 가교 넣기',()=>{plan.nodes.splice(advice.at,0,...structuredClone(advice.nodes));render();},'primary'));adviceHost.append(box);
   }else if(found.status!=='blocked')adviceHost.append(el('p','현재 정보만으로 사용할 가교가 없습니다. 표시된 조건이 문제에 실제로 주어지는지 확인하세요.','muted'));
  }
  $('workNote').textContent=result.work?`계획된 큰 작업: 식 계산 ${result.work.algebra}단위 · 경우 나누기 ${result.work.branches}단위. 원자에 적힌 잠정 작업량이며 실제 사칙연산 횟수나 난도 점수가 아닙니다.`:'';
  renderLibrary();
 }
 function renderLibrary(){
  const term=$('search').value.trim().toLowerCase(),view=$('view').value,origin=$('origin').value,host=$('libraryRows');host.replaceChildren();
  let rows=view==='records'?registry.records:registry.operations.filter(o=>view!=='bridges'||o.kind==='bridge');
  rows=rows.filter(r=>{
   const origins=r.origin?[r.origin]:registry.records.filter(a=>r.supports.includes(a.id)).map(a=>a.origin);
   return (!origin||origins.includes(origin))&&(!term||JSON.stringify(r).toLowerCase().includes(term));
  });
  $('resultCount').textContent=`${rows.length}개 · 사람 검토 상태는 원본 그대로 유지됩니다.`;
  for(const r of rows){
   if(view==='records'){
    const d=el('details',null,'record-row');d.append(el('summary',`${r.name} · ${kinds[r.kind]||r.kind}`));
    d.append(el('p',`${r.id} · ${r.origin} · 원본 상태: ${r.source_status}`));
    d.append(el('p',r.connection_ids.length?'연결 단계: '+r.connection_ids.map(id=>ops.get(id).name).join(' / '):'참고용으로 보존. 실행할 연결 조건은 아직 없으므로 조합에 자동 사용하지 않습니다.'));
    d.append(el('p','원문 기록에는 수정 전 표현이 남아 있을 수 있습니다. 실제 연결은 적용 범위를 다시 적은 연결 단계로 검사합니다.','muted'));
    const raw=el('details');raw.append(el('summary','원본 기록과 출처'),el('pre',JSON.stringify(r.payload||r,null,2)));d.append(raw);host.append(d);continue;
   }
   const row=el('article',null,'asset-row'),left=el('div'),right=el('div');left.append(el('h3',r.name),el('p',(r.kind==='bridge'?'가교':'풀이 단계')+' · 검토 전','meta'));
   right.append(el('p','필요: '+r.requires.map(p=>registry.types[p.type]+(p.object?' (대응 대상 확인)':'')).join(' · ')),el('p','결과: '+r.provides.map(p=>registry.types[p.type]).join(' · ')));
   const add=button('연결 끝에 넣기',()=>{plan.nodes.push({id:r.id,bindings:bindings(),scope:scope()});render();$('actionStatus').textContent=r.name+' 단계를 넣었습니다.';});
   const details=el('details');details.append(el('summary','사용 조건 · 붙이면 안 되는 경우 · 출처'),el('p',r.guard_note));
   if(r.forbids.length)details.append(el('p','금지 조건: '+r.forbids.map(p=>registry.types[p.type]).join(', ')));
   details.append(el('p','역할: '+({representation:'표현을 바꾸는 역할',constraint:'가능한 경우를 줄이는 역할',enabler:'다른 풀이로 이어 주는 역할'}[r.influence.role]||'풀이 단계')));
   details.append(el('p','관련 원본: '+r.supports.join(', '),'meta'));row.append(left,right,add,details);host.append(row);
  }
 }
 registry.presets.forEach(p=>{const b=button('',()=>loadPreset(p.id),'preset');b.dataset.id=p.id;b.append(el('strong',p.name),el('small',p.description));$('presets').append(b);});
 for(const origin of [...new Set(registry.records.map(r=>r.origin))]){if(![...$('origin').options].some(o=>o.value===origin)){const o=el('option',origin==='shared'?'공유 자산':origin);o.value=origin;$('origin').append(o);}}
 for(const [value,text]of Object.entries(registry.types)){const option=el('option',text);option.value=value;$('factType').append(option);}
 $('addFact').onsubmit=e=>{e.preventDefault();const f={type:$('factType').value,subject:$('factSubject').value.trim(),scope:$('factScope').value.trim(),origin:'given'};if(f.type==='height_identity'){f.object=$('factObject').value.trim();if(!f.object)return;}if(!f.subject||!f.scope)return;if(!choices.some(c=>JSON.stringify(c.fact)===JSON.stringify(f)))choices.push({fact:f,enabled:true});renderGivens();render();};
 $('factType').onchange=()=>{$('factObjectLabel').hidden=$('factType').value!=='height_identity';};
 $('blank').onclick=()=>{active='';choices=[];plan={facts:[],nodes:[],revision:registry.revision};$('planTitle').textContent='원자와 조건을 골라 새로운 연결을 설계하세요.';renderGivens();render();};
 for(const id of ['search','view','origin'])$(id).addEventListener(id==='search'?'input':'change',renderLibrary);
 for(const id of ['bindF','bindH','bindA','bindScope'])$(id).addEventListener('change',render);
 $('exportPlan').onclick=()=>{const result=engine.run(plan),payload={schema:'problem-atom/connection-plan/1',...plan,result};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='원자_연결_설계.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('importPlan').onchange=async()=>{try{const file=$('importPlan').files[0];if(!file)return;if(file.size>1000000)throw Error('1MB 이하의 설계 파일만 열 수 있습니다.');const p=JSON.parse(await file.text());if(p.schema!=='problem-atom/connection-plan/1')throw Error('연결 설계 파일이 아닙니다.');engine.run(p);plan={facts:p.facts,nodes:p.nodes,revision:registry.revision};choices=p.facts.map(f=>({fact:f,enabled:true}));active='';renderGivens();render();$('actionStatus').textContent='설계를 불러와 현재 자산으로 다시 검사했습니다.';}catch(e){$('actionStatus').textContent=e.message;}};
 registry.rules.forEach(r=>{const d=el('article',null,'rule');d.append(el('h3',r.name),el('p',r.reason));$('rules').append(d);});
 const witnesses=[
  ['합성방정식 → 두 수평선',String.raw`f(x)=x(x-2)^2`,String.raw`f(x-f(x))=0`, '서로 다른 실근의 개수는 6입니다.',String.raw`H(x)=f(x)-x=x(x-1)(x-3)`,String.raw`H(x)+2=(x-2)(x^2-2x-1)`, '각각 0과 −2인 높이에서 근이 3개씩이고 두 목록은 겹치지 않습니다.'],
  ['극값 조건 → 정수 선택',String.raw`F(x)=x^3-9x^2+15x`,String.raw`G_a(x)=\int_a^x(F(x)-F(t))(t^2+1)\,dt`, '극값이 하나가 되는 정수 a는 1, 5이고 합은 6입니다.',String.raw`G_a'(x)=3(x-1)(x-5)\int_a^x(t^2+1)\,dt`,'', '적분 인수는 x−a와 부호가 같습니다. a를 1 또는 5에 놓으면 두 부호 변화가 겹칩니다.'],
  ['도함수 복원 → 이동거리',String.raw`X'(t)=3t^2-12t+9,\quad X(0)=0`,String.raw`0\le t\le4`, '총 이동거리는 12, 출발점에서 가장 먼 거리는 4입니다.',String.raw`X(t)=t(t-3)^2`,String.raw`X(0)=0,\ X(1)=4,\ X(3)=0,\ X(4)=4`, '방향은 1초와 3초에서 바뀝니다. 4+4+4로 거리를 더합니다.']
 ];
 for(const w of witnesses){const d=el('details');d.append(el('summary',w[0]));w.slice(1).forEach((s,i)=>{if(!s)return;const p=el('p');if([0,1,3,4].includes(i)){p.className='math';katex.render(s,p,{throwOnError:false,displayMode:true});}else p.textContent=s;d.append(p);});$('witnesses').append(d);}
 $('counts').textContent=`원본 ${registry.records.length}개 · 연결 ${registry.operations.length}개 · 가교 ${registry.operations.filter(o=>o.kind==='bridge').length}개`;
 $('loadStatus').textContent='기존 자료와 새 자료를 하나의 자산 목록으로 통합했습니다.';
 const preset=new URLSearchParams(location.search).get('plan');loadPreset(registry.presets.some(p=>p.id===preset)?preset:registry.presets[0].id);
 await PAModelWorkspace.mount({registry,engine,getPlan:()=>structuredClone(plan)});
}catch(e){$('loadStatus').textContent='연결 설계실을 열지 못했습니다: '+e.message;}
})();
