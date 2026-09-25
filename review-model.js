(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PAReviewModel=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 function catalog(registry,legacy,examples){
  // Catalog compilation runs in Node; browsers read the compiled catalog.
  const digest=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const groups=copy(legacy.groups),covered=new Set();
  for(const g of groups){
   g.operations=registry.operations.filter(o=>o.supports.some(id=>g.members.some(m=>m.id===id))).map(o=>o.id);
   g.operations.forEach(id=>covered.add(id));g.revision+=':'+digest(g.operations.map(id=>registry.operations.find(o=>o.id===id)));
  }
  for(const o of registry.operations.filter(o=>!covered.has(o.id))){
   const d=examples?.get(o.id),r=registry.records.find(r=>r.id===o.id);
   groups.push({id:'operation-'+o.id,title:d?.name||o.name,proposal:[o.name,o.guard_note].join('. '),guard:o.guard_note,
    members:[{id:o.id,name:d?.name||o.name,definition:r?.payload?.definition||o.guard_note,kind:o.kind,author:d?.source||'연결 재료'}],
    operations:[o.id],revision:digest([o,r?.payload,d?.name]),relation:'제작실에서 사용하는 박스',reason:'이 박스의 사용 조건과 예시를 확인해 주세요.',regression_notes:o.verification?.review_notes||[]});
  }
  return {schema:'problem-atom/review-catalog/1',registry_revision:registry.revision,groups,checks:legacy.checks||[]};
 }
 function validate(payload,catalog){
  if(payload?.schema!=='problem-atom/group-review/1.0')throw Error('검수 파일 형식이 다릅니다.');
  const actor=typeof payload.actor==='string'?payload.actor.trim():'';
  if(!actor||actor.length>40)throw Error('검토자 이름을 입력해 주세요.');
  if(!Array.isArray(payload.groups)||!payload.groups.length||payload.groups.length>200)throw Error('저장할 검수가 없습니다.');
  const seen=new Set();return payload.groups.map(row=>{
   const g=catalog.groups.find(g=>g.id===row.groupId);
   if(!g||row.revision!==g.revision)throw Error('재료나 연결 조건이 바뀌었습니다. 새로고침 후 다시 검수해 주세요.');
   if(seen.has(g.id)||row.actor!==actor)throw Error('중복 묶음 또는 검토자 불일치');seen.add(g.id);
   if(!Array.isArray(row.parts)||!row.parts.length||row.parts.length>g.members.length)throw Error('묶음 구성이 잘못됐습니다.');
   const members=[];const parts=row.parts.map(p=>{
    if(!Array.isArray(p.memberIds)||!p.memberIds.length||typeof p.proposal!=='string'||!p.proposal.trim()||p.proposal.length>10000||!['pending','approve','hold'].includes(p.verdict))throw Error('정리문과 검수 상태를 확인해 주세요.');
    if(p.verdict==='approve'&&p.proposal.includes('분리 후 정리문을 검토해 주세요.'))throw Error('분리된 항목의 정리문을 먼저 작성해 주세요.');
    members.push(...p.memberIds);return {memberIds:[...p.memberIds],proposal:p.proposal.trim(),verdict:p.verdict};
   });
   if(new Set(members).size!==members.length||members.length!==g.members.length||members.some(id=>!g.members.some(m=>m.id===id)))throw Error('분리한 항목에 누락·중복·외부 항목이 있습니다.');
   return {groupId:g.id,revision:g.revision,actor,parts,at:typeof row.at==='string'?row.at:''};
  });
 }
 function current(ledger,catalog){
  const by=new Map();
  for(const row of ledger?.groups||[]){try{
   const [r]=validate({schema:'problem-atom/group-review/1.0',actor:row.actor,groups:[row]},catalog);
   if(!Number.isFinite(Date.parse(r.at)))continue;
   const old=by.get(r.groupId);if(!old||r.at>=old.at)by.set(r.groupId,r);
  }catch(_){}}
  return [...by.values()].sort((a,b)=>a.groupId.localeCompare(b.groupId));
 }
 function assets(registry,catalog,ledger){
  const rows=[];
  for(const r of current(ledger,catalog))r.parts.forEach((p,i)=>{
   if(p.verdict!=='approve')return;
   const g=catalog.groups.find(g=>g.id===r.groupId),operationIds=g.operations.filter(id=>{
    const o=registry.operations.find(o=>o.id===id);return o&&p.memberIds.some(id=>o.id===id||o.supports.includes(id));
   });
   rows.push({id:'review:'+g.id+':'+i,group_id:g.id,source_revision:g.revision,title:g.title,summary:p.proposal,
    member_ids:p.memberIds,operation_ids:operationIds,reviewer:r.actor,reviewed_at:r.at,approval_scope:'정리문과 선택한 항목 · 연결 규칙과 완성 문항의 품질 승인은 별도'});
  });return rows;
 }
 const forOperation=(registry,id)=>(registry.reviewed_assets||[]).filter(a=>a.operation_ids.includes(id));
 const forPlan=(registry,plan)=>(registry.reviewed_assets||[]).filter(a=>a.operation_ids.some(id=>plan.nodes.some(n=>n.id===id)));
 return {catalog,validate,current,assets,forOperation,forPlan};
});
