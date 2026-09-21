# Shared teacher accounts

Production uses the existing **gichool** Supabase project (`reyydhlreabavrbmomkz`) and the existing GitHub Pages site. It does not depend on the local SQLite preview server.

## Teacher flow

1. Choose your name on the home screen. On the first login, enter the shared initial code `000000` and set your own password (at least 6 characters).
2. Choose Codex subscription or the AI web workflow for this login. Web mode exchanges prompts/results by copying; it does not promise unlimited free model usage. Codex generation still requires the existing companion on the teacher's computer.
3. The dashboard allows completion/reopening/releasing only the signed-in teacher's own claims. Multiple teachers can independently claim the same question.
4. Kim Yeonsu, Lee Kwanghoon, Kim Sangbum and Min Jaewoong are the four initial administrators. **Account management** appears below the common navigation for administrators.
5. Add an account by name. Its initial code is `000000`; it stops working for that account after password setup. New accounts are teachers, not administrators. Reissuing an invitation restores this same setup code. No teacher password is visible to administrators.
6. Delete disables account access immediately, including existing JWTs at the application boundary. Analysis, comments and reviews remain. Restore recovers the same identity; pending accounts return with the same initial code. Self-deletion is blocked.

## Boundaries

- Supabase Auth owns passwords and sessions; the browser uses sessionStorage and the native token refresh endpoint. No service key is distributed to the browser.
- `pa-team` verifies every protected JWT with Auth and then checks the account's active status. Public routes are only roster, login and unauthenticated session status.
- `pa_team_rpc` and seven `pa_team_*` tables are service-only; both anon and authenticated direct access are revoked. Every table has RLS. The function is SECURITY DEFINER with a fixed search path and service_role-only EXECUTE.
- Account changes are serialized and audited. At the owner’s request, invitations use the common code `000000`, stored as a SHA-256 hash without an expiration while the account is pending. The code is removed on activation; it does not replace a password for active accounts. Initial setup has a two-minute lease and can recover an Auth user after an interrupted activation.
- Legacy `pa_members` and `pa_question_claims` remain as backups, with old anonymous client access revoked at cutover. Ambiguous historical question aliases are excluded rather than guessed. Canonical question IDs remain usable.
- Shared reviews use the same review-model validator as the composer, authenticated reviewer identity and a database version check. Reviewed content becomes available through `PAReviewClient` to both the material library and composition workflow.

## Deployment and verification

1. Run the normal `prepare_pages.py --build` (including account setup boundary tests).
2. `node supabase/prepare-deploy.cjs` prepares schema, catalog/question mappings and a single-file Edge bundle in ignored `.pa-team/supabase-deploy`. Initial teacher code files are written there with `000000`. Treat this folder as private.
3. Apply `supabase/team.sql` and the prepared `seed.sql` in the named project. Existing claims import once; later seed runs update the catalog/question mappings and initialize missing invitations. For the change from long codes, apply `supabase/simplify-invitations.sql` once; it affects only pending accounts.
4. Deploy `supabase/functions/pa-team` with `verify_jwt=false` (custom Auth verification is inside the function). The dashboard can deploy the prepared `edge.ts` as `index.ts`; its legacy JWT verification setting must be off. CLI equivalent: `supabase functions deploy pa-team --project-ref reyydhlreabavrbmomkz --no-verify-jwt`.
5. Run `supabase/regression.sql`: its temporary accounts and assertions roll back in full. Check the actual Edge endpoint rejects anonymous protected routes and invalid tokens. Also run the native initial-login flow during acceptance; tests of Auth are distinct from the SQL regression.
6. Apply `supabase/cutover.sql`, then deploy Pages with `account-config.js` enabled. Never expose `.pa-team`, invitation files, SQL seed files, Auth tokens or service keys through `_site`.

The old `server/team-service.cjs` and SQLite tests are retained as an explicit offline fallback. They are not the production account authority. Do not run that preview on port 8992 for shared use.
