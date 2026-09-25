(function(root,factory){const api=typeof module==='object'?factory(require('./design-order.js'),require('./authoring-model.js'),require('./judgment-bundles.js'),require('./curriculum-model.js'),require('./composition-planner.js'),require('./model-contract.js'),require('./connection-engine.js')):factory(root.PADesignOrder,root.PAAuthoring,root.PABundles,root.PACurriculum,root.PAPlanner,root.PAModelContract,root.PAConnections);if(typeof module==='object')module.exports=api;else root.PADesignPlanner=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Order,Authoring,Bundles,Curriculum,Planner,Contract,Connections){
 'use strict';
 // 설계안(blueprint) 생성기. 주문(order)에서 출발해 원본 재생 사례(witness)·교차 예시(preset)를 틀로 삼아
 // 연결 엔진이 통과시키는 설계안만 내놓는다. 설계안은 모델 요청의 seed_plan이지 완성 문항이 아니다.
 const clone=x=>JSON.parse(JSON.stringify(x));
 const key=f=>JSON.stringify([f.type,f.subject,f.object||null,f.scope]);
 const strip=f=>({type:f.type,subject:f.subject,scope:f.scope||'main',origin:'given',...(f.object?{object:f.object}:{})});
 const UNIQUE_GOALS=['tested_candidates','integer_answer'];
 function materialize(port,node){const s=node.bindings[port.subject.slice(1)];return {type:port.type,subject:s,scope:node.scope,...(port.object?{object:node.bindings[port.object.slice(1)]}:{})};}

 // ---- 틀(template) ----
 function fromWitness(w){
  return {id:'W:'+w.source_question_id,name:w.id.replace('W-',''),source:w.source_question_id,origin:'witness',seminar:w.seminar||'',
   facts:w.facts.map(f=>({...strip(f),reads:f.reads||''})),nodes:clone(w.nodes),goals:w.goals.map(g=>({...g,scope:g.scope||'main'})),
   principles:clone(w.principle_ids||[]),bindings:clone(w.bindings||{f:'F',h:'G',a:'a'}),note:w.note||'',fusion_target:w.fusion_target!==false};
 }
 function fromPreset(p,registry){
  const nodes=clone(p.nodes);nodes.splice(p.bridge_at,0,...clone(p.bridge_nodes));
  const target=registry.operations.find(o=>o.id===p.target),last=nodes[nodes.length-1];
  return {id:'P:'+p.id,name:p.name,source:'preset',origin:'preset',seminar:'교차 예시',
   facts:p.facts.map(f=>({...strip(f),reads:registry.types[f.type]})),nodes,goals:target.provides.map(port=>materialize(port,last)),
   principles:[],bindings:{f:'F',h:'H',a:'a'},note:p.description||''};
 }
 function templates(registry,witnesses){
  return [...witnesses.witnesses.map(fromWitness),...registry.presets.map(p=>fromPreset(p,registry))];
 }

 // ---- 설계안 분석 ----
 function analyze(template,registry,engine){
  const ops=new Map(registry.operations.map(o=>[o.id,o]));
  const facts=template.facts.map(strip);
  const res=engine.run({facts,nodes:template.nodes});
  const have=new Set(res.facts.map(key));
  const goalsMet=template.goals.every(g=>have.has(key(g)));
  const stages=template.nodes.map(n=>Authoring.profile(n.id)?.stage||'unknown');
  const judge=stages.filter(s=>s==='judge').length,grammar=template.nodes.filter(n=>ops.get(n.id)?.exposure==='grammar').length;
  const unique=template.goals.some(g=>UNIQUE_GOALS.includes(g.type))?1:0;
  const score=2*judge+res.work.branches+grammar+unique+Math.floor(res.work.algebra/4);
  const wrappers=[...new Set(facts.map(f=>Order.wrapperOf(f.type)).filter(Boolean))];
  const families=[...new Set(template.nodes.map(n=>ops.get(n.id)?.grammar_family).filter(Boolean))];
  const bundles=Bundles.catalog.filter(b=>b.members.every(m=>template.nodes.some(n=>n.id===m))).map(b=>b.id);
  const units=[...new Set(template.nodes.flatMap(n=>Curriculum.classifications[n.id]?.main||[]))];
  // 조건 역할: 어느 단계가 소비하는지로 구조/수치/답 변환을 나눈다. 문면 설계용 분류이며 정본 온톨로지가 아니다.
  const consumers=new Map();
  for(const n of template.nodes){const op=ops.get(n.id);if(!op)continue;for(const p of op.requires){const k=key(materialize(p,n));if(!consumers.has(k))consumers.set(k,[]);consumers.get(k).push({id:n.id,stage:Authoring.profile(n.id)?.stage||'unknown'});}}
  const conditions=template.facts.map((f,index)=>{const c=consumers.get(key(strip(f)))||[];const st=c.map(x=>x.stage);
   const role=['selection_condition','root_sum_condition','known_value_condition','slope_point_condition','requested_count','nonsmooth_count_condition','one_extremum_required','window_limit_bound','total_distance'].includes(f.type)?'numeric':st.every(s=>['finish','bridge'].includes(s))&&st.length?'answer':'structural';
   return {index,type:f.type,label:registry.types[f.type]||f.type,subject:f.subject,object:f.object||null,reads:f.reads||'',role,consumers:c.map(x=>x.id),load_bearing:null};});
  return {status:res.status,connected:res.status==='connected'&&goalsMet,work:res.work,stages,judge,grammar,unique,score,level:Order.levelOf(score).id,
   wrappers,families,bundles,units,principles:template.principles,answer_form:Order.answerFormOf(template.goals.map(g=>g.type)),conditions,calibrated:false};
 }
 // 각 시작 조건을 빼 보아 하중(load_bearing)인지 확인한다. 장식 조건은 설계안에 남기지 않는다.
 function ablate(template,registry,engine){
  const base=analyze(template,registry,engine);
  for(const c of base.conditions){
   const facts=template.facts.filter((_,i)=>i!==c.index).map(strip);
   const res=engine.run({facts,nodes:template.nodes});const have=new Set(res.facts.map(key));
   c.load_bearing=!(res.status==='connected'&&template.goals.every(g=>have.has(key(g))));
  }
  return base;
 }

 // ---- 변형: 마지막 확정 단계를 떼어 한 단계 쉬운 설계안 ----
 function trimmed(template,registry,engine){
  const ops=new Map(registry.operations.map(o=>[o.id,o]));
  const nodes=[...template.nodes];const removed=[];
  while(nodes.length>2&&['finish','bridge'].includes(Authoring.profile(nodes[nodes.length-1].id)?.stage))removed.unshift(nodes.pop());
  if(!removed.length||removed.every(n=>ops.get(n.id).exposure==='grammar'))return null;
  const last=nodes[nodes.length-1],op=ops.get(last.id);
  const goals=op.provides.map(p=>materialize(p,last));
  // 남은 단계가 요구하지 않는 시작 조건은 장식이 되므로 함께 떼어낸다.
  const required=new Set(nodes.flatMap(n=>ops.get(n.id).requires.map(p=>key(materialize(p,n)))));
  const facts=template.facts.filter(f=>required.has(key(strip(f))));
  const t={...template,id:template.id+':trim',name:template.name+' · 확정 단계 제외',origin:template.origin+'-trimmed',facts,nodes,goals,note:'마지막 확정 단계('+removed.map(n=>n.id).join(', ')+')를 뗀 변형. 답은 '+goals.map(g=>registry.types[g.type]).join(', ')+'까지만 묻는다.'};
  const a=analyze(t,registry,engine);return a.connected?t:null;
 }

 // ---- 주문 대조와 순위 ----
 function match(order,template,analysis){
  const has=e=>e.kind==='principle'?analysis.principles.includes(e.id):e.kind==='family'?analysis.families.includes(e.id):e.kind==='operation'?template.nodes.some(n=>n.id===e.id):e.kind==='bundle'?analysis.bundles.includes(e.id):e.kind==='wrapper'?analysis.wrappers.includes(e.id):e.kind==='unit'?analysis.units.includes(e.id):false;
  const satisfied=order.include.filter(has),missing=order.include.filter(e=>!has(e)),violated=order.exclude.filter(has);
  const wrapperHit=order.wrappers.filter(w=>analysis.wrappers.includes(w));
  const target=Order.level(order.level);const levelGap=analysis.level===order.level?0:Math.abs(Order.LADDER.findIndex(l=>l.id===analysis.level)-Order.LADDER.findIndex(l=>l.id===order.level));
  const unitHit=!order.unit||analysis.units.includes(order.unit);
  const formHit=!order.answer_form||analysis.answer_form===order.answer_form;
  let score=3*satisfied.length-4*missing.length+2*wrapperHit.length-(order.wrappers.length&&!wrapperHit.length?2:0)-2*levelGap+(unitHit?1:-2)+(formHit?1:-1);
  if(violated.length)score=-Infinity;
  return {score,satisfied,missing,violated,wrappers:wrapperHit,level_gap:levelGap,unit_hit:unitHit,form_hit:formHit,target_level:target.id};
 }
 function brief(order,template,analysis,m){
  const l=Order.level(order.level);
  const lines=['목표 난이도: '+l.label+' — '+l.hint+'.',
   '설계 틀: '+template.name+(template.source&&template.origin==='witness'?' (원본 '+template.source+'의 풀이 구조를 재사용하되 수치·문면·포장은 새로 만든다)':''),
   '포장: '+(analysis.wrappers.map(w=>Order.WRAPPERS.find(x=>x.id===w).label).join(', ')||'자유'),
   '반드시 포함: '+(order.include.map(e=>e.kind+' '+e.id).join(', ')||'없음')+(m.missing.length?' — 이 틀에 없는 요소('+m.missing.map(e=>e.id).join(', ')+')는 풀이 경로에 실제로 필요하도록 추가하고, 불가능하면 unresolved에 적는다.':''),
   '제외: '+(order.exclude.map(e=>e.id).join(', ')||'없음'),
   '조건 역할: 구조 조건('+analysis.conditions.filter(c=>c.role==='structural').map(c=>c.label).join(', ')+')으로 후보를 유한하게 만들고, 수치 조건('+(analysis.conditions.filter(c=>c.role==='numeric').map(c=>c.label).join(', ')||'없음')+')으로 하나만 남긴다. 장식 조건을 넣지 않는다.',
   '답 형식: '+Order.ANSWER_FORMS.find(f=>f.id===(order.answer_form||analysis.answer_form)).label+'. 답은 정수 또는 서로소 분수로 떨어지게 기준점을 잡는다.'];
  if(analysis.principles.length)lines.push('출제 원리: '+analysis.principles.join(', ')+' (source-witnesses.json principles 참고).');
  if(order.notes)lines.push('추가 주문: '+order.notes);
  return lines.join('\n');
 }
 // ---- 재조합: A의 결론(함수 확정 등)이 B의 보이는 단계를 이어 주는 두 단 설계안 ----
 // B의 시작 조건 중 어떤 계약도 만들지 않는 종류(문면에서만 오는 조건)는 그대로 두고, 계약이 만들 수 있는 종류는 A의 도출 결과와 가교로만 채운다.
 const fusionCache=new Map();
 function fused(registry,witnesses,engine){
  const cacheKey=registry.revision+'|'+JSON.stringify(witnesses)+'|'+registry.operations.map(o=>o.id).join(',');
  if(fusionCache.has(cacheKey))return fusionCache.get(cacheKey);
  const ops=new Map(registry.operations.map(o=>[o.id,o]));const prov=new Set(registry.operations.flatMap(o=>o.provides.map(p=>p.type)));
  const base=templates(registry,witnesses);const out=[];
  for(const A of base)for(const B of base){
   if(A.id===B.id)continue;
   if([...A.nodes,...B.nodes].some(n=>!ops.has(n.id)))continue;   // 등록되지 않은 단계를 가진 틀은 결합하지 않는다
   if(B.fusion_target===false)continue;                          // B의 F가 포장 함수면 앞 문항의 f와 대상이 섞인다(BE-1)
   if(!B.facts.some(f=>prov.has(f.type)))continue;               // B가 앞 문항의 결과를 실제로 필요로 할 때만
   const runA=engine.run({facts:A.facts.map(strip),nodes:A.nodes});if(runA.status!=='connected')continue;
   const map={};for(const k of ['f','h','a'])map[A.bindings[k]]=B.bindings[k];
   const rename=f=>({...f,subject:map[f.subject]||f.subject,...(f.object?{object:map[f.object]||f.object}:{})});
   const aFacts=A.facts.map(rename),aNodes=A.nodes.map(n=>({...n,bindings:Object.fromEntries(Object.entries(n.bindings).map(([k,v])=>[k,map[v]||v]))}));
   const statement=B.facts.filter(f=>!prov.has(f.type));
   let state=engine.prepare([...aFacts.map(strip),...statement.map(strip)]);const nodes=[...aNodes];
   for(const n of aNodes)state=engine.apply(state,n).facts;
   let ok=true;
   for(const n of B.nodes.filter(n=>ops.get(n.id).kind!=='bridge')){
    const same=x=>nodes.some(m=>m.id===x.id&&JSON.stringify(m.bindings)===JSON.stringify(x.bindings)&&m.scope===x.scope);
    if(engine.inspect(state,n).status==='conditional'){const s=engine.suggest(state,n,{bindings:B.bindings});if(s.status!=='bridge'){ok=false;break;}for(const b of s.paths[0]){state=engine.apply(state,b).facts;if(!same(b))nodes.push(b);}}
    const st=engine.apply(state,n);if(st.check.status!=='direct'){ok=false;break;}state=st.facts;if(!same(n))nodes.push(n);
   }
   const have=new Set(state.map(key));if(!ok||!B.goals.every(g=>have.has(key(g))))continue;
   if(new Set(nodes.map(n=>n.id)).size!==nodes.length)continue;   // 같은 재료를 두 대상에 쓰는 지도는 기존 계약이 아직 지원하지 않는다
   if(!nodes.some(n=>!aNodes.some(m=>m.id===n.id)))continue;      // B가 새 단계를 하나도 더하지 않으면 결합이 아니라 복제다
   const t={id:'F:'+A.id+'>'+B.id,name:A.name+' → '+B.name,source:A.source+'→'+B.source,origin:'fusion',seminar:'재조합',
    facts:[...aFacts,...statement.filter(f=>!aFacts.some(g=>key(strip(g))===key(strip(f))))],nodes,goals:clone(B.goals),principles:[...new Set([...A.principles,...B.principles])],bindings:clone(B.bindings),
    note:'앞 문항('+A.name+')의 결론을 뒤 문항('+B.name+')의 시작으로 잇는 두 단 설계안. 두 문항의 문면 조건을 한 함수에 동시에 걸어야 하므로 실제 식이 존재하는지는 검산 층에서 확인한다.'};
   const a=analyze(t,registry,engine);if(a.connected)out.push(t);
  }
  fusionCache.set(cacheKey,out);return out;
 }
 function propose(order,registry,witnesses,engine,{limit=6,includeTrimmed=true,includeFused=true}={}){
  const o=Order.normalize(order);
  const pool=[];
  for(const t of templates(registry,witnesses)){pool.push(t);if(includeTrimmed){const v=trimmed(t,registry,engine);if(v)pool.push(v);}}
  if(includeFused)pool.push(...fused(registry,witnesses,engine));
  const rows=[];
  for(const t of pool){
   const a=ablate(t,registry,engine);if(!a.connected||a.conditions.some(c=>!c.load_bearing))continue;
   const m=match(o,t,a);if(m.score===-Infinity)continue;
   rows.push({template:t,analysis:a,match:m,brief:brief(o,t,a,m)});
  }
  rows.sort((x,y)=>y.match.score-x.match.score||x.analysis.score-y.analysis.score);
  return rows.slice(0,limit).map((r,rank)=>blueprint(r,o,registry,rank));
 }
 function blueprint(r,order,registry,rank){
  const {template:t,analysis:a,match:m}=r;
  const coreNode=t.nodes.find(n=>Authoring.profile(n.id)?.stage==='judge')||t.nodes[0];
  return {schema:'problem-atom/design-blueprint/1',id:t.id,rank,name:t.name,source:t.source,origin:t.origin,seminar:t.seminar,note:t.note,
   order,plan:{facts:t.facts.map(strip),nodes:clone(t.nodes),revision:registry.revision},goals:clone(t.goals),core:clone(coreNode),
   analysis:a,match:m,brief:r.brief,bindings:t.bindings,status:'ai_candidate',release_ready:false};
 }
 // 기존 모델 계약은 마지막 질문이 하나다. 목표가 여럿(보기형)이면 계보가 가장 긴 목표를 주 질문으로 삼고
 // 그 계보 밖의 단계·조건은 요청 plan에서 뺀다. 다른 보기의 단계는 self_checks에 적게 한다(연결 검사의 '미사용 재료' 규칙과 충돌하지 않게).
 function primaryRoute(bp,registry,engine){
  const ops=new Map(registry.operations.map(o=>[o.id,o]));
  const run=engine.run({facts:bp.plan.facts,nodes:bp.plan.nodes});
  const routes=bp.goals.map(g=>{const l=Planner.lineage(run,g);return {goal:g,steps:l.steps,size:l.steps.size};}).sort((a,b)=>b.size-a.size);
  const main=routes[0];const nodes=bp.plan.nodes.filter(n=>main.steps.has(n.id));
  const required=new Set(nodes.flatMap(n=>ops.get(n.id).requires.map(p=>key(materialize(p,n)))));
  const facts=bp.plan.facts.filter(f=>required.has(key(strip(f))));
  const core=nodes.find(n=>Authoring.profile(n.id)?.stage==='judge')||nodes[0];
  const others=routes.slice(1).map(r=>({goal:r.goal,steps:bp.plan.nodes.filter(n=>r.steps.has(n.id)&&!main.steps.has(n.id)).map(n=>n.id)}));
  return {target:main.goal,plan:{facts,nodes,revision:bp.plan.revision},core,trimmed:bp.plan.nodes.filter(n=>!main.steps.has(n.id)).map(n=>n.id),others};
 }
 function request(bp,registry,id,engine){
  engine=engine||Connections.create(registry);
  const l=Order.level(bp.order.level);
  const route=primaryRoute(bp,registry,engine);
  let brief=bp.brief;
  if(route.trimmed.length)brief+='\n주 질문: '+(registry.types[route.target.type]||route.target.type)+'. 이 요청의 plan은 주 질문까지의 경로만 기록한다. 설계안의 다른 목표('+route.others.map(o=>(registry.types[o.goal.type]||o.goal.type)+(o.steps.length?' — '+o.steps.map(sid=>registry.operations.find(op=>op.id===sid).name).join(', '):'')).join('; ')+')는 같은 문항의 다른 보기로 문면에 넣되, 그 단계는 plan에 넣지 말고 self_checks에 「보기: 단계 이름」으로 적는다.';
  const intent=Planner.intent(route.plan,registry,route.core.id,route.target,l.calculation,l.reasoning);
  return Contract.makeRequest(registry,route.plan,brief,id,{...intent,core:route.core});
 }
 function explain(bp,registry){
  const a=bp.analysis,m=bp.match;
  return {name:bp.name,level:a.level+(a.level===m.target_level?' (목표와 일치)':' (목표 '+m.target_level+', 차이 '+m.level_gap+')'),score:a.score,
   path:bp.plan.nodes.map(n=>{const op=registry.operations.find(o=>o.id===n.id);return {id:n.id,name:op.name,stage:Authoring.profile(n.id)?.stage,grammar:op.exposure==='grammar'};}),
   conditions:a.conditions,satisfied:m.satisfied,missing:m.missing,wrappers:a.wrappers,families:a.families,principles:a.principles,bundles:a.bundles,units:a.units,answer_form:a.answer_form,calibrated:false};
 }
 return {templates,analyze,ablate,trimmed,fused,match,propose,primaryRoute,request,explain,strip,key};
});
