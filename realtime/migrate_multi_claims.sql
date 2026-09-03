-- 기존 Problem Atom 저장소를 문항당 여러 강사가 참여할 수 있게 전환한다.
-- 2026-09-03 gichool 프로젝트에 적용 완료.
begin;

alter table public.pa_question_claims
  drop constraint if exists pa_question_claims_pkey;

alter table public.pa_question_claims
  add constraint pa_question_claims_pkey primary key (question_id, owner_id);

create index if not exists pa_question_claims_question_id_idx
  on public.pa_question_claims (question_id);

commit;
