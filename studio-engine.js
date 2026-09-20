'use strict';
(function(root){
 const VERSION='seminar-composer-2.0';
 const families={
 levels:{name:'절댓값을 풀고 만나는 점 세기',summary:'절댓값 → 두 그래프 → 가능한 정수',extension:'높이 대신 정수의 제곱을 넣어 가능한 값을 다시 고릅니다.',sources:['KICE-2021-09-Q20'],atoms:['PA-S02-LEVELS-01','PA-S02-LEVELS-02','PA-S02-LEVELS-03']},
 jump:{name:'끊기는 곳을 다른 인수의 0으로 메우기',summary:'연속 조건 → 근의 모양 → 함수 복원',extension:'근을 크기순으로 놓고 일부 근에 가중치를 주어 위치를 찾습니다.',sources:['KICE-2021-09-Q22'],atoms:['PA-S02-JUMP-01','PA-S02-JUMP-02','PA-S02-JUMP-03','PA-S02-JUMP-04']},
 recurrence:{name:'아는 구간을 옮겨 적분하기',summary:'끝의 값·기울기 → 다음 구간 → 적분',extension:'한 번 구한 식을 다시 사용해 두 구간 뒤의 적분을 구합니다.',sources:['KICE-2021-11-Q20'],atoms:['PA-S02-RECURRENCE-01','PA-S02-RECURRENCE-02','PA-S02-RECURRENCE-03']},
 window:{name:'움직이는 구간으로 함수 찾기',summary:'구간 속 근 개수 → 두 근의 간격 → 후보 선택',extension:'복원한 함수에 절댓값을 붙여 수평선과 만나는 점을 셉니다.',sources:['KICE-2021-11-Q22','KICE-2021-09-Q20'],atoms:['PA-S02-WINDOW-01','PA-S02-WINDOW-02','PA-S02-WINDOW-03','PA-S02-WINDOW-04']},
 signed:{name:'적분 속 함수를 찾아 교점 세기',summary:'좌우 적분 → 연결 지점 → 구간에 맞는 근',extension:'교점 세 개를 만드는 직선의 기울기를 골라 정수합을 구합니다.',sources:['KICE-2022-06-Q14','KICE-2021-09-Q20'],atoms:['PA-S02-SIGNED-01','PA-S02-SIGNED-02','PA-S02-SIGNED-03']},
 travel:{name:'방향이 바뀐 곳에서 거리 더하기',summary:'속도 0인 시각 → 왕복 거리 → 가장 먼 위치',extension:'방향이 바뀌는 시각으로 위치함수의 숨은 계수부터 찾습니다.',sources:['KICE-2022-11-Q14'],atoms:['PA-S02-TRAVEL-01','PA-S02-TRAVEL-02','PA-S02-TRAVEL-04']}
 };
 function validate(o){if(!o||!families[o.family])throw Error('만들 문제를 선택해 주세요.');if(!['guided','standard','challenge'].includes(o.level))throw Error('풀이 목표를 선택해 주세요.');if(!['light','full'].includes(o.calculation))throw Error('계산 크기를 선택해 주세요.');if(!Number.isInteger(o.seed)||o.seed<0||o.seed>2147483647)throw Error('재현 번호는 0부터 2147483647까지의 정수입니다.');}
 const shift=(v,a)=>a===0?v:`${v}${a<0?'+':'-'}${Math.abs(a)}`;
 const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
 const frac=(a,b=1)=>{let g=gcd(a,b);a/=g;b/=g;if(b<0){a=-a;b=-b;}return b===1?String(a):`${a<0?'-':''}\\frac{${Math.abs(a)}}{${b}}`;};
 const plus=n=>n<0?String(n):'+'+n;
 function generator(seed){let state=seed>>>0;return (lo,hi)=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return lo+state%(hi-lo+1);};}
 function generate(input){validate(input);const o={family:input.family,level:input.level,calculation:input.calculation,seed:input.seed};const rnd=generator(o.seed),full=o.calculation==='full',guided=o.level==='guided',hard=o.level==='challenge';let p={},q=[],sol=[],answer,steps=[],work=[],impact=[],extra=[];
 const F=families[o.family];
 if(o.family==='levels'){
  const d=full?rnd(2,4):1,k=rnd(1,4),B=rnd(-2,8),M=7*k*d**3; p={d,k,B,M};
  const f=`${frac(k,2)}x^3-${frac(9*k*d,2)}x^2+${10*k*d*d}x`;
  const H=`${k}x^3-${9*k*d}x^2+${15*k*d*d}x`;
  q.push(guided?`함수 $G(x)=\\begin{cases}-${7*k*d*d}x&x<0\\\\${H}&x\\geq0\\end{cases}$가 주어져 있다.`:`함수 $f(x)=${f}$가 주어져 있다.`);
  const height=hard?`n^2${plus(-B)}`:`n${plus(-B)}`;
  const eq=guided?`G(x)=${height}`:`f(x)+|f(x)+${k*d*d}x|=${6*k*d*d}x+${height}`;
  q.push(`방정식 $${eq}$의 서로 다른 실근의 개수가 4가 되도록 하는 모든 ${hard?'양의 정수':'정수'} $n$의 ${hard?'개수':'합'}을 구하시오.`);
  const values=[];if(hard){for(let n=1;n*n<B+M;n++)if(n*n>B)values.push(n);answer=values.length;}else answer=(M-1)*(2*B+M)/2;
  if(!guided)sol.push(`$f(x)+${k*d*d}x=${frac(k,2)}x(x^2-${9*d}x+${22*d*d})$이다. 이차식의 판별식은 $-${7*d*d}<0$이므로 절댓값 안의 부호는 $x$의 부호와 같다. 따라서 왼쪽에서 $-${7*k*d*d}x$, 오른쪽에서 $${H}$와 수평선의 교점을 센다.`);
  sol.push(`오른쪽 식을 미분하면 $${3*k}(x-${d})(x-${5*d})$이다. 극댓값은 $${M}$, 극솟값은 $${-25*k*d**3}$이다. 왼쪽 직선은 높이가 0보다 클 때 교점 하나를 더한다.`);
  sol.push(`교점이 4개이려면 높이가 $0$보다 크고 $${M}$보다 작아야 한다. 높이 $0$과 $${M}$에서는 서로 다른 교점이 3개이다.`);
  sol.push(hard?`$${B}<n^2<${B+M}$을 만족시키는 양의 정수는 ${values.join(', ')||'없음'}이다. 따라서 개수는 $${answer}$이다.`:`$${B}<n<${B+M}$에서 정수는 $${B+1}$부터 $${B+M-1}$까지이다. 합은 $${answer}$이다.`);
  steps=[...(!guided?['절댓값 안의 부호를 x의 부호로 바꾸기']:[]),'두 그래프의 교점 수를 높이의 범위로 바꾸기','접점과 이음점의 높이는 따로 세기',...(hard?['제곱의 범위에서 양의 정수만 고르기']:['열린구간 안의 정수합 구하기'])];
  work=[['미분',1],['극값 대입',2],['판별식 계산',guided?0:1],['정수 범위 계산',1]];
  impact=[{element:'높이 범위의 양끝 제외',without:'높이 0 또는 극댓값을 포함하면 근이 3개인 경우가 섞입니다.',with:'정확히 4개의 서로 다른 근만 남습니다.'}];
 }
 if(o.family==='jump'){
  const a=rnd(-5,5),d=3*(full?rnd(2,3):1),c=full?rnd(2,4):1,z=a+2*d+1,S=4*a+11*d/3,W=4*a+10*d/3;p={a,d,c,z,S,W};
  const fact=`${c}(${shift('x',a)})^2(${shift('x',a+d)})`;
  q.push(guided?`실수 $a$에 대하여 삼차함수 $f(x)=${c}(x-a)^2(x-a-${d})$라 하자.`:`최고차항의 계수가 $${c}$인 삼차함수 $f(x)$에 대하여`);
  q.push(`$H(x)=\\lim_{h\\to0+}\\frac{|f(x+h)|-|f(x-h)|}{h}$, $g(x)=f(x-${d})H(x)$라 하자.`);
  if(!guided)q.push('함수 $g(x)$는 실수 전체의 집합에서 연속이다.');
  q.push(hard?`방정식 $g(x)=0$의 서로 다른 네 실근을 $\\alpha_1<\\alpha_2<\\alpha_3<\\alpha_4$라 할 때, $\\alpha_1+2\\alpha_2+\\alpha_4=${W}$이다.`:`방정식 $g(x)=0$의 서로 다른 실근은 4개이고, 그 합은 $${S}$이다.`);
  q.push(`$f(${z})$의 값을 구하시오.`);answer=c*(z-a)**2*(z-a-d);
  sol.push('$H(x)$는 $|f|$의 좌우 미분계수의 합이다. $f(x)\\ne0$이면 $H(x)=2\\operatorname{sgn}(f(x))f\'(x)$이고, $f(x)=0$이면 $H(x)=0$이다. 한 번만 등장하는 근에서만 $H$가 끊긴다.');
  if(!guided)sol.push(`그 근 $\\beta$마다 $f(\\beta-${d})=0$이어야 한다. 가장 왼쪽 근을 생각하면 서로 다른 세 실근과 실근 하나인 모양은 불가능하다. 삼중근인 모양은 $g$의 실근이 2개여서 제외된다. 따라서 $f(x)=${c}(x-a)^2(x-a-${d})$이다.`);
  sol.push(`$f'$의 근은 $a$, $a+${2*d/3}$이다. $g$의 서로 다른 근을 순서대로 모으면 $a$, $a+${2*d/3}$, $a+${d}$, $a+${2*d}$이다.`);
  sol.push(hard?`주어진 식은 $4a+${10*d/3}=${W}$이다. 따라서 $a=${a}$이다.`:`네 근의 합은 $4a+${11*d/3}=${S}$이므로 $a=${a}$이다.`);
  sol.push(`$f(x)=${fact}$이므로 $f(${z})=${answer}$이다.`);
  steps=['대칭 차분을 양쪽 미분계수의 합으로 읽기',...(!guided?['끊김을 메우는 근의 배치로 삼차함수 모양 찾기']:[]),'세 인수에서 나오는 근을 합치고 중복 제거',...(hard?['작은 근부터 정렬해 가중 합에 넣기']:['근의 합으로 전체 위치 찾기'])];work=[['미분',1],['근 목록 정리',3],['일차방정식',1],['함숫값 대입',1]];
  impact=[{element:'서로 다른 실근 4개',without:'삼중근인 함수도 연속 조건을 만족시킵니다.',with:'삼중근을 제외하고 두 번 겹치는 근과 한 번 등장하는 근이 남습니다.'}];
 }
 if(o.family==='recurrence'){
  const c=rnd(1,full?7:3),b=full?rnd(-4,5):0,A=c-b,B=c+b,upper=hard?3:2; p={c,b,A,B,upper};
  q.push('실수 전체의 집합에서 미분 가능한 함수 $f(x)$가 다음 조건을 만족시킨다.');
  q.push(hard?`$f(0)=${b}$이고, $0\\leq x\\leq1$에서 $f'(x)=${c}$이다.`:`$0\\leq x\\leq1$에서 $f(x)=${c}x${plus(b)}$이다.`);
  q.push(guided?`$x\\geq0$에서 $f(x+1)-xf(x)=${A}x${plus(B)}$이다.`:'어떤 상수 $A$, $B$에 대하여 $x\\geq0$에서 $f(x+1)-xf(x)=Ax+B$이다.');
  q.push(`$12\\int_{${upper-1}}^{${upper}}f(x)\\,dx$의 값을 구하시오.`);answer=(hard?65:22)*c+12*b;
  if(hard)sol.push(`알고 있는 구간에서 $f(x)=${c}x${plus(b)}$이다.`);
  if(!guided)sol.push(`$x=0$을 관계식에 넣으면 $B=f(1)=${B}$. 관계식을 오른쪽에서 미분하고 $x=0$을 넣으면 $f'(1)=f(0)+A$이므로 $A=${A}$이다.`);
  sol.push(`$0\\leq x\\leq1$에서 $f(x+1)=${c}x^2+${c}x${plus(c+b)}$. 따라서 $1\\leq x\\leq2$에서 $f(x)=${c}x^2-${c}x${plus(c+b)}$이다.`);
  if(hard)sol.push(`이 식을 관계식에 다시 넣으면 $1\\leq x\\leq2$에서 $f(x+1)=${c}x^3-${c}x^2+${2*c}x${plus(c+b)}$이다.`);
  sol.push(`적분 구간을 한 칸 옮겨 위 다항식을 적분하면 구하는 값은 $${answer}$이다.`);
  steps=[...(hard?['도함수와 한 점의 값으로 첫 구간 복원']:[]),...(!guided?['구간 끝의 값과 기울기로 상수 두 개 결정']:[]),'적분할 구간을 아는 구간으로 옮기기',...(hard?['앞에서 구한 식을 다음 구간에 한 번 더 사용']:[])];work=[['끝점 대입',guided?0:2],['관계식 미분',guided?0:1],['식 전개',hard?2:1],['다항식 적분',1]];
  impact=[{element:'미분 가능 조건',without:'함숫값을 맞춰도 A는 자유로워 적분값이 달라집니다.',with:'구간 끝의 기울기를 맞춰 A가 정해집니다.'}];
 }
 if(o.family==='window'){
  const u=rnd(-4,6),h=full?rnd(2,4):1,L=2*h,v=u+3*h,z=u-h,probe=u+4*h,ratio=rnd(1,3);p={u,h,L,v,z,probe,ratio};
  q.push(`최고차항의 계수가 $${frac(1,2*h*h)}$인 삼차함수 $f(x)$에 대하여, 닫힌구간 $[t,t+${L}]$에서 방정식 $f'(x)=0$의 서로 다른 실근의 개수를 $g(t)$라 하자.`);
  if(guided)q.push(`$f'$의 서로 다른 두 실근을 $\\alpha<\\beta$라 할 때, $\\beta-\\alpha=${L}$이고 $f(${u})=f(${v})=\\alpha$이다.`);
  else q.push(`모든 실수 $a$에 대하여 $\\lim_{t\\to a-}g(t)+\\lim_{t\\to a+}g(t)\\leq2$이고, $g(f(${u}))=g(f(${v}))=2$이다.`);
  q.push(`$g(f(${z}))=1$이다.`);
  q.push(hard?`방정식 $|f(x)${plus(-u)}|=${ratio*h}$의 서로 다른 실근의 개수를 구하시오.`:`$f(${probe})$의 값을 구하시오.`);answer=hard?({1:4,2:3,3:2})[ratio]:u+8*h;
  if(!guided)sol.push(`두 근 사이가 $${L}$보다 짧으면 두 근을 포함하는 t의 열린구간에서 극한합이 4가 된다. 따라서 간격은 $${L}$ 이상이다. 한편 $g=2$인 점이 있으므로 간격은 $${L}$ 이하이다. 결국 간격은 $${L}$이고 $f(${u})=f(${v})=\\alpha$이다.`);
  sol.push(`$f(x)-\\alpha=${frac(1,2*h*h)}(${shift('x',u)})(${shift('x',v)})(x-k)$로 놓는다. 도함수 두 근의 간격을 $${L}$로 맞추면 $(${shift('k',u)})(${shift('k',v)})=0$. 두 후보는 $k=${u}$, $k=${v}$이다.`);
  sol.push(`첫 후보는 $\\alpha=${u}$, $f(${z})=${u-2*h}$이므로 길이 $${L}$의 닫힌구간 끝에서 근 하나를 포함한다. 두 번째는 $\\alpha=${u+h}$, $f(${z})=${u-7*h}$여서 근을 포함하지 못한다.`);
  sol.push(`따라서 $f(x)=${frac(1,2*h*h)}(${shift('x',u)})^2(${shift('x',v)})${plus(u)}$이다.`);
  if(hard){sol.push(`$f$의 극댓값은 $${u}$, 극솟값은 $${u-2*h}$이다. $f(x)=${u+ratio*h}$에서 근 1개, $f(x)=${u-ratio*h}$에서 ${ratio===1?'근 3개':ratio===2?'접하는 근을 한 번만 세어 근 2개':'근 1개'}가 생긴다. 합은 $${answer}$이다.`);extra.push('PA-S02-LEVELS-02');}
  else sol.push(`$x=${probe}$를 대입하면 $f(${probe})=${answer}$이다.`);
  steps=[...(!guided?['개수함수의 극한을 두 근 사이의 간격으로 바꾸기']:[]),'같은 함숫값을 빼서 인수 세 개 만들기','가능한 식 두 개를 모두 복원','구간 조건으로 하나 선택',...(hard?['복원한 함수와 두 수평선의 교점 수를 합치기']:[])];work=[['이차방정식',1],['후보 대입',2],['극값 대입',hard?2:0],['최종 함숫값 대입',hard?0:1]];
  impact=[{element:'g(f(기준점))=1 조건',without:'서로 다른 함수 두 개가 남고, 물은 값 또는 교점 개수가 달라집니다.',with:'원래 조건을 각 후보에 대입해 첫 후보만 남깁니다.'}];
 }
 if(o.family==='signed'){
  const a=rnd(-3,3),m=full?rnd(2,6):1,U=2*Math.abs(a)+rnd(2,full?9:5);p={a,m,U};
  if(guided)q.push(`함수 $f(x)=\\begin{cases}-x(3x${plus(-2*a)})&x<0\\\\x(3x${plus(-2*a)})&x\\geq0\\end{cases}$가 주어져 있다.`);
  else {q.push('실수 전체의 집합에서 연속인 함수 $f(x)$와 최고차항의 계수가 1인 삼차함수 $G(x)$가');q.push('$G(x)=\\begin{cases}-\\int_0^x f(t)\\,dt&x<0\\\\\\int_0^x f(t)\\,dt&x\\geq0\\end{cases}$를 만족시킨다.');q.push(`$f(1)=${3-2*a}$이다.`);}
  q.push(hard?`$1\\leq n\\leq${U}$인 정수 $n$ 중 방정식 $f(x)=nx$의 서로 다른 실근의 개수가 3이 되도록 하는 모든 $n$의 합을 구하시오.`:`방정식 $f(x)=${m}x$의 서로 다른 실근의 개수를 구하시오.`);
  const low=2*Math.abs(a)+1;answer=hard?(U-low+1)*(U+low)/2:(Math.abs(2*a)<m?3:2);
  if(!guided){sol.push('$G(0)=0$이고 양쪽 미분식과 f의 연속성을 맞추면 $G\'(0)=f(0)=0$이다. 따라서 $G(x)=x^2(x-a)$로 놓을 수 있다.');sol.push(`$f(1)=3-2a=${3-2*a}$에서 $a=${a}$. 따라서 왼쪽에서 $f(x)=-x(3x${plus(-2*a)})$, 오른쪽에서 $f(x)=x(3x${plus(-2*a)})$이다.`);}
  sol.push(`기울기를 양수 n이라 하면 후보는 $0$, $\\frac{${2*a}-n}{3}$, $\\frac{${2*a}+n}{3}$이다. 두 번째는 음수, 세 번째는 양수일 때만 새 근으로 센다.`);
  if(hard){sol.push(`서로 다른 실근 3개의 조건은 $n>${2*Math.abs(a)}$이다. 따라서 $n=${low},\\ldots,${U}$이고 합은 $${answer}$이다.`);extra.push('PA-S02-LEVELS-03');}
  else sol.push(`$n=${m}$을 넣고 각 근의 구간과 0 중복을 확인하면 서로 다른 실근의 개수는 $${answer}$이다.`);
  steps=[...(!guided?['적분의 끝을 같게 놓고 좌우 미분으로 함수 복원']:[]),'각 구간에서 방정식을 따로 풀기','해가 해당 구간에 들어가는지 확인하고 0 중복 제거',...(hard?['교점 조건을 기울기의 범위로 바꾸고 정수합 구하기']:[])];work=[['미분',guided?0:1],['상수 결정',guided?0:1],['구간별 방정식',2],['정수합',hard?1:0]];
  impact=[{element:'각 근의 구간 확인',without:'구간 밖의 해나 0과 겹친 해를 세면 답이 달라집니다.',with:'n=2|a|인 경계도 서로 다른 근 2개로 처리합니다.'}];
 }
 if(o.family==='travel'){
  const s=full?rnd(2,4):1,M=rnd(1,9),T=12*s,b=15*s,D=686*M;p={s,M,T,b,D};
  q.push(`수직선 위를 움직이는 점 P의 시각 $t$에서의 위치를 $X(t)$라 하자. $0\\leq t\\leq${T}$에서`);
  q.push(hard?`$X(t)=A t(t-${T})(2t-b)$이고, $A>0$이다. 시각 $t=${3*s}$에서 속도가 0이다.`:`$X(t)=A t(t-${T})(2t-${b})$이고, $A>0$이다.`);
  if(guided)q.push(`점 P가 방향을 바꾸는 시각은 $t=${3*s}$과 $t=${10*s}$이다.`);
  q.push(`시각 $0$부터 $${T}$까지 점 P가 움직인 거리는 $${D}$이다. 이 구간에서 원점과 점 P 사이 거리의 최댓값을 구하시오.`);answer=243*M;
  if(hard){sol.push(`$X'(${3*s})=0$에서 $${6*s}b-${90*s*s}=0$이므로 $b=${b}$이다.`);extra.push('PA-S02-TRAVEL-03');}
  sol.push(`$X'(t)=6A(t-${3*s})(t-${10*s})$. 부호는 +, −, + 순서이므로 두 시각에서 방향이 바뀐다.`);
  sol.push(`처음과 끝 위치는 0이고, $X(${3*s})=${243*s**3}A$, $X(${10*s})=-${100*s**3}A$이다.`);
  sol.push(`총 이동거리는 $${243*s**3}A+${343*s**3}A+${100*s**3}A=${686*s**3}A=${D}$. 따라서 $A=${frac(M,s**3)}$이다.`);
  sol.push(`두 방향전환점의 원점까지 거리를 비교하면 최댓값은 $${answer}$이다. 총 이동거리의 절반 $${D/2}$보다 작다.`);
  steps=[...(hard?['속도가 0인 시각으로 숨은 계수 찾기']:[]),...(!guided?['속도 부호가 바뀌는 시각 찾기']:[]),'각 방향전환점의 위치를 순서대로 놓기','간 거리와 돌아온 거리를 모두 더해 크기 결정','양쪽으로 가장 멀리 간 거리를 비교'];work=[['미분',guided?0:1],['계수 방정식',hard?1:0],['위치 대입',2],['거리 합산',1]];
  impact=[{element:'총 이동거리',without:'A의 크기가 정해지지 않아 최대 거리가 자유롭게 변합니다.',with:'왕복한 세 구간의 거리를 합해 A를 결정합니다.'}];
 }
 let used=[...F.atoms];
 if(guided){const omit={levels:[1],jump:[2,3],recurrence:[1,3],window:[2],signed:[1,2],travel:[]}[o.family];used=used.filter(id=>!omit.includes(Number(id.slice(-2))));}
 if(o.family==='recurrence'&&!hard)used=used.filter(id=>!id.endsWith('-03'));
 if(o.family==='recurrence'&&guided)impact=[{element:'알려 준 상수',without:'상수를 지우면 끝점의 값과 기울기로 직접 찾아야 합니다.',with:'상수 결정 단계를 생략하고 구간 이동에 집중합니다.'}];
 if(o.family==='jump'&&guided)impact=[{element:'미리 알려 준 함수 모양',without:'연속 조건을 넣어 근의 모양부터 좁혀야 합니다.',with:'근의 목록과 합을 읽는 단계에 집중합니다.'}];
 const assets=[...used,...extra];
 const note='기본·표준·심화는 풀이 설계 목표입니다. 학생 정답률로 교정한 난도는 아닙니다.';
 return {schema:'problem-atom/generated-item/2.0',version:VERSION,id:`${VERSION}-${o.family}-${o.level}-${o.calculation}-${o.seed}`,options:o,family:F.name,parameters:p,question:q,answer,solution:sol,steps,work,assets,source_questions:(!hard&&['window','signed'].includes(o.family))?F.sources.slice(0,1):F.sources,impact,level_note:note,quality:'수학 구조 회귀검증 적용 · 출제자 검토 전',language_profile:'public-stem-v2',release_ready:false};
 }
 const api={VERSION,families,generate};root.PAStudio=api;if(typeof module!=='undefined')module.exports=api;
 if(typeof require!=='undefined'&&require.main===module){const rows=[];for(const family of Object.keys(families))for(const level of ['guided','standard','challenge'])for(const calculation of ['light','full'])for(const seed of [0,1,2,7,19,31,99,312,2026,2147483647])rows.push(generate({family,level,calculation,seed}));process.stdout.write(JSON.stringify(rows));}
})(typeof globalThis==='undefined'?this:globalThis);
