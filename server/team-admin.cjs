'use strict';
const fs=require('node:fs'),path=require('node:path'),{createTeamStore}=require('./team-store.cjs');
const root=path.resolve(__dirname,'..'),dir=path.resolve(process.env.PA_TEAM_DATA||path.join(root,'.pa-team'));
fs.mkdirSync(dir,{recursive:true});const data=JSON.parse(fs.readFileSync(path.join(root,'dashboard-data.json'),'utf8'));
const store=createTeamStore({file:path.join(dir,'team.sqlite'),questions:data.exams.flatMap(e=>e.sections.flatMap(s=>s.questions))});
try{
 const [command,arg,flag]=process.argv.slice(2);
 if(command==='invite'){
  const token=store.issueInvite(arg),file=path.join(dir,'초대코드-'+arg+'.txt');fs.writeFileSync(file,arg+' 최초 비밀번호 설정용 초대 코드 (7일간 유효, 한 번만 사용)\n'+token+'\n',{mode:0o600});console.log('초대 코드를 비공개 파일에 저장했습니다: '+file);
 }else if(command==='import'){
  if(!arg)throw Error('이전 기록 JSON 경로가 필요합니다.');const source=JSON.parse(fs.readFileSync(path.resolve(arg),'utf8').replace(/^\uFEFF/,''));const report=store.importLegacy(source,{dryRun:flag!=='--apply'});console.log(JSON.stringify(report,null,2));
 }else if(command==='status')console.log(JSON.stringify({members:store.members(),claims:store.claims().length},null,2));
 else throw Error('사용: node server/team-admin.cjs invite 강사이름 | import 파일 [--apply] | status');
}finally{store.close();}
