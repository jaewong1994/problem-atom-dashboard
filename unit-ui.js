(function(root,factory){const api=factory(typeof module==='object'?require('./curriculum-model.js'):root.PACurriculum);if(typeof module==='object')module.exports=api;else root.PAUnitUI=api;})(typeof globalThis!=='undefined'?globalThis:this,C=>{
 'use strict';
 function inventory(registry,scope){
  const main=C.mainUnits(scope),units=C.units.map(u=>({...u,count:C.count(registry,u.id),subjectName:C.subjects.find(s=>s.id===u.subject).name}));
  return {missing:units.filter(u=>main.includes(u.id)&&!u.count),available:units.filter(u=>u.count),hasMain:units.some(u=>main.includes(u.id)&&u.count)};
 }
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,fn,cls='')=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
 function mount(host,{change,continueToMaterials,initialMode=null}){
  let ctx,open=true,mode=initialMode==='fusion'?'fusion':'math2',draftFusion=new Set(),initialized=false;
  function render(value){ctx=value;const {scope,registry,plan}=ctx;if(!initialized){initialized=true;if(scope){mode=initialMode==='fusion'?'fusion':scope.mode==='fusion'?'fusion':C.get(scope.unit).subject;draftFusion=new Set(C.mainUnits(scope));open=initialMode==='fusion';}}
   const settingsOpen=Boolean(host.querySelector('.unit-settings')?.open);host.replaceChildren();const heading=el('div',null,'unit-heading'),title=el('div');title.append(el('p','01 · 제작 범위','unit-kicker'),el('h2',scope?C.label(scope):'어느 대단원의 문항을 만들까요?'));heading.append(title);if(scope)heading.append(button(open?'단원 선택 접기':'제작 틀 바꾸기',()=>{open=!open;render(ctx);}));host.append(heading);
   if(scope){const main=C.mainUnits(scope),empty=main.filter(id=>!C.count(registry,id));const summary=el('div',null,'unit-current');summary.append(el('p',scope.mode==='fusion'?'각 과목에서 얻은 정보가 하나의 답으로 이어지는 문항을 만듭니다.':C.get(scope.unit).description));
    const examples=el('div',null,'unit-topics');for(const id of main)for(const text of C.get(id).examples.slice(0,scope.mode==='fusion'?1:3))examples.append(el('span',text));summary.append(examples);
    if(empty.length)summary.append(el('p',empty.map(id=>C.get(id).name).join(' · ')+'의 전용 재료는 0개입니다. 이 범위의 문항 제작은 아직 준비 중입니다. 아래에서 재료가 등록된 단원을 선택해 주세요.','unit-pending'));
    else summary.append(button('이 범위의 재료 고르기',continueToMaterials,'primary'));
    const settings=el('details',null,'unit-settings');settings.open=settingsOpen;settings.append(el('summary','다른 단원 함께 쓰기 · 기본 지식 확인'));const prereqs=[...new Set(main.flatMap(id=>C.get(id).prerequisites))];settings.append(el('p',prereqs.length?'기본 지식으로 사용하는 단원: '+prereqs.map(id=>C.get(id).name).join(' · '):'기본 식 정리와 계산은 공통 기초로 사용합니다.','unit-note'));
    settings.append(el('p','다른 과목의 판단을 중심에 둘 때는 위의 ‘과목 융합’ 틀을 사용하세요.','unit-note'));
    for(const u of C.units.filter(u=>!main.includes(u.id)&&!prereqs.includes(u.id)&&main.some(id=>C.get(id).subject===u.subject))){const label=el('label'),input=el('input');input.type='checkbox';input.checked=scope.supporting_units.includes(u.id);input.onchange=()=>{const chosen=new Set(scope.supporting_units);input.checked?chosen.add(u.id):chosen.delete(u.id);change({...scope,supporting_units:[...chosen]});};label.append(input,el('span',u.name));settings.append(label);}summary.append(settings);host.append(summary);
    const audit=C.audit(plan,registry,scope);if(plan.nodes.length&&!audit.valid){const issues=el('div',null,'unit-issues');issues.setAttribute('role','status');for(const issue of audit.issues)issues.append(el('p',issue));issues.append(el('small','기존 재료는 그대로 유지됩니다. 범위나 재료를 바꾸고 다시 확인하세요.'));host.append(issues);}
   }
   if(!scope||open){const modes=el('div',null,'unit-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','과목과 제작 틀');for(const item of [...C.subjects,{id:'fusion',name:'과목 융합'}]){const b=button(item.name,()=>{mode=item.id;render(ctx);});b.setAttribute('aria-pressed',String(mode===item.id));modes.append(b);}host.append(modes);
    if(mode==='fusion'){
     host.append(el('h3','서로 다른 과목에서 대단원을 골라 주세요'),el('p','예: 수학Ⅰ 수열 + 확률과 통계 경우의 수. 과목 이름만 섞지 않고, 두 판단이 같은 풀이에 쓰이도록 설계합니다.','unit-note'));
     const grid=el('div',null,'fusion-grid');for(const subject of C.subjects){const section=el('fieldset');section.append(el('legend',subject.name));for(const u of C.units.filter(u=>u.subject===subject.id)){const label=el('label'),input=el('input');input.type='checkbox';input.checked=draftFusion.has(u.id);input.onchange=()=>{input.checked?draftFusion.add(u.id):draftFusion.delete(u.id);render(ctx);host.querySelector('[data-fusion-unit="'+u.id+'"]')?.focus({preventScroll:true});};input.dataset.fusionUnit=u.id;const count=C.count(registry,u.id);label.append(input,el('span',u.name+(count?' · 재료 '+count+'개':' · 재료 0개')));section.append(label);}grid.append(section);}host.append(grid);
     const valid=new Set([...draftFusion].map(id=>C.get(id).subject)).size>=2,selected=el('p',[...draftFusion].map(id=>C.get(id).name).join(' + ')||'아직 고른 단원이 없습니다.','fusion-summary');selected.setAttribute('role','status');const go=button('이 조합으로 융합형 설계',()=>{open=false;change({mode:'fusion',units:[...draftFusion],supporting_units:[]});},'primary');go.disabled=!valid;host.append(selected,go);
    }else{const grid=el('div',null,'unit-grid');for(const u of C.units.filter(u=>u.subject===mode)){const count=C.count(registry,u.id),b=button('',()=>{open=false;change(C.scope(u.id));},'unit-card');b.dataset.unit=u.id;b.append(el('span',count?'전용 재료 '+count+'개':'전용 재료 0개 · 아직 제작 불가','unit-availability'),el('b',u.name),el('span',u.description,'unit-description'),el('small',u.examples.join(' · ')));grid.append(b);}host.append(grid);}
   }
  }
  return {render,open:()=>{open=true;render(ctx);}};
 }
 return {mount,inventory};
});
