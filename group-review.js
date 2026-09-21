'use strict';
window.PAGroupReview=(()=>{
 let store,registry,catalog,ledger,host;const M=PAReviewModel,$=id=>document.getElementById(id);
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const actor=()=>$('actor').value.trim(),feedback=text=>$('groupStatus').textContent=text;
 const name=id=>PABoxExamples.get(id)?.name||registry.operations.find(o=>o.id===id)?.name||id;
 function adopt(s){catalog=s.catalog;ledger=s.ledger;store.attach(registry);}
 function record(g){
  const saved=M.current(ledger,catalog).find(r=>r.groupId===g.id);if(saved)return structuredClone(saved);
  let old;try{old=JSON.parse(localStorage.getItem('pa-group-reviews-v1')||'{}')[actor()+'|'+g.id];}catch(_){}
  if(old&&g.revision.startsWith(old.revision+':'))return {...structuredClone(old),revision:g.revision,parts:old.parts.map(p=>({...p,verdict:'pending'})),legacy:true};
  return {groupId:g.id,revision:g.revision,actor:actor(),parts:[{memberIds:g.members.map(m=>m.id),proposal:g.proposal,verdict:'pending'}]};
 }
 async function commit(r){
  if(!actor())throw Error('검토자 이름을 먼저 입력해 주세요.');
  try{localStorage.setItem('seminar-actor',actor());}catch(_){}
  const row={...structuredClone(r),actor:actor()};delete row.legacy;
  adopt(await store.save({schema:'problem-atom/group-review/1.0',actor:actor(),groups:[row]}));
 }
 function render(){
  if(!catalog)return;host.replaceChildren();const q=$('groupSearch').value.trim().toLowerCase(),filter=$('reviewFilter').value;let shown=0;
  const linked=new Set(registry.reviewed_assets.flatMap(a=>a.operation_ids));
  $('reviewConnectionSummary').textContent=`승인한 정리문 ${registry.reviewed_assets.length}개 · 연결된 제작 박스 ${linked.size}개 / ${registry.operations.length}개`;
  for(const g of catalog.groups){
   const r=record(g);if(q&&!JSON.stringify(g).toLowerCase().includes(q)&&!g.operations.some(id=>name(id).includes(q)))continue;
   if(filter!=='all'&&!r.parts.some(p=>p.verdict===filter))continue;
   const card=node('article',undefined,'review-group');card.id='review-'+g.id;card.append(node('h3',g.title),node('p',g.reason));
   if(r.at)card.append(node('p',`마지막 검수: ${r.actor} · ${new Date(r.at).toLocaleString('ko-KR')}`,'review-byline'));
   if(r.legacy)card.append(node('p','이전 임시 정리문입니다. 현재 연결 조건을 확인하고 다시 승인해 주세요.','group-guard'));
   card.append(node('p',g.guard,'group-guard'));
   const ops=node('details',undefined,'review-linked-boxes');ops.append(node('summary',`제작실에 연결된 박스 ${g.operations.length}개 · 예시 보기`));
   for(const id of g.operations){const d=PABoxExamples.get(id),box=node('section',undefined,'review-box-example');box.append(node('h4',name(id)));
    if(d){const given=node('div');given.innerHTML=PAMath.mathify(d.given);box.append(given);const steps=node('ol');for(const text of [...d.steps,'결과: '+d.result]){const li=node('li');li.innerHTML=PAMath.mathify(text);steps.append(li);}box.append(steps);}
    box.append(node('p',registry.operations.find(o=>o.id===id).guard_note));ops.append(box);
   }card.append(ops);
   r.parts.forEach((part,index)=>{
    const box=node('section',undefined,'group-part'),members=part.memberIds.map(id=>g.members.find(m=>m.id===id));
    const h=node('h4',`${r.parts.length>1?'분리 묶음 '+(index+1)+' · ':''}${members.length}개 항목 · ${{pending:'검수 대기',approve:'검수 완료',hold:'보류'}[part.verdict]}`);box.append(h);
    const label=node('label','승인할 정리문'),text=node('textarea');text.value=part.proposal;text.rows=3;text.maxLength=10000;label.append(text);box.append(label);
    text.oninput=()=>{h.textContent=`${members.length}개 항목 · 수정 중 · 다시 승인 필요`;};
    text.onchange=async()=>{part.proposal=text.value.trim();part.verdict='pending';try{await commit(r);feedback('수정한 정리문을 저장했습니다. 다시 승인하기 전까지 검수 완료 목록에서 빠집니다.');}catch(e){feedback(e.message);}};
    const detail=node('details');detail.append(node('summary','원래 항목 비교 · 분리할 항목 선택'));const selected=[];
    for(const m of members){const row=node('div',undefined,'group-member'),l=node('label'),check=node('input');check.type='checkbox';check.value=m.id;selected.push(check);l.append(check,document.createTextNode(m.name+' · '+(m.author||'출처 기록')));const definition=node('p');definition.innerHTML=PAMath.mathify(m.definition||'');row.append(l,definition,node('small',m.id));detail.append(row);}box.append(detail);
    const actions=node('div',undefined,'group-actions');
    for(const [action,title]of [['approve','승인하고 제작실에 연결'],['split','선택 항목 분리'],['hold','보류']]){
     const b=node('button',title);b.type='button';b.onclick=async()=>{
      if(!actor()){feedback('검토자 이름을 먼저 입력해 주세요.');$('actor').focus();return;}
      part.proposal=text.value.trim();
      if(action==='split'){const ids=selected.filter(c=>c.checked).map(c=>c.value);if(!ids.length||ids.length===part.memberIds.length){feedback('분리할 일부 항목을 선택해 주세요.');return;}part.memberIds=part.memberIds.filter(id=>!ids.includes(id));part.verdict='pending';r.parts.push({memberIds:ids,proposal:ids.map(id=>g.members.find(m=>m.id===id).name).join(' / ')+' — 분리 후 정리문을 검토해 주세요.',verdict:'pending'});}else part.verdict=action;
      actions.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await commit(r);render();feedback(action==='approve'?'검수 내용을 저장하고 제작실에 연결했습니다.':action==='hold'?'보류했습니다. 해당 정리문을 새 제작 요청에 전달하지 않습니다.':'분리한 두 정리문을 다시 검수해 주세요.');}catch(e){feedback(e.message);actions.querySelectorAll('button').forEach(b=>b.disabled=false);}
     };actions.append(b);
    }box.append(actions);
    if(part.verdict==='approve'){const refs=registry.reviewed_assets.filter(a=>a.group_id===g.id&&a.member_ids.some(id=>part.memberIds.includes(id))),links=node('div',undefined,'review-ready-links');links.append(node('b','검수 내용을 사용할 박스'));for(const id of new Set(refs.flatMap(a=>a.operation_ids))){const a=node('a',name(id),'review-operation-link');a.href='connections.html?reviewed='+encodeURIComponent(id);links.append(a);}if(!refs.some(a=>a.operation_ids.length))links.append(node('p','정리문은 저장됐습니다. 이 항목은 아직 제작용 연결 규칙이 없어 재료 등록이 필요합니다.'));box.append(links);}
    card.append(box);
   });host.append(card);if(typeof renderMath==='function')renderMath(card);shown++;
  }
  if(!shown)host.append(node('p','해당 상태의 검수 자료가 없습니다. 다른 필터를 선택해 주세요.'));
  $('groupCount').textContent=`전체 ${catalog.groups.length}묶음 · 현재 ${shown}묶음 표시`;
 }
 async function init(){
  host=$('reviewGroups');store=PAReviewClient.create(PASession.create());
  try{const response=await fetch('connection-registry.json',{cache:'no-store'});if(!response.ok)throw Error('제작 자산을 읽지 못했습니다.');registry=await response.json();adopt(await store.load());
   $('reviewStorage').textContent=store.get().storage==='team'?'공용 검수 원장에 저장됩니다. 같은 계정 서버의 제작실이 바로 사용합니다.':store.get().storage==='companion'?'이 PC의 검수 원장에 저장됩니다. 제작실이 같은 기록을 바로 사용합니다.':'이 브라우저에 저장되고 같은 사이트의 제작실에 연결됩니다. 다른 기기로 옮길 때는 검수 파일을 사용하세요.';
   $('boardSync').textContent='승인한 정리문은 문항 제작실에 연결됩니다.';
   $('groupSearch').oninput=render;$('reviewFilter').onchange=render;$('actor').addEventListener('change',render);
   $('refreshReviews').onclick=async()=>{try{adopt(await store.load());render();feedback('최신 검수 기록을 불러왔습니다.');}catch(e){feedback(e.message);}};
   $('exportGroups').onclick=()=>{const rows=M.current(ledger,catalog);if(!rows.length){feedback('저장된 검수가 없습니다.');return;}download('자산-검수.json',{schema:'problem-atom/review-transfer/1',groups:rows});feedback('검수 파일을 저장했습니다. 다른 기기에서 가져올 수 있습니다.');};
   $('importGroups').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>1000000)throw Error('검수 파일은 1MB 이하여야 합니다.');const data=JSON.parse(await f.text());if(!['problem-atom/review-transfer/1','problem-atom/group-review/1.0'].includes(data.schema)||!Array.isArray(data.groups)||!data.groups.length)throw Error('검수 파일 형식이 다릅니다.');for(const row of data.groups)M.validate({schema:'problem-atom/group-review/1.0',actor:row.actor,groups:[row]},catalog);for(const row of data.groups)adopt(await store.save({schema:'problem-atom/group-review/1.0',actor:row.actor,groups:[row]}));render();feedback('검수 파일을 저장하고 제작실에 연결했습니다.');}catch(error){feedback(error.message);}finally{e.target.value='';}};
   let legacyConnected=false;$('toggleIndividual').onclick=()=>{const n=$('individualReview');n.hidden=!n.hidden;if(!n.hidden&&!legacyConnected&&typeof connectComments==='function'){legacyConnected=true;connectComments();}$('toggleIndividual').setAttribute('aria-expanded',String(!n.hidden));};render();feedback('정리문과 연결될 박스를 확인한 뒤 승인해 주세요.');
  }catch(e){feedback(e.message);}
 }
 return {init};
})();
