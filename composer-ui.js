'use strict';
(() => {
 const $=id=>document.getElementById(id);let draft,current;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const math=text=>{const n=node('p');mathText(n,text);return n;};
 const options=()=>({presentation:document.querySelector('input[name=cpPresentation]:checked').value,inferSign:$('cpSign').checked,selectCandidate:$('cpSelect').checked,seed:$('cpSeed').value.trim()===''?NaN:Number($('cpSeed').value)});
 function preview(){
  current=null;$('cpResult').replaceChildren();$('cpSave').disabled=true;
  try{draft=PAComposer.generate(options());$('cpCreate').disabled=false;
   const host=$('cpPreview');host.replaceChildren(node('h3','만들기 전 예상 풀이'));
   host.append(node('p',draft.preview.calculation),node('p',draft.preview.reasoning));
   const work=node('ul');const labels={gDifferentiations:'정적분으로 정의된 Gₐ의 미분',fDifferentiations:'주어진 F의 미분',coefficientDeterminations:'도함수의 계수 결정',quadraticSolves:'이차방정식 풀이',definiteIntegralEvaluations:'정적분의 값 직접 계산',candidateSignComparisons:'추가 조건으로 후보 비교'};
   Object.entries(draft.work).forEach(([key,value])=>work.append(node('li',`${labels[key]}: ${value}회`)));host.append(work);
   const ol=node('ol');draft.discoveries.forEach(d=>ol.append(node('li',d)));host.append(ol,node('p',draft.preview.note));
   $('cpStatus').textContent='선택이 예상 풀이에 반영되었습니다. 문제 만들기를 누르면 문항이 표시됩니다.';
  }catch(e){draft=null;$('cpCreate').disabled=true;$('cpPreview').replaceChildren();$('cpStatus').textContent=e.message;}
 }
 $('cpOptions').addEventListener('change',preview);
 $('cpRandom').onclick=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);$('cpSeed').value=a[0]%1000000;preview();};
 $('cpCreate').onclick=()=>{if(!draft)return;current=structuredClone(draft);const host=$('cpResult');host.replaceChildren(node('h3','선택한 박스로 만든 문항'),node('p',current.status));current.question.forEach(t=>host.append(math(t)));
  const detail=node('details');detail.append(node('summary','정답과 풀이 확인'),node('p','정답: '+current.answer.join(', ')));current.solution.forEach((t,i)=>detail.append(math(`${i+1}. ${t}`)));detail.append(node('p',current.audit.unusedConstant),node('p',current.audit.shortcut));host.append(detail);$('cpSave').disabled=false;$('cpStatus').textContent='문항을 만들었습니다. 선택을 바꾸면 이전 결과가 지워지고 예상 풀이부터 다시 표시됩니다.';
 };
 $('cpSave').onclick=()=>{if(!current)return;const a=node('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));a.download=`${current.version}-${current.options.seed}.json`;a.click();URL.revokeObjectURL(a.href);};
 preview();
})();
