'use strict';
(() => {
 let bank,current;const $=id=>document.getElementById(id);
 const n=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const math=(tag,text)=>{const node=n(tag);mathText(node,text);return node;};
 function choices(){return bank.examples.filter(e=>(!$('exampleFamily').value||e.family===$('exampleFamily').value)&&(!$('exampleElement').value||e.elements.some(m=>m.id===$('exampleElement').value)));}
 function show(e){
  current=e;const host=$('generatedExample');host.replaceChildren();if(!e){host.append(n('p','이 요소 조합에 연결된 생성 규칙이 없습니다. 다른 요소 또는 전체 구조를 선택해 주세요.'));$('exampleStatus').textContent='현재 조건 0개 · 다른 구조나 요소를 선택해 주세요.';$('exampleSeed').value='';return;}
  const card=n('article');card.className='generated-example';card.append(n('h3',e.family),n('p',`${e.asset_status} · ${e.quality}`));const q=math('p',e.question);q.className='example-question';card.append(q);
  card.append(n('p',e.power));const elements=n('ul');e.elements.forEach(m=>{const li=n('li');const a=n('a',m.name);a.href='#'+m.source_motif_id;li.append(a,document.createTextNode(m.approved?' · 승인 자산':' · 후보'));elements.append(li);});card.append(elements);
  const detail=n('details');detail.append(n('summary','정답·풀이·검증 결과'));detail.append(math('p',`정답: $${e.answer}$`));const ol=n('ol');e.solution.forEach(s=>ol.append(math('li',s)));detail.append(ol);e.verification.forEach(v=>detail.append(n('p','확인 · '+v)));card.append(detail);
  card.append(n('small',`재현 번호: ${e.seed} · 이 번호는 같은 자산 버전에서 같은 문항을 가리킵니다.`));host.append(card);$('exampleSeed').value=e.seed;
  $('exampleStatus').textContent=`현재 조건 ${choices().length}개 중 1개 · 전체 ${bank.examples.length}개 · 승인 공유자산 ${bank.approved_count}개`;
 }
 function random(){const pool=choices().filter(e=>e.id!==current?.id);const fallback=pool.length?pool:choices();const v=new Uint32Array(1);crypto.getRandomValues(v);show(fallback.length?fallback[v[0]%fallback.length]:null);}
 async function boot(){try{const r=await fetch('combination-examples.json',{cache:'no-store'});if(!r.ok)throw Error();bank=await r.json();
  [...new Set(bank.examples.map(e=>e.family))].forEach(f=>{const o=n('option',f);o.value=f;$('exampleFamily').append(o);});
  const elements=new Map(bank.examples.flatMap(e=>e.elements.map(m=>[m.id,m.name])));elements.forEach((name,id)=>{const o=n('option',name);o.value=id;$('exampleElement').append(o);});
  $('exampleFamily').onchange=random;$('exampleElement').onchange=random;$('randomExample').onclick=random;
  $('replayExample').onclick=()=>{const e=bank.examples.find(e=>e.seed===$('exampleSeed').value.trim());if(!e){$('exampleStatus').textContent='현재 자산 버전에 없는 번호입니다. 이전 결과는 저장한 JSON에서 확인하세요.';return;}$('exampleFamily').value='';$('exampleElement').value='';show(e);};
  $('saveExample').onclick=()=>{if(!current)return;const a=n('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));a.download=current.seed+'.json';a.click();URL.revokeObjectURL(a.href);};
  $('adapterStatus').textContent=bank.policy;const ul=n('ul');bank.unadapted.forEach(m=>ul.append(n('li',`${m.name} · ${m.id}`)));$('unadapted').append(ul);random();
 }catch{$('exampleStatus').textContent='조합 결과를 불러오지 못했습니다. 연결 상태를 확인하고 새로고침해 주세요.';}}
 boot();
})();
