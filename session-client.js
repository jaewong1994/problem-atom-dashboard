(function(){'use strict';
 function create(){
  const element=document.getElementById('sessionBootstrap');let bootstrap=null;
  try{bootstrap=element?JSON.parse(element.textContent):null;}catch(_){}
  // Credentials exist only in the same-origin companion DOM, never on the public site.
  const local=Boolean(bootstrap&&['127.0.0.1','localhost'].includes(location.hostname));
  async function call(route,{method='GET',body}={}){
   if(!local)throw Error('Codex 연결 도우미 화면을 열어 주세요.');
   const r=await fetch(route,{method,headers:{'X-PA-Session':bootstrap.token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
   const data=await r.json();if(!r.ok)throw Error(data.error||'연결 도우미가 응답하지 않습니다.');return data;
  }
  function open(plan,brief,calculation,reasoning,coreId=null,target=null,mapState=null,unitScope=null){
   const draft={schema:'problem-atom/selection-draft/1',plan,brief,calculation,reasoning,coreId,target,mapState,unitScope};
   const url='http://127.0.0.1:8987/connections.html#draft='+encodeURIComponent(JSON.stringify(draft));
   // Same-tab navigation also works in embedded browsers that suppress popups.
   window.location.assign(url);
  }
  async function exportHwpx(bundle){
   if(!local)throw Error('한글 출력은 이 PC의 연결 도우미 화면에서 사용하세요. 출력 묶음을 저장한 뒤 가져올 수 있습니다.');
   const r=await fetch('/session/export-hwpx',{method:'POST',headers:{'X-PA-Session':bootstrap.token,'Content-Type':'application/json'},body:JSON.stringify(bundle),signal:AbortSignal.timeout(75000)});
   if(!r.ok){const d=await r.json();throw Error(d.error||'한글 출력에 실패했습니다.');}return r.blob();
  }
  return {local,status:()=>call('/session/status'),jobs:()=>call('/session/jobs'),job:id=>call('/session/jobs/'+encodeURIComponent(id)),submit:job=>call('/session/jobs',{method:'POST',body:job}),importResult:body=>call('/session/import-result',{method:'POST',body}),exportHwpx,cancel:id=>call('/session/jobs/'+encodeURIComponent(id)+'/cancel',{method:'POST'}),open};
 }
 window.PASession={create};
})();
