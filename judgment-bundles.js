(function(root,factory){const api=typeof module==='object'?factory(require('./connection-engine.js'),require('./composition-graph.js')):factory(root.PAConnections,root.PAGraph);if(typeof module==='object')module.exports=api;else root.PABundles=api;})(typeof globalThis!=='undefined'?globalThis:this,(Connections,G)=>{
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 // A bundle is a reusable strategy, not a new atomic judgment or an approved asset.
 // Course availability comes from its actual operations, never from its generic title.
 const catalog=[
  {"id": "signed-area-roots", "name": "정적분·넓이와 근의 위치", "searchAlias": "정적분으로 정의된 함수 절댓값 적분", "idea": "넓이 차 → 음수인 구간 → 근의 범위", "effect": "적분 계산 전에 근의 위치를 나누는 판단이 필요합니다.", "members": ["PA-S03-AREA-01", "PA-S03-AREA-03"], "example": "$f=x(x-1)(x-k)$, $g(t)=\\int_t^{t+1}f-\\int_0^1|f|$. $g(-1)>0$이면?"},
  {"id": "count-to-area", "name": "절댓값 그래프·교점·넓이", "searchAlias": "개수함수 접선 넓이", "idea": "전체 개형 → 교점 개수 → 높이 선택 → 넓이", "effect": "교점 개수에서 찾은 높이가 마지막 넓이 계산에 쓰입니다.", "members": ["PA-S03-V-01", "PA-GRAMMAR-01", "PA-S03-GRAPH-01", "PA-S02-LEVELS-02", "PA-BRIDGE-05", "PA-S03-V-02", "PA-S03-AREA-04"], "example": "$H=x^3+x^2-x$와 $y=4|x|-3$ 사이의 넓이 $S$는?"},
  {"id": "limit-to-minimum", "name": "우극한·구간별 함수·최솟값", "searchAlias": "극한으로 만든 함수 이동한 두 함수의 곱", "idea": "구간과 끝점 → 좌우 값 → 전체 개형 → 최솟값", "effect": "어디까지 다가가는지와 그 값을 실제로 얻는지를 구별합니다.", "members": ["PA-S03-LIMIT-01", "PA-S03-LIMIT-02", "PA-S03-GRAPH-01", "PA-S03-MIN-01"], "example": "$f$는 $[-1,1]$에서 감소하고 $f(-1)=-2$. $h=g(x+)g((x+2)+)$의 최솟값은?"},
  {id:'view-candidates',name:'합성방정식과 그래프',searchAlias:'관점을 바꾸고 후보 좁히기',idea:'다르게 읽기 → 경우 나누기 → 조건 대조 → 검산',effect:'식을 바로 계산하기보다 조건을 연결해 가능한 대상을 찾아야 합니다.',members:['PA-MOTIF-S01-10','PA-MOTIF-S01-11','PA-MOTIF-S01-12','PA-MOTIF-S01-13'],example:'함수가 들어간 방정식을 교점 문제로 바꾸고, 접하는 경우에서 함수 후보를 남겨요.'},
  {id:'sign-cases',name:'정적분과 극값 개수',searchAlias:'값 대신 부호로 경우 나누기',idea:'모양 바꾸기 → 부호 판단 → 겹치는 경우 찾기',effect:'정확한 계산값보다 부호가 달라지는 위치가 풀이의 중심이 됩니다.',members:['PA-MOTIF-S01-01','PA-MOTIF-S01-02','PA-MOTIF-S01-03'],example:'적분을 전개하지 않고 도함수의 부호를 읽어, 극값을 하나만 남기는 경우를 찾아요.'},
  {id:'boundary-check',name:'절댓값과 연속·미분가능',searchAlias:'이어지는 곳을 먼저 맞추기',idea:'좌우 값 맞추기 → 근의 모양 확인 → 꺾이는 곳 구별',effect:'구간을 나누는 경계에서 무엇이 달라지는지 따져야 합니다.',members:['PA-MOTIF-S01-04','PA-MOTIF-S01-05'],example:'부호가 붙은 절댓값 함수를 연속으로 만든 뒤, 미분할 수 없는 위치를 찾아요.'},
  {id:'range-filter',name:'개수함수와 정수 조건',searchAlias:'범위를 좁혀 정수만 남기기',idea:'경우별 범위 찾기 → 대상 연결 → 정수 선별',effect:'구간의 끝점과 제외되는 후보까지 판단해야 합니다.',members:['PA-S02-LEVELS-02','PA-BRIDGE-05','PA-S02-LEVELS-03'],example:'교점 개수를 만족하는 높이를 찾고, 그 높이에 대응하는 매개변수 중 정수만 남겨요.'},
  {id:'moving-range',name:'움직이는 구간과 점의 개수',searchAlias:'움직이는 구간으로 간격 찾기',idea:'동시에 들어가는 때 찾기 → 개수 조건 비교 → 간격 결정',effect:'하나의 위치만 계산하지 않고 구간이 움직일 때의 경우를 비교합니다.',members:['PA-S02-WINDOW-01','PA-S02-WINDOW-02'],example:'길이가 정해진 구간에 두 근이 함께 들어갈 수 있는 때를 이용해 두 근의 간격을 찾아요.'},
  {id:'valid-distinct',name:'구간별 방정식과 실근',searchAlias:'범위 밖 후보와 중복 걷어내기',idea:'구간에 맞는 해 선별 → 겹치는 해 합치기',effect:'식을 풀어 얻은 후보와 실제로 세어야 하는 답을 구별합니다.',members:['PA-S02-SIGNED-03','PA-S02-JUMP-04'],example:'한쪽 구간에서 나온 해가 그 구간에 속하는지 확인하고, 경계에서 겹친 해는 한 번만 세요.'},
  {id:'boundary-transfer',name:'함수의 관계식과 정적분',searchAlias:'경계를 맞춰 다른 구간에 이어 쓰기',idea:'값·기울기 맞추기 → 상수 결정 → 아는 구간으로 이동',effect:'한 구간에서 찾은 정보를 다른 구간의 계산에 사용합니다.',members:['PA-S02-RECURRENCE-01','PA-S02-RECURRENCE-02'],example:'구간 경계에서 상수를 정한 뒤, 구간 사이 관계로 정적분을 계산해요.'}
 ];
 function definition(id){return catalog.find(b=>b.id===id)||null;}
 function slots(op){return [...new Set([...op.requires,...op.provides,...op.forbids].flatMap(p=>[p.subject,p.object].filter(Boolean).map(x=>x.slice(1))))];}
 function node(id,bindings={f:'F',h:'H',a:'a'},scope='main'){return {id,bindings:clone(bindings),scope};}
 function materialize(p,n){return {type:p.type,subject:n.bindings[p.subject.slice(1)],scope:n.scope,origin:'given',...(p.object?{object:n.bindings[p.object.slice(1)]}:{})};}
 function seed(registry,id){
  const b=definition(id),ids=b?b.members:[id],ops=new Map(registry.operations.map(o=>[o.id,o])),facts=new Map(),provided=new Set(),nodes=ids.map(id=>node(id));
  for(const n of nodes){const o=ops.get(n.id);if(!o)throw Error('등록되지 않은 재료입니다.');for(const p of o.requires){const f=materialize(p,n);if(!provided.has(G.key(f)))facts.set(G.key(f),f);}for(const p of o.provides)provided.add(G.key(materialize(p,n)));}
  const plan={revision:registry.revision,nodes,facts:[...facts.values()]},g=G.compile(plan,registry);
  if(g.result.status!=='connected')throw Error('이 묶음의 시작 조건을 준비할 수 없습니다.');
  return {plan:g.plan,coreId:nodes[nodes.length-1].id};
 }
 function courses(registry,id){const b=definition(id),ops=(b?b.members:[id]).map(id=>registry.operations.find(o=>o.id===id));return [...new Set(ops[0]?.curriculum||[])].filter(course=>ops.every(o=>o?.curriculum?.includes(course)));}
 function same(a,b,registry){const op=registry.operations.find(o=>o.id===a.id);return a.id===b.id&&a.scope===b.scope&&slots(op).every(s=>a.bindings[s]===b.bindings[s]);}
 function groups(plan,registry){
  const g=G.compile(plan,registry),out=[],claimed=new Set();
  for(const b of catalog){const actual=b.members.map(id=>g.plan.nodes.find(n=>n.id===id));if(actual.some(n=>!n||claimed.has(n.id)))continue;
   const bindings={},scope=actual[0].scope;let consistent=true;
   for(const n of actual){if(n.scope!==scope)consistent=false;for(const s of slots(registry.operations.find(o=>o.id===n.id))){if(bindings[s]&&bindings[s]!==n.bindings[s])consistent=false;bindings[s]=n.bindings[s];}}
   if(!consistent)continue;
   const expected=G.compile(seed(registry,b.id).plan,registry).edges.filter(e=>e.from!=='@start');
   // Check real dependency, not just co-occurrence or equal node names.
   if(!expected.every(e=>g.edges.some(a=>a.from===e.from&&a.to===e.to))||actual.some(n=>g.result.trace.find(t=>t.id===n.id)?.status!=='direct'))continue;
   const memberSet=new Set(b.members);
   // Collapsing a non-convex subgraph could hide a dependency or create a cycle.
   const outside=g.plan.nodes.filter(n=>!memberSet.has(n.id));
   const reaches=(from,to,seen=new Set())=>from===to||(!seen.has(from)&&(seen.add(from),g.edges.filter(e=>e.from===from).some(e=>reaches(e.to,to,seen))));
   if(outside.some(n=>b.members.some(m=>reaches(m,n.id))&&b.members.some(m=>reaches(n.id,m))))continue;
   out.push({...clone(b),bindings,scope,inputs:actual.flatMap(n=>g.inputs[n.id].filter(i=>!memberSet.has(i.source))),joins:g.edges.filter(e=>memberSet.has(e.from)&&memberSet.has(e.to)),courses:courses(registry,b.id)});b.members.forEach(id=>claimed.add(id));
  }return out;
 }
 function placements(plan,registry,id){
  const template=seed(registry,id).plan,engine=Connections.create(registry),run=engine.run(plan);if(run.status!=='connected')return [];
  // Unify every external input, including relation objects and scope. No new givens.
  let states=[{bindings:{},scope:null}];
  for(const need of template.facts){const next=[];for(const s of states)for(const fact of run.facts){if(fact.type!==need.type||(s.scope&&s.scope!==fact.scope)||Boolean(need.object)!==Boolean(fact.object))continue;const bindings={...s.bindings};let ok=true;for(const [label,value]of [[need.subject,fact.subject],...(need.object?[[need.object,fact.object]]:[])]){if(bindings[label]&&bindings[label]!==value)ok=false;bindings[label]=value;}if(ok)next.push({bindings,scope:fact.scope});}states=[...new Map(next.map(s=>[JSON.stringify(s),s])).values()].slice(0,128);if(!states.length)return [];}
  const choices=[];
  for(const s of states){const nodes=template.nodes.map(n=>node(n.id,Object.fromEntries(Object.entries(n.bindings).map(([k,v])=>[k,s.bindings[v]||v])),s.scope));if(nodes.some(n=>plan.nodes.some(old=>old.id===n.id&&!same(n,old,registry))))continue;
   const added=nodes.filter(n=>!plan.nodes.some(old=>old.id===n.id));if(!added.length)continue;
   const g=G.compile({...clone(plan),nodes:[...clone(plan.nodes),...added]},registry);if(g.result.status!=='connected'||added.some(n=>g.result.trace.find(t=>t.id===n.id)?.redundant))continue;
   const memberSet=new Set(nodes.map(n=>n.id));if(plan.nodes.length&&!g.edges.some(e=>memberSet.has(e.to)&&e.from!=='@start'&&!added.some(n=>n.id===e.from)))continue;
   if(definition(id)&&!groups(g.plan,registry).some(b=>b.id===id))continue;
   choices.push({id,nodes:added,plan:g.plan});
  }return choices;
 }
 function attach(plan,registry,item){const fresh=placements(plan,registry,item.id).find(p=>JSON.stringify(p.nodes)===JSON.stringify(item.nodes));if(!fresh)throw Error('현재 풀이와 이어지는 묶음을 다시 고르세요.');return fresh.plan;}
 function view(plan,registry,expanded=[]){
  const graph=G.compile(plan,registry),bundles=groups(plan,registry),owner=new Map(),nodes=[];
  for(const b of bundles)if(!expanded.includes(b.id))for(const id of b.members)owner.set(id,'@bundle:'+b.id);
  for(const n of graph.plan.nodes){const id=owner.get(n.id)||n.id;if(nodes.some(n=>n.id===id))continue;nodes.push({id,members:owner.has(n.id)?bundles.find(b=>'@bundle:'+b.id===id).members:[n.id]});}
  const edges=new Map();for(const e of graph.edges){const from=owner.get(e.from)||e.from,to=owner.get(e.to)||e.to;if(from===to)continue;const k=JSON.stringify([from,to]);if(!edges.has(k))edges.set(k,{from,to,via:[]});edges.get(k).via.push(...e.via);}
  const rank=new Map([['@start',0]]),remaining=[...nodes],rows=[];
  while(remaining.length){const at=remaining.findIndex(n=>[...edges.values()].filter(e=>e.to===n.id).every(e=>rank.has(e.from)));if(at<0){if(!owner.size)throw Error('지도 연결에 순환이 있습니다.');return view(plan,registry,bundles.map(b=>b.id));}const [n]=remaining.splice(at,1),level=1+Math.max(0,...[...edges.values()].filter(e=>e.to===n.id).map(e=>rank.get(e.from)));rank.set(n.id,level);(rows[level-1]||=[]).push(n.id);}
  return {graph,bundles,nodes,owner,edges:[...edges.values()],rows:rows.filter(Boolean)};
 }
 function instruction(plan,registry,anchor){const bundles=groups(plan,registry);return (bundles.length?'선택한 판단 묶음: '+bundles.map(b=>b.name+' ['+b.members.join(', ')+']').join('; ')+'. 묶음 안의 판단이 모두 답에 기여해야 합니다. 각 판단을 빼거나 더 쉬운 풀이로 건너뛸 수 있는지 검사하세요.':'선택한 재료가 모두 답에 기여하도록 구성하세요.')+' 연결 기준 단계 '+anchor+'만 특별히 어려운 핵심으로 강제하지 마세요. 원자 수나 묶음 크기를 난도로 보지 마세요.';}
 return {catalog,definition,seed,courses,groups,placements,attach,view,instruction};
});
