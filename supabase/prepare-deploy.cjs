'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.pa-team','supabase-deploy');fs.mkdirSync(out,{recursive:true});
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const sql=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
const questions=JSON.parse(read('dashboard-data.json')).exams.flatMap(e=>e.sections.flatMap(s=>s.questions));
const canonical=new Set(questions.map(q=>q.id)),aliases=new Map(questions.map(q=>[q.id,q.id])),ambiguous=new Set();
for(const q of questions)for(const alias of q.legacyIds||[]){if(canonical.has(alias)||ambiguous.has(alias))continue;if(aliases.has(alias)&&aliases.get(alias)!==q.id){aliases.delete(alias);ambiguous.add(alias);}else aliases.set(alias,q.id);}
console.log('Ambiguous historical aliases excluded (canonical question IDs retained): '+ambiguous.size);
const model=read('review-model.js');fs.writeFileSync(path.join(__dirname,'functions/pa-team/review-model.js'),model);
fs.writeFileSync(path.join(out,'edge.ts'),model+'\n'+read('supabase/functions/pa-team/index.ts').replace("import './review-model.js';",''));
fs.copyFileSync(path.join(__dirname,'team.sql'),path.join(out,'schema.sql'));
let seed='begin;\n';
seed+=`insert into pa_team_questions(alias,question_id) select x->>0,x->>1 from jsonb_array_elements(${sql([...aliases])}) x on conflict(alias) do update set question_id=excluded.question_id;\n`;
seed+=`insert into pa_team_documents(key,payload) values('catalog',${sql(JSON.parse(read('review-catalog.json')))}) on conflict(key) do update set payload=excluded.payload,version=pa_team_documents.version+1;\n`;
// Source rows stay intact. Collapse browser identities only when the exact known teacher alias matches.
seed+=`insert into pa_team_claims(question_id,owner_id,status,claimed_at,updated_at,source)
select distinct on(q.question_id,a.id) q.question_id,a.id,c.status,c.claimed_at,c.updated_at,'legacy-supabase'
from pa_question_claims c join pa_team_accounts a on trim(c.owner_name) in (a.name,a.name||'T',a.name||'t',a.name||' 강사',a.name||' 선생님')
join pa_team_questions q on q.alias=c.question_id
where not exists(select 1 from pa_team_documents where key='legacy-migrated')
order by q.question_id,a.id,c.updated_at desc,(c.status='completed') desc
on conflict(question_id,owner_id) do nothing;
do $$ begin if to_regclass('public.pa_asset_comments') is not null then
insert into pa_team_comments(comment_id,asset_id,owner_id,kind,body,created_at)
select c.comment_id,c.asset_id,a.id,c.kind,c.body,c.created_at from pa_asset_comments c join pa_team_accounts a on trim(c.owner_name) in (a.name,a.name||'T',a.name||'t',a.name||' 강사',a.name||' 선생님')
where not exists(select 1 from pa_team_documents where key='legacy-migrated') on conflict do nothing;
end if; end $$;
`;
// Invitations are generated only once per private deployment folder; reruns never rotate a delivered code.
for(const name of ['김연수','이광훈','김상범','민재웅']){
 const file=path.join(out,'초대코드-'+name+'.txt');let invite;
 if(fs.existsSync(file))invite=fs.readFileSync(file,'utf8').trim();else{invite=crypto.randomBytes(32).toString('hex');fs.writeFileSync(file,invite+'\n');}
 const hash=crypto.createHash('sha256').update(invite).digest('hex');seed+=`update pa_team_accounts set invite_hash='${hash}',invite_expires=now()+interval '7 days' where name='${name}' and state='pending' and invite_hash is null;\n`;
}
seed+=`insert into pa_team_documents(key,payload) values('legacy-migrated',jsonb_build_object('at',now())) on conflict do nothing;
commit;
select a.name,a.role,a.state,count(c.*) as claims,count(c.*) filter(where c.status='completed') as completed from pa_team_accounts a left join pa_team_claims c on c.owner_id=a.id group by a.id order by a.name;`;
fs.writeFileSync(path.join(out,'seed.sql'),seed);
console.log('Prepared schema, Edge function, question aliases, review catalog and private invitation files.');
