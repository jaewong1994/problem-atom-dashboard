-- Owner-requested first-login simplification. Active passwords are untouched.
begin;
update public.pa_team_accounts
set invite_hash=encode(sha256(convert_to('000000','UTF8')),'hex'),invite_expires=null,setup_until=null
where state='pending';
-- Clear only setup retry counters so teachers can retry immediately.
update public.pa_team_rates set count=0,until=now()
where key in (select encode(sha256(convert_to('login:'||name,'UTF8')),'hex') from public.pa_team_accounts where state='pending');
commit;
select name,state,invite_hash=encode(sha256(convert_to('000000','UTF8')),'hex') as initial_code_ready,invite_expires is null as no_expiry
from public.pa_team_accounts order by name;
