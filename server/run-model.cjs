// Run on a server/worker with an API key, or use this CLI as an adapter smoke test.
const fs=require('node:fs');const path=require('node:path');const {generate}=require('./model-adapter.cjs');
async function main(){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('사용법: node server/run-model.cjs request.json result.json');
 if(fs.existsSync(output))throw Error('결과 파일 덮어쓰기 금지');
 const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'../connection-registry.json'),'utf8'));
 const job=JSON.parse(fs.readFileSync(input,'utf8'));
 const response=await generate(job,registry);fs.writeFileSync(output,JSON.stringify(response,null,2)+'\n');
 console.log(response.validation.accepted?'연결 검사 통과 · 독립 검산 대기':'검토할 문제가 남았습니다.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
