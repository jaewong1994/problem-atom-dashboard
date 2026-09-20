(function(root,factory){const api=typeof module==='object'?factory(require('./connection-engine.js'),require('./selection-model.js'),require('./composition-graph.js'),require('./curriculum-model.js')):factory(root.PAConnections,root.PASelection,root.PAGraph,root.PACurriculum);if(typeof module==='object')module.exports=api;else root.PAPlanner=api;})(typeof globalThis!=='undefined'?globalThis:this,(Connections,Selection,Graph,Curriculum)=>{
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const key=f=>JSON.stringify([f.type,f.subject,f.object||null,f.scope]);
 const GOALS={integer_answer:'가능한 정수의 개수·합',finite_parameter_set:'조건을 만족하는 매개변수',level_counts:'교점·실근의 개수',height_set:'조건을 만족하는 높이 범위',distance_result:'움직인 전체 거리',distance_bound:'갈 수 있는 최대 거리',tested_candidates:'조건을 만족하는 함수',candidate_functions:'가능한 함수의 식',distinct_roots:'서로 다른 근의 개수',shifted_integral:'정적분의 값',next_interval:'다음 구간의 함수식',boundary_equations:'연결 조건을 만족하는 계수',factor_zero:'연속이 되기 위한 조건',signed_corners:'미분할 수 없는 위치',root_gap:'두 근 사이의 간격',position_coefficients:'위치식의 계수',root_shape_candidates:'조건에 맞는 근의 배치',claim_results:'옳은 보기 고르기',repeated_factor:'연결 조건에서 함수의 인수 찾기'};
 function slots(op){return [...new Set([...op.requires,...op.provides,...op.forbids].flatMap(p=>[p.subject,p.object].filter(Boolean).map(s=>s.slice(1))))];}
 function sameNode(a,b,registry){const op=registry.operations.find(o=>o.id===a?.id);return Boolean(op&&a.id===b?.id&&a.scope===b.scope&&slots(op).every(s=>a.bindings?.[s]===b.bindings?.[s]));}
 function normalizeIntent(value,plan,registry){
  if(value==null)return null;
  if(value.schema!=='problem-atom/design-intent/1'||![0,1,2].includes(value.calculation)||![0,1,2].includes(value.reasoning))throw Error('제작 목표 형식이 다릅니다.');
  if(value.core_role!=null&&value.core_role!=='connection_anchor')throw Error('연결 기준의 역할이 다릅니다.');
  const core=plan.nodes.find(n=>sameNode(n,value.core,registry));
  if(!core)throw Error('핵심 재료와 적용 대상이 선택한 구성에 없습니다.');
  const t=value.target;
  if(!t||!registry.types[t.type]||typeof t.subject!=='string'||!t.subject.trim()||t.subject.length>100||typeof t.scope!=='string'||!t.scope.trim()||t.scope.length>100)throw Error('마지막에 구할 정보를 선택하세요.');
  const relation=registry.operations.some(o=>[...o.requires,...o.provides].some(p=>p.type===t.type&&p.object));
  if(relation?(typeof t.object!=='string'||!t.object.trim()||t.object.length>100):(t.object!=null))throw Error('질문의 대상 관계가 다릅니다.');
  return {schema:value.schema,core:clone(core),...(value.curriculum_scope?{curriculum_scope:Curriculum.normalize(value.curriculum_scope)}:{}),...(value.core_role?{core_role:value.core_role}:{}),target:{type:t.type,subject:t.subject,scope:t.scope,...(relation?{object:t.object}:{})},calculation:value.calculation,reasoning:value.reasoning,...(value.graph?{graph:Graph.normalizeSpec(value.graph,plan,registry)}:{})};
 }
 function intent(plan,registry,coreId,target,calculation,reasoning,graph=null){return normalizeIntent({...((graph)?{graph}:{}),schema:'problem-atom/design-intent/1',core:plan.nodes.find(n=>n.id===coreId),target,calculation,reasoning},plan,registry);}
 function lineage(result,target){
  const facts=new Map(result.facts.map(f=>[key(f),f])),steps=new Set(),keys=new Set();
  function visit(k){if(keys.has(k))return;keys.add(k);const f=facts.get(k);if(!f||f.origin!=='derived')return;steps.add(f.by);(f.depends_on||[]).forEach(visit);}
  visit(key(target));return {facts,keys,steps,goal:facts.get(key(target))};
 }
 function analyze(plan,registry,coreId,target){
  const engine=Connections.create(registry),result=engine.run(plan),issues=[],unused=[];
  const coreNode=plan.nodes.find(n=>n.id===coreId),coreStep=result.trace.find(t=>coreNode&&sameNode(t.node,coreNode,registry));
  const path=target?lineage(result,target):null,goalReady=Boolean(path?.goal?.origin==='derived');
  const coreOutputs=coreStep?.outputs||[];
  const coreConnected=Boolean(goalReady&&coreStep?.status==='direct'&&!coreStep.redundant&&coreOutputs.some(f=>path.keys.has(key(f))&&path.facts.get(key(f))?.origin==='derived'&&path.facts.get(key(f))?.by===coreId));
  if(result.status==='blocked')issues.push('서로 충돌하거나 적용할 수 없는 조건을 먼저 수정하세요.');
  if(coreStep?.redundant)issues.push('핵심으로 알아낼 정보를 이미 시작 조건으로 주었습니다. 핵심이 필요 없어질 수 있습니다.');
  if(target&&path?.goal?.origin==='given')issues.push('마지막에 구할 정보를 시작 조건으로 줄 수 없습니다.');
  if(goalReady&&coreNode&&!coreConnected)issues.push('마지막 질문으로 가는 풀이에 핵심 재료가 이어지지 않습니다.');
  if(goalReady&&result.status==='connected')for(const node of plan.nodes){
   const trace=result.trace.find(t=>sameNode(t.node,node,registry));
   const contributes=trace?.outputs.some(f=>path.keys.has(key(f))&&path.facts.get(key(f))?.by===node.id&&path.facts.get(key(f))?.scope===node.scope);
   if(!contributes)unused.push(node.id);
  }
  if(unused.length)issues.push('마지막 질문에 쓰이지 않는 재료 '+unused.length+'개가 있습니다. 빼거나 질문을 바꾸세요.');
  const relevant=result.trace.filter(t=>!t.redundant&&(!path||path.steps.has(t.id))&&t.status==='direct');
  const work=relevant.reduce((w,t)=>({algebra:w.algebra+(t.work?.algebra||0),branches:w.branches+(t.work?.branches||0)}),{algebra:0,branches:0});
  const ready=Boolean(coreNode&&target&&result.status==='connected'&&goalReady&&coreConnected&&!issues.length);
  return {result,ready,goalReady,coreConnected,issues,unused,work,steps:relevant.length,status:issues.length?'blocked':ready?'ready':'incomplete'};
 }
 function targets(plan,registry,coreId){
  const engine=Connections.create(registry),result=engine.run(plan),out=new Map();
  function add(f,route){
   if(!GOALS[f.type])return;const t={type:f.type,subject:f.subject,scope:f.scope,...(f.object?{object:f.object}:{})};
   const candidate={...plan,nodes:[...plan.nodes,...route]},a=analyze(candidate,registry,coreId,t);
   if(coreId&&a.goalReady&&!a.coreConnected)return;
   if(route.some(n=>a.unused.includes(n.id)))return;
   const row={target:t,name:GOALS[t.type],route,ready:a.ready,unused:a.unused.length};
   if(!out.has(key(t))||route.length<out.get(key(t)).route.length)out.set(key(t),row);
  }
  for(const f of result.facts.filter(f=>f.origin==='derived'))add(f,[]);
  const queue=[{plan,route:[],depth:0}],seen=new Set();let count=0;
  while(queue.length&&count++<24){
   const state=queue.shift();
   for(const r of Selection.recommendations(state.plan,engine,registry,coreId,{limit:registry.operations.length})){
    const route=[...state.route,...r.nodes],next={...plan,nodes:[...plan.nodes,...route]},applied=engine.run(next);
    for(const f of applied.facts.filter(f=>f.origin==='derived'&&f.by===r.id))add(f,route);
    const hash=applied.facts.map(key).sort().join('|');
    if(state.depth<1&&!seen.has(hash)){seen.add(hash);queue.push({plan:next,route,depth:state.depth+1});}
   }
  }
  // Conditional selections may still name a goal; the model must supply and verify missing premises.
  if(result.status==='conditional')for(const n of plan.nodes){
   const op=registry.operations.find(o=>o.id===n.id);if(!op)continue;
   for(const p of op.provides){const subject=n.bindings[p.subject.slice(1)];if(subject)add({type:p.type,subject,scope:n.scope,...(p.object?{object:n.bindings[p.object.slice(1)]}:{})},[]);}
  }
  return [...out.values()].sort((a,b)=>a.unused-b.unused||Number(b.ready)-Number(a.ready)||a.route.length-b.route.length);
 }
 function reorder(plan,registry){
  const engine=Connections.create(registry),remaining=clone(plan.nodes),ordered=[];let facts=engine.prepare(plan.facts);
  while(remaining.length){const at=remaining.findIndex(n=>engine.inspect(facts,n).status==='direct');if(at<0)return null;const [node]=remaining.splice(at,1);facts=engine.apply(facts,node).facts;ordered.push(node);}
  const next={...clone(plan),nodes:ordered};return engine.run(next).status==='connected'?next:null;
 }
 function validateResult(plan,registry,spec,seed){
  if(!spec)return [];
  const engine=Connections.create(registry),result=engine.run(plan),errors=[];
  for(const n of seed.nodes)if(!plan.nodes.some(actual=>sameNode(n,actual,registry)))errors.push('선택한 재료의 대상 또는 가정 범위가 바뀌었습니다: '+n.id);
  const retained=new Set(result.facts.map(key));for(const f of seed.facts)if(!retained.has(key(f)))errors.push('설계에서 정한 조건이 빠졌습니다: '+registry.types[f.type]);
  const audit=analyze(plan,registry,spec.core.id,spec.target);errors.push(...audit.issues);
  if(!audit.goalReady)errors.push('마지막 질문에 필요한 결과를 도출하지 못했습니다.');
  if(!audit.coreConnected)errors.push('핵심 재료에서 마지막 질문까지의 연결을 확인할 수 없습니다.');
  if(spec.curriculum_scope)errors.push(...Curriculum.audit(plan,registry,spec.curriculum_scope).issues);
  if(spec.graph)errors.push(...Graph.validateResult(spec.graph,plan,registry));
  return [...new Set(errors)];
 }
 return {GOALS,key,sameNode,normalizeIntent,intent,lineage,analyze,targets,reorder,validateResult};
});
