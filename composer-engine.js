'use strict';
// Shared browser/Node generator. Options change conditions and the solution graph,
// rather than selecting a previously generated question or relabelling its assets.
(function(root){
 const VERSION='integral-composer-v1';
 function validate(o){
  if(!o||!['factored','expanded','conditions'].includes(o.presentation))throw Error('함수 제시 방법을 선택하세요.');
  if(typeof o.inferSign!=='boolean'||typeof o.selectCandidate!=='boolean')throw Error('추론 박스의 선택을 확인하세요.');
  if(!Number.isInteger(o.seed)||o.seed<0||o.seed>999999)throw Error('숫자 번호는 0부터 999999까지의 정수여야 합니다.');
 }
 const shifted=(variable,value)=>value===0?variable:`${variable}${value<0?'+':'-'}${Math.abs(value)}`;
 const term=(coefficient,power)=>coefficient===0?'':`${coefficient>0?'+':'-'}${Math.abs(coefficient)}${power}`;
 function generate(input){
  validate(input);const o={...input};const r=o.seed%7-3,s=r+2*(Math.floor(o.seed/7)%4+1),m=(r+s)/2,b=o.seed%5-2;
  const A=-3*(r+s),B=6*r*s;
  const formula=`2x^3${term(A,'x^2')}${term(B,'x')}`;
  const W=`(${b===0?'t^2':`(${shifted('t',b)})^2`}+1)`;
  let given;
  if(o.presentation==='factored')given=`삼차함수 F가 $F'(x)=6(${shifted('x',r)})(${shifted('x',s)})$를 만족한다.`;
  if(o.presentation==='expanded')given=`삼차함수 $F(x)=${formula}$가 주어져 있다.`;
  if(o.presentation==='conditions')given=`최고차항의 계수가 2인 삼차함수 F가 $F'(0)=${B}$, $F'(1)=${6*(1-r)*(1-s)}$을 만족한다.`;
  const question=[given,`실수 a에 대하여 $G_a(x)=\\int_a^x\\{F(x)-F(t)\\}${W}dt$로 정의한다.`];
  if(o.selectCandidate)question.push(`$G_a'(${m})<0$이고, Gₐ가 극값을 갖는 점이 정확히 1개일 때 a를 구하여라.`);
  else question.push('Gₐ가 극값을 갖는 점이 정확히 1개가 되도록 하는 모든 실수 a를 구하여라.');
  if(!o.inferSign)question.push(`풀이 도움: $\\int_a^x${W}dt$는 x>a일 때 양수, x<a일 때 음수, x=a일 때 0이라는 사실을 이용해도 좋다.`);
  const solution=[];
  if(o.presentation==='expanded')solution.push(`F를 미분하면 $F'(x)=6x^2${term(2*A,'x')}${term(B,'')}=6(${shifted('x',r)})(${shifted('x',s)})$이다.`);
  if(o.presentation==='conditions')solution.push(`$F'(x)=6x^2+ux+v$로 두면 $v=${B}$이고 $6+u+v=${6*(1-r)*(1-s)}$이므로 $u=${2*A}$이다. 따라서 $F'(x)=6(${shifted('x',r)})(${shifted('x',s)})$. 상수항은 F(x)−F(t)에서 없어지므로 구할 필요가 없다.`);
  solution.push(`$I_a(x)=\\int_a^x${W}dt$로 두자. 정의식을 $F(x)I_a(x)-\\int_a^xF(t)${W}dt$로 나누어 미분하면, 끝값에서 생기는 두 항이 없어져 $G_a'(x)=F'(x)I_a(x)$이다.`);
  solution.push(o.inferSign?'적분 안의 식은 항상 0보다 크다. 따라서 적분 구간의 방향을 비교하면 Iₐ(x)의 부호는 x−a와 같고, 0이 되는 지점은 x=a뿐이다.':'제공된 풀이 도움으로 Iₐ(x)의 부호는 x−a와 같음을 사용한다.');
  solution.push(`a가 두 수 ${r}, ${s} 모두와 다르면 ${r}, ${s}, a에서 각각 도함수의 부호가 바뀌므로 극값은 3개이다. a가 ${r} 또는 ${s}이면 그 지점에서 두 부호 변화가 겹쳐 곱의 부호가 유지된다. 나머지 한 지점에서만 극값이 생긴다. 따라서 후보는 a=${r}, ${s}이다.`);
  if(o.selectCandidate)solution.push(`$F'(${m})=${6*(m-r)*(m-s)}<0$이므로 $G_a'(${m})<0$이려면 $I_a(${m})>0$, 즉 $a<${m}$이어야 한다. 두 후보 중 $a=${r}$만 남는다.`);
  const work={gDifferentiations:1,fDifferentiations:o.presentation==='expanded'?1:0,coefficientDeterminations:o.presentation==='conditions'?2:0,quadraticSolves:o.presentation==='factored'?0:1,definiteIntegralEvaluations:0,candidateSignComparisons:o.selectCandidate?1:0};
  const discoveries=['정적분을 전개하지 않고 Gₐ의 도함수를 곱으로 나타내기',...(o.inferSign?['적분 구간의 방향으로 적분값의 부호 판단하기']:[]),'두 인수가 같은 곳에서 부호를 바꾸면 극값이 줄어드는 이유 찾기',...(o.selectCandidate?['한 점에서의 도함수 부호 조건으로 두 후보 중 하나 제외하기']:[])];
  return {version:VERSION,options:o,parameters:{r,s,m,b,A,B},question,solution,answer:o.selectCandidate?[r]:[r,s],work,discoveries,
   preview:{calculation:work.coefficientDeterminations? '계수 결정 계산이 추가됨':work.quadraticSolves?'미분과 이차방정식 풀이가 추가됨':'도함수의 두 근을 바로 읽을 수 있음',reasoning:`핵심 연결 ${discoveries.length}개 · 실제 난도는 검토 전`,note:'계산량은 제시한 풀이 경로 기준입니다. 다른 풀이의 계산량과 체감 난도는 달라질 수 있습니다.'},
   audit:{constraints:['적분 안의 곱하는 식은 항상 양수','고정된 두 근은 서로 다름','추가 부호를 확인하는 지점은 두 근 사이'],candidateCountBeforeSelection:2,candidateCountAfterSelection:o.selectCandidate?1:2,unusedConstant:'F의 상수항을 찾으라는 조건은 넣지 않음',shortcut:'극값 조건을 빼면 추가 부등식만으로 a가 하나로 정해지지 않음. 모든 가능한 풀이의 최단성은 보장하지 않음'},
   provenance:['PA-MOTIF-S01-01','PA-MOTIF-S01-02','PA-MOTIF-S01-03',...(o.selectCandidate?['PA-MOTIF-S01-13']:[])],status:'실험 문항 · 출제 품질 검토 전'};
 }
 const api={VERSION,generate};root.PAComposer=api;
 if(typeof module!=='undefined')module.exports=api;
 if(typeof require!=='undefined'&&require.main===module){
  const rows=[];for(const presentation of ['factored','expanded','conditions'])for(const inferSign of [false,true])for(const selectCandidate of [false,true])for(const seed of [0,1,7,14,27,41,73,99,140,999999])rows.push(generate({presentation,inferSign,selectCandidate,seed}));
  process.stdout.write(JSON.stringify(rows));
 }
})(typeof globalThis!=='undefined'?globalThis:this);
