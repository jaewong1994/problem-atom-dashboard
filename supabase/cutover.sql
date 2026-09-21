-- Run only after the cloud function and regression.sql pass. Keeps the original rows as a backup.
begin;
revoke all on public.pa_members,public.pa_question_claims from anon,authenticated;
do $$ begin if to_regclass('public.pa_asset_comments') is not null then
 revoke all on public.pa_asset_comments from anon,authenticated;
end if; end $$;
-- Carry across any legacy updates since the initial snapshot; never override authenticated work.
insert into pa_team_claims(question_id,owner_id,status,claimed_at,updated_at,source)
select distinct on(q.question_id,a.id) q.question_id,a.id,c.status,c.claimed_at,c.updated_at,'legacy-supabase'
from pa_question_claims c join pa_team_accounts a on trim(c.owner_name) in (a.name,a.name||'T',a.name||'t',a.name||' 강사',a.name||' 선생님')
join pa_team_questions q on q.alias=c.question_id
where not exists(select 1 from pa_team_audit x where x.actor=a.id and x.action like 'claim-%' and x.detail->>'question'=q.question_id)
order by q.question_id,a.id,c.updated_at desc,(c.status='completed') desc
on conflict(question_id,owner_id) do update set status=excluded.status,updated_at=excluded.updated_at
where pa_team_claims.source='legacy-supabase' and pa_team_claims.updated_at<excluded.updated_at;
commit;
select count(*) as ownership_records,count(*) filter(where status='completed') as completed_ownership_records,count(distinct question_id) filter(where status='completed') as completed_questions from pa_team_claims;
