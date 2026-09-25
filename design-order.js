(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PADesignOrder=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // 주문(order): 사용자가 원하는 문항을 난이도·포장·요소로 적는 계약. 자산을 고르는 화면이 아니라 "무엇을 원하는가"의 층이다.
 const SCHEMA='problem-atom/design-order/1';
 // 난이도 사다리. 점수는 설계안의 구조에서 계산한 잠정값이며 학생 정답률로 보정된 값이 아니다(calibrated:false).
 const LADDER=[
  {id:'L1',label:'3점 · 기본',hint:'배운 방법을 한 번 적용한다',calculation:0,reasoning:0,range:[0,3]},
  {id:'L2',label:'3점 응용 · 4점 초반',hint:'조건 둘을 이어 풀이 방향을 찾는다',calculation:1,reasoning:1,range:[4,6]},
  {id:'L3',label:'4점 · 준킬러',hint:'구조 조건으로 후보를 만들고 수치 조건으로 하나만 남긴다',calculation:1,reasoning:2,range:[7,9]},
  {id:'L4',label:'4점 · 킬러',hint:'숨은 관계 발견과 빠짐없는 경우 판단이 두 번 이상 필요하다',calculation:2,reasoning:2,range:[10,99]}
 ];
 // 포장(P1): 문항이 함수를 감추는 방식. 시작 조건의 정보 종류로 판별한다.
 const WRAPPERS=[
  {id:'integral',label:'정적분으로 정의된 함수',types:['difference_integral','definite_integral_definition','opposite_integral_pieces','derivative_known','signed_area_difference']},
  {id:'absolute',label:'절댓값·부호',types:['signed_absolute','positive_quadratic_factor','absolute_sum','ratio_absolute','absolute_graph_comparison']},
  {id:'limit',label:'극한식',types:['symmetric_difference','right_limit_product','left_limit_product']},
  {id:'composite',label:'합성방정식',types:['composite_equation']},
  {id:'piecewise',label:'조각 붙임',types:['normalized_pieces','piecewise_formula','continuity_at_boundary']},
  {id:'count',label:'개수함수·수평선',types:['closed_window','requested_count','horizontal_problem','separable_parameter_equation']},
  {id:'recurrence',label:'관계식',types:['recurrence_relation']},
  {id:'motion',label:'속도·위치',types:['position_velocity','position_family']}
 ];
 const ANSWER_FORMS=[
  {id:'integer',label:'단답(정수 합·개수)',goal_types:['integer_answer']},
  {id:'value',label:'단답(함숫값·계수)',goal_types:['tested_candidates','shifted_integral','next_interval','distance_result','area_result','admissible_set']},
  {id:'claims',label:'보기형(ㄱㄴㄷ)',goal_types:['claim_results','interior_zero','distance_bound','level_counts','graph_profile','minimum_result','continuity_report']}
 ];
 const ELEMENT_KINDS=['principle','family','operation','bundle','wrapper','unit'];
 function level(id){return LADDER.find(l=>l.id===id)||null;}
 function levelOf(score){return LADDER.find(l=>score>=l.range[0]&&score<=l.range[1])||LADDER[LADDER.length-1];}
 function wrapperOf(type){return WRAPPERS.find(w=>w.types.includes(type))?.id||null;}
 function answerFormOf(goalTypes){return ANSWER_FORMS.find(f=>goalTypes.some(t=>f.goal_types.includes(t)))?.id||'value';}
 function normalize(value){
  if(!value||value.schema!==SCHEMA)throw Error('주문 형식이 다릅니다.');
  if(!level(value.level))throw Error('난이도 단계를 고르세요.');
  const wrappers=[...new Set(value.wrappers||[])];if(wrappers.some(w=>!WRAPPERS.some(x=>x.id===w)))throw Error('알 수 없는 포장 종류입니다.');
  const list=name=>{const rows=value[name]||[];if(!Array.isArray(rows)||rows.length>40)throw Error(name+' 목록 형식');
   return rows.map(e=>{if(!e||!ELEMENT_KINDS.includes(e.kind)||typeof e.id!=='string'||!e.id.trim()||e.id.length>80)throw Error('요소 형식이 다릅니다.');return {kind:e.kind,id:e.id};});};
  const include=list('include'),exclude=list('exclude');
  for(const e of include)if(exclude.some(x=>x.kind===e.kind&&x.id===e.id))throw Error('같은 요소를 포함과 제외에 함께 넣을 수 없습니다.');
  if(value.answer_form!=null&&!ANSWER_FORMS.some(f=>f.id===value.answer_form))throw Error('답 형식이 다릅니다.');
  if(value.unit!=null&&(typeof value.unit!=='string'||!value.unit.trim()))throw Error('단원 형식이 다릅니다.');
  const count=value.count==null?1:value.count;if(!Number.isInteger(count)||count<1||count>20)throw Error('문항 수는 1~20이어야 합니다.');
  const notes=(value.notes||'').toString();if(notes.length>2000)throw Error('추가 주문은 2000자 이내로 적어 주세요.');
  return {schema:SCHEMA,level:value.level,wrappers,include,exclude,answer_form:value.answer_form||null,unit:value.unit||null,count,notes:notes.trim()};
 }
 function describe(order){
  const l=level(order.level);const parts=[l.label];
  if(order.wrappers.length)parts.push('포장: '+order.wrappers.map(w=>WRAPPERS.find(x=>x.id===w).label).join(', '));
  if(order.include.length)parts.push('포함: '+order.include.map(e=>e.id).join(', '));
  if(order.exclude.length)parts.push('제외: '+order.exclude.map(e=>e.id).join(', '));
  if(order.answer_form)parts.push('답 형식: '+ANSWER_FORMS.find(f=>f.id===order.answer_form).label);
  return parts.join(' · ');
 }
 return {SCHEMA,LADDER,WRAPPERS,ANSWER_FORMS,ELEMENT_KINDS,level,levelOf,wrapperOf,answerFormOf,normalize,describe};
});
