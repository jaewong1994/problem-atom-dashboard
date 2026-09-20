(function(root){'use strict';
 const A=root.PAAuthoring,C=root.PABoxCopy,G=root.PAGraph,B=root.PABundles,U=root.PACurriculum,X=root.PABoxExamples;
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};
 const button=(text,fn,cls)=>{const e=el('button',text,cls);e.type='button';e.onclick=fn;return e;};
 const svg=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
 function mount(host,{example}){
  let ctx,selected=null,expandedGoals=false,lastIds=new Set(),hasRendered=false,arrivalIds=new Set(),arrivalUntil=0,drawFrame,libraryMode="bundles",libraryTerm="",libraryLimit=8,lastScope="";const expandedBundles=new Set(),openExamples=new Set();
  const bar=el('div',null,'author-bar'),steps=el('nav',null,'author-tabs');steps.setAttribute('aria-label','문항 설계 편집');
  const grid=el('div',null,'author-grid'),board=el('section',null,'author-board'),boardHeader=el('div',null,'author-board-heading'),canvas=el('div',null,'author-canvas'),wires=svg('svg',{'aria-hidden':'true',class:'author-wires'}),nodeHost=el('div',null,'author-nodes'),panel=el('section',null,'author-panel'),status=el('div',null,'author-status');
  board.setAttribute('aria-label','조건과 풀이가 이어지는 지도');board.id='authorBoard';panel.setAttribute('aria-label','선택한 생각 편집');status.setAttribute('role','status');status.setAttribute('aria-atomic','true');canvas.append(wires,nodeHost);board.append(boardHeader,canvas);grid.append(board,panel);const mapToggle=button('풀이 지도 펼치기',()=>{const shown=host.classList.toggle('show-map');mapToggle.textContent=shown?'풀이 지도 접기':'풀이 지도 펼치기';mapToggle.setAttribute('aria-expanded',String(shown));canvas._draw?.();},'author-map-toggle');mapToggle.setAttribute('aria-controls','authorBoard');mapToggle.setAttribute('aria-expanded','false');host.append(bar,steps,mapToggle,grid,status);
  function name(id){return id==='@start'?'문제에 줄 정보':id==='@question'?'마지막 질문':id==='@review'?'제작 전 점검':X.get(id)?.name||C.atoms[id]?.name||ctx.registry.operations.find(o=>o.id===id)?.name||id;}
  function goalName(t){return C.goals[t.type]?.name||ctx.registry.types[t.type];}
  function focusNode(id){const preview=id.startsWith('@preview:')?id.slice(9):null;if(preview){openExamples.add(preview);libraryMode=B.definition(preview)?'bundles':'single';libraryTerm='';libraryLimit=100;id='@library';}selected=id;if(matchMedia('(max-width: 900px)').matches){host.classList.remove('show-map');mapToggle.textContent='풀이 지도 펼치기';mapToggle.setAttribute('aria-expanded','false');}render(ctx);(preview?panel.querySelector('[data-bundle-choice="'+preview+'"] summary'):panel.querySelector('h3'))?.focus({preventScroll:true});if(matchMedia('(max-width: 900px)').matches)panel.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function heading(kicker,text){panel.append(el('p',kicker,'author-kicker'));const h=el('h3',text);h.tabIndex=-1;panel.append(h);}
  function paragraph(label,text,cls=''){const d=el('div',null,'author-explanation '+cls);d.append(el('b',label),el('p',text));return d;}
  function render(context){
   ctx=context;const scopeKey=JSON.stringify(ctx.unitScope);if(scopeKey!==lastScope){lastScope=scopeKey;libraryTerm="";libraryLimit=8;selected="@library";}const {plan,registry,coreId,target,audit,choices,actions}=ctx,layout=B.view(plan,registry,[...expandedBundles]),graph=layout.graph;host.classList.toggle('is-empty',!plan.nodes.length);
   if(!plan.nodes.length&&!selected?.startsWith('@preview:'))selected='@library';
   if(!selected||(!plan.nodes.some(n=>n.id===selected)&&!layout.bundles.some(b=>'@bundle:'+b.id===selected)&&!selected?.startsWith('@preview:')&&!['@question','@review','@start','@library'].includes(selected)))selected=coreId?(target?(layout.owner.get(coreId)||coreId):'@question'):'@library';
   bar.replaceChildren();const title=el('div');title.append(el('span','02 · 문항 구성','author-kicker'),el('h2',plan.nodes.length?'판단을 묶어 문항 만들기':'함께 쓰는 생각을 한 묶음으로'));bar.append(title,button('재료 넣기',()=>focusNode('@library'),'author-change'));
   steps.replaceChildren();for(const [id,num,title,subtitle,done]of [['@library','01','재료 담기',plan.nodes.length?'묶음이나 낱개 더하기':'묶음 · 낱개 중에서 선택',!!plan.nodes.length],['@question','02','마지막 질문',target?goalName(target):'학생이 구할 것 정하기',!!target],['@review','03','풀이 연결',audit.ready?'연결됨 · 문항 제작 가능':'필요한 생각 이어 붙이기',audit.ready]]){
    const b=button('',()=>focusNode(id),'author-tab'+(selected===id?' active':''));b.dataset.authorTab=id;b.setAttribute('aria-pressed',String(selected===id));b.append(el('span',num,'author-tab-number'),el('b',title),el('small',subtitle));if(done)b.append(el('span','선택됨','sr-only'));steps.append(b);
   }
   boardHeader.replaceChildren();const info=el('div');info.append(el('h3','이번 문항의 풀이 지도'),el('p','상자를 누르면 그 생각의 쓰임과 다음 연결을 볼 수 있어요.'));boardHeader.append(info,el('span',layout.bundles.filter(b=>!expandedBundles.has(b.id)).length+'개 묶음 · '+plan.nodes.length+'개 재료','author-count'));
   nodeHost.replaceChildren();const newIds=new Set(plan.nodes.map(n=>n.id)),added=hasRendered?[...newIds].filter(id=>!lastIds.has(id)).slice(-2):[],linkEdges=[...layout.edges];
   if(added.length){arrivalIds=new Set(added);arrivalUntil=performance.now()+240;}const arrivals=performance.now()<arrivalUntil?arrivalIds:new Set();
   function node(id,subtitle,caption,extra=''){
    const b=button('',()=>focusNode(id),'author-node '+extra+(selected===id?' active':'')+(arrivals.has(id)?' just-added':''));b.dataset.designNode=id;b.setAttribute('aria-pressed',String(selected===id));b.append(el('span',caption,'author-node-caption'),el('b',subtitle));return b;
   }
   const start=node('@start',plan.facts.length?plan.facts.length+'개 정보로 시작':'묶음이나 낱개로 시작하세요','주어진 조건','given');nodeHost.append(start);
   for(const row of layout.rows){const layer=el('div',null,'author-layer');layer.style.setProperty('--branches',Math.min(2,row.length));for(const id of row){
    const bundle=layout.bundles.find(b=>'@bundle:'+b.id===id),members=bundle?bundle.members:[id],p=A.profile(id),traces=graph.result.trace.filter(t=>members.includes(t.id)),unused=members.filter(m=>audit.unused.includes(m));
    const b=node(id,bundle?bundle.name:name(id),bundle?'판단 묶음 · '+members.length+'개 재료':p?A.stages[p.stage]:'제작용 설명 검토 필요',(bundle?'bundle ':'')+(unused.length?'unused ':''));
    if(bundle)b.append(el('small',bundle.idea,'bundle-idea'));
    if(traces.some(t=>t.status!=='direct'))b.append(el('small','필요한 정보 확인','author-node-warning'));else if(unused.length)b.append(el('small','질문에 쓰이지 않는 재료 '+unused.length+'개','author-node-warning'));layer.append(b);
   }nodeHost.append(layer);}
   const question=node('@question',target?goalName(target):'마지막에 무엇을 구할까요?','마지막 질문',target?'question':'question not-chosen');nodeHost.append(question);
   const last=target&&graph.result.facts.find(f=>G.key(f)===G.key(target));if(last?.origin==='derived')linkEdges.push({from:layout.owner.get(last.by)||last.by,to:'@question',via:[G.key(last)]});
   lastIds=newIds;hasRendered=true;
   function draw(){
    const width=canvas.clientWidth,height=canvas.clientHeight;wires.setAttribute('viewBox',`0 0 ${width} ${height}`);wires.setAttribute('width',width);wires.setAttribute('height',height);wires.replaceChildren();
    // Layout coordinates do not drift while transform-based arrival motion is running.
    const point=n=>{let x=0,y=0,at=n;while(at&&at!==canvas){x+=at.offsetLeft;y+=at.offsetTop;at=at.offsetParent;}return {x,y,w:n.offsetWidth,h:n.offsetHeight};};
    const byId=new Map([...nodeHost.querySelectorAll('[data-design-node]')].map(n=>[n.dataset.designNode,n]));
    for(const edge of linkEdges){const f=byId.get(edge.from),t=byId.get(edge.to);if(!f||!t)continue;const a=point(f),b=point(t),x=a.x+a.w/2,y=a.y+a.h,x2=b.x+b.w/2,y2=b.y,dy=Math.max(14,(y2-y)/2);const path=svg('path',{d:`M${x},${y} C${x},${y+dy} ${x2},${y2-dy} ${x2},${y2}`,class:'author-wire'+(edge.from==='@start'?' given':'')+([edge.from,edge.to].includes(selected)?' focused':'')});wires.append(path);}
   }
   cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(draw);canvas._draw=draw;
   panel.replaceChildren();panel.dataset.selection=selected;
   function mathLine(text){const row=example(text,true);row.querySelector?.('.example-label')?.remove();row.className='box-math-line';return row;}
   function materialDetails(panel,id){
    const b=B.definition(id),startOptions=A.startOptions(registry,id),seed=startOptions.seed,p=A.profile(id),scopeFits=ctx.unitScope&&U.audit(seed.plan,registry,ctx.unitScope,{requireMain:false}).valid,placements=plan.nodes.length?B.placements(plan,registry,id).filter(item=>ctx.unitScope&&U.audit(item.plan,registry,ctx.unitScope,{requireMain:false}).valid):[];
    const d=X.get(id);
    if(d){const steps=el('ol',null,'box-worked-steps');for(const text of d.steps){const row=el('li');row.append(mathLine(text));steps.append(row);}panel.append(el('h4','이렇게 풀어요'),steps,el('div',null,'box-conclusion'));const result=panel.lastElementChild;result.append(el('b','얻는 결과'),mathLine(d.result));}
    if(b){const members=el('details',null,'box-members');members.append(el('summary','묶음에 들어 있는 판단 '+b.members.length+'개'));for(const member of b.members)members.append(el('p',name(member)));panel.append(members);}
    if(d?.source){const source=el('details',null,'box-seminar-source');source.append(el('summary','세미나 기록 · '+d.source),el('p','기록지 표현: '+d.original),el('small','적용 범위가 드러나도록 이름을 다듬은 경우가 있습니다. 예시의 숫자와 식은 이해를 돕기 위한 것으로 제작 조건에 자동 추가되지 않습니다.'));panel.append(source);}
    const conditions=el('details',null,'author-inputs');conditions.append(el('summary','필요한 시작 정보 '+seed.plan.facts.length+'개 · 사용 조건'));for(const fact of seed.plan.facts)conditions.append(el('p',registry.types[fact.type]));for(const n of seed.plan.nodes){const op=registry.operations.find(o=>o.id===n.id);conditions.append(el('p',op.guard_note,'author-footnote'));}panel.append(conditions);
    if(scopeFits&&!U.audit(seed.plan,registry,ctx.unitScope).hasMain)panel.append(el('p','이 재료만으로는 선택한 각 대단원의 판단을 모두 담을 수 없습니다. 필요한 단원의 재료와 함께 사용하세요.','author-caution'));
    if(!scopeFits)panel.append(el('p','이 구성에는 선택 범위 밖의 재료나 조건이 있습니다. 위에서 제작 범위를 먼저 조정하세요.','author-caution'));
    if(!startOptions.hasQuestion){panel.append(el('p','이 낱개는 풀이 중간에 이어 쓰는 재료입니다. 혼자서는 마지막 질문까지 이어지지 않아요.','author-caution'));for(const pack of startOptions.bundles.filter(b=>U.material(registry,B.definition(b.id).members,ctx.unitScope).visible))panel.append(button('함께 쓰는 묶음: '+pack.name,()=>focusNode('@preview:'+pack.id),'wide'));}
    if(!plan.nodes.length&&startOptions.hasQuestion&&scopeFits&&U.canStart(seed.plan,registry,ctx.unitScope)){const start=button(b?'이 묶음 담기':'이 재료 담기',()=>{actions.startMaterial(id);focusNode(U.audit(seed.plan,registry,ctx.unitScope).hasMain?'@question':'@library');},'primary wide');start.dataset.bundleStart=id;panel.append(start,el('p','필요한 시작 정보도 함께 준비합니다. 다음 화면에서 확인·수정할 수 있어요.','author-footnote'));}
    else if(plan.nodes.length){for(const item of placements.slice(0,3)){panel.append(button('현재 풀이에 '+item.nodes.length+'개 이어 붙이기',()=>{actions.addMaterial(item);focusNode(b?'@bundle:'+id:id);},'primary wide'));}
     if(!placements.length)panel.append(el('p',seed.plan.nodes.every(n=>plan.nodes.some(old=>old.id===n.id))?'이 재료는 이미 구성에 들어 있습니다.':'현재 풀이의 정보만으로는 이어 붙일 수 없습니다. 필요한 조건과 적용 대상을 확인하세요.','author-caution'));
     if(startOptions.hasQuestion&&scopeFits&&U.canStart(seed.plan,registry,ctx.unitScope)){const change=el('details');change.append(el('summary','이 재료로 새 구성 시작'),el('p','현재 재료를 바꾸고 필요한 시작 정보를 준비합니다. 되돌리기로 복구할 수 있어요.','author-footnote'),button('현재 구성을 바꾸고 시작',()=>{actions.startMaterial(id);focusNode(U.audit(seed.plan,registry,ctx.unitScope).hasMain?'@question':'@library');},'wide'));panel.append(change);}
    }

   }
   if(selected==='@library'){
    heading('재료 고르기','예시를 펼쳐 보고, 필요한 박스를 담으세요');panel.append(el('p','박스를 누르면 그 자리에서 풀이가 펼쳐져요. 예시를 확인한 뒤 담기 버튼을 누르세요.','author-intro'));
    const modes=el('div',null,'bundle-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','재료 보기');for(const [mode,label]of [['bundles','판단 묶음'],['single','낱개 재료']]){const b=button(label,()=>{libraryMode=mode;libraryLimit=8;render(ctx);},'');b.setAttribute('aria-pressed',String(libraryMode===mode));modes.append(b);}panel.append(modes);
    const label=el('label',null,'bundle-search');label.append(el('span','이름이나 예시로 찾기'));const search=el('input');search.type='search';search.value=libraryTerm;search.placeholder='예: 후보, 구간, 정수';label.append(search);panel.append(label);
    panel.append(el('p',ctx.unitScope?'선택한 대단원의 재료예요. 세미나 이름과 예시의 식으로도 검색할 수 있어요.':'대단원을 먼저 고르면 그 범위의 재료가 나옵니다.','author-footnote'));
    const shelf=el('div',null,'bundle-shelf');panel.append(shelf);
    const paint=()=>{shelf.replaceChildren();const term=libraryTerm.trim().toLowerCase(),rows=(libraryMode==='bundles'?B.catalog:registry.operations.map(o=>({id:o.id,name:name(o.id),idea:A.profile(o.id)?.decision||o.name,example:C.atoms[o.id]?.example||''}))).filter(b=>ctx.unitScope&&U.mainUnits(ctx.unitScope).some(id=>U.count(registry,id)>0)&&U.material(registry,B.definition(b.id)?.members||[b.id],ctx.unitScope).visible&&[b.name,b.idea,b.example,C.atoms[b.id]?.name,...Object.values(X.get(b.id)||{}).flat()].join(' ').toLowerCase().includes(term)).sort((a,b)=>Number(U.material(registry,B.definition(b.id)?.members||[b.id],ctx.unitScope).main)-Number(U.material(registry,B.definition(a.id)?.members||[a.id],ctx.unitScope).main));
     for(const b of rows.slice(0,libraryLimit)){const pack=B.definition(b.id),d=X.get(b.id),card=el('details',null,'box-accordion');card.dataset.bundleChoice=b.id;card.open=openExamples.has(b.id);const summary=el('summary'),top=el('span',null,'box-card-heading'),title=el('span',null,'box-card-title');top.append(el('span',pack?'판단 묶음 · '+b.members.length+'개':'낱개 재료','author-choice-meta'),el('span','⌄','box-chevron'));top.lastElementChild.setAttribute('aria-hidden','true');title.textContent=d?.name||b.name;summary.append(top,title);if(d)summary.append(mathLine(d.given));summary.append(el('span',card.open?'풀이 접기':'풀이 펼치기','box-expand-hint'));const content=el('div',null,'box-card-content');if(card.open)materialDetails(content,b.id);card.append(summary,content);card.addEventListener('toggle',()=>{if(card.open&&!content.childElementCount)materialDetails(content,b.id);card.open?openExamples.add(b.id):openExamples.delete(b.id);summary.querySelector('.box-expand-hint').textContent=card.open?'풀이 접기':'풀이 펼치기';});shelf.append(card);}
     if(rows.length>libraryLimit)shelf.append(button('재료 '+Math.min(8,rows.length-libraryLimit)+'개 더 보기',()=>{libraryLimit+=8;paint();},'wide'));if(!rows.length)shelf.append(el('p',libraryTerm?'맞는 재료가 없습니다. 다른 말로 찾아보세요.':'이 범위의 연결 재료가 아직 없습니다. 선택한 제작 틀은 저장됩니다.','author-empty'));
    };search.oninput=()=>{libraryTerm=search.value;libraryLimit=8;paint();};paint();
   }else if(selected.startsWith('@bundle:')){
    const b=layout.bundles.find(b=>'@bundle:'+b.id===selected);heading('판단 묶음 · '+b.members.length+'개 재료',b.name);panel.append(paragraph('이 묶음이 하는 일',b.effect,'spotlight'),example(X.get(b.id)?.given||b.example));
    const list=el('ol',null,'bundle-members');for(const id of b.members){const li=el('li'),open=button(name(id),()=>{expandedBundles.add(b.id);focusNode(id);},'bundle-member-button');li.append(open,el('p',A.profile(id)?.decision));if(audit.unused.includes(id))li.append(el('small','현재 질문에는 쓰이지 않음','author-node-warning'));list.append(li);}panel.append(list);
    panel.append(button(expandedBundles.has(b.id)?'지도에서 한 덩어리로 접기':'지도에서 낱개로 펼치기',()=>{expandedBundles.has(b.id)?expandedBundles.delete(b.id):expandedBundles.add(b.id);render(ctx);},'wide'));
    appendNext(null);const edit=el('details');edit.append(el('summary','묶음 수정'),button('묶음 전체 빼기',()=>{actions.removeBundle(b.members);focusNode('@library');},'wide'));panel.append(edit);
   }else if(selected==='@start'){
    heading('문제의 출발점','학생에게 무엇을 알려 줄까요?');panel.append(el('p','현재 선택한 풀이에 필요한 정보입니다. 아래 예시의 숫자가 문항에 고정되는 것은 아니에요.','author-intro'));
    if(!plan.nodes.length)panel.append(button('재료 고르기',()=>focusNode('@library'),'primary wide'));
    const list=el('ul',null,'author-givens');for(const {fact:f,enabled}of ctx.givens){const li=el('li'),label=el('label'),input=el('input');input.type='checkbox';input.checked=enabled;input.dataset.authorFact=G.key(f);input.onchange=()=>{actions.toggleFact(f);panel.querySelector('[data-author-fact="'+CSS.escape(G.key(f))+'"]')?.focus({preventScroll:true});};label.append(input,el('b',registry.types[f.type]));li.append(label,example(C.facts[f.type],true));list.append(li);}panel.append(list);
    const missing=new Map((ctx.repair?.missing||[]).map(f=>[G.key(f),f]));if(missing.size){panel.append(el('h4','가장 먼저 보충할 정보'));for(const f of missing.values()){const card=el('article',null,'author-choice');card.append(el('h4',registry.types[f.type]),example(C.facts[f.type],true),button('이 정보를 문제에 주기',()=>actions.declare(f),'wide'));panel.append(card);}}
    if(ctx.repair?.nodes.length)panel.append(button('조건을 주는 대신 풀이 연결로 얻기',actions.repair,'wide'));
   }else if(selected==='@question'){
    heading('질문부터 좁히기','마지막에 무엇을 구하게 할까요?');panel.append(el('p','같은 판단 묶음이어도 질문에 따라 뒤에 필요한 풀이가 달라져요. 질문을 고른 뒤 필요한 연결만 붙입니다.','author-intro'));
    const visible=expandedGoals?choices:choices.slice(0,3);
    for(const choice of visible){const active=target&&G.key(choice.target)===G.key(target),card=el('article',null,'author-choice'+(active?' selected':''));card.append(el('span',active?'선택한 질문':choice.unused?'구성 조정 필요':choice.route.length?'연결 '+choice.route.length+'개 필요':'현재 풀이로 가능','author-choice-meta'),el('h4',goalName(choice.target)),example(C.goals[choice.target.type]?.example,true));
     if(choice.route.length)card.append(el('p',choice.route.map(n=>name(n.id)).join(' → '),'author-route-preview'));
     if(choice.unused)card.append(el('p','현재 재료 '+choice.unused+'개가 이 질문에는 쓰이지 않습니다. 선택 후 확인하고 뺄 수 있어요.','author-caution'));
     const b=button(active?'선택됨 · 풀이 이어 보기':'이 질문 선택',()=>{if(!active)actions.chooseQuestion(choice);focusNode(layout.owner.get(coreId)||coreId||'@start');},active?'primary wide':'wide');b.dataset.authorGoal=choice.target.type;card.append(b);panel.append(card);
    }
    if(choices.length>3)panel.append(button(expandedGoals?'질문 간단히 보기':'다른 질문 '+(choices.length-3)+'개 보기',()=>{expandedGoals=!expandedGoals;render(ctx);panel.querySelector('h3')?.focus({preventScroll:true});},'text-button'));
    if(!choices.length)panel.append(el('p','재료를 담고 연결에 부족한 정보를 먼저 확인하세요.','author-empty'),button(coreId?'부족한 정보 확인':'재료 고르기',()=>focusNode(coreId?'@start':'@library'),'primary wide'));
   }else if(selected==='@review'){
    heading('연결을 문항으로','제작 전에 풀이를 점검하세요');
    const checks=[['선택한 재료',plan.nodes.length?layout.bundles.length+'개 묶음 / 전체 '+plan.nodes.length+'개 재료':'아직 담지 않았어요',!!plan.nodes.length],['마지막 질문',target?goalName(target):'아직 정하지 않았어요',!!target],['답에 쓰이는 연결',audit.ready?'모든 재료가 마지막 질문으로 이어집니다':'부족한 연결이나 남는 재료를 확인하세요',audit.ready]];
    for(const [label,text,ok]of checks)panel.append(paragraph(label,text,ok?'complete':'pending'));
    for(const issue of audit.issues)panel.append(el('p',issue,'author-caution'));
    if(audit.unused.length)panel.append(button('질문에 쓰이지 않는 재료 '+audit.unused.length+'개 빼기',actions.prune,'wide'));
    if(!target)panel.append(button('마지막 질문 선택',()=>focusNode('@question'),'primary wide'));
    else if(!audit.ready)appendNext(null);
    const work=el('details',null,'author-work');work.append(el('summary','계산과 판단 미리 보기'));const bp=A.blueprint(plan,registry,coreId,target);for(const s of bp.steps){const p=A.profile(s.id);if(p)work.append(paragraph(p.stage==='calculate'?'계산할 일':p.stage==='bridge'?'이어 쓸 정보':'판단할 일',p.stage==='calculate'||p.stage==='bridge'?p.action:p.decision));}work.append(el('p','등록된 풀이의 작업 목록입니다. 실제 전개 길이·풀이 시간·추론 난도는 생성된 문항으로 확인합니다.','author-footnote'));panel.append(work);
    if(audit.ready)panel.append(button('난도 정하고 문항 만들기',actions.produce,'primary wide'));
   }else{
    const p=A.profile(selected);heading('선택한 풀이',name(selected));const parent=layout.bundles.find(b=>b.members.includes(selected));if(parent)panel.append(button('← '+parent.name,()=>focusNode('@bundle:'+parent.id),'text-button'));
    if(p){panel.append(paragraph('여기서 떠올릴 생각',p.decision,'spotlight'));}
    else panel.append(el('p','이 재료의 제작용 설명은 아직 검토 전입니다. 연결 조건은 상세에서 확인하세요.','author-caution'));
    const inputs=el('details',null,'author-inputs');inputs.append(el('summary','선택한 생각의 예시·필요한 정보'));if(p)inputs.append(paragraph('이 조건을 보면',p.signal),example(X.get(selected)?.given||C.atoms[selected]?.example),paragraph('실제로 할 일',p.action));for(const input of graph.inputs[selected]||[]){const row=el('div',null,'author-input');row.append(el('b',registry.types[input.fact.type]),el('small',input.source?input.source==='@start'?'문제에서 주는 정보':'앞 풀이: '+name(input.source):'아직 없는 정보'));if(!input.source){row.append(example(C.facts[input.fact.type],true),button('처음 막힌 조건부터 확인',()=>focusNode('@start')));}inputs.append(row);}if(p)inputs.append(el('p',p.pitfall,'author-caution'));
    appendNext(selected);
    panel.append(inputs);
    const edit=el('details',null,'author-edit');edit.append(el('summary','이 재료 수정'));const edits=el('div',null,'author-edit-actions');edits.append(button('재료 빼기',()=>actions.remove(selected)));edit.append(edits,el('p','이번 문항에서 맡길 역할','author-footnote'));const roles=el('div',null,'author-edit-actions');for(const [r,v]of Object.entries(G.ROLES)){const b=button(v.name,()=>actions.role(selected,r));b.setAttribute('aria-pressed',String(G.role(selected,ctx.mapState)===r));b.dataset.role=r;roles.append(b);}edit.append(roles,el('p','역할 이름을 바꿔도 난도가 자동으로 달라지지는 않습니다.','author-footnote'));panel.append(edit);
   }
   function appendNext(focus){
    const nextHeading=el('div',null,'author-next-heading');nextHeading.append(el('span','다음 연결','author-kicker'),el('h4',target?'이 질문에 필요한 다음 생각':'먼저 마지막 질문을 정해 보세요'));panel.append(nextHeading);
    if(!target){panel.append(button('질문을 고르고 필요한 재료 보기',()=>focusNode('@question'),'primary wide'));return;}
    const pending=A.next(plan,registry,coreId,target,focus,choices),elsewhere=focus?A.next(plan,registry,coreId,target,null,choices):[];
    for(const item of pending.slice(0,3)){
     const card=el('article',null,'author-choice next-choice'),p=item.profile;card.append(el('span',A.stages[p.stage],'author-choice-meta'),el('h4',name(item.id)),el('p',p.decision),example(X.get(item.id)?.given||C.atoms[item.id]?.example,true));
     card.append(el('p','이어서 쓸 정보: '+item.via.map(i=>registry.types[i.fact.type]).join(' · '),'author-route-preview'),el('p',(p.stage==='calculate'?'추가 계산: ':'추가 작업: ')+p.action,'author-work-preview'));if(item.nodes.length>1)card.append(el('p','후보를 전달하는 연결도 함께 담습니다.','author-footnote'));
     const b=button('이 생각 붙이기',()=>{actions.next(item,focus);focusNode(item.id);},'primary wide');b.dataset.authorNext=item.id;card.append(b);panel.append(card);
    }
    const route=choices.find(c=>G.key(c.target)===G.key(target));
    if(pending.length>3)panel.append(el('p','우선 연결할 수 있는 3개를 표시했습니다. 하나를 붙이면 다음 선택지가 갱신됩니다.','author-footnote'));
    if(!pending.length&&elsewhere.length)panel.append(el('p','이 가지는 준비됐습니다. 다른 가지의 정보를 먼저 연결하면 다음으로 이어집니다.','author-intro'),button('다른 가지에 필요한 생각 보기',()=>focusNode('@review'),'wide'));
    else if(!pending.length&&audit.ready)panel.append(el('p','마지막 질문까지 연결됐습니다. 재료를 더 넣기 전에 계산과 판단을 점검해 보세요.','author-done'),button('연결 점검하기',()=>focusNode('@review'),'wide'));
    else if(!pending.length&&!route?.route.length){panel.append(el('p','현재 조건으로 이어 붙일 재료가 없습니다. 부족한 정보를 확인하거나 질문을 바꾸세요.','author-caution'));if(ctx.repair?.nodes.length)panel.append(button('빠진 연결 '+ctx.repair.nodes.length+'개 복구',actions.repair,'wide'));panel.append(button('주어진 정보·연결 확인',()=>focusNode('@start'),'wide'));}
    if(route?.route.length){const d=el('details',null,'author-route');d.append(el('summary','질문까지 남은 연결 '+route.route.length+'개 미리 보기'));const ol=el('ol');for(const n of route.route){const li=el('li');li.append(el('b',name(n.id)));const p=A.profile(n.id);if(p)li.append(el('small',p.action));ol.append(li);}d.append(ol,button('남은 연결 한 번에 붙이기',actions.complete,'wide'));panel.append(d);}
   }
   status.replaceChildren();status.append(el('b',audit.ready?'풀이 연결 준비 완료':!plan.nodes.length?'다음 할 일: 재료 담기':!target?'다음 할 일: 마지막 질문 선택':graph.result.status==='blocked'?'충돌하는 조건 확인 필요':audit.unused.length?'답에 쓰이지 않는 재료 확인 필요':'필요한 생각을 이어 붙여 주세요'),el('span','연결 확인은 수학적 정답·난도 검증과 구분됩니다.'));
  }
  const observer=new ResizeObserver(()=>{cancelAnimationFrame(drawFrame);drawFrame=requestAnimationFrame(()=>canvas._draw?.());});observer.observe(canvas);
  return {render,focusNode};
 }
 root.PAAuthoringUI={mount};
})(typeof globalThis!=='undefined'?globalThis:this);
