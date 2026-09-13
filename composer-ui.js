'use strict';
(() => {
 const $=id=>document.getElementById(id);let draft,current;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const math=text=>{const n=node('p');mathText(n,text);return n;};
 const options=()=>({presentation:document.querySelector('input[name=cpPresentation]:checked').value,inferSign:$('cpSign').checked,selectCandidate:$('cpSelect').checked,seed:$('cpSeed').value.trim()===''?NaN:Number($('cpSeed').value)});
 function preview(){
  current=null;$('cpResult').replaceChildren(node('h3','문항 미리보기'),node('p','설정을 고른 뒤 문제 만들기를 눌러 주세요. 문항과 풀이가 여기에 나타납니다.'));$('cpSave').disabled=true;
  try{draft=PAComposer.generate(options());$('cpCreate').disabled=false;
   const host=$('cpPreview');host.replaceChildren(node('h3','선택한 문제의 예상 풀이'));
   const metrics=node('div');metrics.className='cp-metrics';
   const calc=node('div');calc.append(node('span','추가 계산'),node('strong',({factored:'두 근 바로 읽기',expanded:'미분 + 방정식',conditions:'계수 찾기 + 방정식'})[draft.options.presentation]));
   const reasoning=node('div');reasoning.append(node('span','연결할 생각'),node('strong',`${draft.discoveries.length}단계`));metrics.append(calc,reasoning);host.append(metrics);
   const ol=node('ol');ol.className='cp-path';draft.discoveries.forEach(d=>ol.append(node('li',d)));host.append(ol);
   const details=node('details');details.append(node('summary','계산 내역과 예상 기준 보기'));
   const work=node('ul');const labels={gDifferentiations:'정적분으로 정의된 함수 미분',fDifferentiations:'삼차함수 미분',coefficientDeterminations:'도함수의 계수 결정',quadraticSolves:'이차방정식 풀이',definiteIntegralEvaluations:'정적분의 값 직접 계산',candidateSignComparisons:'추가 조건으로 후보 비교'};
   Object.entries(draft.work).forEach(([key,value])=>work.append(node('li',`${labels[key]}: ${value}회`)));details.append(work,node('p',draft.preview.note+' 추론 단계 수는 난이도 점수가 아닙니다.'));host.append(details);
   $('cpStatus').textContent='선택한 조건으로 문항을 만들 준비가 되었습니다.';
  }catch(e){draft=null;$('cpCreate').disabled=true;$('cpPreview').replaceChildren();$('cpStatus').textContent=e.message;}
 }
 $('cpOptions').addEventListener('change',preview);
 $('cpSeed').addEventListener('input',preview);
 $('cpRandom').onclick=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);$('cpSeed').value=a[0]%1000000;preview();};
 $('cpCreate').onclick=()=>{if(!draft)return;current=structuredClone(draft);const host=$('cpResult');host.replaceChildren(node('h3','만들어진 문제'),node('p',current.status));current.question.forEach(t=>host.append(math(t)));
  const detail=node('details');detail.append(node('summary','정답과 풀이 확인'),node('p','정답: '+current.answer.join(', ')));current.solution.forEach((t,i)=>detail.append(math(`${i+1}. ${t}`)));detail.append(node('p',current.audit.unusedConstant),node('p',current.audit.shortcut));host.append(detail);$('cpSave').disabled=false;$('cpStatus').textContent='문항을 만들었습니다. 선택을 바꾸면 이전 결과가 지워지고 예상 풀이부터 다시 표시됩니다.';
 };
 $('cpSave').onclick=()=>{if(!current)return;const a=node('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));a.download=`${current.version}-${current.options.seed}.json`;a.click();URL.revokeObjectURL(a.href);};
 preview();
})();
