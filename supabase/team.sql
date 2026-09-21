-- Run on gichool (reyydhlreabavrbmomkz). Service-only storage; no client may spoof an actor.
begin;
create table if not exists public.pa_team_accounts (
 id uuid primary key default gen_random_uuid(), name text unique not null check(length(name) between 1 and 20),
 role text not null default 'member' check(role in ('admin','member')),
 state text not null default 'pending' check(state in ('pending','active','deleted')),
 auth_id uuid unique references auth.users(id), invite_hash text, invite_expires timestamptz,
 setup_until timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.pa_team_claims (
 question_id text not null, owner_id uuid not null references public.pa_team_accounts(id),
 status text not null check(status in ('claimed','completed')), claimed_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), source text not null default 'account', primary key(question_id,owner_id)
);
create table if not exists public.pa_team_comments (
 comment_id uuid primary key default gen_random_uuid(), asset_id text not null,
 owner_id uuid not null references public.pa_team_accounts(id), kind text not null check(kind in ('addition','correction','question')),
 body text not null check(length(body) between 1 and 2000), created_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.pa_team_documents (key text primary key,payload jsonb not null,version bigint not null default 1);
create table if not exists public.pa_team_audit (id bigint generated always as identity primary key,actor uuid,action text not null,detail jsonb,at timestamptz not null default now());
create table if not exists public.pa_team_rates (key text primary key,count integer not null,until timestamptz not null);
create table if not exists public.pa_team_questions (alias text primary key,question_id text not null);
do $$ declare t text; begin
 foreach t in array array['pa_team_accounts','pa_team_claims','pa_team_comments','pa_team_documents','pa_team_audit','pa_team_rates','pa_team_questions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.pa_team_audit_id_seq to service_role;
insert into public.pa_team_accounts(name,role) values ('김연수','admin'),('이광훈','admin'),('김상범','admin'),('민재웅','admin') on conflict(name) do nothing;
insert into public.pa_team_documents(key,payload) values ('ledger','{"groups":[]}') on conflict do nothing;

create or replace function public.pa_team_rpc(p_actor uuid,p_action text,p_body jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a pa_team_accounts; target pa_team_accounts; result jsonb; q text; old pa_team_claims; doc pa_team_documents; n integer; r jsonb;
begin
 if p_action='rate' then
  delete from pa_team_rates where until < now();
  insert into pa_team_rates values(p_body->>'key',1,now()+interval '15 minutes')
   on conflict(key) do update set count=pa_team_rates.count+1 returning count into n;
  if n>12 then return jsonb_build_object('error','로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.','status',429); end if;
  return '{"ok":true}';
 end if;
 if p_action='members' then
  return jsonb_build_object('members',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'needsSetup',state='pending') order by name) from pa_team_accounts where state<>'deleted'),'[]'));
 end if;
 if p_action='setup-lock' then
  select * into target from pa_team_accounts where name=p_body->>'name' for update;
  if target.id is null or target.state<>'pending' or target.invite_hash is null or target.invite_hash<>p_body->>'hash' or (target.invite_expires is not null and target.invite_expires<now()) then
   return jsonb_build_object('error','초대 코드 000000을 입력하고 본인 이름을 확인해 주세요.','status',401);
  end if;
  if target.setup_until>now() then return jsonb_build_object('error','비밀번호 설정 중입니다. 잠시 후 다시 시도해 주세요.','status',409); end if;
  update pa_team_accounts set setup_until=now()+interval '2 minutes' where id=target.id;
  -- Allows recovery after Auth succeeded but the previous function invocation stopped before activation.
  select id into target.auth_id from auth.users where email=target.id::text||'@problem-atom.invalid';
  return jsonb_build_object('id',target.id,'auth_id',target.auth_id);
 end if;
 if p_action='setup-finish' then
  select * into target from pa_team_accounts where id=(p_body->>'id')::uuid for update;
  if target.state<>'pending' or target.invite_hash is distinct from p_body->>'hash' or target.setup_until<=now() then
   return jsonb_build_object('error','초대 상태가 바뀌었습니다. 관리자에게 확인해 주세요.','status',409);
  end if;
  update pa_team_accounts set state='active',auth_id=(p_body->>'authId')::uuid,invite_hash=null,invite_expires=null,setup_until=null where id=target.id;
  insert into pa_team_audit(actor,action) values(target.id,'password-initialized');
  return '{"ok":true}';
 end if;
 select * into a from pa_team_accounts where auth_id=p_actor and state='active';
 if a.id is null then return jsonb_build_object('error','로그인한 뒤 사용해 주세요.','status',401); end if;
 if p_action='me' then return jsonb_build_object('user',jsonb_build_object('id',a.id,'name',a.name,'role',a.role)); end if;
 if p_action like 'admin-%' then
  perform pg_advisory_xact_lock(6942026);
  -- Recheck after acquiring the lock: another administrator may have removed this account.
  select * into a from pa_team_accounts where auth_id=p_actor and state='active';
  if a.id is null or a.role<>'admin' then return jsonb_build_object('error','관리자만 계정을 관리할 수 있습니다.','status',403); end if;
  if p_action='admin-create' then
   if length(trim(p_body->>'name')) not between 1 and 20 or p_body->>'name' ~ '[[:cntrl:]]' then return jsonb_build_object('error','이름은 1~20자로 입력해 주세요.','status',400); end if;
   if exists(select 1 from pa_team_accounts where name=trim(p_body->>'name')) then return jsonb_build_object('error','이미 등록된 이름입니다. 삭제한 계정이라면 복원해 주세요.','status',409); end if;
   insert into pa_team_accounts(name,invite_hash,invite_expires) values(trim(p_body->>'name'),p_body->>'hash',null) returning * into target;
  elsif p_action in ('admin-delete','admin-restore','admin-invite') then
   select * into target from pa_team_accounts where id=(p_body->>'id')::uuid for update;
   if target.id is null then return jsonb_build_object('error','계정이 없습니다.','status',404); end if;
   if p_action='admin-delete' then
    if target.id=a.id then return jsonb_build_object('error','현재 로그인한 본인 계정은 삭제할 수 없습니다.','status',409); end if;
    if target.role='admin' and (select count(*) from pa_team_accounts where role='admin' and state<>'deleted')<=1 then return jsonb_build_object('error','마지막 관리자는 삭제할 수 없습니다.','status',409); end if;
    update pa_team_accounts set state='deleted',invite_hash=null,invite_expires=null,setup_until=null where id=target.id;
   elsif p_action='admin-restore' then
    if target.state<>'deleted' then return jsonb_build_object('error','삭제된 계정만 복원할 수 있습니다.','status',409); end if;
    update pa_team_accounts set state=case when auth_id is null then 'pending' else 'active' end,invite_hash=case when auth_id is null then encode(sha256(convert_to('000000','UTF8')),'hex') else null end,invite_expires=null,setup_until=null where id=target.id;
   else
    if target.state<>'pending' then return jsonb_build_object('error','최초 비밀번호 설정 전인 계정에만 초대 코드를 발급합니다.','status',409); end if;
    update pa_team_accounts set invite_hash=p_body->>'hash',invite_expires=null,setup_until=null where id=target.id;
   end if;
  elsif p_action<>'admin-list' then return jsonb_build_object('error','지원하지 않는 관리 동작입니다.','status',400); end if;
  if p_action<>'admin-list' then insert into pa_team_audit(actor,action,detail) values(a.id,p_action,jsonb_build_object('target',target.id)); end if;
  return jsonb_build_object('members',(select jsonb_agg(jsonb_build_object('id',id,'name',name,'role',role,'state',state,'createdAt',created_at) order by created_at,name) from pa_team_accounts));
 end if;
 if p_action in ('claims','claims-write') then
  if p_action='claims-write' then
   if p_body ?| array['owner_id','owner_name','actor'] then return jsonb_build_object('error','로그인한 계정으로만 기록할 수 있습니다.','status',400); end if;
   select question_id into q from pa_team_questions where alias=p_body->>'questionId';
   if q is null then return jsonb_build_object('error','등록된 문항이 아닙니다.','status',400); end if;
   perform pg_advisory_xact_lock(hashtextextended(a.id::text||q,0));
   select * into old from pa_team_claims where question_id=q and owner_id=a.id;
   if p_body->>'action'='claim' then
    if old.owner_id is not null then return jsonb_build_object('error','이미 본인이 맡은 문항입니다.','status',409); end if;
    insert into pa_team_claims(question_id,owner_id,status) values(q,a.id,'claimed');
   else
    if old.owner_id is null then return jsonb_build_object('error','본인이 선점한 문항만 변경할 수 있습니다.','status',403); end if;
    if p_body->>'action'='complete' and old.status='claimed' then update pa_team_claims set status='completed',updated_at=now(),source='account' where question_id=q and owner_id=a.id;
    elsif p_body->>'action'='reopen' and old.status='completed' then update pa_team_claims set status='claimed',updated_at=now(),source='account' where question_id=q and owner_id=a.id;
    elsif p_body->>'action'='release' and old.status='claimed' then delete from pa_team_claims where question_id=q and owner_id=a.id;
    else return jsonb_build_object('error','현재 문항 상태에서는 변경할 수 없습니다.','status',409); end if;
   end if;
   insert into pa_team_audit(actor,action,detail) values(a.id,'claim-'||(p_body->>'action'),jsonb_build_object('question',q));
  end if;
  return jsonb_build_object('claims',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('owner_name',m.name) order by c.question_id,c.owner_id) from pa_team_claims c join pa_team_accounts m on m.id=c.owner_id),'[]'));
 end if;
 if p_action in ('comments','comments-write') then
  if p_action='comments-write' then
   if p_body->>'action'='delete' then
    update pa_team_comments set deleted_at=now() where comment_id=(p_body->>'commentId')::uuid and owner_id=a.id and deleted_at is null;
    if not found then return jsonb_build_object('error','본인 의견만 삭제할 수 있습니다.','status',403); end if;
   else
    if length(trim(p_body->>'assetId')) not between 1 and 200 or length(trim(p_body->>'body')) not between 1 and 2000 or p_body->>'kind' not in ('addition','correction','question') then return jsonb_build_object('error','의견 내용을 확인해 주세요.','status',400); end if;
    insert into pa_team_comments(asset_id,owner_id,kind,body) values(p_body->>'assetId',a.id,p_body->>'kind',trim(p_body->>'body'));
   end if;
  end if;
  return jsonb_build_object('comments',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('owner_name',m.name) order by c.created_at) from pa_team_comments c join pa_team_accounts m on m.id=c.owner_id where c.deleted_at is null),'[]'));
 end if;
 if p_action in ('reviews','reviews-write') then
  select * into doc from pa_team_documents where key='ledger' for update;
  if p_action='reviews-write' then
   if p_body->>'baseVersion' is distinct from doc.version::text then return jsonb_build_object('error','다른 검수가 먼저 저장됐습니다. 새로고침 후 다시 확인해 주세요.','status',409); end if;
   if p_body->>'actor' is distinct from a.name or exists(select 1 from jsonb_array_elements(p_body->'groups') x where x->>'actor' is distinct from a.name) then return jsonb_build_object('error','로그인한 검토자 이름으로만 저장할 수 있습니다.','status',403); end if;
   result=coalesce((select jsonb_agg(x) from jsonb_array_elements(doc.payload->'groups') x where not exists(select 1 from jsonb_array_elements(p_body->'groups') y where y->>'groupId'=x->>'groupId')),'[]');
   for r in select * from jsonb_array_elements(p_body->'groups') loop result=result||jsonb_build_array(r||jsonb_build_object('at',now())); end loop;
   insert into pa_team_audit(actor,action,detail) values(a.id,'reviews',doc.payload);
   update pa_team_documents set payload=jsonb_build_object('groups',result),version=version+1 where key='ledger' returning * into doc;
  end if;
  return jsonb_build_object('catalog',(select payload from pa_team_documents where key='catalog'),'ledger',doc.payload,'version',doc.version::text,'storage','team');
 end if;
 return jsonb_build_object('error','지원하지 않는 요청입니다.','status',404);
end $$;
revoke all on function public.pa_team_rpc(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.pa_team_rpc(uuid,text,jsonb) to service_role;
commit;
