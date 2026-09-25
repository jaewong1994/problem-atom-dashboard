(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PACurriculum=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const subjects=[{id:'math1',name:'수학Ⅰ'},{id:'math2',name:'수학Ⅱ'},{id:'probability',name:'확률과 통계'}];
 // Project chapter organization, not a claim about a newly revised national curriculum.
 const units=[
  {id:'m1-exponential',subject:'math1',name:'지수함수와 로그함수',description:'지수·로그의 성질을 읽고 식과 그래프를 연결해요.',examples:['식의 관계로 값 찾기','그래프와 직선의 만남','조건을 만족하는 범위'],prerequisites:[]},
  {id:'m1-trigonometry',subject:'math1',name:'삼각함수',description:'각, 주기, 그래프, 도형의 관계를 이용해요.',examples:['주기와 대칭 이용하기','삼각형의 길이와 넓이','조건에 맞는 각 찾기'],prerequisites:[]},
  {id:'m1-sequences',subject:'math1',name:'수열',description:'항 사이의 규칙을 찾고 조건을 거꾸로 연결해요.',examples:['항과 합 연결하기','경우를 나눠 수열 찾기','반복되는 규칙 이용하기'],prerequisites:[]},
  {id:'m2-limits',subject:'math2',name:'함수의 극한과 연속',description:'다가가는 값과 구간이 이어지는 조건을 살펴봐요.',examples:['좌우 값 비교하기','연속이 되도록 조건 맞추기','구간별 후보 확인하기'],prerequisites:[]},
  {id:'m2-derivatives',subject:'math2',name:'미분',description:'기울기와 증감을 이용해 함수의 모양과 후보를 좁혀요.',examples:['극값과 교점 개수','접하는 경우 찾기','조건으로 함수 되찾기'],prerequisites:['m2-limits']},
  {id:'m2-integrals',subject:'math2',name:'적분',description:'쌓인 양, 넓이, 적분으로 정의한 함수의 관계를 읽어요.',examples:['계산 대신 부호 판단하기','구간을 옮겨 적분하기','이동거리 나눠 더하기'],prerequisites:['m2-limits','m2-derivatives']},
  {id:'p-counting',subject:'probability',name:'경우의 수',description:'빠진 경우와 중복을 확인하며 세는 방법을 정해요.',examples:['분류해서 세기','중복을 보정하기','조건에 맞게 배치하기'],prerequisites:[]},
  {id:'p-probability',subject:'probability',name:'확률',description:'무엇을 기준으로 세는지 정하고 사건의 관계를 연결해요.',examples:['조건에 따라 기준 바꾸기','독립인지 판단하기','경우별 확률 합치기'],prerequisites:['p-counting']},
  {id:'p-statistics',subject:'probability',name:'통계',description:'분포와 표본의 정보를 읽어 값과 범위를 추론해요.',examples:['분포에서 조건 읽기','평균과 분산 연결하기','표본과 모집단 비교하기'],prerequisites:['p-counting','p-probability']}
 ];
 const LIMIT='m2-limits',DIFF='m2-derivatives',INT='m2-integrals',classifications={};
 function add(ids,main,requires=main){for(const id of ids)classifications[id]={main:[...main],requires:[...requires]};}
 add(['PA-MOTIF-S01-01','PA-MOTIF-S01-02','PA-MOTIF-S01-07','PA-S02-RECURRENCE-02','PA-S02-SIGNED-01','PA-S02-SIGNED-02','PA-S02-TRAVEL-01','PA-S02-TRAVEL-02','PA-BRIDGE-04'],[INT]);
 add(['PA-MOTIF-S01-03','PA-MOTIF-S01-05','PA-MOTIF-S01-06','PA-MOTIF-S01-08','PA-MOTIF-S01-10','PA-MOTIF-S01-11','PA-MOTIF-S01-12','PA-S02-LEVELS-02','PA-S02-JUMP-01','PA-S02-RECURRENCE-01','PA-S02-TRAVEL-03','PA-S02-TRAVEL-04','PA-OP-FIXED-LEVELS','PA-BRIDGE-01','PA-BRIDGE-02','PA-BRIDGE-07','PA-BRIDGE-08','PA-BRIDGE-09'],[DIFF]);
 add(['PA-MOTIF-S01-04','PA-S02-JUMP-02','PA-S02-JUMP-03','PA-S02-SIGNED-03','PA-S02-WINDOW-02'],[LIMIT]);
 // Algebra, counting candidate roots, and information transfer are supporting skills.
 // They cannot alone certify a probability/statistics or other unstocked chapter.
 add(['PA-MOTIF-S01-09','PA-MOTIF-S01-13','PA-S02-LEVELS-01','PA-S02-LEVELS-03','PA-S02-JUMP-04','PA-S02-RECURRENCE-03','PA-S02-WINDOW-01','PA-S02-WINDOW-03','PA-S02-WINDOW-04','PA-CAND-SKL-20260910-033','PA-CAND-SKL-20260914-001','PA-BRIDGE-03','PA-BRIDGE-05','PA-BRIDGE-06'],[]);
 // 2026-09-21 문법 가교와 이동 단계(connection-incoming/seminar-grammar-bridges.json).
 add(['PA-GRAMMAR-02','PA-GRAMMAR-05','PA-GRAMMAR-07','PA-GRAMMAR-12','PA-S02-TRAVEL-05'],[DIFF]);
 add(['PA-GRAMMAR-03','PA-GRAMMAR-13'],[LIMIT]);
 add(['PA-GRAMMAR-11'],[INT]);
 add(['PA-GRAMMAR-01','PA-GRAMMAR-04','PA-GRAMMAR-06','PA-GRAMMAR-08','PA-GRAMMAR-09','PA-GRAMMAR-10','PA-GRAMMAR-14'],[]);
 add(['PA-GRAMMAR-15'],[DIFF]);
 add(["PA-S03-AREA-01", "PA-S03-AREA-02", "PA-S03-AREA-03", "PA-S03-V-02", "PA-S03-AREA-04"],["m2-integrals"]);
 add(["PA-S03-V-01", "PA-S03-GRAPH-01", "PA-S03-MIN-01"],["m2-derivatives"]);
 add(["PA-S03-LIMIT-01", "PA-S03-LIMIT-03", "PA-S03-LIMIT-02"],["m2-limits"]);
 const factUnits={};
 function facts(list,unit){for(const key of list.split(' '))factUnits[key]=[unit];}
 facts('difference_integral continuous_weight positive_intervals zero_weight_interval changing_weight_sign integral_sign shifted_integral definite_integral_definition base_zero opposite_integral_pieces distance_definition distance_result',INT);
 facts('derivative_product two_simple_critical_roots one_extremum_required signed_corners critical_points derivative_known slope_match differentiability_required tangent_candidates slope_point_condition graph_profile one_sided_derivatives position_velocity turn_times zero_velocity_time nonzero_derivative differentiable_function parameter_is_critical_root',DIFF);
 facts('continuous_required finite_jump continuous_factor product_continuity continuity_at_boundary jump_unbounded window_limit_bound',LIMIT);
 facts('sign_change_values interior_zero',LIMIT);
 facts('corner_line_slope nonsmooth_count_condition',DIFF);
 const get=id=>units.find(u=>u.id===id)||null;
 function normalize(value){if(value==null)return null;const fusion=value.mode==='fusion',main=fusion?value.units:[value.unit];if(value.mode!=null&&!['unit','fusion'].includes(value.mode))throw Error('제작 틀 형식이 다릅니다.');if(!Array.isArray(main)||!main.length||main.some(id=>!get(id))||new Set(main).size!==main.length||!Array.isArray(value.supporting_units)||value.supporting_units.some(id=>!get(id)||main.includes(id))||new Set(value.supporting_units).size!==value.supporting_units.length)throw Error('대단원 선택 형식이 다릅니다.');if(fusion&&(main.length<2||new Set(main.map(id=>get(id).subject)).size<2))throw Error('융합형은 서로 다른 과목에서 두 대단원 이상 고르세요.');return {...(fusion?{mode:'fusion',units:[...main].sort()}:{unit:main[0]}),supporting_units:[...value.supporting_units].sort()};}
 const mainUnits=value=>{const s=normalize(value);return s?(s.mode==='fusion'?s.units:[s.unit]):[];};
 const scope=id=>normalize({unit:id,supporting_units:[]});
 function allowed(value){const s=normalize(value),main=mainUnits(s);return s?[...new Set([...main,...main.flatMap(id=>get(id).prerequisites),...s.supporting_units,...s.supporting_units.flatMap(id=>get(id).prerequisites)])]:[];}
 function audit(plan,registry,value,{requireMain=true}={}){
  const s=normalize(value);if(!s)return {valid:false,issues:['문항을 만들 대단원을 먼저 고르세요.'],outside:[],hasMain:false};
  const main=mainUnits(s),permitted=new Set(allowed(s)),outside=new Set(),unknown=[],covered=new Set();
  for(const n of plan.nodes){const c=classifications[n.id];if(!c){unknown.push(n.id);continue;}for(const id of main)if(c.main.includes(id))covered.add(id);for(const u of c.requires)if(!permitted.has(u))outside.add(u);}
  for(const f of plan.facts)for(const u of factUnits[f.type]||[])if(!permitted.has(u))outside.add(u);
  const issues=[];if(outside.size)issues.push('선택한 범위 밖의 '+[...outside].map(id=>get(id).name).join(' · ')+' 재료나 조건이 있습니다. 함께 사용할 단원을 추가하거나 구성을 조정하세요.');
  if(unknown.length)issues.push('대단원 분류를 검토하지 않은 재료가 있습니다.');
  const missingMain=main.filter(id=>!covered.has(id));if(requireMain&&missingMain.length)issues.push(missingMain.map(id=>get(id).name).join(' · ')+'의 판단 재료가 필요합니다.'+(s.mode==='fusion'?' 융합형은 선택한 각 대단원의 판단이 모두 답에 쓰여야 합니다.':''));
  return {valid:!issues.length,issues,outside:[...outside],hasMain:!missingMain.length,missingMain};
 }
 function material(registry,ids,value){const s=normalize(value);if(!s)return {visible:false,main:false,missing:[]};const permitted=new Set(allowed(s)),rows=ids.map(id=>classifications[id]),missing=[...new Set(rows.flatMap(c=>c?.requires||[]).filter(id=>!permitted.has(id)))];const main=rows.some(c=>c?.main.some(id=>mainUnits(s).includes(id)));return {visible:rows.every(Boolean)&&missing.length===0&&(main||rows.every(c=>c.main.length===0||c.main.some(u=>permitted.has(u)))),main,missing};}
 function canStart(plan,registry,value){const s=normalize(value);return !!s&&audit(plan,registry,s,{requireMain:false}).valid&&plan.nodes.some(n=>classifications[n.id]?.main.some(id=>mainUnits(s).includes(id)));}
 function count(registry,id){return registry.operations.filter(o=>classifications[o.id]?.main.includes(id)).length;}
 function guidance(value){const s=normalize(value);if(!s)return null;const main=mainUnits(s);return {version:1,classification:'production_scope_not_curriculum_certification',mode:s.mode||'unit',main_units:main.map(id=>{const u=get(id);return {id,subject:subjects.find(x=>x.id===u.subject).name,name:u.name};}),supporting_units:s.supporting_units.map(id=>({id,name:get(id).name})),prerequisites:[...new Set([...main,...s.supporting_units].flatMap(id=>get(id).prerequisites))].map(id=>({id,name:get(id).name})),rule:'선택한 각 주 대단원의 판단이 답을 구하는 데 실제로 필요해야 한다. 융합형은 서로 다른 과목의 결과가 같은 최종 질문으로 연결되어야 하며, 서로 무관한 소문항을 나열하지 않는다. 허용하지 않은 다른 단원의 재료를 추가하지 않는다. 기본 식 정리나 후보 개수 세기를 주 대단원의 판단으로 대신하지 않는다. 본문과 해설의 교육과정 범위는 별도로 검토한다.'};}
 function label(value){const s=normalize(value);if(!s)return '대단원 선택';return (s.mode==='fusion'?'과목 융합 · ':'')+mainUnits(s).map(id=>{const u=get(id);return subjects.find(x=>x.id===u.subject).name+' / '+u.name;}).join(' + ');}
 return {subjects,units,classifications,factUnits,get,normalize,scope,mainUnits,allowed,audit,material,canStart,count,guidance,label};
});
