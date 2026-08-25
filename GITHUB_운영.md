# GitHub Pages 운영

## 구성원이 하는 일

1. 배포된 현황판에서 발표자 이름을 입력합니다.
2. 발표한 문제를 체크합니다. 기록은 해당 브라우저에 임시 저장됩니다.
3. 세미나가 끝나면 `세미나 기록 JSON 내보내기`를 눌러 운영자에게 전달합니다.

## 운영자가 세미나 후 하는 일

1. 전달받은 JSON을 `progress` 폴더에 넣습니다.
2. `세미나_JSON_반영.cmd`를 실행합니다.
3. 변경된 `progress-summary.json`을 GitHub에 커밋하고 푸시합니다.
4. GitHub Actions가 현황판을 자동 배포합니다.

개별 구성원의 원본 JSON은 `.gitignore`에 의해 공개 저장소에 올라가지 않습니다. 웹에는 병합된 완료 현황과 발표자 이름만 배포됩니다.

## 최초 배포

1. GitHub에서 빈 공개 저장소를 하나 만듭니다.
2. 이 폴더의 파일을 `main` 브랜치에 올립니다.
3. 저장소 `Settings → Pages → Build and deployment → Source`에서 `GitHub Actions`를 선택합니다.
4. `Actions` 탭의 배포가 끝나면 Pages 주소가 표시됩니다.
