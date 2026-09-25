(function(root,factory){const api=factory(typeof module==='object'?require('./curriculum-model.js'):root.PACurriculum);if(typeof module==='object')module.exports=api;else root.PAProblemDesign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(U){
 'use strict';
 const item=(id,name,example,why,units,ops)=>({id,name,example,why,units,operations:ops.split(' ')});
 const L='m2-limits',D='m2-derivatives',I='m2-integrals';
 const forms=[
  item('integral-function','정적분으로 정의된 함수','$\\mathrm{F}(x)=\\int_0^x f(t)\\,dt$','적분값의 조건으로 원래 함수의 모양을 찾는 문제',[I],'PA-S02-SIGNED-01 PA-S02-SIGNED-02 PA-GRAMMAR-11'),
  item('difference-integral','함숫값의 차를 넣은 정적분','$\\mathrm{G}(x)=\\int_a^x\\{f(x)-f(t)\\}g(t)\\,dt$','미분했을 때 두 함수의 관계가 드러나는 문제',[I],'PA-MOTIF-S01-01 PA-MOTIF-S01-02 PA-MOTIF-S01-03'),
  item('piecewise','구간별로 다른 함수','$g(x)=f(x)\\ (x<0),\\quad g(x)=f(-x)\\ (x\\ge0)$','식을 나누는 지점이 풀이에 영향을 주는 문제',[L,D,I],'PA-S03-GRAPH-01 PA-S03-LIMIT-02 PA-S02-SIGNED-03'),
  item('absolute','절댓값이 포함된 식','$g(x)=|f(x)|$ 또는 $f(x)=a|x|+b$','접히는 그래프와 방정식의 관계를 쓰는 문제',[L,D,I],'PA-MOTIF-S01-05 PA-S03-V-01 PA-S02-LEVELS-01'),
  item('count-function','개수함수','$g(t)$: 방정식 $f(x)=t$의 서로 다른 실근의 개수','함숫값이 해의 개수로 주어지는 문제',[L,D,I],'PA-S02-LEVELS-02 PA-S02-WINDOW-01 PA-S02-WINDOW-02'),
  item('composite','함수 안에 함수를 넣은 방정식','$f(x-f(x))=0$','합성식을 그래프와 직선의 관계로 바꾸는 문제',[D,I],'PA-MOTIF-S01-10 PA-MOTIF-S01-11'),
  item('moving-interval','움직이는 적분 구간','$\\mathrm{G}(x)=\\int_x^{x+2}g(t)\\,dt$','양끝이 움직이면서 지나는 구간이 달라지는 문제',[I],'PA-S03-GRAPH-01 PA-S03-LIMIT-02'),
  item('motion','위치·속도와 이동거리','위치 $f(t)$, $0$부터 $a$까지 움직인 거리','되돌아온 구간과 이동거리의 조건을 쓰는 문제',[I],'PA-S02-TRAVEL-01 PA-S02-TRAVEL-02 PA-S02-TRAVEL-04')
 ];
 const conditions=[
  item('nonnegative','모든 실수에서 0 이상','모든 실수 $x$에 대하여 $\\mathrm{F}(x)\\ge0$','전체 구간의 부호가 함수의 후보를 제한하게 합니다',[D,I],'PA-S03-AREA-01 PA-S03-AREA-02 PA-GRAMMAR-14'),
  item('root-count','실근의 개수가 주어진 조건','방정식 $g(x)=t$의 서로 다른 실근의 개수가 $3$이다.','접하는 경우와 경계값을 구별해야 답이 정해지게 합니다',[L,D,I],'PA-S02-LEVELS-02 PA-S03-V-01 PA-MOTIF-S01-11'),
  item('extrema-count','극값의 개수가 주어진 조건','함수 $\\mathrm{G}(x)$가 극값을 갖는 $x$의 개수가 $1$이다.','극값의 개수에서 매개변수의 후보를 거꾸로 찾습니다',[D,I],'PA-MOTIF-S01-03'),
  item('same-values','서로 다른 두 곳의 함숫값이 같음','$\\mathrm{F}(-2)=\\mathrm{F}(1)$','두 위치의 관계가 함수의 식을 결정하는 단서가 됩니다',[D,I],'PA-MOTIF-S01-07 PA-S02-WINDOW-03 PA-BRIDGE-08'),
  item('continuous-product','끊기는 함수인데 곱하면 연속','함수 $g(x)$는 불연속이지만 $f(x)g(x)$는 연속이다.','끊기는 위치와 다른 함수의 근이 연결됩니다',[L,D,I],'PA-S02-JUMP-02 PA-S02-JUMP-03'),
  item('smooth-absolute','절댓값을 씌워도 미분 가능','함수 $|f(x)|$가 모든 실수에서 미분 가능하다.','절댓값의 모서리가 사라지도록 함수의 모양을 정합니다',[D,I],'PA-MOTIF-S01-05 PA-MOTIF-S01-08'),
  item('integral-area-equal','정적분과 넓이가 같음','$\\int_a^b f(x)\\,dx=\\int_a^b |f(x)|\\,dx\\quad(a<b)$','구간 전체에서 함수가 놓이는 위치를 추론합니다',[I],'PA-S03-AREA-02 PA-S03-AREA-03'),
  item('limit-defined','극한값으로 새 함수를 정의','각 실수 $t$에 대해 $g(t)=\\lim_{x\\to t+}h(x)$','다가가는 방향과 실제 함숫값의 차이를 이용합니다',[L,D,I],'PA-S03-LIMIT-01 PA-S03-LIMIT-03')
 ];
 const branches=[
  {id:'limit',name:'극한·연속 추론',description:'구간이 바뀌는 곳에서 어떤 일이 생길까요?',items:[
   item('one-sided','좌극한과 우극한이 다른 경우','$\\lim_{x\\to a-}g(x)$와 $\\lim_{x\\to a+}g(x)$를 비교','양쪽 식의 차이가 조건을 결정해야 합니다',[L,D,I],'PA-S03-LIMIT-01 PA-S03-LIMIT-03 PA-S03-LIMIT-02'),
   item('join','이어지는 지점의 값 찾기','구간별 함수가 $x=a$에서 연속이 되도록 하는 상수','연속 조건에서 새 정보를 얻습니다',[L,D,I],'PA-MOTIF-S01-04 PA-S02-RECURRENCE-01'),
   item('limit-window','움직이는 구간의 개수와 극한','열린구간 $(t,t+2)$ 안에 있는 근의 개수 $g(t)$','끝점이 근을 지날 때의 변화로 근 사이 간격을 찾습니다',[L,D,I],'PA-S02-WINDOW-01 PA-S02-WINDOW-02')]},
  {id:'graph',name:'미분·그래프 추론',description:'모양과 만나는 점의 조건으로 함수를 좁힙니다.',items:[
   item('tangent-count','교점 개수에서 접하는 경우 찾기','$f(x)=ax+b$의 서로 다른 실근의 개수','접점의 위치와 구간 조건을 함께 확인합니다',[D,I],'PA-MOTIF-S01-11 PA-S03-V-01'),
   item('extrema-reverse','극값 조건에서 상수 찾기','$\\mathrm{G}(x)$의 극값 개수가 정해졌을 때 $a$의 값','도함수가 0인 점과 실제 극값을 구분해야 합니다',[D,I],'PA-MOTIF-S01-03'),
   item('minimum-boundary','최솟값과 구간 끝 비교','열린구간에서 가장 작은 값이 존재하는가?','다가가는 값과 실제로 갖는 값을 구별합니다',[D,I],'PA-S03-MIN-01')]},
  {id:'integral',name:'적분·넓이 추론',description:'긴 적분 계산보다 부호와 구간의 관계를 씁니다.',items:[
   item('area-sign','정적분과 넓이의 차에서 부호 찾기','$\\int_a^b f(x)\\,dx$와 그래프의 넓이 비교','음수인 부분이 조건에 어떤 영향을 주는지 찾습니다',[I],'PA-S03-AREA-01 PA-S03-AREA-02'),
   item('shift-integral','적분 구간을 옮겨 관계 찾기','$f(x+2)$의 조건으로 다른 구간의 적분값 찾기','이미 아는 구간의 정보로 새 구간을 연결합니다',[I],'PA-S02-RECURRENCE-02 PA-S02-RECURRENCE-03'),
   item('distance','이동거리에서 방향 전환 찾기','이동거리와 처음·마지막 위치의 차가 주어짐','되돌아온 구간이 실제로 필요하게 합니다',[I],'PA-S02-TRAVEL-01 PA-S02-TRAVEL-02')]}
 ];
 const all=[...forms,...conditions,...branches.flatMap(b=>b.items)],byId=new Map(all.map(x=>[x.id,x]));
 const isDesign=value=>value?.mode==='problem_design';
 const defaults=()=>({mode:'problem_design',version:1,curriculum_scope:{unit:I,supporting_units:[]},elements:[],branches:[],calculation:1,reasoning:1});
 function pool(registry,scope){return registry.operations.filter(o=>U.material(registry,[o.id],scope).visible);}
 function available(entry,scope,registry){return entry.units.some(u=>U.allowed(scope).includes(u))&&entry.operations.some(id=>pool(registry,scope).some(o=>o.id===id));}
 function normalize(value,registry){
  if(!isDesign(value)||value.version!==1)throw Error('제작 조건의 형식이 다릅니다.');
  const scope=U.normalize(value.curriculum_scope);if(!scope)throw Error('대단원을 먼저 고르세요.');
  for(const unit of U.mainUnits(scope))if(!registry.operations.some(o=>U.classifications[o.id]?.main.includes(unit)))throw Error(U.get(unit).name+'의 분석 재료가 아직 없습니다. 다른 대단원을 선택하세요.');
  for(const k of ['elements','branches'])if(!Array.isArray(value[k])||value[k].length>12||new Set(value[k]).size!==value[k].length||value[k].some(id=>!(k==='elements'?[...forms,...conditions]:branches.flatMap(b=>b.items)).some(e=>e.id===id)))throw Error('선택한 조건을 확인하세요.');
  for(const id of [...value.elements,...value.branches])if(!available(byId.get(id),scope,registry))throw Error(byId.get(id).name+'은 현재 제작 범위에 없습니다.');
  if(![0,1,2].includes(value.calculation)||![0,1,2].includes(value.reasoning))throw Error('계산량과 추론 난도를 확인하세요.');
  return {mode:'problem_design',version:1,curriculum_scope:scope,elements:[...value.elements].sort(),branches:[...value.branches].sort(),calculation:value.calculation,reasoning:value.reasoning};
 }
 function guide(value,registry){const d=normalize(value,registry);return {mode:d.mode,selected:[...d.elements,...d.branches].map(id=>({...byId.get(id),role:d.branches.includes(id)?'solution_branch':'problem_condition',operations:byId.get(id).operations.filter(id=>pool(registry,d.curriculum_scope).some(o=>o.id===id))})),rule:'선택한 조건은 필수이고 예시의 숫자와 식은 고정하지 않는다. 선택하지 않은 보조 판단은 AI가 등록 재료에서 찾아 풀이 경로를 구성한다.'};}
 function validateCoverage(data,d,registry){const errors=[],rows=data.design_coverage||[],required=[...d.elements,...d.branches],used=new Set(data.used_operations);if(new Set(rows.map(r=>r.element_id)).size!==rows.length)errors.push('条件の対応記録が重複しています。');for(const id of required){const e=byId.get(id),r=rows.find(x=>x.element_id===id);if(!r){errors.push('선택한 조건의 설명이 없습니다: '+e.name);continue;}if(!r.solution_evidence.trim()||!data.solution.some(s=>s.includes(r.solution_evidence)))errors.push(e.name+'이 풀이 어디에서 쓰이는지 확인하세요.');if(d.elements.includes(id)&&(!r.question_evidence.trim()||!data.question.some(s=>s.includes(r.question_evidence))))errors.push(e.name+'이 문면에 반영되지 않았습니다.');if(!r.operation_ids.length||r.operation_ids.some(op=>!used.has(op))||!r.operation_ids.some(op=>e.operations.includes(op)))errors.push(e.name+'과 실제 풀이 재료의 연결을 확인하세요.');}for(const r of rows)if(!required.includes(r.element_id))errors.push('선택하지 않은 조건의 대응 기록입니다.');return errors;}
 return {VERSION:1,forms,conditions,branches,all,byId,isDesign,defaults,normalize,pool,available,guide,validateCoverage};
});
