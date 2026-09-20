(function(root,factory){const api=typeof module==='object'?factory(require('./connection-engine.js'),require('./selection-model.js')):factory(root.PAConnections,root.PASelection);if(typeof module==='object')module.exports=api;else root.PAGraph=api;})(typeof globalThis!=='undefined'?globalThis:this,(Connections,Selection)=>{
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),key=f=>JSON.stringify([f.type,f.subject,f.object||null,f.scope]);
 const ROLES={reasoning:{name:'추론',action:'추론 이어 붙이기',help:'조건 사이의 관계를 찾거나 경우를 나누는 생각'},calculation:{name:'계산',action:'계산 붙이기',help:'앞에서 얻은 식을 정리·미분·적분하는 작업'},finishing:{name:'마무리',action:'마무리 붙이기',help:'후보를 고르거나 개수·합 등 마지막 답을 정하는 작업'}};
 const calculation=new Set(['PA-MOTIF-S01-01','PA-MOTIF-S01-07','PA-S02-RECURRENCE-02','PA-S02-RECURRENCE-03','PA-S02-TRAVEL-02','PA-S02-TRAVEL-03','PA-BRIDGE-02','PA-BRIDGE-04','PA-BRIDGE-06','PA-CAND-SKL-20260910-033','PA-CAND-SKL-20260914-001']);
 const finishing=new Set(['PA-MOTIF-S01-09','PA-MOTIF-S01-13','PA-S02-LEVELS-03','PA-S02-JUMP-04','PA-S02-WINDOW-04','PA-S02-SIGNED-03','PA-S02-TRAVEL-04','PA-OP-FIXED-LEVELS','PA-BRIDGE-03','PA-BRIDGE-05']);
 function defaultRole(id){return finishing.has(id)?'finishing':calculation.has(id)?'calculation':'reasoning';}
 // These are useful starting suggestions, not permanent mathematical types.
 function rolesFor(id){return [...new Set([defaultRole(id),'reasoning',...(calculation.has(id)||/LEVELS|TRAVEL|RECURRENCE|BRIDGE-0[1246]/.test(id)?['calculation']:[]),...(finishing.has(id)?['finishing']:[])])];}
 function state(value,plan){
  const ids=new Set(plan.nodes.map(n=>n.id)),roles={},positions={};
  for(const [id,role]of Object.entries(value?.roles||{})){if(!ids.has(id))continue;if(!ROLES[role])throw Error('노드의 역할이 올바르지 않습니다.');roles[id]=role;}
  for(const [id,p]of Object.entries(value?.positions||{}))if((ids.has(id)||['@start','@question'].includes(id))&&Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=0&&p.y>=0&&p.x<=30000&&p.y<=30000)positions[id]={x:p.x,y:p.y};
  return {roles,positions};
 }
 function role(id,view){return view?.roles?.[id]||defaultRole(id);}
 function materialize(p,n){return {type:p.type,subject:n.bindings[p.subject.slice(1)],scope:n.scope,...(p.object?{object:n.bindings[p.object.slice(1)]}:{})};}
 function compile(plan,registry){
  const engine=Connections.create(registry),ops=new Map(registry.operations.map(o=>[o.id,o])),remaining=clone(plan.nodes),ordered=[];
  if(new Set(remaining.map(n=>n.id)).size!==remaining.length)throw Error('같은 재료를 다른 대상에 두 번 쓰는 지도는 아직 지원하지 않습니다.');
  let available=engine.prepare(plan.facts),guard=0;
  while(remaining.length&&guard++<100){const at=remaining.findIndex(n=>engine.inspect(available,n).status==='direct');if(at<0)break;const [n]=remaining.splice(at,1);available=engine.apply(available,n).facts;ordered.push(n);}
  const compiled={...clone(plan),nodes:[...ordered,...remaining]},result=engine.run(compiled),edges=new Map(),inputs={};
  available=engine.prepare(compiled.facts);
  for(const n of compiled.nodes){const op=ops.get(n.id);if(!op)continue;const facts=new Map(available.map(f=>[key(f),f]));inputs[n.id]=[];
   for(const p of op.requires){const required=materialize(p,n),f=facts.get(key(required));inputs[n.id].push({fact:required,source:f?(f.origin==='given'?'@start':f.by):null});if(!f)continue;
    const from=f.origin==='given'?'@start':f.by,id=JSON.stringify([from,n.id]);if(!edges.has(id))edges.set(id,{from,to:n.id,via:[]});edges.get(id).via.push(key(required));
   }
   available=engine.apply(available,n).facts;
  }
  return {plan:compiled,result,edges:[...edges.values()],inputs};
 }
 const edgeKey=e=>JSON.stringify([e.from,e.to,[...e.via].sort()]);
 function normalizedEdges(edges){return edges.map(e=>({from:e.from,to:e.to,via:[...e.via].sort()})).sort((a,b)=>edgeKey(a).localeCompare(edgeKey(b)));}
 function spec(plan,registry,view){const graph=compile(plan,registry);if(graph.result.status!=='connected')throw Error('지도의 부족한 조건과 충돌을 먼저 해결하세요.');return {schema:'problem-atom/reasoning-graph/1',roles:graph.plan.nodes.map(n=>({id:n.id,role:role(n.id,view)})),edges:normalizedEdges(graph.edges)};}
 function normalizeSpec(value,plan,registry){
  if(!value||value.schema!=='problem-atom/reasoning-graph/1'||!Array.isArray(value.roles)||!Array.isArray(value.edges)||value.roles.length!==plan.nodes.length||value.edges.length>2000)throw Error('풀이 지도 형식이 다릅니다.');
  const roles={},ids=new Set(plan.nodes.map(n=>n.id));
  for(const r of value.roles){if(!ids.has(r?.id)||Object.hasOwn(roles,r.id)||!ROLES[r.role])throw Error('지도 역할의 재료·종류가 다릅니다.');roles[r.id]=r.role;}
  for(const e of value.edges)if(!e||typeof e.from!=='string'||typeof e.to!=='string'||!Array.isArray(e.via)||!e.via.length||e.via.some(v=>typeof v!=='string'))throw Error('지도 연결 정보가 올바르지 않습니다.');
  const expected=spec(plan,registry,{roles});
  if(JSON.stringify(normalizedEdges(value.edges))!==JSON.stringify(expected.edges))throw Error('그린 연결과 실제 풀이에 전달되는 정보가 다릅니다.');
  return expected;
 }
 function validateResult(value,plan,registry){const actual=new Set(compile(plan,registry).edges.flatMap(e=>e.via.map(v=>JSON.stringify([e.from,e.to,v]))));return value.edges.flatMap(e=>e.via.filter(v=>!actual.has(JSON.stringify([e.from,e.to,v]))).map(()=>`지도에서 정한 연결이 빠졌습니다: ${e.from} → ${e.to}`));}
 function recommendations(plan,registry,fromId,requestedRole){
  if(!plan.nodes.some(n=>n.id===fromId))return [];
  const compiled=compile(plan,registry);if(compiled.result.status!=='connected')return [];
  return Selection.recommendations(compiled.plan,Connections.create(registry),registry,fromId,{limit:registry.operations.length,includeIntermediate:true}).filter(r=>!requestedRole||rolesFor(r.id).includes(requestedRole)).sort((a,b)=>Number(defaultRole(b.id)===requestedRole)-Number(defaultRole(a.id)===requestedRole)||a.nodes.length-b.nodes.length);
 }
 function attach(plan,registry,fromId,item,requestedRole,view){
  if(!ROLES[requestedRole])throw Error('붙일 재료의 역할을 고르세요.');
  const fresh=recommendations(plan,registry,fromId,requestedRole).find(r=>r.id===item.id&&JSON.stringify(r.nodes)===JSON.stringify(item.nodes));
  if(!fresh)throw Error('이 노드에서 실제로 이어지는 재료를 다시 고르세요.');
  const next=compile({...plan,nodes:[...plan.nodes,...fresh.nodes]},registry).plan,nextView=state(view,next);nextView.roles[item.id]=requestedRole;
  return {plan:next,mapState:nextView};
 }
 function layout(graph,target,positions={},coreId=null){
  const core=coreId||graph.plan.nodes[0]?.id,ancestors=new Set();
  function visit(id){for(const e of graph.edges.filter(e=>e.to===id&&e.from!=='@start'))if(!ancestors.has(e.from)){ancestors.add(e.from);visit(e.from);}}
  if(core)visit(core);
  const left=['@start',...graph.plan.nodes.filter(n=>ancestors.has(n.id)).map(n=>n.id)],right=[...graph.plan.nodes.filter(n=>n.id!==core&&!ancestors.has(n.id)).map(n=>n.id),'@question'];
  const rows=Math.max(left.length,right.length,1),out={};
  for(const [ids,x]of [[left,32],[right,750]])ids.forEach((id,i)=>{out[id]=positions[id]||{x,y:36+(i+(rows-ids.length)/2)*186};});
  if(core)out[core]=positions[core]||{x:390,y:36+(rows-1)*93};
  return out;
 }

 return {ROLES,defaultRole,rolesFor,state,role,compile,spec,normalizeSpec,validateResult,recommendations,attach,layout,key};
});
