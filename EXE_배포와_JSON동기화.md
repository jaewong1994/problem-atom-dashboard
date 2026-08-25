# EXE 배포와 JSON 동기화

## 권장 배포 방식

`dashboard` 폴더 전체를 하나의 OneDrive 공유 폴더로 사용합니다. 구성원은 그 안의 `ProblemAtomDashboard.exe` 또는 `현황판_시작.cmd`를 실행합니다.

EXE는 화면을 여는 로컬 서버일 뿐이며, 기록은 계속 아래 파일에 저장됩니다.

```text
dashboard/
├─ ProblemAtomDashboard.exe
├─ dashboard-data.json
├─ progress/
│  ├─ 구성원A.json
│  └─ 구성원B.json
├─ assets/
├─ vendor/
└─ index.html
```

- `dashboard-data.json`: 운영자가 관리하는 시험·문항 원장
- `progress/이름.json`: 구성원별 체크 기록
- `assets/`: 문제 이미지
- `ProblemAtomDashboard.exe`: Python 없이 실행하는 프로그램

## 동기화가 유지되는 조건

1. 모든 구성원이 같은 OneDrive 공유 `dashboard` 폴더를 동기화합니다.
2. 각 구성원은 서로 다른 발표자 이름을 사용합니다.
3. OneDrive 동기화가 끝난 뒤 EXE를 실행합니다.
4. EXE만 각자 바탕화면에 복사하지 않습니다. EXE는 옆의 JSON·HTML·이미지를 읽습니다.

각 구성원의 진행 기록을 별도 JSON으로 저장하므로 여러 사람이 서로 다른 문제를 동시에 체크할 수 있습니다. 같은 사람이 두 PC에서 같은 이름으로 동시에 수정하면 OneDrive 충돌 사본이 생길 수 있으므로 피합니다.

## 배포와 업데이트

- 최초 배포: `dashboard` 폴더 전체 공유
- 문항 추가: `dashboard-data.json`과 필요한 `assets`만 동기화
- 화면 수정: HTML·CSS·JS만 동기화
- 서버 코드 수정: 운영자가 `EXE_빌드.ps1`을 실행해 EXE만 교체

문항 이미지 약 223MB를 EXE 안에 넣지 않았기 때문에 실행이 빠르고, 문항을 추가할 때 EXE 전체를 다시 만들 필요가 없습니다.
