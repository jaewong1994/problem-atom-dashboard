# GitHub Pages 운영

## 구성원이 하는 일

> **2026-09-03 변경:** 시즌 1 문항 선점은 JSON 배포가 아니라 Problem Atom 전용 Supabase Realtime을 사용한다. 최초 연결은 `실시간_선점_설정.md`를 따른다. 아래 JSON 절차는 세미나 완료 이력의 백업·일괄 반영용으로 유지한다.

1. 배포된 현황판에서 발표자 이름을 입력합니다.
2. 발표한 문제를 체크합니다. 기록은 해당 브라우저에 임시 저장됩니다.
3. 세미나가 끝나면 `세미나 기록 JSON 내보내기`를 눌러 운영자에게 전달합니다.

## 운영자가 세미나 후 하는 일

1. 전달받은 JSON을 `progress` 폴더에 넣습니다.
2. `세미나_JSON_반영.cmd`를 실행합니다.
3. 변경된 `progress-summary.json`을 GitHub에 커밋하고 푸시합니다.
4. GitHub Actions가 현황판을 자동 배포합니다.

개별 구성원의 원본 JSON은 `.gitignore`에 의해 공개 저장소에 올라가지 않습니다. 웹에는 병합된 완료 현황과 발표자 이름만 배포됩니다.

## 검수된 연구 자산 반영

1. 원본 기록지는 옵시디언에 보관합니다.
2. AI 정리 후 강사가 확인한 항목만 `../shared/approved-assets.json`에 반영합니다.
3. `공유자산_반영.cmd`를 실행합니다.
4. 공개용 `asset-library.json`의 집계를 확인한 뒤 GitHub에 커밋하고 푸시합니다.

출판 전 문항 전문, 학생 개인정보, 전체 AI 초안과 개별 진행 JSON은 공개 저장소에 올리지 않습니다.

## 승격 대기 파일럿

1. `python ../tools/build_pilot_review.py`로 `pilot-review.json`을 갱신합니다.
2. 페이지 `pilot-review.html`에서 후보 자산·조합 초안·공백 초안 회귀만 확인합니다.
3. 이 JSON의 문항 초안은 강사 검토용이며 배포·승격 대상이 아닙니다.
4. 학생용 화면이 필요해지면 문항 전문을 빼고 자산 이름만 남깁니다.

## 승격 대기 자산 탭 운영

1. 강사는 `promotion-board.html`에서 이름을 입력하고 자기 탭을 엽니다. 후보마다 `확인 · 정정 필요 · 보류`를 누르고, 이름 수정안·빠진 전제·합칠 후보는 상자 안 댓글로 남깁니다. 손글씨·여백 유래 후보는 `손글씨 주의` 상자를 보고 원문 PDF와 대조합니다.
2. 세미나 후 `검토 JSON 내보내기`와 `댓글 JSON 내보내기`를 눌러 운영자에게 보냅니다. 실시간 댓글이 연결되어 있으면 댓글은 자동 공유됩니다.
3. 운영자는 파일을 `reviews`·`comments` 폴더에 넣고 `python ../tools/pa_pipeline.py collect`를 실행합니다. status는 바뀌지 않습니다.
4. `python ../tools/pa_pipeline.py brief`로 승격 브리프를 만들고, Claude에게 `archive/reviews/promotion_brief.md`를 읽어 결정 파일 초안을 쓰게 합니다(옵시디언 `31_승격_대기_자산_파이프라인_SOP`).
5. 결정 파일을 확인한 뒤 `python ../tools/pa_pipeline.py decide --decision-file ../archive/reviews/decisions/날짜.json`을 실행합니다. reviewed·합침·고도화·폐기·비준이 여기서만 일어나고 화면 JSON이 다시 만들어집니다.
6. 커밋·푸시합니다. `pilot-review.json`은 초안 전문이 빠진 상태여야 합니다(`build_pilot_review.py --with-drafts` 결과는 커밋 금지).

## 승격 대기 강사 검토 회수

1. 강사는 `pilot-review.html`에서 이름을 입력하고 `내 후보만`으로 자기 후보를 연 뒤, 후보마다 `확인 · 정정 필요 · 보류`와 메모를 남깁니다. 기록지 아래의 `검토 쟁점`은 교차검토 대상입니다.
2. `검토 JSON 내보내기`를 눌러 운영자에게 보냅니다. 표시는 브라우저에만 남으므로 세미나마다 내보냅니다.
3. 운영자는 받은 파일을 `reviews` 폴더에 넣고 `강사검토_반영.cmd`를 실행합니다. 결과는 `archive/reviews/ledger.json`과 각 후보 파일의 `instructor_reviews`에 붙고, 작성 강사 본인의 확인만 `review_status: author_confirmed`가 됩니다. `status`는 바뀌지 않습니다.
4. 세미나에서 이름·정의가 합의된 뒤에만 운영자가 `python ../tools/apply_pilot_reviews.py --promote-reviewed`를 실행해 작성 강사가 확인한 후보를 `reviewed`로 올립니다. `ratified`는 이 도구로 만들 수 없습니다.
5. `python ../tools/build_pilot_review.py`로 화면 JSON을 다시 만들면 회수된 검토가 후보 행에 표시됩니다.

## 자산 댓글 반영

1. 공유 자산 페이지에서 강사 이름을 입력하고 카드에 추가·정정·질문 댓글을 답니다.
2. `댓글 JSON 내보내기`를 눌러 운영자에게 전달합니다.
3. 받은 파일을 `comments` 폴더에 넣고 `자산댓글_반영.cmd`를 실행합니다.
4. 댓글은 `archive/comments/ledger.json`과 해당 후보 파일에 붙습니다. 정의문·이름은 자동으로 바뀌지 않습니다.
5. 실시간 공유를 쓰려면 Problem Atom Supabase SQL Editor에서 `realtime/supabase_setup.sql`을 한 번 더 실행해 `pa_asset_comments` 테이블을 만듭니다.

## 최초 배포

1. GitHub에서 빈 공개 저장소를 하나 만듭니다.
2. 이 폴더의 파일을 `main` 브랜치에 올립니다.
3. 저장소 `Settings → Pages → Build and deployment → Source`에서 `GitHub Actions`를 선택합니다.
4. `Actions` 탭의 배포가 끝나면 Pages 주소가 표시됩니다.
