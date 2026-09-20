// Home reads the saved selection without resetting it.
function showSavedSelection(){
  const action=document.getElementById('startLabel'),note=document.getElementById('resumeNote');
  action.textContent='문항 만들기';note.textContent='처음이라면 제작실의 시작 조합을 골라 보세요.';
  try{
    const saved=JSON.parse(localStorage.getItem('pa-compose-boxes-v1')||'null');
    const count=Array.isArray(saved?.plan?.nodes)?saved.plan.nodes.length:0;
    if(count>0){action.textContent='이어서 문항 만들기';note.textContent='이 브라우저에 선택한 재료 '+count+'개가 저장돼 있어요.';}
  }catch(_){/* Storage may be disabled; the start link remains usable. */}
}
showSavedSelection();
window.addEventListener('pageshow',showSavedSelection);
window.addEventListener('storage',event=>{if(event.key==='pa-compose-boxes-v1')showSavedSelection();});
