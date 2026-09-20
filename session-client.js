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
  function open(plan,brief,calculation,reasoning){
   const draft={schema:'problem-atom/selection-draft/1',plan,brief,calculation,reasoning};
   const url='http://127.0.0.1:8987/connections.html#draft='+encodeURIComponent(JSON.stringify(draft));
   window.open(url,'_blank','noopener,noreferrer');
  }
  return {local,status:()=>call('/session/status'),jobs:()=>call('/session/jobs'),job:id=>call('/session/jobs/'+encodeURIComponent(id)),submit:job=>call('/session/jobs',{method:'POST',body:job}),cancel:id=>call('/session/jobs/'+encodeURIComponent(id)+'/cancel',{method:'POST'}),open};
 }
 window.PASession={create};
})();
