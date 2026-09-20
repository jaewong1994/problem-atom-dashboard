const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),M=require('../review-model.js');
function createReviewStore({registry,catalog,stateDir,baseLedger={groups:[]}}){
 const file=path.join(stateDir,'asset-reviews.json');
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{groups:baseLedger.groups||[],history:[]};
 const version=data=>crypto.createHash('sha256').update(JSON.stringify(data.groups)).digest('hex');
 function snapshot(){const data=read();return {catalog,ledger:{groups:data.groups},version:version(data),storage:'companion'};}
 function save(payload){
  const data=read();if(payload.baseVersion!==version(data))throw Error('다른 화면에서 검수가 바뀌었습니다. 새로고침 후 다시 저장해 주세요.');
  const rows=M.validate(payload,catalog),at=new Date().toISOString();
  for(const row of rows){row.at=at;data.groups=data.groups.filter(r=>r.groupId!==row.groupId);data.groups.push(row);}
  data.history=[...(data.history||[]),{at,actor:payload.actor,groups:rows}];
  fs.mkdirSync(stateDir,{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2));fs.renameSync(tmp,file);
  return snapshot();
 }
 function reviewedRegistry(){return {...registry,reviewed_assets:M.assets(registry,catalog,read())};}
 return {snapshot,save,reviewedRegistry};
}
module.exports={createReviewStore};
