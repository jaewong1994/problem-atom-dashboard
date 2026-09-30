// Bounded orchestration. The caller supplies the model composer and independent verifier.
// This module never claims that model self-checks or matching JSON prove mathematics.
(function(root,factory){const api=typeof module==='object'?factory(require('./model-contract.js'),require('./problem-design.js'),require('./connection-engine.js')):factory(root.PAModelContract,root.PAProblemDesign,root.PAConnections);if(typeof module==='object')module.exports=api;else root.PADesignBatch=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C,D,E){
 'use strict';
 async function run({registry,design,brief,batchId,count=1,maxAttempts=3,compose,verify,signal,onProgress=()=>{},previous=[],referenceStructure=null}){
  if(!Number.isInteger(count)||count<1||count>10||!Number.isInteger(maxAttempts)||maxAttempts<count||maxAttempts>30)throw Error('한 묶음은 1~10문항, 시도는 최대 30회로 정하세요.');
  if(typeof compose!=='function'||typeof verify!=='function')throw Error('모델 제작기와 독립 검산기를 연결해야 합니다.');
  if(typeof batchId!=='string'||!/^B-[a-zA-Z0-9-]{1,50}$/.test(batchId))throw Error('제작 묶음 번호를 확인하세요.');
  if(referenceStructure!==null&&(typeof referenceStructure!=='string'||!referenceStructure.trim()))throw Error('기준 문항의 구조 키를 확인하세요.');
  const normalized=D.normalize(design,registry);if(!normalized.tuning)throw Error('묶음 제작에는 설계 세부 조절과 유도 기록이 필요합니다.');
  if(!Array.isArray(previous)||previous.length>2000||previous.some(r=>!r||typeof r.instance_key!=='string'||!r.instance_key.trim()||typeof r.structural_key!=='string'||!r.structural_key.trim()))throw Error('이전 검산 결과의 구조·문항 키를 확인하세요.');
  const engine=E.create(registry),accepted=[],attempts=[],instances=new Set(previous.map(r=>r.instance_key)),structures=new Set(previous.map(r=>r.structural_key));
  let anchorStructure=referenceStructure;
  const checkpoint=()=>({schema:'problem-atom/design-batch/1',batch_id:batchId,requested:count,attempt_limit:maxAttempts,accepted:[...accepted],attempts:[...attempts],release_ready:false,human_approval:false});
  for(let i=0;i<maxAttempts&&accepted.length<count;i++){
   if(signal?.aborted)break;
   const request=C.makeRequest(registry,{revision:registry.revision,facts:[],nodes:[]},brief,'REQ-'+batchId+'-'+(i+1),normalized);
   let row={attempt:i+1,request_id:request.request_id,status:'pending'};
   try{
    // Feedback is evidence only, not permission to weaken selected controls.
    const result=await compose(request,{signal,referenceStructure:anchorStructure,previous:accepted.map(x=>({structure:x.result.design_evidence.structure,structural_key:x.verification.structural_key})),rejections:attempts.slice(-5).map(x=>({status:x.status,reasons:x.reasons}))});
    if(signal?.aborted)break;
    const contract=C.validateResult(result,request,registry,engine);
    if(!contract.accepted)row={...row,status:'contract_rejected',reasons:contract.errors};
    else{
     const checked=await verify({request,result,signal});
     if(signal?.aborted)break;
     if(checked?.verdict==='fail')row={...row,status:'math_rejected',reasons:Array.isArray(checked.errors)&&checked.errors.length?checked.errors.slice(0,20).map(e=>String(e).slice(0,1000)):['독립 검산에서 오류를 발견했습니다.']};
     else if(!checked||checked.verdict!=='pass'||checked.independent!==true||typeof checked.instance_key!=='string'||!checked.instance_key.trim()||typeof checked.structural_key!=='string'||!checked.structural_key.trim())row={...row,status:'math_review_pending',reasons:['독립 검산 또는 숫자를 제거한 구조 대조가 끝나지 않았습니다.']};
     else if(instances.has(checked.instance_key))row={...row,status:'duplicate_instance',reasons:['이미 만든 문항과 같습니다.']};
     else if(normalized.tuning.values.variation==='structure'&&structures.has(checked.structural_key))row={...row,status:'duplicate_structure',reasons:['숫자·함수명만 다른 같은 구조입니다.']};
     else if(normalized.tuning.values.variation==='numbers'&&anchorStructure&&anchorStructure!==checked.structural_key)row={...row,status:'structure_changed',reasons:['숫자만 바꾸는 요청인데 풀이 구조가 달라졌습니다.']};
     else{if(!anchorStructure)anchorStructure=checked.structural_key;instances.add(checked.instance_key);structures.add(checked.structural_key);accepted.push({request,result,verification:checked,status:'human_review_pending',release_ready:false});row={...row,status:'human_review_pending'};}
    }
   }catch(e){if(signal?.aborted)break;row={...row,status:'failed',reasons:[String(e.message||e).slice(0,1000)]};}
   attempts.push(row);await onProgress(checkpoint());
  }
  return {...checkpoint(),status:signal?.aborted?'cancelled':accepted.length===count?'human_review_pending':'attempt_limit_reached'};
 }
 return {run};
});
