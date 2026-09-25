(() => {
  'use strict';
  const search=document.getElementById('report-search');
  const topic=document.getElementById('report-topic');
  const rows=[...document.querySelectorAll('.inventory-item')];
  const count=document.getElementById('report-count');
  document.querySelector('.filters').hidden=false;
  function filter(){
    const query=search.value.trim().toLocaleLowerCase('ko').split(/\s+/).filter(Boolean);
    let shown=0;
    for(const row of rows){
      const match=(!topic.value||row.dataset.topic===topic.value)&&query.every(q=>row.dataset.search.includes(q));
      row.hidden=!match;
      if(match)shown++;
    }
    count.textContent=`전체 ${rows.length}개 중 ${shown}개 연결 단계`;
    document.getElementById('report-empty').hidden=shown!==0;
  }
  search.addEventListener('input',filter);
  topic.addEventListener('change',filter);
  document.getElementById('report-reset').addEventListener('click',()=>{search.value='';topic.value='';filter();search.focus();});
  filter();
})();
