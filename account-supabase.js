(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PASupabaseAccount=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 function browserStorage(name){try{return globalThis[name];}catch(_){return null;}}
 function create(config,{fetcher=fetch,storage=browserStorage('localStorage'),legacyStorage=browserStorage('sessionStorage'),locks=globalThis.navigator?.locks,now=()=>Date.now()}={}){
  const key='pa-teacher-session-v1',migrationKey=key+':migrated';
  let session=null,mode=null,userId=null,refreshing=null,memoryOnly=!storage;
  function read(store,name=key){try{return JSON.parse(store?.getItem(name)||'null');}catch(_){return null;}}
  function restore(){
   if(memoryOnly)return;
   const saved=read(storage);
   session=saved?.session||null;mode=saved?.mode||null;userId=saved?.userId||null;
  }
  function persist(){
   try{
    if(session)storage?.setItem(key,JSON.stringify({session,mode,userId}));else storage?.removeItem(key);
    if(legacyStorage)storage?.setItem(migrationKey,'true');
   }catch(_){memoryOnly=true;}
   try{legacyStorage?.removeItem(key);}catch(_){}
  }
  function clear(){session=null;mode=null;userId=null;persist();}
  // Migrate an existing tab once. The marker prevents old tabs reviving a logged-out session.
  restore();
  if(legacyStorage){
   if(!read(storage,migrationKey)){
    const old=read(legacyStorage);
    if(!session&&old?.session){session=old.session;mode=old.mode||null;userId=old.userId||null;persist();}
    if(session)try{storage?.setItem(migrationKey,'true');}catch(_){}
   }
   try{legacyStorage.removeItem(key);}catch(_){}
  }
  function sameSession(token){restore();return session?.access_token===token;}
  function expired(){return session&&session.expires_at*1000<=now()+30000;}
  async function refresh(){
   restore();
   if(!expired())return;
   if(!refreshing){
    const renew=async()=>{
     // Another tab may have refreshed while this tab waited for the browser lock.
     restore();if(!expired())return;
     const token=session.access_token,refreshToken=session.refresh_token;
     const response=await fetcher(config.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken}),cache:'no-store'});
     const data=await response.json();
     if(!sameSession(token))return; // Logout or a newer login won while the request was pending.
     if(!response.ok){
      if([400,401,403].includes(response.status)){
       clear();throw Object.assign(Error('로그인이 만료됐습니다. 다시 로그인해 주세요.'),{status:401});
      }
      throw Object.assign(Error('로그인 연결을 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'),{status:response.status});
     }
     if(!data.access_token||!data.refresh_token||!Number.isFinite(data.expires_in))throw Error('로그인 갱신 응답을 확인하지 못했습니다. 다시 시도해 주세요.');
     session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Math.floor(now()/1000)+data.expires_in};persist();
    };
    refreshing=(locks?.request?locks.request(key+':refresh',renew):renew()).finally(()=>refreshing=null);
   }
   await refreshing;
  }
  async function call(route,payload){
   restore();
   if(route!=='login'&&route!=='logout'){
    try{await refresh();}catch(error){if(route==='me'&&error.status===401)return {user:null,mode:null};throw error;}
   }
   const token=route!=='login'?session?.access_token:null;
   // Clear this device immediately, including when the server is temporarily unreachable.
   if(route==='logout')clear();
   const response=await fetcher(config.url+'/functions/v1/pa-team',{method:'POST',cache:'no-store',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({route,...(payload!==undefined?{payload}:{})})});
   const data=await response.json();
   if(!response.ok){
    if(response.status===401&&route!=='login'&&sameSession(token))clear();
    if(route==='me'&&response.status===401)return {user:null,mode:null};
    throw Object.assign(Error(data.error||'계정 서버에 연결하지 못했습니다.'),{status:response.status});
   }
   if(route==='login'){session=data.session;mode=null;userId=data.user?.id||null;persist();delete data.session;}
   if(route==='mode'&&sameSession(token)){mode=data.mode;persist();}
   if(route==='me'&&sameSession(token)){
    if(!data.user)clear();
    else if(userId!==data.user.id){userId=data.user.id;persist();}
   }
   if(data.user)data.mode=mode;
   return data;
  }
  return {call,clear,storageKey:key};
 }
 return {create};
});
