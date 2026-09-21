// Home reads the saved selection without resetting it.
function showSavedSelection(){
  const action=document.getElementById('startLabel'),note=document.getElementById('resumeNote');
  action.textContent='문항 만들기';note.textContent='아래에서 대단원이나 과목 융합 틀을 골라 시작하세요.';
  try{
    const saved=JSON.parse(localStorage.getItem(window.PAAccount?.storageKey('pa-compose-boxes-v1')||'pa-compose-boxes-v1')||'null');
    const count=Array.isArray(saved?.plan?.nodes)?saved.plan.nodes.length:0;
    if(count>0){action.textContent='이어서 문항 만들기';note.textContent='이 브라우저에 선택한 재료 '+count+'개가 저장돼 있어요.';}
  }catch(_){/* Storage may be disabled; the start link remains usable. */}
}
showSavedSelection();
if(window.PAAccount?.enabled)PAAccount.ready.then(showSavedSelection).catch(()=>{});
window.addEventListener('pageshow',showSavedSelection);
window.addEventListener('storage',event=>{if(event.key==='pa-compose-boxes-v1')showSavedSelection();});

// The home page only reads a saved draft. Choosing a chapter is navigation;
// the studio keeps the old plan and reports any scope mismatch.
(function(){const host=document.getElementById('homeUnits');if(!host||typeof PACurriculum==='undefined')return;const C=PACurriculum;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 for(const subject of C.subjects){const section=el('section',null,'home-course');section.append(el('h2',subject.name));for(const unit of C.units.filter(u=>u.subject===subject.id)){const link=el('a',null,'home-unit-link');link.href='connections.html?unit='+encodeURIComponent(unit.id);link.append(el('b',unit.name));const status=el('span','제작 틀 열기');status.dataset.unitCount=unit.id;link.append(status);section.append(link);}host.append(section);}
 fetch('connection-registry.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(registry=>{for(const node of host.querySelectorAll('[data-unit-count]')){const count=C.count(registry,node.dataset.unitCount);node.textContent=count?'판단 재료 '+count+'개 · 문항 구성하기':'제작 틀 준비 · 연결 재료 준비 중';}}).catch(()=>{});
})();
