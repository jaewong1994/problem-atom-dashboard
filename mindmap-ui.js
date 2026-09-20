(function(root){'use strict';
 const G=root.PAGraph,C=root.PABoxCopy;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
 const svg=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 function mount(host,{example}){
  let context,selected=null,branchRole='reasoning',zoom=.85,first=true,dragged=false,detailsOpen=false;
  const toolbar=el('div',null,'map-toolbar'),title=el('div');title.append(el('h2','풀이 지도'),el('p','노드를 누르고 추론·계산·마무리를 이어 붙이세요.','muted'));toolbar.append(title);
  const tools=el('div',null,'map-tools');toolbar.append(tools);const legend=el('div',null,'map-legend');for(const [r,info]of Object.entries(G.ROLES))legend.append(el('span',info.name,'role-label '+r));legend.append(el('span','실선: 풀이에서 얻은 정보 · 점선: 주어진 조건','muted'));
  const workspace=el('div',null,'map-workspace'),left=el('div',null,'map-left'),viewport=el('div',null,'map-viewport'),sizer=el('div',null,'map-sizer'),stage=el('div',null,'map-stage'),wires=svg('svg',{'aria-hidden':'true',class:'map-wires'}),nodes=el('div',null,'map-nodes'),inspector=el('section',null,'map-inspector');
  viewport.setAttribute('aria-label','노드를 연결하는 풀이 지도');viewport.tabIndex=0;viewport.append(sizer);sizer.append(stage);stage.append(wires,nodes);left.append(viewport,el('p','지도 안을 스크롤해 둘러보세요. 노드의 ‘이동’은 드래그하거나 방향키로 조절할 수 있습니다.','map-help'));inspector.setAttribute('aria-label','선택한 노드와 붙일 재료');workspace.append(left,inspector);
  const status=el('div',null,'map-status');status.setAttribute('role','status');host.append(toolbar,legend,workspace,status);
  const zoomText=el('span',null,'map-zoom');
  tools.append(button('−',()=>setZoom(zoom-.15),'map-zoom-button'),zoomText,button('+',()=>setZoom(zoom+.15),'map-zoom-button'),button('전체 보기',()=>{const width=Number(stage.dataset.width),height=Number(stage.dataset.height);setZoom(Math.min(1,(viewport.clientWidth-24)/width,(viewport.clientHeight-24)/height));viewport.scrollTo(0,0);}),button('가지 정리',()=>context.actions.arrange()));
  tools.children[0].setAttribute('aria-label','지도 축소');tools.children[2].setAttribute('aria-label','지도 확대');
  function setZoom(v){zoom=Math.min(1.5,Math.max(.3,v));stage.style.transform=`scale(${zoom})`;sizer.style.width=Number(stage.dataset.width)*zoom+'px';sizer.style.height=Number(stage.dataset.height)*zoom+'px';zoomText.textContent=Math.round(zoom*100)+'%';}
  function name(id){return id==='@start'?'문제에 줄 조건':id==='@question'?'마지막 질문':C.atoms[id]?.name||context.registry.operations.find(o=>o.id===id)?.name||id;}
  function focusNode(id){selected=id;render(context);const n=[...nodes.children].find(e=>e.dataset.node===id);if(n)viewport.scrollTo({left:Math.max(0,parseFloat(n.style.left)*zoom-viewport.clientWidth/2+126*zoom),top:Math.max(0,parseFloat(n.style.top)*zoom-viewport.clientHeight/2+76*zoom),behavior:'auto'});inspector.querySelector('h3')?.focus({preventScroll:true});}
  function render(ctx){
   context=ctx;const {registry,plan,coreId,target,mapState,audit,choices,actions}=ctx,graph=G.compile(plan,registry),opMap=new Map(registry.operations.map(o=>[o.id,o]));
   if(!selected||!plan.nodes.some(n=>n.id===selected)&&!['@start','@question'].includes(selected))selected=coreId||'@start';
   const positions=G.layout(graph,target,mapState.positions,coreId),allEdges=[...graph.edges],targetFact=target?graph.result.facts.find(f=>G.key(f)===G.key(target)):null;
   if(targetFact?.origin==='derived')allEdges.push({from:targetFact.by,to:'@question',via:[G.key(target)]});
   const width=Math.max(950,...Object.values(positions).map(p=>p.x+290)),height=Math.max(430,...Object.values(positions).map(p=>p.y+190));stage.dataset.width=width;stage.dataset.height=height;stage.style.width=width+'px';stage.style.height=height+'px';wires.setAttribute('width',width);wires.setAttribute('height',height);setZoom(zoom);
   const defs=svg('defs',{}),marker=svg('marker',{id:'map-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#7286a2'}));defs.append(marker);wires.replaceChildren(defs);
   for(const e of allEdges){const a=positions[e.from],b=positions[e.to];if(!a||!b)continue;const vertical=Math.abs(b.x-a.x)<200,down=b.y>=a.y;let d;if(vertical){const x=a.x+126,y=a.y+(down?154:0),x2=b.x+126,y2=b.y+(down?0:154),dy=(y2-y)/2;d=`M${x},${y} C${x},${y+dy} ${x2},${y2-dy} ${x2},${y2}`;}else{const x=a.x+252,y=a.y+77,x2=b.x,y2=b.y+77,offset=Math.max(48,Math.abs(x2-x)/2);d=`M${x},${y} C${x+offset},${y} ${x2-offset},${y2} ${x2},${y2}`;}const line=svg('path',{d,class:'map-edge'+(e.from==='@start'?' given':'')+([e.from,e.to].includes(selected)?' focused':''),'marker-end':'url(#map-arrow)'});wires.append(line);}
   nodes.replaceChildren();
   for(const id of ['@start',...graph.plan.nodes.map(n=>n.id),'@question']){
    const p=positions[id],op=opMap.get(id),r=op?G.role(id,mapState):id==='@question'?'finishing':'given',trace=graph.result.trace.find(t=>t.id===id),card=el('article',null,'map-node '+r+(id===selected?' active':'')+(audit.unused.includes(id)?' unused':''));card.dataset.node=id;card.style.left=p.x+'px';card.style.top=p.y+'px';
    const choose=button('',()=>{if(!dragged)focusNode(id);},'map-node-select');choose.setAttribute('aria-pressed',String(id===selected));choose.setAttribute('aria-label',name(id)+' 노드 선택');
    const badge=el('span',id===coreId?'핵심 · '+G.ROLES[r].name:op?G.ROLES[r].name:id==='@start'?'주어진 정보':'질문','map-node-role');choose.append(badge,el('b',id==='@question'?(target?C.goals[target.type]?.name||registry.types[target.type]:'무엇을 물을까요?'):name(id)));
    const detail=op?(trace?.status!=='direct'?'조건 확인 필요':audit.unused.includes(id)?'현재 질문에 쓰이지 않음':`식 정리 ${op.work.algebra} · 경우 ${op.work.branches}`):id==='@start'?`${plan.facts.length}개 조건`:(target?'질문 바꾸기':'눌러서 질문 붙이기');choose.append(el('small',detail));card.append(choose);
    const move=button('이동',()=>{},'map-drag');move.setAttribute('aria-label',name(id)+' 위치 이동 · 방향키 사용');
    move.onkeydown=e=>{const d={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[e.key];if(!d)return;e.preventDefault();actions.move(id,{x:Math.max(0,p.x+d[0]),y:Math.max(0,p.y+d[1])});nodes.querySelector(`[data-node="${CSS.escape(id)}"] .map-drag`)?.focus({preventScroll:true});};
    move.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const origin={x:e.clientX,y:e.clientY},base={...p};dragged=false;move.setPointerCapture(e.pointerId);move.onpointermove=ev=>{const dx=(ev.clientX-origin.x)/zoom,dy=(ev.clientY-origin.y)/zoom;if(Math.abs(dx)+Math.abs(dy)>4)dragged=true;card.style.left=Math.max(0,base.x+dx)+'px';card.style.top=Math.max(0,base.y+dy)+'px';};const end=ev=>{move.onpointermove=null;move.onpointerup=null;move.onpointercancel=null;if(move.hasPointerCapture(ev.pointerId))move.releasePointerCapture(ev.pointerId);if(dragged)actions.move(id,{x:Math.min(30000,parseFloat(card.style.left)),y:Math.min(30000,parseFloat(card.style.top))});dragged=false;};move.onpointerup=end;move.onpointercancel=end;};card.append(move);nodes.append(card);
   }
   inspector.replaceChildren();const heading=el('h3',name(selected));heading.tabIndex=-1;inspector.append(heading);
   if(selected==='@start'){
    inspector.append(el('p','풀이를 시작할 때 학생에게 알려 줄 정보입니다.','muted'),button('시작 조건 수정',actions.givens,'primary wide'));
    const list=el('ul',null,'map-facts');for(const f of plan.facts)list.append(el('li',registry.types[f.type]+' · '+f.subject));inspector.append(list);
   }else if(selected==='@question'){
    inspector.append(el('p','현재 핵심으로 풀 수 있는 질문입니다. 고르면 필요한 연결까지 함께 담습니다.','muted'));
    for(const choice of choices){const card=el('div',null,'map-option');card.append(el('b',C.goals[choice.target.type]?.name||choice.name),example(C.goals[choice.target.type]?.example,true));const b=button('이 질문으로 마무리',()=>actions.goal(choice));b.dataset.goalType=choice.target.type;card.append(b);if(choice.unused)card.append(el('small','현재 재료 중 '+choice.unused+'개는 이 질문에 쓰이지 않습니다.'));inspector.append(card);}
    if(!choices.length)inspector.append(el('p','먼저 핵심 재료를 고르고 부족한 조건을 보충하세요.','map-empty'));
   }else{
    const op=opMap.get(selected),currentRole=G.role(selected,mapState);inspector.append(example(C.atoms[selected]?.example));const nodeDetails=el('details',null,'map-node-details');nodeDetails.open=detailsOpen;nodeDetails.ontoggle=()=>{detailsOpen=nodeDetails.open;};nodeDetails.append(el('summary','역할·받는 정보 확인'),el('p','이번 문항에서 맡길 역할','map-label'));inspector.append(nodeDetails);
    const roleButtons=el('div',null,'map-role-buttons');for(const [r,info]of Object.entries(G.ROLES)){const b=button(info.name,()=>actions.role(selected,r));b.dataset.role=r;b.setAttribute('aria-pressed',String(currentRole===r));roleButtons.append(b);}nodeDetails.append(roleButtons,el('p','역할은 이 문항에서의 의도입니다. 역할 이름을 바꿔도 계산량이나 난도가 자동으로 바뀌지는 않습니다.','map-help'));
    const links=el('div',null,'map-connections'),incoming=allEdges.filter(e=>e.to===selected),outgoing=allEdges.filter(e=>e.from===selected);
    for(const [caption,list,direction]of [['받는 정보',incoming,'from'],['이어진 곳',outgoing,'to']])if(list.length){links.append(el('p',caption,'map-label'));for(const edge of list){const other=edge[direction],b=button(name(other),()=>focusNode(other),'map-link');b.append(el('small',edge.via.map(v=>registry.types[JSON.parse(v)[0]]).join(' · ')));links.append(b);}}
    const missing=graph.inputs[selected]?.filter(i=>!i.source)||[];if(missing.length){links.append(el('p','이 노드에 부족한 조건','map-label'));for(const m of missing){const row=el('div',null,'map-option');row.append(el('b',registry.types[m.fact.type]),example(C.facts[m.fact.type],true),button('문제에 주는 조건으로 추가',()=>actions.declare(m.fact)));links.append(row);}}nodeDetails.append(links);const moves=el('div',null,'map-nudges');nodeDetails.append(el('p','지도에서 위치 이동','map-label'),moves);for(const [label,dx,dy]of [['왼쪽',-36,0],['위',0,-36],['아래',0,36],['오른쪽',36,0]]){const b=button(label,()=>actions.move(selected,{x:Math.max(0,positions[selected].x+dx),y:Math.max(0,positions[selected].y+dy)}));b.setAttribute('aria-label',name(selected)+' '+label+'으로 이동');moves.append(b);}
    inspector.append(el('h4','여기서 무엇을 이어 갈까요?'));
    const filters=el('div',null,'map-role-buttons');for(const [r,info]of Object.entries(G.ROLES)){const b=button(info.name,()=>{branchRole=r;render(context);inspector.querySelector(`[data-branch-role="${r}"]`)?.focus({preventScroll:true});});b.dataset.branchRole=r;b.setAttribute('aria-pressed',String(branchRole===r));filters.append(b);}inspector.append(filters,el('p',G.ROLES[branchRole].help,'muted'));
    const suggestions=G.recommendations(plan,registry,selected,branchRole);
    for(const item of suggestions.slice(0,8)){const card=el('div',null,'map-option');card.append(el('b',name(item.id)),example(C.atoms[item.id]?.example,true));if(item.bridgeCount)card.append(el('small','함께 붙일 연결: '+item.nodes.slice(0,-1).map(n=>name(n.id)).join(' → ')));card.append(el('small',`추가 작업 · 식 정리 ${item.work.algebra} / 경우 ${item.work.branches}`));const b=button('이 노드에 붙이기',()=>actions.attach(selected,item,branchRole));b.dataset.attach=item.id;card.append(b);inspector.append(card);}
    if(!suggestions.length)inspector.append(el('p',missing.length?'부족한 조건을 먼저 확인하세요.':'지금 정보로 바로 붙일 '+G.ROLES[branchRole].name+' 재료가 없습니다. 다른 역할을 고르거나 마지막 질문을 정하세요.','map-empty'));
    inspector.append(button('마지막 질문 고르기',()=>focusNode('@question'),'primary wide'));
    const edit=el('div',null,'map-edit');if(selected!==coreId)edit.append(button('이 노드를 핵심으로',()=>actions.core(selected)));edit.append(button('이 노드 빼기',()=>actions.remove(selected)));inspector.append(edit);
   }
   status.replaceChildren();const counts={reasoning:0,calculation:0,finishing:0};plan.nodes.forEach(n=>counts[G.role(n.id,mapState)]++);status.append(el('b',`노드 역할 · 추론 ${counts.reasoning} · 계산 ${counts.calculation} · 마무리 ${counts.finishing}`),el('span',`예상 작업(등록 단위): 식 정리 ${audit.work.algebra} / 경우 ${audit.work.branches}`));
   const messages=[...audit.issues,...graph.result.errors];if(!coreId)messages.push('중심이 될 노드를 고른 뒤 ‘이 노드를 핵심으로’를 누르세요.');if(!target)messages.push('마지막 질문 노드를 눌러 무엇을 구할지 정하세요.');if(graph.result.status==='conditional')messages.push('노드를 눌러 부족한 조건을 확인하세요.');if(audit.ready)messages.push('핵심에서 질문까지 연결됐습니다. 실제 문항과 난도는 제작 후 검토합니다.');for(const msg of new Set(messages))status.append(el('p',msg));
   if(audit.unused.length)status.append(button('현재 질문에 쓰이지 않는 노드 빼기',actions.prune));if(audit.ready)status.append(button('난도 정하고 문항 제작',actions.produce,'primary'));
   if(first){first=false;requestAnimationFrame(()=>{if(viewport.clientWidth>600)setZoom(Math.min(.9,(viewport.clientWidth-24)/width));const p=positions[selected];if(p)viewport.scrollLeft=Math.max(0,p.x*zoom-viewport.clientWidth/2+126*zoom);});}
  }
  return {render,focusNode};
 }
 root.PAMindmap={mount};
})(typeof globalThis!=='undefined'?globalThis:this);
