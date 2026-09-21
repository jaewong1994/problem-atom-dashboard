'use strict';
const {DatabaseSync}=require('node:sqlite');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const MEMBERS=[['kim-yeonsu','김연수'],['lee-kwanghoon','이광훈'],['kim-sangbum','김상범'],['min-jaewoong','민재웅']];
const code=()=>crypto.randomBytes(32).toString('base64url');
const fail=(status,message)=>{const e=Error(message);e.status=status;throw e;};
const person=name=>MEMBERS.find(([,n])=>[n,n+'T',n+'t',n+' 선생님',n+' 강사'].includes(String(name||'').trim()));
async function passwordHash(password,salt){return Buffer.from(await scrypt(password,salt,64,{N:131072,r:8,p:1,maxmem:160*1024*1024})).toString('hex');}

function createTeamStore({file,questions,now=()=>Date.now(),derive=passwordHash}){
 const db=new DatabaseSync(file);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,name TEXT UNIQUE NOT NULL,salt TEXT,password_hash TEXT,invite_hash TEXT,invite_expires INTEGER);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES members(id),csrf TEXT NOT NULL,mode TEXT,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS claims(question_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES members(id),status TEXT NOT NULL CHECK(status IN ('claimed','completed')),claimed_at TEXT NOT NULL,updated_at TEXT NOT NULL,source TEXT NOT NULL,PRIMARY KEY(question_id,user_id));
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,user_id TEXT,action TEXT NOT NULL,question_id TEXT,detail TEXT);
 CREATE TABLE IF NOT EXISTS failures(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,asset_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES members(id),kind TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL);`);
 for(const [id,name]of MEMBERS)db.prepare('INSERT OR IGNORE INTO members(id,name) VALUES(?,?)').run(id,name);
 const aliases=new Map();for(const q of questions){aliases.set(q.id,q.id);for(const id of q.legacyIds||[])aliases.set(id,q.id);}
 const date=()=>new Date(now()).toISOString(),member=id=>db.prepare('SELECT * FROM members WHERE id=?').get(id);
 const log=(id,action,q=null,detail=null)=>db.prepare('INSERT INTO audit(at,user_id,action,question_id,detail) VALUES(?,?,?,?,?)').run(date(),id,action,q,detail);
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
 function limited(name,ip){
  const keys=[['ip:'+ip,30],['name:'+name,8]];
  for(const [key,max] of keys){const r=db.prepare('SELECT * FROM failures WHERE key=?').get(hash(key));if(r&&r.until>now()&&r.count>=max)fail(429,'잠시 후 다시 시도해 주세요.');}
  for(const [key]of keys)db.prepare('INSERT INTO failures(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END,until=CASE WHEN until<? THEN excluded.until ELSE until END').run(hash(key),now()+15*60000,now(),now());
 }
 function issueInvite(name){
  const entry=person(name);if(!entry)fail(400,'등록된 네 강사만 사용할 수 있습니다.');const m=member(entry[0]);if(m.password_hash)fail(409,'이미 비밀번호가 설정된 계정입니다.');
  const token=code();db.prepare('UPDATE members SET invite_hash=?,invite_expires=? WHERE id=?').run(hash(token),now()+7*86400000,m.id);log(m.id,'invite-issued');return token;
 }
 function sessionFor(id){
  const token=code(),csrf=code(),m=member(id);db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());
  db.prepare('INSERT INTO sessions(token_hash,user_id,csrf,mode,expires) VALUES(?,?,?,NULL,?)').run(hash(token),id,csrf,now()+12*3600000);
  return {token,user:{id:m.id,name:m.name},csrf,mode:null};
 }
 let deriving=false;
 async function authenticate({name,password,invite},ip='local'){
  if(typeof name!=='string'||name.length>40||typeof password!=='string'||password.length>256)fail(400,'이름과 비밀번호를 확인해 주세요.');
  limited(name,ip);if(deriving)fail(429,'다른 로그인 확인 중입니다. 잠시 후 다시 시도해 주세요.');
  const entry=person(name),m=entry&&member(entry[0]);
  if(!m)fail(401,'이름 또는 비밀번호를 확인해 주세요.');
  if(!m.password_hash){
   if(typeof invite!=='string'||invite.length>128||!m.invite_hash||m.invite_hash!==hash(invite)||m.invite_expires<now())fail(401,'최초 설정에는 본인의 초대 코드가 필요합니다.');
   if(password.length<12)fail(400,'비밀번호는 12자 이상으로 설정해 주세요.');
  }
  deriving=true;let derived,salt=m.salt||crypto.randomBytes(24).toString('hex');
  try{derived=await derive(password,salt);}finally{deriving=false;}
  return transaction(()=>{
   const current=member(m.id);
   if(!m.password_hash){
    if(current.password_hash||current.invite_hash!==m.invite_hash||current.invite_expires<now())fail(409,'초대 코드가 바뀌었거나 이미 설정된 계정입니다.');
    db.prepare('UPDATE members SET salt=?,password_hash=?,invite_hash=NULL,invite_expires=NULL WHERE id=?').run(salt,derived,m.id);log(m.id,'password-initialized');
   }else if(!crypto.timingSafeEqual(Buffer.from(derived,'hex'),Buffer.from(m.password_hash,'hex')))fail(401,'이름 또는 비밀번호를 확인해 주세요.');
   db.prepare('DELETE FROM failures WHERE key=?').run(hash('name:'+name));log(m.id,'login');return sessionFor(m.id);
  });
 }
 function session(token){if(typeof token!=='string'||token.length>128)return null;const row=db.prepare('SELECT s.*,m.name FROM sessions s JOIN members m ON m.id=s.user_id WHERE token_hash=? AND expires>?').get(hash(token),now());return row?{user:{id:row.user_id,name:row.name},csrf:row.csrf,mode:row.mode}:null;}
 function logout(token){db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token||''));}
 function mode(token,value){if(!['codex','web'].includes(value))fail(400,'제작 방식을 선택해 주세요.');if(!session(token))fail(401,'로그인이 필요합니다.');db.prepare('UPDATE sessions SET mode=? WHERE token_hash=?').run(value,hash(token));return session(token);}
 function claims(){return db.prepare('SELECT question_id,user_id AS owner_id,name AS owner_name,status,claimed_at,updated_at,source FROM claims JOIN members ON members.id=claims.user_id ORDER BY question_id,user_id').all();}
 function updateClaim(user,questionId,action){
  if(!member(user.id))fail(401,'로그인이 필요합니다.');const q=aliases.get(questionId);if(!q)fail(400,'등록된 문항이 아닙니다.');
  return transaction(()=>{
   const own=db.prepare('SELECT * FROM claims WHERE question_id=? AND user_id=?').get(q,user.id);
   if(action==='claim'){
    if(own)fail(409,'이미 본인이 맡은 문항입니다.');db.prepare('INSERT INTO claims VALUES(?,?,?,?,?,?)').run(q,user.id,'claimed',date(),date(),'account');
   }else{
    if(!own)fail(403,'본인이 선점한 문항만 변경할 수 있습니다.');
    if(action==='complete'){if(own.status!=='claimed')fail(409,'이미 분석 완료된 문항입니다.');db.prepare('UPDATE claims SET status=?,updated_at=?,source=? WHERE question_id=? AND user_id=?').run('completed',date(),'account',q,user.id);}
    else if(action==='reopen'){if(own.status!=='completed')fail(409,'완료된 본인 문항만 다시 분석 중으로 바꿀 수 있습니다.');db.prepare('UPDATE claims SET status=?,updated_at=?,source=? WHERE question_id=? AND user_id=?').run('claimed',date(),'account',q,user.id);}
    else if(action==='release'){if(own.status!=='claimed')fail(409,'완료 기록은 선점 취소로 삭제할 수 없습니다.');db.prepare('DELETE FROM claims WHERE question_id=? AND user_id=?').run(q,user.id);}
    else fail(400,'지원하지 않는 동작입니다.');
   }log(user.id,action,q);return claims();
  });
 }
 function importLegacy(payload,{dryRun=true}={}){
  const raw=[...(payload.claims||[])];for(const source of payload.sources||[])for(const e of source.events||[])raw.push({question_id:e.questionId,owner_name:source.actor,status:e.done?'completed':'claimed',updated_at:e.updatedAt,claimed_at:e.updatedAt,wasUndone:!e.done});
  const latest=new Map(),unmatched=[];
  for(const r of raw){const m=person(r.owner_name),q=aliases.get(r.question_id);if(!m||!q||!['claimed','completed'].includes(r.status)){unmatched.push({name:r.owner_name,question:r.question_id,reason:!m?'이름 확인':!q?'문항 ID 확인':'상태 확인'});continue;}
   const key=q+'|'+m[0],at=Number.isFinite(Date.parse(r.updated_at))?new Date(r.updated_at).toISOString():date(),old=latest.get(key);
   if(!old||at>=old.updated_at)latest.set(key,{...r,question_id:q,user_id:m[0],updated_at:at,claimed_at:Number.isFinite(Date.parse(r.claimed_at))?new Date(r.claimed_at).toISOString():at});
  }
  const rows=[...latest.values()].filter(r=>!r.wasUndone),report={dryRun,sourceRows:raw.length,matched:rows.length,inserted:0,updated:0,existing:0,unmatched,byMember:{}};
  transaction(()=>{for(const r of rows){
   report.byMember[r.user_id]=(report.byMember[r.user_id]||0)+1;
   const old=db.prepare('SELECT * FROM claims WHERE question_id=? AND user_id=?').get(r.question_id,r.user_id);
   if(old){
    if(old.source==='legacy'&&r.updated_at>old.updated_at){report.updated++;if(!dryRun){db.prepare('UPDATE claims SET status=?,updated_at=? WHERE question_id=? AND user_id=?').run(r.status,r.updated_at,r.question_id,r.user_id);log(r.user_id,'legacy-refresh',r.question_id);}}
    else report.existing++;continue;
   }
   // A deliberate release remains authoritative even though it removes the claim row.
   const released=db.prepare("SELECT 1 FROM audit WHERE question_id=? AND user_id=? AND action='release' LIMIT 1").get(r.question_id,r.user_id);
   if(released){report.existing++;continue;}
   report.inserted++;if(!dryRun){db.prepare('INSERT INTO claims VALUES(?,?,?,?,?,?)').run(r.question_id,r.user_id,r.status,r.claimed_at,r.updated_at,'legacy');log(r.user_id,'legacy-import',r.question_id,JSON.stringify({name:r.owner_name,status:r.status,source:payload.source||'legacy-export'}));}
  }});return report;
 }
 function comments(){return db.prepare('SELECT c.id AS commentId,asset_id AS assetId,user_id AS ownerId,name AS actor,kind,body,created_at AS createdAt FROM comments c JOIN members m ON m.id=c.user_id ORDER BY created_at').all();}
 function comment(user,payload){if(!['addition','correction','question'].includes(payload.kind)||typeof payload.assetId!=='string'||payload.assetId.length>200||typeof payload.body!=='string'||!payload.body.trim()||payload.body.length>2000)fail(400,'댓글 내용을 확인해 주세요.');db.prepare('INSERT INTO comments VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(),payload.assetId,user.id,payload.kind,payload.body.trim(),date());return comments();}
 function deleteComment(user,id){const result=db.prepare('DELETE FROM comments WHERE id=? AND user_id=?').run(id,user.id);if(!result.changes)fail(403,'본인의 댓글만 삭제할 수 있습니다.');return comments();}
 return {authenticate,session,logout,mode,issueInvite,claims,updateClaim,importLegacy,comments,comment,deleteComment,members:()=>MEMBERS.map(([id,name])=>({id,name,needsSetup:!member(id).password_hash})),close:()=>db.close()};
}
module.exports={createTeamStore,MEMBERS,passwordHash};
