# Sol 문항 제작 API

API 기본 모델은 `gpt-5.6-sol`, 추론 노력은 `high`다. 매 호출 1문항, 출력 상한 16,000토큰, `store:false`를 사용한다. 모델은 서버에 고정한다. 실패 시 자동 재시도·Astra 전환은 없다. API 요금은 별도이며 Codex 이용 한도와 다르다.

현재 연결 설정은 **서버 미배포·API 키 미설정**이다. 테스트는 외부 호출 없이 모의 API와 메모리 표본으로 수행한다. 코드를 작성한 사실과 Sol 생성 품질 검증을 구분한다.

## 서버 배포

1. Node 22 이상을 실행할 서버에 저장소를 배치한다. `server/`, `model-contract.js`, `connection-engine.js`, `connection-registry.json`이 함께 있어야 한다.
2. 서버의 비밀 환경변수에 `OPENAI_API_KEY`, 충분히 긴 임의 `PA_SERVICE_TOKEN`을 설정한다. `PA_ALLOWED_ORIGIN`은 `https://jaewong1994.github.io`로 설정한다. 키를 Git·공개 JSON·브라우저에 넣지 않는다.
3. `node server/service.cjs`를 실행한다. 기본 수신 주소는 127.0.0.1:8788이다. 관리형 호스팅에서는 해당 환경에 맞춰 `HOST`와 `PORT`를 설정하고 HTTPS 주소를 연결한다. 인터넷에 평문 HTTP로 공개하지 않는다.
4. `model-provider.json`의 `mode`를 `api`, `api_endpoint`를 실제 HTTPS `/v1/compose` URL로 바꾼다. `api_model`은 `gpt-5.6-sol`로 유지한다.
5. 화면에서 제작 요청을 준비하고 **서비스 접근 토큰**을 입력해 1문항 제작한다. OpenAI API 키는 서버에만 존재한다. 브라우저는 접근 토큰을 저장하지 않는다.

프로세스 하나당 동시 요청은 1개다. 분산 서버·다중 사용자 운영으로 늘릴 때는 공통 작업 큐, 사용자별 인증과 할당량, 요청 번호 기반 중복 방지를 먼저 추가한다. 현재 서비스는 초기 운영용 단일 프로세스이며 작업 큐나 재시작 후 결과 보관을 제공하지 않는다. 응답을 잃은 요청은 자동으로 다시 보내지 않는다.

사이트는 GitHub Pages이고 API 서버는 별도다. 서버가 설정되지 않은 동안에도 요청 JSON·Codex 전달문을 저장해 현재 Codex 작업에서 제작하고, 받은 결과 JSON을 사이트에서 열 수 있다. Codex 전달에 Astra를 쓴다는 것과 유료 API 모델을 Sol로 고정하는 것은 별개다.

## 운영자 단건 실행

서버 환경에 키를 설정한 뒤 아래 명령으로 요청 파일을 직접 처리할 수도 있다. 로컬 수치 생성기가 아니라 같은 원격 Sol API를 호출하는 운영용 도구다.

```text
node server/run-model.cjs request.json result.json
```

기존 결과 파일은 덮어쓰지 않는다. 수학 검산 또는 사람 승인 상태를 임의로 올리지 않는다. 프런트엔드는 서버가 반환한 검증 표시를 신뢰해 승인하지 않고 같은 자산 판본으로 다시 검사한다.

## 검증

```text
python -m unittest test_model -v
python prepare_pages.py --build
```

요청 변조·모델 고정·자산 판본·잘못된 결과 형식·미등록 가교·미해결 항목·거절·출력 중단·호출 실패·중복 동시 호출·접근 토큰·허용 출처를 검사한다. 테스트용 자료는 메모리에서만 만들며 실제 자산으로 반입하지 않는다. 품질 평가는 `CONNECTION_MODEL.md`의 12문항 평가 계획을 따른다.

공식 API 문서: https://developers.openai.com/api/docs/models/gpt-5.6-sol , https://developers.openai.com/api/docs/guides/structured-outputs
