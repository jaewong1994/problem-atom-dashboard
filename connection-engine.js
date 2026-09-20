(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PAConnections=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='connections-1.0';
 const key=f=>JSON.stringify([f.type,f.subject,f.object||null,f.scope]);
 const clone=x=>JSON.parse(JSON.stringify(x));
 function create(registry){
  if(registry.schema!=='problem-atom/connections/1')throw Error('지원하지 않는 통합 자산 형식입니다.');
  const ops=new Map(registry.operations.map(o=>[o.id,o]));
  if(ops.size!==registry.operations.length)throw Error('중복 연결 ID');
  function materialize(port,bindings,scope){
   const subject=bindings[port.subject.slice(1)];
   if(typeof subject!=='string'||!subject.trim()||subject.length>100)throw Error(`대상 지정 필요: ${port.subject}`);
   if(typeof scope!=='string'||!scope.trim())throw Error('가정 범위가 필요합니다.');
   const result={type:port.type,subject,scope};
   if(port.object){const object=bindings[port.object.slice(1)];if(typeof object!=='string'||!object.trim())throw Error('대응하는 대상 지정 필요: '+port.object);result.object=object;}
   return result;
  }
  function prepare(facts){
   if(!Array.isArray(facts)||facts.length>2000)throw Error('입력 조건 목록 오류');
   const unique=new Map();
   for(const f of facts){
    if(!registry.types[f.type]||typeof f.subject!=='string'||!f.subject.trim()||typeof f.scope!=='string'||!f.scope.trim()||(f.object!==undefined&&(typeof f.object!=='string'||!f.object.trim())))throw Error('등록되지 않은 조건 또는 대상·범위 누락');
    if(!['given','derived'].includes(f.origin))throw Error('조건의 출처 표시가 필요합니다.');
    unique.set(key(f),clone(f));
   }
   return [...unique.values()];
  }
  function contradictions(facts){
   const set=new Set(facts.map(key));const errors=[];
   for(const [a,b] of registry.contradictions)for(const f of facts.filter(x=>x.type===a))if(set.has(key({...f,type:b})))errors.push(`${f.subject}: ${registry.types[a]} / ${registry.types[b]}가 충돌합니다.`);
   return errors;
  }
  function inspect(facts,node){
   const op=ops.get(node.id);
   const base={id:node.id,name:op?.name||node.id,missing:[],outputs:[],reasons:[],status:'blocked'};
   if(!op)return {...base,reasons:['등록되지 않은 연결입니다.']};
   if(op.contract_status!=='encoded')return {...base,reasons:['연결 조건이 아직 작성되지 않았습니다.']};
   try{
    const bindings=node.bindings||{};const scope=node.scope;
    const required=op.requires.map(p=>materialize(p,bindings,scope));
    const output=op.provides.map(p=>materialize(p,bindings,scope));
    const forbidden=(op.forbids||[]).map(p=>materialize(p,bindings,scope));
    if(op.kind==='bridge'&&op.id==='PA-BRIDGE-01'&&bindings.f===bindings.h)return {...base,reasons:['기울기 항을 뺀 함수는 다른 대상으로 이름을 붙여야 합니다.']};
    const current=new Set(facts.map(key));
    const clashes=forbidden.filter(p=>current.has(key(p)));
    const errors=contradictions(facts);
    if(clashes.length||errors.length)return {...base,reasons:[...clashes.map(p=>'사용 금지: '+registry.types[p.type]),...errors]};
    const missing=required.filter(p=>!current.has(key(p)));
    const redundant=output.every(p=>current.has(key(p)));
    return {...base,status:missing.length?'conditional':'direct',missing,outputs:output,redundant,
     reasons:missing.length?['필요한 조건 또는 앞 단계의 결과가 부족합니다.']:[],guard:op.guard_note,
     work:clone(op.work),influence:clone(op.influence)};
   }catch(e){return {...base,reasons:[e.message]};}
  }
  function apply(facts,node){
   const check=inspect(facts,node);
   if(check.status!=='direct')return {check,facts:clone(facts)};
   const map=new Map(facts.map(f=>[key(f),clone(f)]));
   const contract=ops.get(node.id);
   for(const f of check.outputs)if(!map.has(key(f)))map.set(key(f),{...f,origin:'derived',by:node.id,
    contract_revision:contract.revision,bindings:clone(node.bindings),
    depends_on:contract.requires.map(p=>key(materialize(p,node.bindings,node.scope)))});
   return {check,facts:[...map.values()]};
  }
  function run(plan){
   if(!plan||!Array.isArray(plan.nodes)||plan.nodes.length>100)throw Error('연결은 100단계 이내여야 합니다.');
   if(plan.revision&&plan.revision!==registry.revision)throw Error('자산이 바뀌었습니다. 기존 연결을 다시 검토해야 합니다.');
   // A submitted plan may declare starting conditions, but cannot smuggle in derived facts.
   if((plan.facts||[]).some(f=>f.origin!=='given'))throw Error('시작 조건은 given만 허용합니다. 결과는 연결 단계에서 도출해야 합니다.');
   let facts=prepare(plan.facts||[]);const trace=[];const errors=contradictions(facts);
   if(errors.length)return {status:'blocked',errors,trace,facts,release_ready:false};
   for(const node of plan.nodes){const result=apply(facts,node);trace.push({...result.check,node:clone(node)});facts=result.facts;}
   const passed=trace.length>0&&trace.every(s=>s.status==='direct');
   const work={algebra:0,branches:0};
   trace.filter(s=>s.status==='direct'&&!s.redundant).forEach(s=>{for(const k of Object.keys(work))work[k]+=Number(s.work?.[k]||0);});
   return {status:passed?'connected':trace.some(s=>s.status==='blocked')?'blocked':'conditional',trace,facts,errors,work,
    release_ready:false,scope_note:'조건을 충족하는 풀이 연결입니다. 계산 수행·문항의 존재·정답 유일성을 보증하지 않습니다.',revision:registry.revision};
  }
  function suggest(facts,target,{maxDepth=3,limit=5,bindings={}}={}){
   maxDepth=Math.min(3,Math.max(0,maxDepth));
   const direct=inspect(facts,target);
   if(direct.status==='direct')return {status:'direct',paths:[],check:direct};
   if(direct.status==='blocked')return {status:'blocked',paths:[],check:direct};
   const pool=registry.operations.filter(o=>o.kind==='bridge');
   const bind={...bindings,...target.bindings};
   const queue=[{facts:clone(facts),nodes:[]}];const seen=new Set([facts.map(key).sort().join('|')]);const paths=[];
   while(queue.length&&paths.length<limit){
    const cur=queue.shift();if(cur.nodes.length>=maxDepth)continue;
    for(const op of pool){
     // Enumerate only explicit entity names supplied by the caller, never invent assumptions.
     const variants=[bindings,bind];
     if(bind.h)variants.push({...bind,f:bind.h});
     for(const bs of variants){
      const node={id:op.id,bindings:bs,scope:target.scope};
      const next=apply(cur.facts,node);if(next.check.status!=='direct'||next.check.redundant)continue;
      const nodes=[...cur.nodes,node];
      if(inspect(next.facts,target).status==='direct'){paths.push(nodes);continue;}
      const hash=next.facts.map(key).sort().join('|');
      if(!seen.has(hash)){seen.add(hash);queue.push({facts:next.facts,nodes});}
     }
    }
   }
   return {status:paths.length?'bridge':'conditional',paths,check:direct};
  }
  function pair(fromId,toId){
   const from=ops.get(fromId),to=ops.get(toId);
   if(!from||!to)return {status:'blocked',reason:'연결 계약이 없는 자산입니다.'};
   const shared=from.provides.filter(a=>to.requires.some(b=>a.type===b.type));
   const clash=from.provides.filter(a=>(to.forbids||[]).some(b=>a.type===b.type));
   if(clash.length)return {status:'blocked',reason:'앞 단계의 결과와 다음 단계의 금지 조건이 충돌합니다.'};
   // Pair matching is discovery, not a pass: entity binding and all requirements must be checked in run().
   return {status:shared.length?'conditional':'unrelated',shared:shared.map(p=>p.type),
    reason:shared.length?'이어지는 결과가 있습니다. 대상·범위·나머지 조건을 확인하세요.':'바로 전달되는 결과가 없습니다. 가교 또는 다른 연결이 필요합니다.'};
  }
  return {run,inspect,apply,suggest,pair,prepare,registry};
 }
 return {VERSION,create};
});
