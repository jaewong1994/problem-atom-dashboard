(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PASelection=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const categories=[['all','전체 재료'],['graph','함수·그래프'],['differential','미분·연속'],['integral','정적분'],['roots','근·매개변수'],['motion','이동거리'],['bridge','이어 주는 요소']];
 function category(op){const id=op.id;if(op.kind==='bridge')return 'bridge';if(id.includes('TRAVEL'))return 'motion';if(id.includes('INTEGRAL')||id.includes('RECURRENCE')||id.endsWith('SIGNED-01'))return 'integral';if(/JUMP-0[34]$/.test(id)||id.endsWith('SIGNED-03')||id.includes('SLIDING')||id.endsWith('LEVELS-03'))return 'roots';if(id.includes('JUMP')||id.includes('SKL-')||id.endsWith('SIGNED-02'))return 'differential';const n=Number(id.split('-').at(-1));if(id.includes('MOTIF'))return n<=3?'integral':n<=9?'differential':n===13?'roots':'graph';return 'graph';}
 const examples={
  'PA-MOTIF-S01-01':['적분식 속 함숫값의 차를 미분으로 풀어내요.',String.raw`G'(x)=F'(x)\int_a^x w(t)\,dt`],
  'PA-MOTIF-S01-02':['적분을 전개하지 않고 양수인지 음수인지 판단해요.',String.raw`x>a\;\Rightarrow\;\int_a^x w(t)\,dt>0`],
  'PA-MOTIF-S01-03':['부호가 바뀌는 두 위치를 겹쳐 극값을 줄여요.',String.raw`G_a'(x)=(x-1)(x-5)I_a(x)`],
  'PA-MOTIF-S01-10':['합성방정식의 해를 그래프가 만나는 점으로 바꿔요.',String.raw`F(x-mF(x))=0`],
  'PA-OP-FIXED-LEVELS':['높이를 정한 수평선이 그래프와 몇 번 만나는지 세요.',String.raw`H(x)=0\quad\text{또는}\quad H(x)=-2`],
  'PA-S02-LEVELS-02':['교점 개수에 맞는 수평선의 높이를 찾아요.',String.raw`y=F(x),\qquad y=a`],
  'PA-S02-LEVELS-03':['가능한 값 가운데 정수만 남겨 답을 정해요.',String.raw`1<a\le 4\quad\Rightarrow\quad a=2,3,4`],
  'PA-CAND-SKL-20260910-033':['절댓값 비율을 부호에 따라 1, −1로 바꿔요.',String.raw`\frac{|u|}{u}=\begin{cases}1&u>0\\-1&u<0\end{cases}`],
  'PA-CAND-SKL-20260914-001':['절댓값의 합과 차를 두 구간의 식으로 바꿔요.',String.raw`|u|+u=\begin{cases}2u&u\ge0\\0&u<0\end{cases}`],
  'PA-BRIDGE-01':['기울어진 직선을 수평선으로 읽도록 함수를 바꿔요.',String.raw`H(x)=F(x)-\frac{x}{m}`],
  'PA-BRIDGE-04':['도함수와 한 점의 값을 모아 원래 함수를 찾아요.',String.raw`X'(t)=v(t),\qquad X(0)=0`],
  'PA-BRIDGE-07':['함수의 그래프를 시간에 따른 위치로 읽어요.',String.raw`x=\text{시간},\quad F(x)=\text{위치}`],
  'PA-S02-TRAVEL-01':['출발점과 도착점의 차이가 아닌 실제 이동을 더해요.',String.raw`\text{이동거리}=\int_0^T |v(t)|\,dt`],
  'PA-S02-TRAVEL-02':['방향이 바뀔 때마다 나눠 각 구간의 거리를 더해요.',String.raw`|X(t_1)-X(0)|+|X(T)-X(t_1)|`]
 };
 const explanations={
  'PA-MOTIF-S01-04':'부호가 달라지는 경계에서 끊기지 않으려면 어떤 값이어야 할지 찾아요.',
  'PA-MOTIF-S01-05':'절댓값 때문에 꺾이는 점과 그대로 매끄럽게 지나는 점을 구별해요.',
  'PA-MOTIF-S01-06':'기준점을 원점으로 옮겨 함수의 모양을 간단히 비교해요.',
  'PA-MOTIF-S01-07':'같은 값을 빼서 불필요한 상수를 없애고 식을 나눠요.',
  'PA-MOTIF-S01-08':'두 식이 만나는 곳에서 값과 기울기를 차례로 맞춰요.',
  'PA-MOTIF-S01-09':'ㄱ, ㄴ, ㄷ에 주어진 조건을 각각 따로 두고 판단해요.',
  'PA-MOTIF-S01-11':'직선이 곡선을 가로지르는 경우와 접하는 경우를 모두 살펴요.',
  'PA-MOTIF-S01-12':'기울기가 같다는 이유만으로 한 점을 고르지 않고 후보를 모두 남겨요.',
  'PA-MOTIF-S01-13':'가능해 보이는 함수들을 원래 조건에 다시 대입해 걸러요.',
  'PA-S02-LEVELS-01':'절댓값 안이 양수인지 음수인지 나눠 그래프를 그려요.',
  'PA-S02-JUMP-01':'한 점의 왼쪽과 오른쪽에서 기울기를 따로 구해 비교해요.',
  'PA-S02-JUMP-02':'한 인수가 갑자기 바뀌어도 곱은 이어지도록 다른 인수의 값을 정해요.',
  'PA-S02-JUMP-03':'가장 왼쪽에서 0이 되는 위치부터 함수의 가능한 모양을 좁혀요.',
  'PA-S02-JUMP-04':'서로 다른 식에서 같은 해가 나오면 한 번만 세요.',
  'PA-S02-RECURRENCE-01':'구간이 만나는 곳의 함숫값과 기울기로 남은 상수를 정해요.',
  'PA-S02-RECURRENCE-02':'주어진 관계를 이용해 적분을 계산할 수 있는 구간으로 옮겨요.',
  'PA-S02-RECURRENCE-03':'한 구간에서 알아낸 식을 이웃 구간의 식으로 이어 가요.',
  'PA-S02-WINDOW-01':'움직이는 구간 안에 두 점이 함께 들어오는 때를 찾아요.',
  'PA-S02-WINDOW-02':'구간 안에 들어오는 근의 개수로 두 근 사이 간격을 알아내요.',
  'PA-S02-WINDOW-03':'같은 높이의 점들을 함수식의 인수로 바꿔요.',
  'PA-S02-WINDOW-04':'마지막까지 남은 식을 추가 조건에 넣어 답을 골라요.',
  'PA-S02-SIGNED-01':'적분 구간의 길이가 0이 되는 곳부터 함숫값을 찾아요.',
  'PA-S02-SIGNED-02':'연결점의 좌우 식을 미분하고 값과 기울기가 맞는지 확인해요.',
  'PA-S02-SIGNED-03':'식에서 찾은 해가 그 식을 쓰기로 한 구간에 있는지 확인해요.',
  'PA-S02-TRAVEL-03':'물체가 멈추는 시각에 속도가 0이라는 조건으로 계수를 정해요.',
  'PA-S02-TRAVEL-04':'갔다가 돌아와야 한다는 조건으로 가장 멀리 갈 수 있는 거리를 제한해요.',
  'PA-BRIDGE-02':'함수식을 미분해 올라가고 내려가는 구간과 꺾이는 높이를 구해요.',
  'PA-BRIDGE-03':'앞에서 찾은 후보를 그대로 넘겨 그중 정수만 고를 수 있게 해요.',
  'PA-BRIDGE-05':'그래프에서 찾은 높이 범위를 문제의 매개변수 범위로 바꿔요.',
  'PA-BRIDGE-06':'함수가 0이 되는 위치와 각 인수가 몇 번 곱해졌는지 함께 찾아요.'
 };
 function describe(op,registry){return examples[op.id]||[explanations[op.id]||registry.types[op.provides[0].type]+' 정보를 얻는 데 사용해요.',null];}
 function blank(registry){return {revision:registry.revision,nodes:[],facts:[]};}
 function preset(registry,id){const p=registry.presets.find(x=>x.id===id);if(!p)throw Error('시작 구성이 없습니다.');const plan={revision:registry.revision,nodes:structuredClone(p.nodes),facts:structuredClone(p.facts)};plan.nodes.splice(p.bridge_at,0,...structuredClone(p.bridge_nodes));return plan;}
 function toggle(plan,id,registry){if(!registry.operations.some(o=>o.id===id))throw Error('등록되지 않은 재료입니다.');const i=plan.nodes.findIndex(n=>n.id===id);if(i>=0)plan.nodes.splice(i,1);else plan.nodes.push({id,bindings:{f:'F',h:'H',a:'a'},scope:'main'});return plan;}
 function advice(plan,engine){const result=engine.run(plan),at=result.trace.findIndex(s=>s.status!=='direct');if(at<0)return {result,at,nodes:[],missing:[]};let state=engine.prepare(plan.facts);for(let i=0;i<at;i++)state=engine.apply(state,plan.nodes[i]).facts;const found=engine.suggest(state,plan.nodes[at],{bindings:{f:'F',h:'H',a:'a'},maxDepth:3,limit:1});return {result,at,nodes:found.paths?.[0]||[],missing:result.trace[at].missing};}
 function declare(plan,fact){const f={...fact,origin:'given'};if(!plan.facts.some(x=>x.type===f.type&&x.subject===f.subject&&x.scope===f.scope&&x.object===f.object))plan.facts.push(f);return plan;}
 return {categories,category,describe,blank,preset,toggle,advice,declare};
});
