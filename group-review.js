'use strict';
// Group decisions have a separate ledger: approving a revised summary must never
// silently approve the old, potentially incorrect individual definitions.
window.PAGroupReview = (() => {
 const KEY='pa-group-reviews-v1';let catalog, persisted={}, host;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const actor=()=>document.getElementById('actor').value.trim();
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {};}};
 const identity=g=>`${actor()}|${g.id}`;
 const fresh=g=>({groupId:g.id,revision:g.revision,actor:actor(),parts:[{memberIds:g.members.map(m=>m.id),proposal:g.proposal,verdict:'pending'}]});
 const record=g=>{const local=load()[identity(g)],remote=persisted[identity(g)];const options=[local,remote].filter(r=>r?.revision===g.revision).sort((a,b)=>(b.at||'').localeCompare(a.at||''));return options.length?structuredClone(options[0]):fresh(g);};
 function save(g,r){r.actor=actor();r.at=new Date().toISOString();const s=load();s[identity(g)]=r;localStorage.setItem(KEY,JSON.stringify(s));}
 function feedback(text){document.getElementById('groupStatus').textContent=text;}
 function render(){
  if(!catalog)return;host.replaceChildren();
  const q=document.getElementById('groupSearch').value.trim().toLowerCase();let shown=0;
  catalog.groups.filter(g=>!q||JSON.stringify(g).toLowerCase().includes(q)).forEach(g=>{
   const r=record(g);const card=node('article');card.className='review-group';card.append(node('h3',g.title),node('p',g.relation),node('p',g.reason));
   const caution=node('p',g.guard);caution.className='group-guard';card.append(caution);
   (g.duplicate_pairs||[]).forEach(pair=>card.append(node('p','중복 정리 추천: '+pair.names.join(' ↔ ')+' · 적용 범위를 맞춘 뒤 대표 항목으로 정리')));
   const detail=node('details');detail.append(node('summary','검증 범위와 제외 사례'));
   detail.append(node('p','아래는 연결 규칙의 검산입니다. 묶음 전체의 의미 동등성이나 원문 일반론을 자동 승인하는 검사가 아닙니다.'));
   (g.regression_notes||[]).forEach(text=>detail.append(node('p','이 묶음의 검사 · '+text)));
   catalog.checks.forEach(c=>detail.append(node('p',`${c.passed?'통과':'실패'} · ${c.name}: ${c.detail}`)));card.append(detail);
   r.parts.forEach((part,index)=>{
    const box=node('section');box.className='group-part';const names=part.memberIds.map(id=>g.members.find(m=>m.id===id));
    const heading=node('h4',`${r.parts.length>1?`분리 묶음 ${index+1} · `:''}${names.length}개 항목 · ${{pending:'검수 대기',approve:'묶음 승인',hold:'보류'}[part.verdict]||'검수 대기'}`);box.append(heading);
    const label=node('label','승인할 정리문');const text=node('textarea');text.value=part.proposal;text.rows=3;label.append(text);box.append(label);
    text.onchange=()=>{if(actor()&&text.value.trim()){part.proposal=text.value.trim();part.verdict='pending';heading.textContent=`${names.length}개 항목 · 수정됨 · 검수 대기`;try{save(g,r);feedback('정리문 수정을 저장했습니다. 변경된 내용은 다시 승인해 주세요.');}catch{feedback('정리문 저장에 실패했습니다.');}}};
    const items=node('details');items.open=r.parts.length>1;items.append(node('summary','원래 항목 비교 · 분리할 항목 선택'));
    const selected=[];
    names.forEach(m=>{const row=node('div');row.className='group-member';const l=node('label');const check=node('input');check.type='checkbox';check.value=m.id;selected.push(check);l.append(check,document.createTextNode(`${m.name} · ${m.author}`));row.append(l,node('p',m.definition),node('small',m.id));const a=node('button','개별 검토에서 보기');a.type='button';a.onclick=()=>{document.getElementById('individualReview').hidden=false;jumpTo(m.id);};row.append(a);items.append(row);});box.append(items);
    const actions=node('div');actions.className='group-actions';
    const apply=(action)=>{if(!actor()){feedback('강사 이름을 먼저 입력해 주세요.');document.getElementById('actor').focus();return;}
     part.proposal=text.value.trim();if(!part.proposal){feedback('승인할 정리문을 입력해 주세요.');return;}
     if(action==='approve'&&part.proposal.includes('분리 후 정리문을 검토해 주세요.')){feedback('분리한 항목의 정리문을 작성한 뒤 승인해 주세요.');return;}
     if(action==='split'){
      const ids=selected.filter(c=>c.checked).map(c=>c.value);
      if(!ids.length||ids.length===part.memberIds.length){feedback('현재 묶음 중 일부 항목을 선택해 주세요. 전체 선택은 분리가 아닙니다.');return;}
      part.memberIds=part.memberIds.filter(id=>!ids.includes(id));part.verdict='pending';
      r.parts.push({memberIds:ids,proposal:ids.map(id=>g.members.find(m=>m.id===id).name).join(' / ')+' — 분리 후 정리문을 검토해 주세요.',verdict:'pending'});
     }else part.verdict=action;
     try{save(g,r);render();feedback(action==='split'?'선택 항목을 별도 묶음으로 분리했습니다. 두 묶음의 정리문을 다시 확인해 주세요.':'이 기기에 검토를 저장했습니다. 묶음 검토 보내기로 운영 원장에 반영할 수 있습니다.');}catch{feedback('저장 공간에 기록하지 못했습니다. 기존 기록을 확인해 주세요.');}
    };
    [['approve','이 묶음 승인'],['split','선택 항목 분리'],['hold','보류']].forEach(([action,title])=>{const b=node('button',title);b.type='button';b.onclick=()=>apply(action);actions.append(b);});box.append(actions);card.append(box);
   });host.append(card);shown++;
  });
  if(!shown)host.append(node('p','검색 결과가 없습니다. 검색어를 바꿔 주세요.'));
  document.getElementById('groupCount').textContent=`추천 ${catalog.groups.length}묶음 · 현재 ${shown}묶음 표시`;
 }
 function exportBatch(){
  if(!actor()){feedback('강사 이름을 먼저 입력해 주세요.');return;}
  const rows=catalog.groups.map(g=>record(g)).filter(r=>r.parts.some(p=>p.verdict!=='pending')||r.parts.length>1);
  if(!rows.length){feedback('먼저 묶음을 승인·분리·보류해 주세요.');return;}
  download(`${actor()}-묶음검토.json`,{schema:'problem-atom/group-review/1.0',actor:actor(),at:new Date().toISOString(),groups:rows});feedback('묶음 검토 파일을 저장했습니다. 운영자는 묶음검토_반영.cmd로 반영합니다.');
 }
 async function init(){
  host=document.getElementById('reviewGroups');
  try{const [a,b]=await Promise.all([fetch('review-groups.json',{cache:'no-store'}),fetch('group-review-ledger.json',{cache:'no-store'})]);if(!a.ok)throw Error();catalog=await a.json();if(b.ok){const d=await b.json();persisted=Object.fromEntries((d.groups||[]).map(r=>[`${r.actor}|${r.groupId}`,r]));}
   document.getElementById('groupSearch').addEventListener('input',render);document.getElementById('actor').addEventListener('change',render);document.getElementById('exportGroups').onclick=exportBatch;
   document.getElementById('resetGroups').onclick=()=>{if(!actor()){feedback('초기화할 검토자 이름을 입력해 주세요.');return;}const state=load();Object.keys(state).filter(k=>k.startsWith(actor()+'|')).forEach(k=>delete state[k]);localStorage.setItem(KEY,JSON.stringify(state));render();feedback('현재 이름으로 이 기기에 저장한 묶음 기록을 초기화했습니다. 이미 반영된 운영 원장은 유지됩니다.');};
   document.getElementById('toggleIndividual').onclick=()=>{const n=document.getElementById('individualReview');n.hidden=!n.hidden;document.getElementById('toggleIndividual').setAttribute('aria-expanded',String(!n.hidden));};render();feedback('추천 묶음을 확인한 뒤 승인하거나 일부 항목을 분리하세요. 기록은 검토자 이름별로 저장됩니다.');
  }catch{feedback('추천 묶음을 읽지 못했습니다. 개별 검토는 계속 사용할 수 있습니다.');document.getElementById('individualReview').hidden=false;}
 }
 return {init};
})();
