(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PASupabaseAccount=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 function create(config,{fetcher=fetch,storage=sessionStorage,now=()=>Date.now()}={}){
  const key='pa-teacher-session-v1';let session=null,mode=null,refreshing=null;
  try{const saved=JSON.parse(storage.getItem(key)||'null');session=saved?.session||null;mode=saved?.mode||null;}catch(_){}
  const persist=()=>{try{if(session)storage.setItem(key,JSON.stringify({session,mode}));else storage.removeItem(key);}catch(_){}};
  const clear=()=>{session=null;mode=null;persist();};
  async function refresh(){
   if(!session||session.expires_at*1000>now()+30000)return;
   if(!refreshing)refreshing=(async()=>{
    const response=await fetcher(config.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),cache:'no-store'});
    const data=await response.json();if(!response.ok){clear();throw Error('로그인이 만료됐습니다. 다시 로그인해 주세요.');}
    session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(now()/1000)+data.expires_in};persist();
   })().finally(()=>refreshing=null);
   await refreshing;
  }
  async function call(route,payload){
   if(route!=='login')await refresh();
   const response=await fetcher(config.url+'/functions/v1/pa-team',{method:'POST',cache:'no-store',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(session&&route!=='login'?{Authorization:'Bearer '+session.access_token}:{})},body:JSON.stringify({route,...(payload!==undefined?{payload}:{})})});
   const data=await response.json();
   if(route==='logout')clear();
   if(!response.ok){if(response.status===401&&route!=='login')clear();throw Object.assign(Error(data.error||'계정 서버에 연결하지 못했습니다.'),{status:response.status});}
   if(route==='login'){session=data.session;mode=null;persist();delete data.session;}
   if(route==='mode'){mode=data.mode;persist();}
   if(route==='me'&&!data.user)clear();
   if(data.user)data.mode=mode;
   return data;
  }
  return {call,clear};
 }
 return {create};
});
