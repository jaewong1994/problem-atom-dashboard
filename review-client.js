(function(){'use strict';
 const KEY='pa-linked-reviews-v1';
 function create(session){
  let snapshot=null,queue=Promise.resolve();
  const cached=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"groups":[]}');}catch{return {groups:[]};}};
  async function load(){
   if(window.PAAccount?.enabled){await PAAccount.ready;snapshot=await PAAccount.call('reviews');}
   else if(session.local)snapshot=await session.reviews();
   else {const [a,b]=await Promise.all([fetch('review-catalog.json',{cache:'no-store'}),fetch('group-review-ledger.json',{cache:'no-store'})]);if(!a.ok||!b.ok)throw Error('검수 자료를 읽지 못했습니다.');const catalog=await a.json(),ledger=await b.json();snapshot={catalog,ledger:{groups:[...(ledger.groups||[]),...cached().groups]},storage:'browser'};}
   return snapshot;
  }
  function save(payload){const captured=structuredClone(payload);const run=async()=>{
   if(!snapshot)await load();PAReviewModel.validate(captured,snapshot.catalog);
   if(window.PAAccount?.enabled)snapshot=await PAAccount.call('reviews',{...captured,baseVersion:snapshot.version});
   else if(session.local)snapshot=await session.saveReviews({...captured,baseVersion:snapshot.version});
   else {const data=cached(),rows=PAReviewModel.validate(captured,snapshot.catalog);for(const row of rows){row.at=new Date().toISOString();data.groups=data.groups.filter(r=>r.groupId!==row.groupId);data.groups.push(row);}localStorage.setItem(KEY,JSON.stringify(data));await load();}
   return snapshot;
  };queue=queue.then(run,run);return queue;}
  const attach=registry=>{registry.reviewed_assets=PAReviewModel.assets(registry,snapshot.catalog,snapshot.ledger);return registry.reviewed_assets;};
  return {load,save,attach,get:()=>snapshot,key:KEY};
 }
 window.PAReviewClient={create};
})();
