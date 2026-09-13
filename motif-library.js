'use strict';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const list=(values)=>{const ul=el('ul');values.forEach(v=>ul.append(el('li',v)));return ul;};
let library;
function mathText(node,text){
  text.split(/(\$[^$]+\$)/g).forEach(part=>{
    if(part.startsWith('$')&&part.endsWith('$')&&window.katex){const span=el('span');katex.render(part.slice(1,-1),span,{throwOnError:false,trust:false});node.append(span);}
    else node.append(document.createTextNode(part));
  });
}
function render(){
 const query=document.querySelector('#search').value.trim().toLocaleLowerCase();
 const author=document.querySelector('#author').value;const host=document.querySelector('#recipes');host.replaceChildren();
 const rows=library.recipes.filter(r=>(!author||r.author===author)&&(!query||JSON.stringify(r).toLocaleLowerCase().includes(query)));
 document.querySelector('#result-count').textContent=`레시피 ${rows.length}개 · 포함된 풀이 묶음 ${rows.reduce((n,r)=>n+r.motifs.length,0)}개`;
 if(!rows.length)host.append(el('p','일치하는 자산이 없습니다. 검색어나 분석지를 바꿔보세요.','empty'));
 rows.forEach(r=>{
  const card=el('article',undefined,'recipe');card.id=r.id;
  card.append(el('p',`${r.author} · ${r.source_question_id} · 검수 대기`,'meta'),el('h2',r.name),el('p',r.discovery,'discovery'));
  const correction=el('p',undefined,'correction');mathText(correction,`이번에 보완한 점: ${r.correction}`);card.append(correction);
  if(r.evaluation_kind==='independent_propositions')card.append(el('p','보기마다 가정이 다릅니다. 세 보기를 동시에 만족시키는 조건으로 합치지 않습니다.'));
  r.motifs.forEach(m=>{const box=el('details',undefined,'motif');box.id=m.id;const title=el('summary',m.name);title.append(el('small',m.id));box.append(title);const dl=el('dl');
   [['핵심 추론',m.claim],['필요한 전제',m.preconditions],['교체할 부분',m.replaceable],['실패하기 쉬운 점',m.failure_modes],['원문 근거',`분석지 ${m.source_pages.join(', ')}쪽`],['기존 원자',m.legacy_atom_refs]].forEach(([label,value])=>{const dd=el('dd');if(Array.isArray(value))dd.append(list(value));else mathText(dd,value);dl.append(el('dt',label),dd);});box.append(dl);card.append(box);
  });
  const more=el('details');more.append(el('summary','현재 배치에서 조건이 하는 일'));const wrap=el('div',undefined,'table-wrap');const table=el('table');const head=el('tr');['요소','역할','실제 영향','제거·교체 시'].forEach(t=>head.append(el('th',t)));const thead=el('thead');thead.append(head);table.append(thead);const tbody=el('tbody');r.influence.forEach(row=>{const tr=el('tr');row.forEach(v=>{const td=el('td');mathText(td,v);tr.append(td);});tbody.append(tr);});table.append(tbody);wrap.append(table);more.append(wrap);card.append(more);host.append(card);
 });
}
fetch('motif-library.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(data=>{
 library=data;[...new Set(data.recipes.map(r=>r.author))].forEach(a=>{const option=el('option',a);option.value=a;document.querySelector('#author').append(option);});
 const transferHost=document.querySelector('#transfers');data.transfers.forEach(t=>{const box=el('div',undefined,'transfer');box.append(el('p',`${t.from} → ${t.to}`,'meta'),el('p',t.why));transferHost.append(box);});
 document.querySelector('#search').addEventListener('input',render);document.querySelector('#author').addEventListener('change',render);render();
}).catch(()=>{document.querySelector('#result-count').textContent='자산을 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요.';});
