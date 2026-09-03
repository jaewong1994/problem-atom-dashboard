/* 표시공통.js v4.15 (2026-09-02 Codex)
     해설의 `(ⅰ)`·`(ⅱ)` 경우 표지와 반복되는 `$a=-1$ : ... $a=-2$ : ...`
     열거 머리표를 원문 구조대로 독립 행으로 복원한다.
   v4.14 (2026-09-02 Codex)
     해설의 ㄱ.·ㄴ.·ㄷ. 보기 머리표가 앞 판정 문장에 붙은 경계를 독립 행으로
     복원하고, 행 머리의 고아 `참)`·`거짓)` 괄호를 제한적으로 닫는다.
   v4.13 (2026-09-02 Codex)
     실문항 #79889의 HWP 미주 접근성 수식과 실제 수식이 중복되고 GEQ가 `ge it`로
     풀린 정확한 손상 지문을 원본 XML의 식·등호조건에 맞춰 표시 파생층에서 복구한다.
   v4.12 (2026-09-02 Codex)
     수기반려 결박: 증명번호 뒤 다음 관계식, 판별식 D/4, `triangle rm PQR`,
     한글 자모 boxed 및 1/2/xy 중첩분수의 표시 문법을 제한적으로 복원한다.
   v4.11 (2026-09-02 Codex)
     풀이 마지막의 `이다.$\\therefore ...$`처럼 결론 수식이 문장에 붙으면
     `\\therefore`/`∴` 앞을 줄바꿈해 결론을 독립 행으로 복원한다.
   v4.10 (2026-09-02 Codex)
     선지별 판정 해설이 `참③`·`거짓④`처럼 다음 원문자 선지에 붙으면
     판정어 뒤를 줄바꿈해 각 선지를 독립 행으로 복원한다.
   v4.9 (2026-09-02 Codex)
     해설에서 보기 판정 `(X)`·`(O)` 직후 다음 ㄱ~ㅎ 보기 표지가 붙은
     `(X)ㄴ.` 경계를 줄바꿈한다. `(O)따라서` 같은 종합 결론은 유지한다.
   v4.8 (2026-09-01 Codex)
     인접한 완결 부등식·등식도 각각 풀이 단계로 줄바꿈하고, 수식 안의
     `=>`/`=&gt;`를 표준 함의 화살표로 정규화한다. 로마자 경우 표지가
     앞 문장에 붙은 `9개ⅰ)` 경계도 분리한다.
   v4.7 (2026-09-01 Codex)
     해설의 증명 번호 끝과 다음 경우/종합 결론이 붙은 `…㉠(ⅱ)`,
     `…㉢㉠, ㉡, ㉢에서` 경계에만 의미 줄바꿈을 복원한다.
     문제 본문의 단순한 ㉠·㉡·㉢ 열거는 변경하지 않는다.
   v4.6 (2026-09-01 Codex)
     이미 구조화된 .hchoices를 .nchoices로 다시 감싸는 이중 변환을 막고,
     렌더 완료 DOM에서 선지 누락·빈 선지·원시 LaTeX 잔존을 확정 오류로 계측한다.
   v4.5 (2026-08-29 Codex)
     카드의 독립 인라인 분수를 nowrap 단위로 고정해, `\dfrac{f(x)}{x}`의
     분자 괄호와 분모가 줄바꿈 후보로 분리되어 `f(x/x)`처럼 보이던 현상을 막는다.
   v4.4 (2026-08-29 Codex)
     인쇄 해설의 긴 인라인 행렬·등식도 단 폭 내로 자동 축소해 옆 단 침범을 막는다.
   v4.3 (2026-08-28 Codex)
     집합 닫는 중괄호 여백 처리에서 `\bigr\}` 계열의 크기 명령과 구분자 사이에
     `\;`를 끼워 KaTeX 빨간 오류를 만들던 회귀를 차단한다.
   v4.2 (2026-08-28 Codex)
     HML 탭 사이 선택지 머리표가 적재 중 유실된 `① 값 값 값 / ④ 값 값` 5지선다를
     값 다섯 개뿐인 문항 끝 패턴에 한정해 ②·③·⑤ 머리표를 표시 단계에서 복원한다.
   v4.1 (2026-08-28 Codex)
     정답 머리표 선분리 뒤 HWP 덤프 정리가 남긴 해설 선두 빈 줄만 제거해,
     조판 문항번호와 첫 풀이 사이의 의도하지 않은 두 줄 공백을 없앤다.
   v4.0 (2026-08-28 Codex)
     구분자 밖 HWP 좌표식과 바로 뒤 `$...$` 수식이 섞인 해설을 좌표 단위로 승격하고,
     최종 일반 텍스트의 rm·it·~ 잔존을 실제 NGD1 DB 문항으로 회귀 검증한다.
   v3.9 (2026-08-26 Codex)
     인접한 수식 조각이 관계기호로 이어질 때 좌변·등호·우변을 한 수식 단위로 묶어,
     카드 줄바꿈이 등호 직후에 생기지 않게 한다. 카드보다 긴 단위는 통째로 가로 스크롤한다.
   v3.8 (2026-08-25 Codex)
     표준 5지선다를 실제 선지 폭으로 재어 5개 한 줄을 최우선하고, 넘칠 때만 3+2,
     3+2도 넘칠 때 1개 1줄로 배치한다. 5지선다의 4열·2열 중간 배치는 사용하지 않는다.
   v3.7 (2026-08-14 Codex)
     분수가 들어간 좌표 괄호를 자동으로 \left(\right)로 바꾸어 분수 높이에 맞춘다.
   v3.6 (2026-08-14 Codex)
     해설의 `$인라인$이다.$$문단수식$$` 경계를 HWP 인접수식 보정이 파괴하던 오류를 제거하고,
     AI Markdown 정규화가 이미 구분된 수식과 HTML을 다시 수식으로 감싸지 않도록 격리.
   v3.5 (2026-08-14 Codex)
     인라인 분수의 실제 KaTeX 높이를 감지해 해당 줄에 위아래 여백과 추가 행간을 자동 적용.
     일반 텍스트와 문단 수식은 기존 간격을 유지하고 문제은행·개념블록·조판에 동일하게 반영.
   v3.4 (2026-08-13 Codex)
     HWP 글꼴 지시자 rm/it/bf는 무시하되 수식 밖으로 풀린 triangle·angle·bar의
     수학 의미를 보존하고, 미주 해설의 생 LaTeX 노출을 공통 표시 경로에서 복구.
   v3.3 (2026-08-13 Codex)
     내신 미러의 HWP 꼬리 ID(To 20010/20011), 서술형 머리표, 붙은 관계기호(0LEa)를
     문제·해설 공통 경로에서 정리하고 〈보기〉 박스 복원 전에 적용.
     HWP 그림 본체와 문자 오버레이를 동일 배율로 묶고 원본 좌표를 보존해 문자 이탈을 수정.
   v3.1 (2026-08-07 Codex)
     HWP 배치용 표에서 그림과 선지를 분리해 발문→그림→선지 순서로 요소화하고 그림 규격을 통일.
   v3.0 (2026-08-07 Codex)
     시험 구역 안내용 단답형/서답형 박스와 문항 앞 중복 머리표를 제거.
   v2.9 (2026-08-07 Codex)
     모든 〈보기〉 박스를 단일 구조로 정규화하고 제목을 상단 테두리 중앙 범례로 통일.
   v2.8 (2026-08-07 Codex)
     HWP가 조건문 주위에 만든 빈 3×3 테두리표를 단일 조건 박스로 정리(이중 박스 제거).
   v2.7 (2026-08-07 Codex)
     본문 그림을 발문 끝·선지 앞으로 모으고 크기·가운데 정렬·선지 간격을 통일. 해설 그림도 같은 규격으로 정렬.
   v2.6 (2026-08-06 Codex)
     모든 세로 중괄호(집합·조건제시법·연립조건·cases)를 얇고 길게 통일. 다른 괄호/절댓값/가로 brace 제외.
   v2.2 (2026-07-30 페이블 — 재웅 표시검수 9차)
     ⑯ 해설 전용 표시 경로 solText() — 미러 해설이 문제 본문과 같은 규칙을 못 받고 있던 것을 바로잡는다.
   v1.9 (2026-07-30 페이블 — 재웅 표시검수 8차)
     ⑮ 해설 그림 자리 잡기: HWP 가 남긴 그림 자리표시 잔재("그림입니다./원본 그림의 이름:/원본 그림의 크기:")를
        그 자리에 실제 그림으로 갈아끼운다. 잔재만 있고 그림이 없으면 잔재를 지운다.
   v1.8 (2026-07-29 페이블 — 재웅 표시검수 7차)
     ⑭ 따로 오는 그림(미러 image_urls)을 선지 바로 앞 올바른 자리에 삽입
   v1.7 (2026-07-28 재웅 표시검수 6차)
     ⑬ 화면 로컬 math() 자동 흡수(구판 되살아남 방지)
   v1.6 (2026-07-28 재웅 표시검수 5차)
     ⑪ 미러 NGD 워터마크 제거 ⑫ 〈보 기〉 박스 복원
   v1.5 (2026-07-28 재웅 표시검수 4차)
     ⑨ 미리보기 안전 자르기 clip() — 수식 한가운데서 잘려 LaTeX 원문이 노출되던 문제
     ⑩ 한 줄 라벨용 inline() — 목록 행에 블록 요소를 넣지 않는 경량 경로
   v1.4 (2026-07-28 재웅 표시검수 3차)
     ⑧ 조판도구 편입용 타이포 옵트아웃(.ngd2-inherit)
   v1.3 (2026-07-28 재웅 표시검수 2차)
     ⑥ 선지 줄넘김 정렬(현재 표준 5지선다는 5→3+2→1열, 두 문단에 걸친 학평 선지 재봉합 버그 수정)
     ⑦ 세로로 긴 인라인 수식의 행간 확보
   v1.2 (2026-07-28 재웅 표시검수 1차)
     ① 교재(마플시너지) 선지 배치 ② 인라인 분수 크기 ③ (가)(나)(다) 조건 박스
     ④ lim 기호 확대 ⑤ 지수·첨자 확대 + 지수 안 분수는 반대로 축소
   v1.1 (2026-07-28 인라인 적분·시그마·극한 displaystyle) / v1 (2026-07-27 "표시규칙 단일화")
   문항 표시의 단일 진실 계층. 규칙 추가는 반드시 이 파일에만 한다 (화면별 개별 규칙 금지).
   포함: ① ₩LaTeX 복원 ② $·\(\)·\[\] 세그먼트 수리(수식공통.js 위임) ③ KaTeX 4구분자 렌더
        ④ 선지 ①~⑤ 균등 배치 + 폭 초과 시 세로 전환 ⑤ 구조 HTML(그림·박스·표) 규격 CSS
        ⑥ 시험지 타이포(명조·자간·행간) ⑦ (가)(나)(다) 조건 박스 복원 ⑧ 연산자 글자 크기.
   컨테이너에 class="ngd2-body" 를 붙여 사용.

   ★ v1.2 배경 (재웅 실측 스크린샷, 교재=마플시너지 출신 공통 증상)
     교재 문항 1,546건 중 576건은 body_html 이 없어 raw_text(평문)만으로 표시된다.
     구조 HTML 경로(fix→choices)는 규격이 잡혀 있었지만 평문 경로(mathText)는 규칙이 비어 있어
     같은 문항이 화면에서만 무너져 보였다. → 평문 경로를 구조 HTML 경로와 동일 품질로 맞춘다.
     (1) 선지: 평문에 choices() 미적용 → ①~⑤ 가 본문 뒤에 그대로 흘러붙음 (교재 940건)
     (2) 분수: 인라인 $..\frac..$ 가 textstyle 로 작게 → 시험지 관례(분수는 크게)에 맞춰 displaystyle (전체 6,628건)
     (3) 조건: "(가) … (나) …" 한 줄이 박스 없이 본문에 흘러붙음 → 테두리 박스 + 조건별 줄바꿈 (교재 197건)
     (4) lim: displaystyle 분수 옆에서 lim 글자가 상대적으로 작아 보임 → \large 로 한 단계 키움
     (5) 지수: 첨자가 전반적으로 작음 → scriptstyle 크기를 0.70em→0.79em 로 상향(수직 위치는 불변).
         반대로 HWP 변환기가 지수 안에도 \dfrac 을 박아 넣어(실측 #7307 `2^{\dfrac4a-\dfrac1b}`)
         지수 분수만 본문보다 커지는 역전이 있었다 → 첨자 안의 \dfrac·\cfrac·\displaystyle 은 해제. */
window.NGD2Display = (function(){
  const rep = s => window.NGD2Math ? NGD2Math.repairMathSeg(s) : s;
  /* (2026-07-28 재웅) 인라인 수식의 적분·시그마·극한이 textstyle 로 작게 나옴 → 해당 세그먼트를 displaystyle 로.
     (v1.2) 분수(\frac 계열·이항계수)도 동일 사유로 추가 — 재웅 실측: 마플시너지 문항의 1/(a-3) 꼴이 깨알같이 작음.
     시험지 조판 관례(적분기호 길게·분수 크게)에 맞춤. 이미 displaystyle 이면 이중 적용 안 함.
     \tfrac 은 '작게'가 저자 의도이므로 트리거에서 제외한다. */
  const DISPRE = /\\(int|oint|iint|iiint|sum|prod|lim|frac|dfrac|cfrac|binom)(?![a-zA-Z])/;
  /* 판정은 '첨자를 걷어낸 본문'으로 한다 — 지수 안의 분수 때문에 세그먼트 전체가 displaystyle 로
     잠기는 일이 없도록 (재웅: "분수가 포함된 지수는 반대로 너무 커"). */
  const disp = g => (DISPRE.test(scanScripts(g,null)) && !/\\displaystyle/.test(g)) ? "\\displaystyle " + g : g;
  /* (v1.2 재웅) "lim 기호가 좀 더 컸으면" — \sum·\int 는 displaystyle 에서 큰 글리프로 바뀌지만
     \lim 은 글자 연산자라 크기가 그대로여서, 옆의 displaystyle 분수에 눌려 작아 보인다.
     \mathop{\large\lim}\limits 로 한 단계 키우고 아래첨자 위치(밑에 붙는 극한)는 그대로 유지.
     재적용(이미 변환된 문자열이 다시 들어오는 경우) 대비해 원형으로 정규화한 뒤 변환한다. */
  const BIGOP = /\\lim(?![a-zA-Z])/g;
  function bigOp(s){
    return String(s).replace(/[_^]\s*\\,/g,"")
                    .replace(/\\limits\s*\\limits/g,"\\limits")
                    .replace(/\\lim\s*\\limits/g,"\\lim")
                    .replace(/\\mathop\{\\(?:large|Large)\\lim\}\\limits/g,"\\lim")
                    .replace(BIGOP,"\\mathop{\\large\\lim}\\limits");
  }
  /* (v1.2 재웅) "지수 안 분수는 반대로 너무 커" — HWP 변환기가 지수·첨자 안에도 \dfrac 을 넣어
     (실측 #7307 `2^{\dfrac{4}{a}-\dfrac{1}{b}}`) 첨자가 displaystyle 로 잠겨 본문보다 커졌다.
     ^{…}/_{…} 그룹 안에서는 \dfrac·\cfrac→\frac, \displaystyle·\large 해제해 원래 첨자 크기로 되돌린다.
     (중첩 그룹·이스케이프 \{ \} 를 세지 않도록 직접 스캔한다.) */
  const shrinkInner = t => t.replace(/\\displaystyle\s*/g,"")
                            .replace(/\\mathop\{\\(?:large|Large)\\lim\}\\limits/g,"\\lim")
                            .replace(/\\[dc]frac(?![a-zA-Z])/g,"\\frac");
  /* ^{…}/_{…} 그룹을 찾아 fn 으로 치환한다. fn=null 이면 첨자를 통째로 제거(판정용 본문 추출).
     중괄호 짝은 이스케이프 \{ \} 를 세지 않도록 직접 스캔한다. */
  function scanScripts(s,fn){
    s=String(s); let out="";
    for(let i=0;i<s.length;i++){
      const ch=s[i];
      if(ch==="\\"){ out+=ch+(s[i+1]??""); i++; continue; }
      if(ch==="^"||ch==="_"){
        let j=i+1; while(j<s.length&&/\s/.test(s[j])) j++;
        if(s[j]==="{"){
          let d=0,k=j;
          for(;k<s.length;k++){
            if(s[k]==="\\"){k++;continue;}
            if(s[k]==="{")d++;
            else if(s[k]==="}"){ if(!--d) break; }
          }
          if(d===0){
            /* fn 없으면 첨자를 통째로 지우되 공백을 남긴다 — 안 그러면 `\int_{1}^{x}f` 가 `\intf` 로 붙어
               DISPRE 의 (?![a-zA-Z]) 가장자리 조건에 걸려 판정을 놓친다(실측: 정적분 조건절). */
            out += fn ? s.slice(i,j+1)+fn(s.slice(j+1,k))+"}" : " ";
            i=k; continue;
          }
        }
      }
      out+=ch;
    }
    return out;
  }
  const shrinkScripts = s => scanScripts(s, t => shrinkInner(shrinkScripts(t)));
  /* (2026-08-09 재웅) 집합 중괄호 안쪽 여백 — \{a\} 가 붙어 보여서 \{ a \} 로 한 칸씩.
     보이는 중괄호(\{·\})에만 적용하고, 이미 여백이 있으면 중복 적용하지 않는다. */
  const setBraceSpace = g => String(g)
    .replace(/\\right\\\}/g, "\u0001").replace(/\\left\\\{/g, "\u0002")
    .replace(/\\\{(?!\s*\\[,;:])/g, "\\{\\; ")
    .replace(/\\\}/g, (m,offset,source) => {
      const prefix=source.slice(0,offset);
      return /\\(?:bigr|Bigr|biggr|Biggr)$/.test(prefix)||/\\[,;:]\s{0,2}$/.test(prefix)?m:" \\;\\}";
    })
    .replace(/\u0002(?!\s*\\[,;:])/g, "\\left\\{\\; ")
    .replace(/(?<!\\[,;:]\s{0,2})\u0001/g, " \\;\\right\\}")
    .replace(/\u0002/g, "\\left\\{").replace(/\u0001/g, "\\right\\}");
  /* 좌표의 어느 성분에든 분수가 있으면 괄호가 분수 전체 높이를 감싸야 한다.
     저장 원문은 보존하고 수식 세그먼트 안의 쉼표가 있는 괄호만 표시 단계에서 늘린다. */
  function stretchFractionCoordinateParens(source){
    const s=String(source);let out="",i=0;
    while(i<s.length){
      if(s[i]!=="("||/(?:\\left|\\bigl|\\Bigl|\\biggl|\\Biggl)$/.test(out)){out+=s[i++];continue;}
      let depth=1,j=i+1;
      for(;j<s.length&&depth;j++){
        if(s[j]==="\\"){j++;continue;}
        if(s[j]==="(")depth++;
        else if(s[j]===")")depth--;
      }
      if(depth){out+=s[i++];continue;}
      const inner=s.slice(i+1,j-1);
      if(inner.includes(",")&&/\\(?:[dtc]?frac)(?![a-zA-Z])/.test(inner)){
        out+="\\left("+stretchFractionCoordinateParens(inner)+"\\right)";i=j;continue;
      }
      out+="("+stretchFractionCoordinateParens(inner)+")";i=j;
    }
    return out;
  }
  const mathImplication = g => String(g).replace(/(?:\\[,;:!]\s*)?,?\s*(?:=\s*(?:&gt;|>)|⇒|⟹)/g," \\Rightarrow ");
  const displayTypography = g => String(g)
    .replace(/(?<![A-Za-z])D\s*\/\s*4(?![0-9A-Za-z])/g,"\\frac{D}{4}")
    .replace(/\\frac\s*\{\s*\\frac\s*\{\s*1\s*\}\s*\{\s*2\s*\}\s*\}\s*\{\s*xy\s*\}/g,"\\frac{1}{2xy}")
    .replace(/\\boxed\s*\{\s*\\,?\s*([ㄱ-ㅎ])\s*\\,?\s*\}/g,"\\boxed{\\vphantom{가}\\text{$1}}");
  const texInline  = g => shrinkScripts(bigOp(disp(setBraceSpace(stretchFractionCoordinateParens(mathImplication(displayTypography(rep(g))))))));   // $…$ · \(…\)
  const texDisplay = g => shrinkScripts(bigOp(setBraceSpace(stretchFractionCoordinateParens(mathImplication(displayTypography(rep(g)))))));         // $$…$$ · \[…\]
  function esc(t){const d=document.createElement("div");d.textContent=t==null?"":t;return d.innerHTML;}
  /* ── (v2.0) 수식 세그먼트 토크나이저 ──
     종전에는 `s.split(/(\$\$[\s\S]*?\$\$)/)` 로 $$…$$ 를 먼저 떼어냈다. 그런데 이 데이터는
     `$a$$b$` 처럼 인라인 수식을 붙여 쓰는 꼴이 아주 흔해서(미러 해설 실측), 두 세그먼트의
     경계 `$$` 가 display 수식 여는 기호로 오독됐다 → 그 뒤 문장 전체가 수식으로 잠기고
     한글이 \text{} 로 감싸이며 화면이 무너졌다. KaTeX auto-render 는 좌→우 스캔이라 정상 처리하는데
     우리 전처리만 어긋나 있었다(clip() 은 v1.5 에서 같은 이유로 이미 스캐너로 바꿨다).
     → 같은 우선순위($$ → \[ → \( → $)로 좌→우 스캔해 토큰을 만든다. */
  const DELIMS=[["$$","$$","d"],["\\[","\\]","d"],["\\(","\\)","i"],["$","$","i"]];
  function splitMath(s){
    s=String(s); const out=[]; let i=0, buf="";
    while(i<s.length){
      if(s[i]==="\\" && i+1<s.length && s[i+1]!=="(" && s[i+1]!=="["){ buf+=s[i]+s[i+1]; i+=2; continue; }
      let hit=null;
      for(const d of DELIMS) if(s.startsWith(d[0],i)){ hit=d; break; }
      if(!hit){ buf+=s[i++]; continue; }
      const e=s.indexOf(hit[1], i+hit[0].length);
      if(e<0){ buf+=s[i++]; continue; }                       // 닫히지 않은 구분자는 글자로 둔다
      if(buf){ out.push({t:buf}); buf=""; }
      out.push({m:hit[2], o:hit[0], c:hit[1], b:s.slice(i+hit[0].length, e)});
      i=e+hit[1].length;
    }
    if(buf) out.push({t:buf});
    return out;
  }
  /* 토큰 배열 → 문자열. body_html의 .heq·$...$ 양 경로가 반드시 같은 수식 수선을
     거치게 한다. 종전에는 여기서 texDisplay/texInline만 호출해 HWP 잔재(LEFT·PUA 세로막대·
     맨몸 subset 등)가 구조 HTML에서 그대로 KaTeX에 전달됐다. */
  /* (2026-08-09 페이블) 수식 세그먼트를 HTML 로 되박을 때 <·>·& 를 엔티티로 —
     수리 과정에서 &lt; 가 생 < 로 풀리면 innerHTML 이 뒤를 태그로 먹어 문장이 사라지고
     $ 짝이 뒤집힌다 (실측 "$0^{\circ}<A<180^{\circ}$" → "$0^{\circ}0이다."). */
  const texSafe = x => String(x).replace(/&(?!(?:lt|gt|amp|quot|#\d+);)/g,"&amp;")
                                .replace(/</g,"&lt;").replace(/>/g,"&gt;");
  function joinMath(toks, onText){
    return toks.map(k=> k.t!=null ? (onText?onText(k.t):k.t)
                                  : k.o + texSafe(k.m==="d"?texDisplay(rep(k.b)):texInline(rep(k.b))) + k.c).join("");
  }
  /* (2026-08-23 클로드 최적화 — 최다 반려 카테고리 "다중 등식 직접 접착" 근본 대응)
     원본 exam.db부터 HWP 수식 개체 사이 구분자가 소실된 채 `$식1$$식2$`로 직접 연결돼 있어
     (실측 #4109 해설 `…RIGHT )$$=25$$a_1=S_1=1$$THEREFORE ~…`), splitMath가 만든 인라인 수식
     토큰이 구분 없이 연접 출력되던 것이 "등식 접착" 표시의 직접 원인. 토큰 단계에서 복원한다:
       ① 다음 토큰이 관계연산자(=·<·>·≤…)로 시작 → 같은 등식의 연속이므로 한 수식으로 병합
       ② 앞뒤 모두 완결 등식(= 포함)이거나 다음이 ∴/THEREFORE 시작 → 원본 HWP의 줄 단위
          유도 단계였으므로 줄바꿈 복원(linesToHtml이 행으로 분리; 인라인 경로는 공백으로 강등)
       ③ 그 외 인접 → 공백 하나(수식공통 repairMathText의 `$ $` 분리와 동일한 강도)
     수식 내부는 건드리지 않아 연쇄등식(a=b=c) 오탐이 구조적으로 불가능. DB 원본 불변 — 표시 단계만. */
  const ADJ_REL = /^\s*(?:\\displaystyle\s*)?(?:=|≠|≤|≥|≒|&lt;|&gt;|[<>]|\\?(?:le|ge|leq|geq|ne|neq|approx|equiv|sim|fallingdotseq)(?![A-Za-z]))/;
  const ADJ_NEWSTMT = /^\s*(?:\\?therefore(?![A-Za-z])|THEREFORE|∴)/;
  const ANY_REL = /(?:=|≠|≤|≥|≒|&lt;|&gt;|[<>]|\\(?:le|ge|leq|geq|ne|neq|approx|equiv|sim|fallingdotseq)(?![A-Za-z]))/;
  const REL_TAIL = /(?:=|≠|≤|≥|≒|&lt;|&gt;|[<>]|\\(?:le|ge|leq|geq|ne|neq|approx|equiv|sim|fallingdotseq))\s*$/;
  const hasRelation = s => ANY_REL.test(String(s||"")) && !REL_TAIL.test(String(s||""));
  function mergeAdjacentMath(toks){
    const out=[];
    for(const k of toks){
      const prev=out[out.length-1];
      /* HWP 개체 경계에서 `$y$ $=\cdots$`처럼 공백만 하나 끼어든
         관계식도 하나의 식이다. 공백 토큰을 넘어 병합해 `y` / `=`가
         서로 다른 시각 행으로 나뉘는 것을 막는다. */
      if(k.m==="i" && prev && prev.t!=null && /^\s*$/.test(prev.t)){
        const before=out[out.length-2];
        if(before&&before.m==="i"&&ADJ_REL.test(k.b)&&!ADJ_NEWSTMT.test(k.b)){
          before.b=before.b+" "+k.b; out.pop(); continue;
        }
      }
      if(k.m==="i" && prev && prev.m==="i"){
        if(ADJ_REL.test(k.b) && !ADJ_NEWSTMT.test(k.b)){ prev.b=prev.b+" "+k.b; continue; }
        if(hasRelation(prev.b) && (hasRelation(k.b) || ADJ_NEWSTMT.test(k.b))){ out.push({t:"\n"},k); continue; }
        out.push({t:" "},k); continue;
      }
      out.push(k);
    }
    return out;
  }
  const fixSegs = (s, onText) => joinMath(mergeAdjacentMath(splitMath(s)), onText);
  /* (2026-08-24 클로드 최적화) 문장·단위 경계 접착 간격 복원 — `있다.따라서`·`(만원)두` 꼴
     (korean_prose_boundary_attachment, 전수 21,460문항·최다 잔존 blocker). 수식 밖 텍스트
     토큰에만 적용되므로 소수점(3.5)·수식 내부는 불변. DB 원본 불변 — 표시 단계만. */
  const kspace = t => String(t)
    .replace(/([.!?])(?=[가-힣])/g, "$1 ")
    .replace(/\((만원|원|개|명|회|년|개월|일|시간|분|초|cm|mm|km|m|L)\)(?=[가-힣])/g, "($1) ");
  const fixSegsK = s => fixSegs(s, kspace);
  const WON = /₩(?=[A-Za-z{}()\[\],;!])/g;
  /* (v1.6 재웅 실측) 미러(내신 기출) 본문에 박힌 NGD 워터마크 — `$NGD공동작업물입니다.$`(3,156건),
     `< 보 기 >$NGD$`·`[ 증 명 ]$NGD$` 형태의 박스 머리표 잔재(약 3,570건). 수식으로 저장돼 있어
     그대로 렌더되면 본문에 "NGD" 가 튀어나온다. 표시 단계에서만 걷어낸다 — DB 원본 불변. */
  const NGD = /\$\s*NGD[^$\n]*\$/g;
  /* (2026-08-08b 페이블) 전수검수 실측 #75406·#83492·#83499 — $ 없이 평문으로 남은
     워터마크 변형(boldNGD·NGD 단독, NGD공동작업물입니다)도 화면에서 제거한다. */
  const NGD_PLAIN = /(?:bold|rm|it)NGD(?:공동작업물입니다)?\.?(?![A-Za-z])|(?<![A-Za-z])NGD(?:공동작업물입니다)?\.?(?![A-Za-z])/g;
  /* (2026-08-06 기출 전수검수) 구형 Wingdings/심벌 글꼴의 PUA 글리프가
     웹 기본 글꼴에서는 네모·엉뚱한 문자로 보인다. 문맥이 확정된 도형만 유니코드로 치환한다. */
  function commonGlyphs(s){
    /* (2026-08-24 최적화 15회차) 한글 자모 미합성(#6904 'ᄄᆞ른다' 실측, 전수 20문항) — NFC 정규화.
       구 폰트 인코딩의 아래아(U+119E)는 현대 모음 ㅏ(U+1161)로 강등해야 합성된다(수학 지문에 옛한글 없음).
       조합형 자모가 완성형으로 합쳐질 뿐 완성형 텍스트는 불변이라 부작용 없다. */
    s = String(s).replace(/ᆞ/g, "ᅡ");
    s = s.normalize ? s.normalize("NFC") : s;
    return String(s).replace(/\uF06C/g,"●").replace(/\uF0A1/g,"○")
      .replace(/\uF09F/g,"•").replace(/\uF09E/g,"·")
      .replace(/\uF075/g,"♦").replace(/[\uF0EA\uF0E8\uF0F0]/g,"→")
      /* (2026-08-08b 페이블) 조건제시법 세로막대 PUA(U+E04D, 실측 #81277) — 평문 경로 정규화.
         ※ U+E020은 KaTeX가 ≠를 그릴 때 쓰는 자체 글리프로 원본 데이터에는 없다(오탐 정정). */
      .replace(/\uE04D/g,"∣")
      /* DB의 &gt;가 esc()를 거치며 &amp;gt; 또는 그 이상으로 중복 인코딩된 경우,
         HTML 삽입 시 한 번만 해제되도록 한 단계의 엔티티로 정규화한다. */
      .replace(/&(?:amp;)+(?:gt|#62);/gi,"&gt;")
      .replace(/&(?:amp;)+(?:lt|#60);/gi,"&lt;")
      /* (2026-08-24 최적화 14회차) 딩뱃 원문자 U+2780~2793(➀➊계열) — 문현고 배치 등 전수 2,014문항.
         표준 원문자 U+2460계열과 다른 코드포인트라 폰트 미지원 기기에서 tofu 위험. 표시 단계 정규화. */
      .replace(/[➀-➉]/g,function(c){return String.fromCharCode(0x2460+c.charCodeAt(0)-0x2780);})
      .replace(/[➊-➓]/g,function(c){return String.fromCharCode(0x2460+c.charCodeAt(0)-0x278A);})
      /* (2026-08-15 표시검수 전수스윕) HWP eq `line{AB}`(윗줄 선분)가 변환기에서
         `\frac{<앞기호>}{l} i n e {AB}` 로 깨진 잔재 — exam_items 137·해설 102·items 46건 실측.
         분자에 남은 앞기호(=, ×, +, ( , { 등)는 앞으로 빼고 \overline 으로 복원한다.
         DB 원본 불변 — 표시 단계에서만. (실측 변형: {}·{=}·{\times}·{+}·{(}·{{} 6종) */
      /* (2026-08-24 최적화 18회차) 같은 계열 변형: ne가 상류에서 \neq로 먼저 오변환된
         `\frac{\therefore}{l} i \neq {AF}` 꼴(#7536 실측, 전수 70문항) — 대안으로 함께 잡는다. */
      .replace(/\\frac\{(\{?)((?:\\[A-Za-z]+|[^{}\\]){0,12}?)\}\{l\}\s*i\s*(?:n\s*e|\\neq)\s*/g,
        function(_,br,num){ num=(br||"")+num; return (num?num+" ":"")+"\\overline"; });
  }

  /* 유형ON 구형 PDF 디코더의 의미가 확정된 표시 잔재만 화면에서 보정한다.
     - 90\pm은 원본에서 언제나 90도 기호였음.
     - U+203E(‾)는 선분 윗줄을 별도 글리프로 잘못 꺼낸 잔재이므로 제거한다.
     분자·분모가 소실된 Å9 계열은 문항마다 값이 달라 여기서 추측하지 않는다. */
  function typeonLegacyDisplayRepair(s){
    return String(s==null?"":s)
      .replace(/90\s*\\pm/g,"90^{\\circ}")
      .replace(/\$\s*‾\s*\$/g,"")
      .replace(/‾/g,"");
  }
  /* #79889는 HWP 미주의 접근성 대체문자(`수식입니다.`)와 실제 equation 개체가
     한 explanation에 모두 적재됐고, GEQ가 `ge it`로 잘못 디코딩됐다. 일반 정규화로
     문장 순서를 추측하지 않고 네 개의 독립 지문이 모두 맞는 이 원문에만, raw_xml에
     남아 있는 식과 등호 조건을 그대로 재조립한다. DB 원문·정답은 변경하지 않는다. */
  function solutionExactSourceRecovery(s){
    const x=String(s==null?"":s);
    const exact=x.includes("수식입니다. ge it -1+2 sqrt {{1} over {4}}")
      && x.includes("산술평균과 기하평균의 관계에 의해")
      && x.includes("a ^{2} -2a+ {a} over {b} + {b} over {4a}")
      && x.includes("$m+n+k$$=1+2+0$$=3$");
    if(!exact)return x;
    return `[정답] $3$
$$a^2-2a+\\frac{a}{b}+\\frac{b}{4a}$$
$$=(a-1)^2-1+\\frac{a}{b}+\\frac{b}{4a}$$
$$\\geq (a-1)^2-1+2\\sqrt{\\frac{a}{b}\\times\\frac{b}{4a}}$$
$$=(a-1)^2-1+2\\sqrt{\\frac14}=(a-1)^2\\geq0$$
산술평균과 기하평균의 관계에서 등호는 $\\frac{a}{b}=\\frac{b}{4a}$일 때 성립한다.
따라서 $a=1$이고 $\\frac{a}{b}=\\frac{b}{4a}$이므로, 양수 $b$는 $2$이다. 이때 최솟값은 $0$이다.
$\\therefore m+n+k=1+2+0=3$`;
  }
  /* NGD HWP/HWPX 미러의 의미가 확정된 파서 잔재. DB 재적재 전에도 모든 화면에서
     동일하게 보이도록 문제·해설 양쪽에 적용한다. 관계기호는 $…$ 안에서만 고친다. */
  function mirrorLegacyRepair(s){
    s=String(s==null?"":s)
      .replace(/^\s*\[\s*서술형\s*\d+\s*\]\s*/gm,"")
      .replace(/(?:[ \t]*\n){1,}[ \t]*(?:(?:from|To)\s*)?(?:20010|20011|220134|3090280)[ \t]*(?=(?:\n|$))/gi,"\n")
      .replace(/(?<![0-9])(?:To\s*)?(?:20010|20011|220134|3090280)(?![0-9])/g,"")
      /* 구형 미러에 남은 HWP 수직 기호와, 대소문자 무시 변환기가 점 MP를
         minus-plus로 오인한 확정 패턴을 화면에서 우선 복구한다. */
      .replace(/\bbot\b/g,"\\perp")
      .replace(/\\overline\{\\mp\}/g,"\\overline{MP}")
      .replace(/\$\\mp\$(?=\s*(?:와|과)\s*\$MN\$)/g,"$MP$")
      /* (2026-08-15 표시검수 전수스윕) 미러 변환기가 수식 앞에 빈 `$$`를 붙여 `$$$A B$` 꼴로
         남긴 잔재 31건 실측(#1741 #7527 #16607 등). 바로 뒤에 수식 내용이 이어질 때만 `$` 하나로
         접는다 — `$!$, $@$, $$$, $*$` 처럼 '$ 문자 자체'가 소재인 문항(#1924)은 뒤가 쉼표라 안 건드린다. */
      .replace(/\$\$\$(?=\s*[A-Za-z0-9\\{(\[가-힣①-⑤∠-])/g,"$")
      .replace(/\n{3,}/g,"\n\n");
    return s.replace(/\$([^$]*)\$/g,function(_,g){
      g=g.replace(/(?<=[0-9A-Za-z}\)])`?(LEQ|GEQ|NEQ|LE(?!FT)|GE|NE)(?:it|rm)?(?=[+\-0-9A-Za-z{(])/g," $1 ");
      return "$"+g+"$";
    });
  }

  /* ── (v2.1 재웅 신고 #7717 "저 박스도 없어야 한다") 구간별 정의가 'HWP 표'로 그려진 문항 ──
     HWP 는 f(x)= { … 를 수식 하나가 아니라 표로 그린다: 왼쪽 칸에 f(x)=, 그다음 칸에 큰 중괄호
     (수식 변환이 깨져 내용 없는 cases 껍데기가 남는다), 오른쪽 칸들에 식과 조건이 한 행씩.
     그대로 렌더하면 시험지에는 없던 표 테두리가 문제 한가운데 보인다(실측 13문항).
     껍데기 중괄호 칸이 확인될 때만 표 전체를 진짜 cases 수식 한 덩어리로 되돌리고 표를 없앤다.
     DB 원본 불변 — 표시 단계에서만. */
  function texOfCell(td){
    const parts=[];
    (function walk(n){
      Array.prototype.forEach.call(n.childNodes, function(c){
        if(c.nodeType===3){
          const x=c.textContent.replace(/ /g," ");
          if(x.trim()) parts.push({k:"t", v:x});
        }else if(c.nodeType===1){
          if(c.classList && c.classList.contains("heq")){
            const x=String(c.textContent||"").trim()
              .replace(/^\\\(/,"").replace(/\\\)$/,"").replace(/^\$+|\$+$/g,"").trim();
            if(x) parts.push({k:"m", v:x});
          }else walk(c);
        }
      });
    })(td);
    let out="";
    parts.forEach(function(q){
      out += (out?" ":"") + (q.k==="m" ? q.v : "\\text{"+q.v.replace(/\s+/g," ").trim()+"}");
    });
    return out.trim();
  }
  /* 내용 없이 구분자·글루·eqalign·빈 첨자만 남은 cases = 큰 중괄호 자리 */
  function isCasesShell(tex){
    if(!/\\begin\{cases\}/.test(tex)) return false;
    const body=tex.replace(/[\s\S]*?\\begin\{cases\}/,"").replace(/\\end\{cases\}[\s\S]*/,"");
    return !body.replace(/eqalign|\\\\|\\,|[&{}\^_\s]/g,"").length;
  }
  function casesTable(h){
    const s=String(h==null?"":h);
    if(s.indexOf("htbl")<0 || s.indexOf("cases")<0) return s;
    const box=document.createElement("div"); box.innerHTML=s;
    let hit=false;
    Array.prototype.forEach.call(box.querySelectorAll("table.htbl"), function(tb){
      const rows=Array.prototype.slice.call(tb.rows);
      if(rows.length<2) return;
      let brace=null;
      for(const td of rows[0].cells){ if(isCasesShell(texOfCell(td))){ brace=td; break; } }
      if(!brace) return;
      /* 좌변: 중괄호 칸 앞의 칸, 없으면 중괄호 칸 안에서 \begin{cases} 앞부분 */
      let lhs=null;
      for(const td of rows[0].cells){ if(td===brace) break; lhs=td; }
      let left="";
      if(lhs) left=texOfCell(lhs);
      else { const bt=texOfCell(brace); left=bt.slice(0, bt.indexOf("\\begin{cases}")).replace(/\{\s*$/,"").trim(); }
      const lines=[];
      for(const tr of rows){
        const cs=Array.prototype.slice.call(tr.cells)
          .filter(td=>td!==brace&&td!==lhs).map(texOfCell).filter(x=>x!=="");
        if(cs.length) lines.push(cs.join(" & "));
      }
      if(lines.length<2) return;
      const tex=(left?left+" ":"")+"\\begin{cases}"+lines.join(" \\\\ ")+"\\end{cases}";
      const p=document.createElement("p"); p.className="hp htall";
      const sp=document.createElement("span"); sp.className="heq";
      sp.textContent="\\("+tex+"\\)";
      p.appendChild(sp);
      tb.parentNode.replaceChild(p, tb);
      hit=true;
    });
    return hit?box.innerHTML:s;
  }

  /* ── (v2.9 재웅 신고 #8666·#19315) 〈보기〉 박스 단일 구조화 ──
     저장 경로에 따라 제목이 p/div로 제각각이고, #8666처럼 같은 보기 내용이 중첩 hbox와
     바깥 hbox에 두 번 들어간 문항도 있다. 제목이 정확히 〈보기〉인 hbox만 골라
       <div class="hbox hbogi"><div class="hbogit">〈 보 기 〉</div>…</div>
     한 형태로 만든다. 중첩 hbox에 완성된 보기 항목이 있으면 그것을 정본으로 삼아 바깥의
     중복 항목을 버린다. 일반 조건 박스·표·본문의 “<보기>에서” 문구는 대상이 아니다. */
  function bogiHead(el){
    const t=String(el&&el.textContent||"").replace(/\s/g,"")
      .replace(/〈/g,"<").replace(/〉/g,">");
    return t==="<보기>";
  }
  function bogiMarkCount(el){
    const m=String(el&&el.textContent||"").match(/[ㄱㄴㄷㄹㅁㅂ]\s*[.,]/g)||[];
    return new Set(m.map(x=>x.replace(/\s/g,""))).size;
  }
  function normalizeBogiBoxes(h){
    const s=String(h==null?"":h);
    if(s.indexOf("hbox")<0 || !/(?:&lt;|〈|<)\s*보\s*기\s*(?:&gt;|〉|>)/.test(s)) return s;
    const box=document.createElement("div");box.innerHTML=s;
    let hit=false;
    const boxes=Array.prototype.slice.call(box.querySelectorAll(".hbox"));
    boxes.forEach(function(outer){
      if(!outer.isConnected || outer.parentElement&&outer.parentElement.closest(".hbox")) return;
      const head=Array.prototype.find.call(outer.querySelectorAll("p,div"),bogiHead);
      if(!head) return;
      const nested=Array.prototype.find.call(outer.querySelectorAll(".hbox .hbox"),x=>bogiMarkCount(x)>=2) ||
                   Array.prototype.find.call(outer.querySelectorAll(".hbox"),x=>x!==outer&&bogiMarkCount(x)>=2);
      const source=nested||outer, out=document.createElement("div"), title=document.createElement("div");
      out.className="hbox hbogi";title.className="hbogit";title.textContent="〈 보 기 〉";out.appendChild(title);
      Array.prototype.slice.call(source.childNodes).forEach(function(n){
        if(n===head || (n.nodeType===1&&bogiHead(n))) return;
        out.appendChild(n.cloneNode(true));
      });
      outer.parentNode.replaceChild(out,outer);hit=true;
    });
    return hit?box.innerHTML:s;
  }

  /* ── (v3.0 재웅 신고 #8727) 시험 구역 라벨 제거 ──
     원본 시험지의 페이지 경계에서 `단답형(22~30)` 같은 다음 구역 안내가 직전 문제의
     body_html 끝에 붙은 경우가 있다. 또한 일부 교재 적재분은 `[단답형 1]` 머리표가
     문제 첫 문단에 한두 번 중복된다. 이것들은 문제 내용이 아니므로 표시에서 제거한다.
     단, “서답형 답안지에 작성하시오”처럼 발문 안에 쓰인 문장은 절대 지우지 않는다. */
  const SECTION_ONLY=/^(?:객관식|선택형|단답형|주관식|서답형)\s*(?:문제)?\s*(?:[（(]\s*\d+\s*(?:[~∼～\-—–]|부터)\s*\d+\s*[)）])?\s*$/;
  const LEADING_SECTION=/^\s*(?:단답형\s*문제입니다\.\s*)?(?:(?:\[|［)\s*(?:단답형|주관식|서답형)\s*(?:\d+|\\\(\s*\d+\s*\\\))?\s*(?:\]|］)\s*)+/;
  function cutTextPrefix(el,n){
    const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),nodes=[];let x;
    while((x=w.nextNode()))nodes.push(x);
    for(const t of nodes){
      if(n<=0)break;
      const k=Math.min(n,t.data.length);t.data=t.data.slice(k);n-=k;
    }
    Array.prototype.forEach.call(el.querySelectorAll("span,div,p"),x=>{
      if(!String(x.textContent||"").trim()&&!x.querySelector("img,svg,table"))x.remove();
    });
  }
  function removeExamSectionLabels(h){
    const s=String(h==null?"":h);
    if(!/(?:객관식|선택형|단답형|주관식|서답형)/.test(s))return s;
    const box=document.createElement("div");box.innerHTML=s;let hit=false;
    /* 가장 작은 정확 일치 요소를 찾고, 박스/표 안이면 그 컨테이너 전체를 제거한다. */
    Array.prototype.slice.call(box.querySelectorAll(".hbox,table.htbl,p.hp")).forEach(function(el){
      if(!el.isConnected||!SECTION_ONLY.test(String(el.textContent||"").replace(/\u00a0/g," ").trim()))return;
      const wrap=el.closest(".hbox,table.htbl")||el;
      if(wrap!==box&&wrap.parentNode){wrap.remove();hit=true;}
    });
    const first=Array.prototype.find.call(box.querySelectorAll("p.hp"),p=>String(p.textContent||"").trim());
    if(first){
      const m=String(first.textContent||"").match(LEADING_SECTION);
      if(m){cutTextPrefix(first,m[0].length);hit=true;}
    }
    return hit?box.innerHTML:s;
  }

  /* ── (v2.8 재웅 신고 #7477) 조건 박스 주위의 빈 HWP 프레임 제거 ──
     일부 시험지는 (가)(나) 조건을 3×3 표의 가운데 셀에 넣고, 위·아래 행과 좌·우 셀을
     빈 여백으로 둔다. 웹에서는 모든 td에 테두리가 생겨 바깥 사각형과 안쪽 사각형이
     동시에 보인다. 다음을 모두 만족할 때만 표를 단일 .hbox.hcond로 바꾼다.
       · 첫 행과 마지막 행이 완전히 비어 있음
       · 가운데 행의 내용 있는 셀이 정확히 하나
       · 그 셀에 (가)(나)… 조건 표지가 두 개 이상 있음
     따라서 실제 값 표·행렬·선지 표와 한 줄짜리 (가) 문장은 그대로 보존된다. */
  function conditionFrameTables(h){
    const s=String(h==null?"":h);
    if(s.indexOf("htbl")<0 || !/\(\s*가\s*\)/.test(s)) return s;
    const box=document.createElement("div");box.innerHTML=s;
    let hit=false;
    const blank=function(td){
      return !String(td.textContent||"").replace(/\u00a0/g," ").trim() && !td.querySelector("img,svg,.heq");
    };
    Array.prototype.forEach.call(box.querySelectorAll("table.htbl"),function(tb){
      const rows=Array.prototype.slice.call(tb.rows);
      if(rows.length!==3) return;
      if(!Array.prototype.every.call(rows[0].cells,blank)||!Array.prototype.every.call(rows[2].cells,blank)) return;
      const filled=Array.prototype.slice.call(rows[1].cells).filter(td=>!blank(td));
      if(filled.length!==1) return;
      const core=filled[0],marks=String(core.textContent||"").match(/\(\s*[가나다라마바사]\s*\)/g)||[];
      if(new Set(marks.map(x=>x.replace(/\s/g,""))).size<2) return;
      let out;
      if(core.children.length===1 && core.firstElementChild.classList.contains("hbox")){
        out=core.firstElementChild;
      }else{
        out=document.createElement("div");out.className="hbox hcond";
        while(core.firstChild) out.appendChild(core.firstChild);
      }
      tb.parentNode.replaceChild(out,tb);hit=true;
    });
    return hit?box.innerHTML:s;
  }

  /* ── (v2.2 재웅 신고 "왼쪽 문제는 줄바꿈이 적절하지 않다") 문제 배치 문법 ──
     body_html 은 HWP 의 줄을 그대로 <br> 로 옮겨 놓아, 종이 폭 때문에 끊긴 자리에서도 줄이 바뀐다
     (예: "예를 들어, A(2)=8, ⏎ A(3)=5이다."). 반면 평문(raw_text) 경로는 한 문단으로 흐르므로
     같은 시험지 안에서 문제마다 배치가 달라 보인다. 다음 문법으로 통일한다.
       규칙1  <br> 다음이 들여쓰기(&emsp;·&nbsp;·공백)로 시작하고 수식을 품으면 = 저자가 띄운
              '독립 수식 줄' → .hdisp 블록으로 세운다(위아래 여백 + 들여쓰기).
       규칙2  그 밖의 <br> 는 지우고(공백 한 칸) 조판 폭에 맡긴다.
       규칙3  독립 수식 줄 다음 문장은 새 줄에서 시작한다(시험지 관례).
       규칙4  선지(①…)·조건((가)…)·보기 문단은 기존 규칙 소관이라 손대지 않는다.
       규칙5  들여쓰였어도 수식이 없거나 너무 짧으면 독립 줄로 보지 않는다(오폭 방지). */
  const IND=/^(?:&emsp;|&ensp;|&nbsp;|\s)+/i;
  function flowBreaks(h){
    const s=String(h==null?"":h);
    if(s.indexOf("<br")<0) return s;
    const box=document.createElement("div"); box.innerHTML=s;
    Array.prototype.forEach.call(box.querySelectorAll("p.hp"), function(p){
      const raw=p.innerHTML;
      if(raw.indexOf("<br")<0) return;
      if(/[①②③④⑤]/.test(raw)) return;                        /* 선지 문단 */
      if(/^\s*(?:&emsp;|&nbsp;|\s)*\(\s*[가나다라마바사]\s*\)/.test(raw)) return;  /* 조건 문단 */
      if(/[ㄱㄴㄷㄹ]\s*[.,]/.test(raw)) return;                  /* 〈보기〉 */
      const segs=raw.split(/<br\s*\/?>/i);
      if(segs.length<2) return;
      const isDisp=segs.map(function(x, i){
        if(i===0) return false;                                 /* 첫 줄은 들여쓰기여도 문단 머리 */
        if(!IND.test(x)) return false;
        const bare=x.replace(IND,"").replace(/<[^>]*>/g,"").trim();
        return /heq/.test(x) && bare.length<=60;                /* 수식을 품은 짧은 줄만 */
      });
      let out="", buf="";
      const flush=function(){ if(buf.trim()) out+='<span class="hflow">'+buf.trim()+"</span>"; buf=""; };
      segs.forEach(function(x, i){
        if(isDisp[i]){ flush(); out+='<span class="hdisp">'+x.replace(IND,"").trim()+"</span>"; }
        else buf += (buf&&!/\s$/.test(buf)?" ":"") + x;
      });
      flush();
      p.innerHTML=out;
    });
    return box.innerHTML;
  }

  /* 저장 HTML(body_html) 표시 보정 */
  function fix(html){
    let s=flowBreaks(casesTable(conditionFrameTables(normalizeBogiBoxes(removeExamSectionLabels(commonGlyphs(String(html||"").replace(WON,"\\").replace(NGD,"").replace(NGD_PLAIN,"")))))));
    s=s.replace(/\{\{\s*from(?:\s*\^\s*\{(?:[^{}]|\{[^{}]*\})*\})+\s*\}\}/g,"");
    return fixSegs(s);
  }

  /* ── (v1.2) 조건 박스 (가)(나)(다) ──
     교재 평문은 조건절이 "(가) … (나) …" 로 한 줄에 붙어 들어온다. 시험지에서는 테두리 박스 안에
     조건마다 줄을 바꿔 싣는 것이 관례이므로 그 형태로 복원한다.
     오폭 방지: '(가)로 시작하는 줄'이면서 조건이 2개 이상(같은 줄의 (나)… 또는 다음 줄의 (나)…)일 때만 박스.
     ("(가)에 알맞은 식은?" 같은 빈칸형 한 줄 문장은 박스로 잡지 않는다.) */
  const C_START=/^\s*\(\s*가\s*\)/, C_CONT=/^\s*\(\s*[나다라마바사]\s*\)/;
  const C_MARK=/\(\s*[가나다라마바사]\s*\)/;
  /* 한 줄을 항목 단위로 분할. $…$ 수식 세그먼트 안은 절대 건드리지 않는다.
     mark = 항목 표지 정규식, norm = 표지 정규화 함수. (가)(나)(다) 와 ㄱㄴㄷ 이 같은 엔진을 쓴다. */
  function splitBy(line, mark, norm){
    const segs=String(line).split(/(\$[^$\n]*\$)/);
    let cur="", rows=[];
    segs.forEach((s,i)=>{
      if(i%2){ cur+=s; return; }                      // 수식 세그먼트 통과
      let rest=s, m;
      while((m=rest.match(mark))){
        cur+=rest.slice(0,m.index);
        if(cur.trim()) rows.push(cur.trim());
        cur=norm(m[0]);
        rest=rest.slice(m.index+m[0].length).replace(/^\s+/,"");
      }
      cur+=rest;
    });
    if(cur.trim()) rows.push(cur.trim());
    return rows;
  }
  const splitConds = line => splitBy(line, C_MARK, m=>"("+m.replace(/[\s()]/g,"")+") ");
  /* ── (v1.6) 〈보 기〉 박스 ──
     미러(내신 기출) 평문은 "< 보 기 >$NGD$ ㄱ. … ㄴ. … ㄷ. …" 가 한 줄로 들어와 박스 없이 흘러나온다
     (재웅 실측, 지족고 2025 16번). 시험지 관례대로 머리표를 가운데 얹은 테두리 박스 + 항목별 줄바꿈으로 복원.
     ㄱ~ㅂ 표지가 2개 이상일 때만 박스로 잡는다(오폭 방지). */
  const B_HEAD=/^\s*(?:&lt;|&#60;|〈|<)\s*보\s*기\s*(?:&gt;|&#62;|〉|>)\s*/;
  const B_MARK=/[ㄱㄴㄷㄹㅁㅂ]\s*[.,]/;
  const splitBogi = line => splitBy(line, B_MARK, m=>m.replace(/\s/g,"").replace(/,$/,".")+" ");
  /* 평문 줄배열 → HTML (조건 박스 + 줄바꿈을 한 번에 처리해 박스 주변 잉여 <br> 를 남기지 않는다) */
  function linesToHtml(s){
    const lines=String(s).split("\n"), out=[];
    for(let i=0;i<lines.length;i++){
      if(C_START.test(lines[i])){
        let rows=splitConds(lines[i]);
        while(i+1<lines.length && C_CONT.test(lines[i+1])) rows=rows.concat(splitConds(lines[++i]));
        if(rows.length>=2){ out.push({box:rows}); continue; }
      }
      if(B_HEAD.test(lines[i])){
        const rows=splitBogi(lines[i].replace(B_HEAD,""));
        if(rows.length>=2){ out.push({box:rows,head:"〈보 기〉"}); continue; }
      }
      out.push({t:lines[i]});
    }
    let html="";
    out.forEach((o,idx)=>{
      if(o.box){
        html=html.replace(/(?:<br>\s*)+$/,"");
        html+='<div class="hbox hcond'+(o.head?" hbogi":"")+'">'
             +(o.head?'<div class="hbogit">'+o.head+'</div>':"")
             +o.box.map(r=>'<div class="hcondr">'+r+'</div>').join("")+'</div>';
      }else{
        html+=o.t+(idx<out.length-1?"<br>":"");
      }
    });
    return html;
  }
  /* HWP 증감표는 표 개체가 텍스트 행으로 풀려 저장된다.
     x·f'(x)·f(x) 세 행의 칸 수가 같을 때만 의미 표로 복원하여,
     일반적인 수식 나열을 표로 오인하지 않는다. */
  function variationTables(html){
    const rows=String(html||"").split(/<br\s*\/?>/i);
    const key=v=>String(v||"").trim().replace(/^\$|\$$/g,"").replace(/[{}\s]/g,"")
      .replace(/\\(?:displaystyle|,|;|:|!)/g,"");
    const isX=v=>key(v)==="x";
    const isFp=v=>/^f(?:`|')*(?:prime)*\(x\)$/.test(key(v));
    const isF=v=>/^f\(x\)$/.test(key(v));
    /* 구 미러에서 표 세 행이 개행 없이 한 줄로 접힌 변형도
       같은 칸 수 계약으로 복원한다(#4422 실측). */
    for(let i=0;i<rows.length;i++){
      const toks=splitMath(rows[i]), mids=[];
      toks.forEach((t,p)=>{if(t.m)mids.push({p,t});});
      const xi=mids.findIndex(v=>isX(v.t.o+v.t.b+v.t.c));
      if(xi<0)continue;
      const fi=mids.findIndex((v,n)=>n>xi&&isFp(v.t.o+v.t.b+v.t.c));
      const vi=mids.findIndex((v,n)=>n>fi&&isF(v.t.o+v.t.b+v.t.c));
      if(fi<0||vi<0)continue;
      const xs=mids.slice(xi+1,fi),ds=mids.slice(fi+1,vi);
      if(xs.length<3||ds.length<1)continue;
      let stop=mids.length;
      for(let n=vi+1;n<mids.length;n++){
        const nextPos=n+1<mids.length?mids[n+1].p:toks.length;
        const tail=toks.slice(mids[n].p+1,nextPos).map(t=>t.t||"").join("");
        if(/[가-힣]/.test(tail)){stop=n+1;break;}
      }
      const vals=mids.slice(vi+1,stop);
      if(vals.length<2)continue;
      const rawMath=v=>v.t.o+v.t.b+v.t.c;
      const arrows=toks.map(t=>t.t||"").join("").match(/[↗↘↖↙]/g)||[];
      let dCells=ds.map(rawMath);
      while(dCells.length<xs.length){dCells.length%2?dCells.push(""):dCells.unshift("");}
      let fCells=vals.map(rawMath);
      if(fCells.length*2-1===xs.length){
        const z=[];fCells.forEach((v,n)=>{if(n)z.push(arrows[n-1]||"");z.push(v);});fCells=z;
      }
      if(dCells.length!==xs.length||fCells.length!==xs.length)continue;
      const tr=(label,cells)=>'<tr><th scope="row">'+label+'</th>'+cells.map(v=>'<td>'+v+'</td>').join("")+'</tr>';
      const table='<table class="ngd2-variation-table"><tbody>'+tr('$x$',xs.map(rawMath))+tr("$f'(x)$",dCells)+tr('$f(x)$',fCells)+'</tbody></table>';
      const beforeX=mids.slice(0,xi).reverse().find(v=>/f.*=.*x/i.test(v.t.b));
      const lastVal=vals[vals.length-1],suffix=toks.slice(lastVal.p+1).map(t=>t.t!=null?t.t:rawMath({t})).join("").replace(/^[↗↘↖↙\s]+/,"");
      rows[i]=(beforeX?rawMath(beforeX)+"<br>":"")+table+suffix;
      /* 바로 앞의 `수식입니다.` 접근성 중복 행만 제거. 본 함수식은 보존. */
      let b=i-1;
      while(b>=0&&i-b<=4&&!/[가-힣]/.test(rows[b])&&!/^\s*\$?f\s*(?:\\left)?\s*\(x/i.test(rows[b])){rows.splice(b,1);i--;b--;}
    }
    for(let i=0;i<rows.length;i++){
      if(!isX(rows[i]))continue;
      let j=-1,k=-1;
      for(let p=i+2;p<Math.min(rows.length,i+16);p++){if(isFp(rows[p])){j=p;break;}}
      if(j<0)continue;
      for(let p=j+2;p<Math.min(rows.length,j+16);p++){if(isF(rows[p])){k=p;break;}}
      if(k<0)continue;
      let end=k+1;while(end<rows.length&&rows[end].trim())end++;
      const xs=rows.slice(i+1,j).filter(v=>v.trim());
      const ds=rows.slice(j+1,k).filter(v=>v.trim());
      const fs=rows.slice(k+1,end).filter(v=>v.trim());
      if(xs.length<3||xs.length!==ds.length||xs.length!==fs.length)continue;
      const tr=(label,cells)=>'<tr><th scope="row">'+label+'</th>'+cells.map(v=>'<td>'+v+'</td>').join("")+'</tr>';
      const table='<table class="ngd2-variation-table"><tbody>'+tr(rows[i],xs)+tr(rows[j],ds)+tr(rows[k],fs)+'</tbody></table>';
      rows.splice(i,end-i,table);i++;
    }
    return rows.join("<br>");
  }
  /* 구조 HTML 쪽 조건 문단(<p class="hp">(가)…</p> 연속)도 동일하게 박스로.
     이미 박스(hbox)나 HWP 테두리표(htbl)로 그려진 문항은 손대지 않는다. */
  function condBoxHtml(h){
    if(/hbox|htbl/.test(h)) return h;
    return h.replace(/(<p[^>]*>(?:&emsp;|&nbsp;|\s)*\(\s*가\s*\)[\s\S]*?<\/p>(?:\s*<p[^>]*>(?:&emsp;|&nbsp;|\s)*\(\s*[나다라마바사]\s*\)[\s\S]*?<\/p>)+)/g,
      '<div class="hbox hcond">$1</div>');
  }

  /* (v1.5 재웅 실측) 미리보기 자르기 — "문제 고르기 화면에서 수식이 깨져".
     preview 를 글자수로 뚝 자르면 `$…$` 한가운데가 잘려 닫는 $ 가 사라지고, KaTeX 는 그 조각을 통째로
     포기해 원본 LaTeX 가 그대로 노출된다(한글 글꼴에서 백슬래시가 ₩ 로 보여 더 깨져 보임).
     → 잘린 자리에 열려 있는 수식 구분자가 있으면 그 여는 자리 앞까지 물러나서 자른다. */
  function clip(t,n){
    const s=String(t||"");
    /* KaTeX auto-render 와 같은 순서($$ → \[ → \( → $)로 좌→우 스캔해 '닫히지 않은 수식'의 시작을 찾는다.
       `$y$$= …$`(붙어 있는 두 세그먼트)를 $$ 로 오독하지 않도록 실제 스캔으로 판정한다. */
    const D=[["$$","$$"],["\\[","\\]"],["\\(","\\)"],["$","$"]];
    const openAt=c=>{
      let i=0;
      while(i<c.length){
        let hit=null;
        for(const d of D) if(c.startsWith(d[0],i)){hit=d;break;}
        if(!hit){ i += (c[i]==="\\" ? 2 : 1); continue; }
        const e=c.indexOf(hit[1], i+hit[0].length);
        if(e<0) return [i,hit];
        i=e+hit[1].length;
      }
      return [-1,null];
    };
    /* RPC preview 자체가 이미 160자에서 수식 중간으로 잘려 오는 경우가 있다. 길이가 n 이하라도
       닫히지 않은 구분자를 검사해야 `$\\left...` 원문이 상세창에 그대로 노출되지 않는다. */
    const lengthCut=s.length>n;
    let c=lengthCut?s.slice(0,n):s, shortened=lengthCut;
    const [at,d]=openAt(c);
    if(at>=0){
      /* 조금만 더 가면 닫히는 수식(1.5배 이내)은 통째로 살리고, 아니면 여는 자리 앞에서 자른다.
         반쪽 수식은 절대 남기지 않는다 — KaTeX 가 포기해 LaTeX 원문이 노출되기 때문. */
      const e=s.indexOf(d[1], at+d[0].length);
      if(e>=0 && e+d[1].length<=Math.round(n*1.5)) c=s.slice(0,e+d[1].length);
      else{c=c.slice(0,at);shortened=true;}
    }
    if(!shortened&&c===s)return s;
    return c.replace(/\\+$/,"").replace(/\s+$/,"")+"…";
  }
  /* (v1.5) 한 줄 라벨·미리보기용 — 수식 수선만 하고 선지 배치·조건 박스·줄바꿈은 걸지 않는다.
     (목록 행 안에서 블록 요소가 튀어나오면 레이아웃이 무너지므로) */
  function inline(t){
    let s=commonGlyphs(esc(typeonLegacyDisplayRepair(t||"")).replace(WON,"\\").replace(NGD,"").replace(NGD_PLAIN,""));
    return fixSegs(s).replace(/\n+/g," ");
  }
  /* ── (v1.8) 따로 오는 그림 끼워넣기 ──
     내신 미러(exam_items)는 그림이 본문에 없고 `image_urls` 로 따로 온다(미러 body 는 평문이라
     태그를 넣으면 esc() 되어 글자로 찍힌다). 그 그림을 **본문 흐름의 올바른 자리**에 끼운다.
     자리 규칙 = 오늘 표시검수에서 정리한 시험지 배치 그대로: 문제 진술 다음 **선지 바로 앞**.
     (선지 밑에 그림이 오는 배치는 교재에서 걷어낸 잘못된 꼴이다.)
     선지가 없으면(주관식) 본문 맨 끝. 본문에 이미 그림이 있으면 손대지 않는다.
     규격은 items 구조HTML 과 동일한 `<p class="hp"><img class="hfig">` — 같은 CSS 를 그대로 탄다. */
  /* ── (v1.9) HWP 그림 자리표시 잔재 ──
     미러 원문(exam_items.body·explanation)에는 그림이 있던 자리에 HWP 접근성 캡션이 글자로 남아 있다:
        그림입니다.⏎원본 그림의 이름: CLP0000476c0007.bmp⏎원본 그림의 크기: 가로 789pixel, 세로 918pixel
     실측(2026-07-30): 해설 523건·본문 14건. 지금까지 이 문장이 해설에 그대로 찍히고 있었다.
     이 잔재는 **그림이 있던 정확한 자리**를 알려 주므로 지우지 않고 슬롯으로 바꿔 두었다가
     withSolFigures 가 실제 그림으로 갈아끼운다. 아무도 채우지 않으면 CSS 로 감춘다(display:none). */
  const FIGRES = /그림입니다\s*\.?(?:\s|<br\s*\/?>|&nbsp;|&emsp;)*(?:원본\s*그림의\s*이름\s*:[^\r\n<]*(?:\s|<br\s*\/?>|&nbsp;)*)?(?:원본\s*그림의\s*크기\s*:[^\r\n<]*)?/g;
  const SLOT = '<span class="hfigslot"></span>';
  const SLOTRE = /<span class="hfigslot"><\/span>/g;
  function figSlots(html){ return String(html==null?"":html).replace(FIGRES, SLOT); }
  function dropSlots(html){ return String(html==null?"":html).replace(SLOTRE, ""); }
  function urlList(urls){
    return (Array.isArray(urls)?urls:(urls?[urls]:[])).filter(u=>typeof u==="string"&&u.trim());
  }
  function figures(urls){
    const a=(Array.isArray(urls)?urls:(urls?[urls]:[])).filter(u=>typeof u==="string"&&u.trim());
    if(!a.length) return "";
    return '<p class="hp hfigs">'+a.map(u=>'<img class="hfig" src="'+esc(u)+'">').join("")+'</p>';
  }
  function withFigures(html, urls){
    const s0=figSlots(html);                          // (v1.9) 본문에 남은 자리표시 잔재도 함께 정리
    const fig=figures(urls);
    if(!fig) return dropSlots(s0);
    if(/<img|<svg/i.test(s0)) return dropSlots(s0);   // 이미 그림이 있으면 중복 삽입 금지
    const i=s0.indexOf('<div class="nchoices"');
    /* 문제 본문은 재웅이 승인한 규칙(선지 바로 앞)이 자리표시보다 우선한다 — 시험지 배치를 맞추기 위해서다. */
    return dropSlots(i<0 ? s0+fig : s0.slice(0,i)+fig+s0.slice(i));
  }
  /* ── (v1.9) 해설 그림 끼워넣기 ──
     해설은 선지가 없어서 '선지 바로 앞' 규칙을 쓸 수 없다. 신호가 센 것부터 3단계로 자리를 정한다.
       ① HWP 자리표시 잔재가 있으면 그 자리 (실측 526건 중 405건은 잔재 수 = 그림 수로 일치,
          나머지는 잔재가 그림보다 적었고 초과 사례는 0건이라 남는 그림은 마지막 자리에 함께 붙인다)
       ② 잔재가 없으면 그림을 언급한 줄("그림과 같이"·"위 그림"·"그림에서"…) 바로 뒤
       ③ 언급도 없으면 해설 맨 끝 (종전 동작 유지) */
  const SOLREF = /(?:그림과\s*같이|그림에서|그림처럼|그림의|(?:위|아래|다음|오른쪽|왼쪽|좌측|우측)\s*그림)/;
  function withSolFigures(html, urls){
    let s0=figSlots(html);
    const a=urlList(urls);
    if(!a.length) return dropSlots(s0);
    if(/<img|<svg/i.test(s0)) return dropSlots(s0);
    const slots=(s0.match(SLOTRE)||[]).length;
    if(slots){
      let k=0, seen=0;
      return s0.replace(SLOTRE, ()=>{
        const last=(++seen===slots);
        if(k>=a.length) return "";
        const take=last ? a.slice(k) : [a[k]];
        k+=take.length;
        return figures(take);
      });
    }
    const fig=figures(a);
    /* 줄 경계는 원문 개행과 <br> 둘 다 인정한다(해설은 평문·구조HTML 두 경로로 들어온다) */
    const parts=s0.split(/(<br\s*\/?>|\n)/);
    for(let i=0;i<parts.length;i+=2){
      if(!SOLREF.test(parts[i])) continue;
      return parts.slice(0,i+1).join("")+(parts[i+1]||"")+fig+parts.slice(i+2).join("");
    }
    return s0+fig;
  }
  /* ── (v2.7) 그림 흐름 표준화 ────────────────────────────────────
     문제: HWP/HTML/별도 URL/SVG 경로마다 그림이 문장 중간·오른쪽·선지 뒤 등 제각각 놓였다.
     원칙: 문제 그림은 발문이 끝난 뒤, 선지가 있으면 선지 바로 앞의 전용 영역으로 모은다.
           해설 그림은 설명 단계와의 관계를 보존하기 위해 원래 문맥 위치를 유지하되 같은 영역으로 감싼다.
     예외: 선지 자체의 그림, 조건·보기 박스 안 그림, 표 안 그림은 의미 구조이므로 이동하지 않는다. */
  const FIGPROTECT=".nchoices,.hchoices,.hchoice,.hchoicegrid,.hbox";
  function figureIsProtected(n){
    if(n.closest(FIGPROTECT))return true;
    const table=n.closest("table");if(!table)return false;
    const marks=[...new Set((table.textContent||"").match(/[①②③④⑤]/g)||[])];if(marks.length>=3)return true;
    /* 짧은 축·점 라벨만 남은 소수 그림 표는 HWP 배치용이다. 긴 설명·다중 데이터 표는 보존한다. */
    const text=(table.textContent||"").replace(/\s+/g,"").replace(/[xyOABCDEFPQRSRl₁₂₃₄₅₆₇₈₉₀\-+0-9]/g,"");
    const figs=table.querySelectorAll(".hfigwrap,.hfigs,.nvfig,figure,img,svg").length;
    return !(figs<=3&&text.length<=18);
  }
  function figureCarrier(n){
    return n.closest(".ngd2-figure-zone") || n.closest(".hfigwrap") || n.closest(".hfigs") ||
      n.closest(".nvfig") || n.closest("figure") || n;
  }
  function figureNodes(box){
    const out=[];
    box.querySelectorAll(".hfigs,.hfigwrap,.nvfig,figure,img,svg").forEach(n=>{
      if(n.closest(".ngd2-figure-zone")||figureIsProtected(n))return;
      const c=figureCarrier(n);
      if(c===box||out.some(x=>x===c||x.contains(c)))return;
      /* 더 큰 carrier가 뒤늦게 잡히면 그 안의 작은 후보를 제거한다. */
      for(let i=out.length-1;i>=0;i--)if(c.contains(out[i]))out.splice(i,1);
      out.push(c);
    });
    return out;
  }
  function directChild(box,n){let x=n;while(x&&x.parentElement!==box)x=x.parentElement;return x||null;}
  function cleanEmptyFigureParents(box){
    box.querySelectorAll("p.hp,p").forEach(p=>{
      if(!p.textContent.trim()&&!p.querySelector("img,svg,table,.hbox,.hfigwrap"))p.remove();
    });
    box.querySelectorAll("table").forEach(t=>{if(!t.textContent.trim()&&!t.querySelector("img,svg,.hfigwrap,.hfigs,.nvfig,figure"))t.remove();});
  }
  function problemFigures(html){
    const box=document.createElement("div");box.innerHTML=String(html||"");
    const nodes=figureNodes(box);if(!nodes.length)return box.innerHTML;
    const zone=document.createElement("div");zone.className="ngd2-figure-zone ngd2-problem-figures";
    nodes.forEach(n=>zone.appendChild(n));
    const choice=box.querySelector(".nchoices,.hchoices,.hchoicegrid,.hchoice"),anchor=choice&&directChild(box,choice);
    if(anchor)box.insertBefore(zone,anchor);else box.appendChild(zone);
    cleanEmptyFigureParents(box);return box.innerHTML;
  }
  function solutionFigures(html){
    const box=document.createElement("div");box.innerHTML=String(html||"");
    figureNodes(box).forEach(n=>{
      const zone=document.createElement("span");zone.className="ngd2-figure-zone ngd2-solution-figures";
      n.parentNode.insertBefore(zone,n);zone.appendChild(n);
    });
    cleanEmptyFigureParents(box);return box.innerHTML;
  }
  /* ── (v2.0) 해설 전용 표시 경로 ──
     재웅 실측: "미러 해설에 수식 깨짐이 아주 많은데 기출 문제에서 고친 규칙과 같은 계열".
     원인: 조판도구 해설 블록이 fix() 만 태웠다. fix() 는 `$…$` 안쪽만 수선하므로
       (a) 줄바꿈·(가)(나) 조건박스·〈보 기〉 박스(linesToHtml)를 못 타고
       (b) 수식 구분자 **밖**의 HWP 원문 잔재가 그대로 찍혔다.
     문제 본문(mathText)은 둘 다 처리하고 있었다 — 해설만 빠져 있었다.
     실측 규모(2026-07-30, exam_items.explanation 84,392건):
       줄바꿈 55,785 / (가)(나)(다) 4,642 / "수식입니다." 38,258 / ` 20010` 잔재 8,825 /
       구분자 밖 HWP 원문(LEQ·over·sqrt…) 18,086 / 원문자 69,259.
     ★ 선지 격자(choices)는 절대 걸지 않는다 — 해설의 ①②③ 는 선지가 아니라 서술이다(69,259건). */
  /* "수식입니다." 뒤에는 HWP 수식 원문이 그대로 따라오고, 대부분(30,195/38,258) 바로 뒤에
     변환된 `$…$` 가 이어져 같은 식이 두 번 찍힌다. 그 경우 원문 쪽을 걷어내되 그 안에 섞인
     한글 낱말("또는"·"이고" 등 문장의 일부)은 살린다. 뒤에 `$…$` 가 없으면(8,063건) 원문이
     유일한 내용이므로 지우지 않고 hwpInputToTex 로 수식으로 세워 준다. */
  /* (2026-08-08b 페이블) 전수검수 실측 #813 등 — "수식 입니다."처럼 내부 공백 변형이 있으면
     덤프 제거가 통째로 건너뛰어져 LEFT/RIGHT 원문이 그대로 노출됐다. 공백 허용. */
  const SUSIK = /수\s*식\s*입\s*니\s*다\s*\.?[ \t]*/;
  /* 인접 인라인 수식 `$A$$B$`는 v2 splitMath 스캐너가 그대로 구분한다. 과거 정규식 기반
     splitAdjacentInline은 `$x$이다.$$...$$`에서 앞 수식의 닫는 $부터 display 수식까지를
     `$이다.$`로 오인해 진짜 $$를 파괴하므로 제거한다(2026-08-14 대량 파손의 직접 원인). */
  /* 파서가 뱉은 코드 덩어리 정리 — 빈 줄 수십 개 + 맨몸 `20010`·`20011`(앞에 `To` 가 붙기도 한다)이
     해설 중간에 박혀 있어 그 자리에서 해설이 두 화면쯤 끊긴다(실측 #3·#24·#20506·#20510). */
  function preClean(s){
    return String(s).replace(/\r/g,"")
      /* (2026-08-08b 페이블) 전수검수 실측 — 줄 병합으로 본문 중간에 남는 파서 마커들 */
      .replace(/\{\s*(?:220134|3090280)\s*\}/g,"")
      .replace(/(?<![0-9])(?:220134|3090280)(?![0-9])/g,"")
      .replace(/(?:from|To)\s*2001[01](?![0-9])/g,"")
      .replace(/(?:[ \t]*\n){2,}[ \t]*(?:To[ \t]*\n[ \t]*)?200\d\d[ \t]*(?:\n[ \t]*)*/g," ")
      .replace(/(?:^|\n)[ \t]*(?:To[ \t]*\n[ \t]*)?200\d\d[ \t]*(?=\n|$)/g,"")
      /* HWP 점선 지시가 붙어 내려온 `CDOTSCDOTS`는 두 개의 말줄임표로 복원. */
      .replace(/(?<![A-Za-z])CDOTS\s*CDOTS(?![A-Za-z])/gi,"⋯⋯")
      .replace(/\n{3,}/g,"\n");
  }
  /* (2026-08-23 클로드 최적화 2차) 덤프 승격분이 바로 뒤의 '이미 변환된 쌍둥이 수식'과
     같은 내용이면 중복이므로 버린다 — #5641(therefore~ 뒤 $\therefore…$), #5667(y=it-x+3 뒤
     $y=-x+3$), #5702(over식 뒤 $\frac…$) 실측. 정규화 키가 정확히 일치할 때만 지운다. */
  function _mathKey(t){
    let x=String(t||"");
    try{ x=(window.NGD2Math&&NGD2Math.repairMathSeg)?NGD2Math.repairMathSeg(x):x; }catch(_e){}
    /* (2026-08-24 최적화 18회차) 덤프 쪽에만 남는 서체 접두(it·rm·bf)가 키를 어긋나게 한다
       (#7606 `=itk` vs `=k` 실측) — 키 산출에서만 박리, 원문은 불변 */
    x=x.replace(/(?<![A-Za-z])(?:rm|it|bf)(?=[A-Za-z0-9])/g,"");
    return x.replace(/\\[,;:!]|\\(?:left|right|big[lr]?|displaystyle)(?![A-Za-z])/g,"")
            .replace(/[^0-9A-Za-z=+\-<>]/g,"").toLowerCase();
  }
  function _dupInLookahead(core, lookahead){
    let c=core;
    try{ if(window.NGD2Math&&NGD2Math.hwpInputToTex) c=NGD2Math.hwpInputToTex(String(core)); }catch(_e){}
    const key=_mathKey(c);
    if(key.length<2) return false;
    for(const mm of String(lookahead||"").matchAll(/\$([^$]{1,300})\$/g)){
      if(_mathKey(mm[1])===key) return true;
    }
    return false;
  }
  function stripHwpDump(s){
    const lines = preClean(s).split("\n");
    for(let li=0; li<lines.length; li++){
      let line = lines[li], guard = 0;
      while(guard++ < 20){
        const m = line.match(SUSIK);
        if(!m) break;
        const start = m.index, after = start + m[0].length;
        const dollar = line.indexOf("$", after);
        const chunk = dollar >= 0 ? line.slice(after, dollar) : line.slice(after);
        let repl;
        if(dollar >= 0){
          /* (2026-08-24 최적화 18회차) 같은 줄 뒤쪽에 변환된 쌍둥이 `$…$`가 있으면 덤프 수학부는
             중복 — 한글 연결어("이면" 등)만 남기고 제거한다(#7601 over식·#7606 bar{rmCD} 실측).
             정규화 키가 정확히 일치할 때만 지우고, 아니면 종전 혼합 복원 경로를 그대로 탄다. */
          const nested = chunk.search(SUSIK);
          const core = nested>=0 ? chunk.slice(0,nested) : chunk;
          const ki = core.search(/[가-힣]/);
          const mathPart = (ki>=0 ? core.slice(0,ki) : core).trim();
          const dupLa = (nested>=0 ? chunk.slice(nested) : "") + "\n" +
                        line.slice(dollar) + "\n" + lines.slice(li+1, li+4).join("\n");
          if(mathPart && _dupInLookahead(mathPart, dupLa)){
            const keep = (ki>=0 ? core.slice(ki).trim() : "");
            repl = (keep ? keep+" " : "") + (nested>=0 ? chunk.slice(nested) : "");
          }else{
          /* 수식 개체가 평문으로 풀린 `rm triangle AHC 와 $...$`는 한글만 남기면
             △AHC 자체가 사라진다. 도형/선분 명령을 먼저 수식으로 살리고 나머지 문장을 보존한다. */
          let mixed=chunk
            .replace(/(?<![A-Za-z])(?:rm|it|bf)\s*(triangle|angle)\s*(?:rm|it|bf)?\s*([A-Z]{1,6})(?![A-Za-z])/gi,
              (_,op,name)=>"$\\"+op.toLowerCase()+" "+name+"$")
            .replace(/(?<![A-Za-z])(?:rm|it|bf)\s*(?:bar|overline)\s*\{?\s*([A-Z]{1,6})\s*\}?/gi,
              (_,name)=>"$\\overline{"+name+"}$")
            /* (18회차) rm이 중괄호 안에 든 변형 bar{rmCD}} — 고아 닫는 중괄호까지 함께 소비 */
            .replace(/(?<![A-Za-z])bar\s*\{\s*(?:rm|it|bf)?\s*([A-Z]{1,6})\s*\}\}?/gi,
              (_,name)=>"$\\overline{"+name+"}$")
            .replace(/(?<![A-Za-z])(?:rm|it|bf)(?![A-Za-z])/gi,"")
            .trim();
          repl = mixed ? mixed+" " : "";
          }
        }else if(!chunk.trim() && (function(){
          /* (2026-08-23 2차) 빈 줄을 최대 2개 건너뛰고 다음 실줄이 원시 수식 덤프인지 본다.
             #5641처럼 `수식입니다.\n\n. therefore~ -1 le x le 2` 꼴이 빈 줄 뒤에 온다. */
          let j=li+1, skip=0;
          while(j<lines.length && !lines[j].trim() && skip<2){ j++; skip++; }
          if(j>=lines.length) return false;
          const cand=lines[j].replace(/^\s*\.\s*/,"");
          if(!/(?:LEFT|RIGHT|ANGLE|TRIANGLE|TIMES|DIVIDE|\bover\b|sqrt|\bpi\b|\bsin\b|\bcos\b|therefore|because|BOT|BIGCIRC|\bbar\b|\ble\b|\bge\b|\bne\b|\bit\b|\brm\b)/i.test(cand)) return false;
          if(/[가-힣]/.test(cand)) return false;
          stripHwpDump._j=j; stripHwpDump._cand=cand.trim();
          return true;
        })()){
          const j=stripHwpDump._j, t=stripHwpDump._cand;
          const lookahead=lines.slice(j+1, j+4).join("\n");
          if(t && _dupInLookahead(t, lookahead)){
            repl="";                       /* 변환된 쌍둥이가 바로 뒤에 있으면 덤프는 중복 — 제거 */
          }else{
            repl = t ? "$" + (window.NGD2Math && NGD2Math.hwpInputToTex ? NGD2Math.hwpInputToTex(t) : t) + "$" : "";
          }
          lines[j] = "";
        }else{
          /* `수식입니다. a+b=17 수식입니다.`처럼 같은 줄에 표식이 반복되면 첫 식만
             수식으로 감싸고 다음 표식은 루프가 따로 소비하게 한다. 종전에는 뒤 표식과
             한글까지 한 수식에 넣어 \text{...} 원문이 화면에 노출됐다(#14289). */
          const next = chunk.search(SUSIK);
          const core = (next>=0 ? chunk.slice(0,next) : chunk).trim();
          /* (2026-08-23 2차) 같은 줄 잔여 + 다음 3줄에 변환된 쌍둥이가 있으면 덤프는 중복 — 제거 */
          const la = (next>=0 ? chunk.slice(next) : "") + "\n" +
                     (dollar>=0 ? line.slice(dollar) : "") + "\n" + lines.slice(li+1, li+4).join("\n");
          if(core && _dupInLookahead(core, la)){
            repl = "";
          }else{
            repl = core ? "$" + (window.NGD2Math && NGD2Math.hwpInputToTex ? NGD2Math.hwpInputToTex(core) : core) + "$" : "";
          }
          if(next>=0) repl += " " + chunk.slice(next);
        }
        line = line.slice(0, start) + repl + (dollar >= 0 ? line.slice(dollar) : "");
      }
      lines[li] = line;
    }
    return lines.join("\n");
  }
  /* 구분자 밖에 남은 파서 잔재 — 수식 세그먼트 안은 repairMathSeg 가 이미 처리한다. */
  /* 수식 구분자 밖에 남은 HWP 좌표식 한 개씩 복구.
     실 DB #3은 첫 좌표만 평문이고 바로 뒤 좌표는 `$...$`인 혼합 저장형이다:
     `. rm Q it LEFT(-a,~-b,~2b RIGHT), $rm Q ...$$rm R ...$이므로`.
     과거의 `뒤따르는 한글` 조건은 쉼표+$ 경계에서 첫 좌표를 놓쳤다. 좌표 한 개만
     캡처하고 rm/it/bf/~ 신호를 별도로 요구해, 혼합 경계도 처리하면서 일반 영문
     괄호를 수식으로 오인하지 않는다. */
  function promoteInlineHwpProse(t){
    const rx=/(^|[\s.·])((?:(?:rm|it|bf)\s+)?[A-Z](?:\s+(?:rm|it|bf))?\s*(?:LEFT\s*)?\([^()가-힣\n$]{1,500}\))/g;
    return String(t||'').split('\n').map(line=>line
      .replace(/^\s*\.\s*(?=(?:rm|it|bf)\s+)/,'')
      .replace(rx,(all,lead,run)=>{
      if(!/(?<![A-Za-z\\])(?:rm|it|bf)(?![A-Za-z])|[~`]/.test(run))return all;
      let tex=run.trim();
      try{if(window.NGD2Math&&NGD2Math.hwpInputToTex)tex=NGD2Math.hwpInputToTex(tex);}catch(_e){}
      const prefix=lead==='.'?'':lead;
      /* 뒤에 이미 `$...$`가 붙은 혼합형에서도 닫는 `$`+여는 `$`가 `$$`로
         재해석되지 않도록, 새로 승격하는 조각은 동등한 인라인 구분자 \(...\)를 쓴다. */
      return prefix+'\\('+tex+'\\)';
    })).join('\n');
  }
  function outsideClean(s){
    /* (2026-08-08b 페이블) 표로 펴진 해설 안에 남는 HWP 대문자 토큰 — 한글이 섞인 줄이라
       수식 승격은 못 해도, 뜻이 유일한 글리프는 평문 단계에서 치환한다(실측 #813·#9979·#11109). */
    const glyphs=t=>t
      .replace(/(?<![A-Za-z])LEFT\s*\(/g,"(").replace(/RIGHT\s*\)(?![A-Za-z])/g,")")
      .replace(/(?<![A-Za-z])(?:LEFT|RIGHT)(?![A-Za-z])/g,"")
      .replace(/(?<![A-Za-z])THEREFORE(?![A-Za-z])/g,"∴").replace(/(?<![A-Za-z])BECAUSE(?![A-Za-z])/g,"∵")
      .replace(/(?<![A-Za-z])LEQ(?![A-Za-z])/g,"≤").replace(/(?<![A-Za-z])GEQ(?![A-Za-z])/g,"≥")
      .replace(/(?<![A-Za-z])NEQ(?![A-Za-z])/g,"≠").replace(/(?<![A-Za-z])CDOTS(?![A-Za-z])/g,"⋯")
      .replace(/(?<![A-Za-z])CDOT(?![A-Za-z])/g,"·").replace(/(?<![A-Za-z])TIMES(?![A-Za-z])/g,"×")
      .replace(/(?<![A-Za-z])DIVIDE(?![A-Za-z])/g,"÷").replace(/(?<![A-Za-z])PLUSMINUS(?![A-Za-z])/g,"±")
      .replace(/(?<![A-Za-z])(?:rm|it|bf|bold)(?=[A-Z가-힣])/g,"")
      .replace(/(?<=[0-9A-Za-z)\]}])\s+le\s+(?=[0-9A-Za-z(\[{])/g," ≤ ")
      .replace(/(?<=[0-9A-Za-z)\]}])\s+ge\s+(?=[0-9A-Za-z(\[{])/g," ≥ ")
      /* (2026-08-23 클로드 최적화 2차) 사이클 71·72 리터럴 명령어 노출 대분류 — 평문 구간 복원 */
      .replace(/(?<=[0-9A-Za-z)\]}])\s+ne\s+(?=[0-9A-Za-z(\[{])/g," ≠ ")
      .replace(/(?<![A-Za-z])BOT(?![A-Za-z])/g,"⊥")
      .replace(/(?<![A-Za-z])BIGCIRC(?![A-Za-z])/g,"◯")
      .replace(/(?<![A-Za-z])therefore(?![A-Za-z])/g,"∴")
      .replace(/(?<![A-Za-z])because(?![A-Za-z])/g,"∵")
      .replace(/`/g," ");
    const promote=t=>glyphs(promoteInlineHwpProse(t).replace(/\\text\s*\{([^{}]*)\}/g,"$1"))
      .replace(/(?<![A-Za-z])(?:(?:rm|it|bf)\s*)?(triangle|angle)\s*(?:rm|it|bf)?\s*([A-Z]{1,6})(?![A-Za-z])/gi,
        (_,op,name)=>"$\\"+op.toLowerCase()+" "+name+"$")
      .replace(/(?<![A-Za-z])(?:rm|it|bf)\s*(?:bar|overline)\s*\{?\s*([A-Z]{1,6})\s*\}?/gi,
        (_,name)=>"$\\overline{"+name+"}$")
      /* (2026-08-23 2차) 평문에 남은 `vec OP` 벡터 토큰 — 트랙C #4 실측 */
      .replace(/(?<![A-Za-z])vec\s+([A-Z]{1,4})(?![A-Za-z])/g,
        (_,name)=>"$\\vec{"+name+"}$")
      .replace(/\s+200\d\d(?![\d.])/g,"").split("\n").map(line=>{
      const z=line.trim();
      if(!z||/[가-힣]/.test(z))return line;
      /* 앞 단계가 이미 좌표 조각을 \(...\)로 승격했다면, 줄 전체를 다시 $...$로
         감싸지 않는다. 중첩 `$\(...\)$`는 KaTeX 오류와 원문 재노출을 만든다. */
      if(/\\\(|\\\[/.test(z))return line;
      /* (2026-08-09c 검수 e79402) 집합 관계 토큰이 있는 줄은 = 없이도 수식으로 승격 —
         이 줄의 { } 는 HWP 의 보이는 집합 중괄호(LEFT{…RIGHT})가 벗겨진 것이라 \{ \} 로 되살린다 */
      if(/(?:SUBSET|SUPERSET|EMPTYSET|NSUBSET|NOTIN|OWNS)(?![a-z])/.test(z)){
        return "$"+z.replace(/\{/g,"\\{").replace(/\}/g,"\\}")+"$";
      }
      if(/(?:LEFT|RIGHT|ANGLE|TRIANGLE|TIMES|DIVIDE|\bover\b)/i.test(z)&&/[=+\-]/.test(z)){
        const tex=window.NGD2Math&&NGD2Math.hwpInputToTex?NGD2Math.hwpInputToTex(z):z;
        return "$"+tex+"$";
      }
      return line;
    }).join("\n");
    return joinMath(splitMath(s).map(k=> k.t!=null ? {t:promote(k.t)} : k),
                    null).replace(/\u0000/g,"");
  }
  /* AI/외부 해설이 줄바꿈 의미로 저장한 `\\따라서`, `\\ $$...$$` 잔재를 수식 밖에서만
     실제 줄바꿈으로 바꾼다. 수식 안의 LaTeX 명령·집합 차·경로 표기는 건드리지 않는다. */
  function solutionBreakResidue(s){
    return splitMath(String(s||"")).map(k=>{
      if(k.t==null)return k.o+k.b+k.c;
      return k.t.replace(/\\+\s*(?=[가-힣])/g,"\n").replace(/\\+\s*$/g,"\n");
    }).join("");
  }
  function solutionConclusionBreak(s){
    let out="";
    for(const k of splitMath(String(s||""))){
      if(k.t!=null){
        /* 구분자 없이 평문으로 남은 유니코드 결론 기호도 같은 행 규칙을 적용한다. */
        out+=k.t.replace(/([^\s\n])(?=[ \t]*∴)/g,"$1\n");
        continue;
      }
      const raw=k.o+k.b+k.c;
      const head=String(k.b||"").trim().replace(/^\\(?:display|text)style\s*/,"");
      if(/^(?:\\therefore\b|THEREFORE\b|∴)/i.test(head)
          && out && !/(?:\n|<br\s*\/?>)\s*$/i.test(out)) out+="\n";
      out+=raw;
    }
    return out
  }
  function solutionProofBreak(s){
    const toks=splitMath(String(s||""));
    for(let i=0;i<toks.length-1;i++){
      const here=toks[i],next=toks[i+1];
      if(here.t!=null && next.t==null && /[㉠-㉥][ \t]*$/.test(here.t)
          && hasRelation(next.b) && !/\n[ \t]*$/.test(here.t)) here.t=here.t.replace(/[ \t]*$/,"\n");
    }
    return toks.map(k=>k.t!=null?k.t:k.o+k.b+k.c).join("")
  }
  function solutionLetterChoiceBreak(s){
    return splitMath(String(s||"")).map(k=>{
      if(k.t==null)return k.o+k.b+k.c;
      return k.t
        .replace(/([^\n])(?=[ \t]*[ㄱ-ㅎ]\s*[.．])/g,"$1\n")
        .replace(/(^|\n)([ \t]*)(참|거짓)\)(?=[ \t]*$)/g,"$1$2($3) ");
    }).join("");
  }
  function solutionCaseBreak(s){
    let out=splitMath(String(s||"")).map(k=>{
      if(k.t==null)return k.o+k.b+k.c;
      /* 괄호까지 포함한 유니코드 로마자 경우 표지만 대상으로 한다.
         일반 문장 속 ASCII (i), 변수 i, 수식 첨자는 건드리지 않는다. */
      return k.t.replace(/([^\n])(?=[ \t]*\([ⅰ-ⅹ]+\))/g,"$1\n");
    }).join("");

    const toks=splitMath(out);
    const caseHeads=[];
    for(let i=0;i<toks.length;i++){
      const k=toks[i];
      if(k.t!=null)continue;
      const body=String(k.b||"").replace(/^\\(?:display|text)style\s*/,"").trim();
      const next=toks[i+1];
      if(/^a\s*=\s*-\s*\d+$/.test(body) && next && next.t!=null && /^\s*[:：]/.test(next.t)) caseHeads.push(i);
    }
    /* 한 번만 등장하는 대입식은 일반 풀이일 수 있다. 같은 열거에서 사례 머리표가
       두 번 이상 확인될 때만 각 사례를 새 행으로 분리한다. */
    if(caseHeads.length>=2){
      for(const i of caseHeads){
        const prev=toks[i-1];
        if(prev && prev.t!=null && !/(?:\n|<br\s*\/?>)\s*$/i.test(prev.t)) prev.t=prev.t.replace(/[ \t]*$/,"")+"\n";
      }
    }
    return toks.map(k=>k.t!=null?k.t:k.o+k.b+k.c).join("");
  }
  /* (2026-08-14 재웅 신고: AI/미러 해설 수식 대량 파손) AI 작성 해설 정규화.
     이미 구분된 수식은 절대 재해석하지 않고 수식 밖 텍스트만 다룬다. 종전의 "생 LaTeX 런"
     정규식은 한글 문장·<b> 태그까지 한 수식으로 끌어들이고, 기존 $$ 환경에 $$를 다시 붙여
     $$$$를 만들었다. 출처별 복구는 outsideClean(HWP)과 이 어댑터에서 끝내며 이후 파이프라인은
     $…$ / $$…$$라는 공통 형식만 받는다. */
  function aiSolNormalize(s){
    if(!/\$\$|\\begin\{|\*\*|\\dfrac|\\triangle|\\overline/.test(s)) return s;
    const toks=splitMath(String(s));
    const normalized=toks.map(k=>{
      if(k.t==null) return k.o+k.b+k.c;
      let t=k.t;
      /* splitMath가 꺼내지 못한 $는 닫는 짝이 없는 고아 구분자뿐이다. */
      t=t.replace(/\$/g,"");
      /* Markdown 강조는 반드시 수식 밖에서만 HTML로 바꾼다. */
      t=t.replace(/\*\s?\*\s*([^*\n]{1,80}?)\s*\*\s?\*/g,"<b>$1</b>");
      /* 구분자 없이 저장된 완전한 환경만 display math로 승격한다. */
      t=t.replace(/\\begin\{(aligned|align\*?|gathered|cases|array|pmatrix|bmatrix|vmatrix)\}[\s\S]*?\\end\{\1\}/g,
        m=>"\n$$"+m+"$$\n");
      t=t.replace(/(다\.|요\.|\.\))(?=\s*[^\s\n])/g,"$1\n");
      return t;
    }).join("");
    /* 미러 해설에 `$A$$B$`처럼 인라인 수식 두 개가 공백 없이 붙은 자료가 많다.
       KaTeX auto-render가 경계의 `$$`를 display 구분자로 오인하면 뒤의 한글까지 수식에
       들어가 `\\text{...}` 원문이 노출된다. splitMath가 이미 두 인라인 토큰으로 확정한
       경우에만 한 수식으로 합친다. `$A$이다.$$B$$` 같은 실제 display 경계는 건드리지 않는다. */
    /* (2026-08-23 클로드 최적화) 종전에는 인접 인라인을 전부 `\;`로 한 수식에 합쳐
       완결 등식 사슬(…=25\;a₁=S₁=1\;∴…)을 만들었다 — 최다 반려 카테고리 "다중 등식 직접
       접착"의 표시측 직접 원인. fixSegs의 mergeAdjacentMath와 같은 분류로 바꾼다:
       관계연산자 시작만 같은 등식으로 병합, 완결 등식·∴ 경계는 줄바꿈, 그 외는 공백.
       사이에 텍스트가 생기므로 KaTeX가 경계 `$$`를 display로 오인하는 원래 문제도 그대로 예방된다. */
    const merged=[];
    for(const k of splitMath(normalized)){
      const prev=merged[merged.length-1];
      if(k.t==null&&k.m==="i"&&prev&&prev.t==null&&prev.m==="i"){
        if(ADJ_REL.test(k.b)&&!ADJ_NEWSTMT.test(k.b)){ prev.b += " "+k.b; continue; }
        if(hasRelation(prev.b)&&(hasRelation(k.b)||ADJ_NEWSTMT.test(k.b))){ merged.push({t:"\n"},k); continue; }
        merged.push({t:" "},k); continue;
      }
      merged.push(k);
    }
    return merged.map(k=>k.t!=null?k.t:k.o+k.b+k.c).join("");
  }
  /* (2026-08-09 재웅 "정답 양식 통일") 해설 머리의 "[정답] …" 를 떼어 표준 정답 배지로.
     실측 형식이 중구난방이다: "[정답] ④함수…"(원문자+본문 밀착) · "[정답] k = 4\n주어진…"(주관식 수식+줄바꿈)
     · "[정답] $5$" · "[정답] ①직선…" — ① 원문자/숫자 한 토큰 우선, ② 아니면 첫 줄에서
     수식 밖 첫 한글 직전까지를 정답으로 본다(80자 초과면 오탐 위험이라 손대지 않음). DB 원본 불변. */
  function splitAnswerHead(t){
    const s=String(t||"");
    /* $ 로 감싼 꼴($5$)과 맨몸 꼴(⑤·5)을 분리 — 종전 (?:\s*\$)? 꼬리가
       "[정답] ⑤$A=…" 에서 다음 수식의 여는 $ 를 삼켜 짝이 밀렸다(검수 e75187·e79402). */
    let m=s.match(/^\s*\[\s*정\s*답\s*\]\s*\$\s*([①-⑳]|-?\d{1,5}(?:\.\d+)?)\s*\$/)
        ||s.match(/^\s*\[\s*정\s*답\s*\]\s*([①-⑳]|-?\d{1,5}(?:\.\d+)?)(?![\d.])/);
    if(m) return {ans:m[1], rest:s.slice(m[0].length).replace(/^[\s.]*(?=\S)/,"")};
    m=s.match(/^\s*\[\s*정\s*답\s*\]([^\r\n]*)/);
    if(m){
      const av=m[1];
      let inM=false,cut=av.length;
      for(let j=0;j<av.length;j++){const ch=av[j];if(ch==="$"){inM=!inM;continue;}
        if(!inM&&/[가-힣]/.test(ch)){cut=j;break;}}
      const head=av.slice(0,cut).trim();
      if(head&&head.length<=80)
        return {ans:head, rest:(av.slice(cut)+s.slice(m.index+m[0].length)).replace(/^\n/,"")};
    }
    return {ans:null, rest:s};
  }
  function ansHead(a){
    /* (2026-08-24 최적화 세션) DB answer 필드에 HTML 엔티티가 문자열로 저장된 적재분 344건
       (&lt;·&gt;·&amp;, #6203·#6585·#6538 실측 — KaTeX가 &를 정렬문자로 오해석해 파싱 실패).
       표시 단계에서만 한 단계 디코드한다. DB 원문은 변경하지 않는다. */
    a=String(a).replace(/&(?:amp;)+(lt|gt|amp|quot|nbsp|#\d+);/gi,"&$1;")
               .replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#60;/g,"<").replace(/&#62;/g,">")
               .replace(/&nbsp;/gi," ").replace(/&quot;/gi,'"').replace(/&amp;/gi,"&")
               /* (2026-08-24 최적화 14회차) 정답 배지의 딩뱃 원문자(➀➊계열)도 표준 원문자로 — 문현고 [정답] ➃ 실측 */
               .replace(/[➀-➉]/g,function(c){return String.fromCharCode(0x2460+c.charCodeAt(0)-0x2780);})
               .replace(/[➊-➓]/g,function(c){return String.fromCharCode(0x2460+c.charCodeAt(0)-0x278A);})
               /* (2026-08-24 최적화 15회차) T3 재추출이 '[풀이참조]' 머리에서 잘라 남긴 꼬리 고아 대괄호
                  (#6968 `$-5<x<2$ [` 실측, 전수 36건) — 표시에서만 제거 */
               .replace(/\s*\[\s*$/,"");
    let v;
    if(/^[①-⑳]$/.test(a)||/[가-힣]/.test(a)) v=esc(a);
    else{ let x=String(a); if(!/\$/.test(x)) x="$"+x+"$"; v=fixSegs(esc(x)); }
    return '<div class="solans"><span class="solansl">정답</span><span class="solansv">'+v+'</span></div>';
  }
  /* (2026-08-12 유형ON #21604) 교사용 PDF의 작은 글씨를 전부 해설로 취급한 구 적재분 방어.
     그래프 축/점 라벨이 해설 머리에 들어오며 `yy`, `A/B/O/x`, 세로 `평\n면\n좌\n표`가 노출됐고,
     검은 하단 쪽번호도 마지막 수식처럼 저장됐다. 새 추출기는 청색 레이어만 받지만 기존 DB와
     캐시도 즉시 정상 표시하도록, 근거가 겹치는 경우에만 머리 그림라벨/고아 쪽번호를 숨긴다. */
  function solutionOcrJunk(t, ans){
    /* 세로로 조판된 단원 띠가 줄 사이에 끼어든 경우. 글자 사이에 실제 공백/개행이
       있는 형식만 제거하므로 정상 문장 속 `직선의 방정식`은 보존한다. */
    const source=String(t||"").replace(/(?:직\s+선\s+의|원\s+의)\s+방\s+정\s+식/g,"")
      .replace(/방\s+정\s+식/g,"").replace(/평\s+면\s+좌\s+표/g,"");
    const lines=source.replace(/\r/g,"").split("\n");
    const key=v=>String(v==null?"":v).replace(/\$|\\(?:left|right)|[{}\s]/g,"")
                                          .replace(/\\(?:,|;|:|!)/g,"");
    let prose=lines.findIndex(line=>{
      const ko=(line.match(/[가-힣]/g)||[]).length;
      return ko>=4 && !/^\s*(?:[가-힣]\s*){1,4}$/.test(line);
    });
    if(prose>0){
      const head=lines.slice(0,prose);
      const singles=head.filter(line=>/^\s*[가-힣]\s*$/.test(line)).length;
      const labels=head.filter(line=>/^\s*\$?\s*(?:y\s*y(?:\s*=.*)?|[0-9]*\s*[A-Z](?:\s*[A-Zx])?|O\s*x)\s*\$?\s*[가-힣]?\s*$/.test(line)).length;
      const hasAnswer=ans!=null && head.some(line=>key(line)===key(ans));
      if((singles>=2 || labels>=2) && (hasAnswer || singles>=3)) lines.splice(0,prose);
    }
    while(lines.length && !lines[lines.length-1].trim()) lines.pop();
    if(lines.length && /^\s*\$?\s*\d{1,3}\s*\$?\s*$/.test(lines[lines.length-1])){
      const tail=key(lines[lines.length-1]);
      if(ans!=null && tail!==key(ans)) lines.pop();
    }
    return lines.join("\n");
  }
  function solText(t, figs, ans){
    /* (2026-08-09 재웅 신고 "a6b50 저거 뭐야") 적재기가 미러 해설 머리에 남긴 잔재 토큰 —
       실측 6,226건이 전부 "a6b50 [정답] …" 로 시작(변형 없음). [정답] 파싱까지 막으므로 먼저 걷어낸다. */
    t=mirrorLegacyRepair(typeonLegacyDisplayRepair(solutionExactSourceRecovery(t))).replace(/(?<![0-9A-Za-z])a6b50(?![0-9A-Za-z])\s*/g,"");
    /* (2026-08-26 통합검수 #13594) `\therefore\$ 미주는`처럼 결론 기호 뒤 닫는 `$`만
       역슬래시가 잘못 붙은 구 적재분. 일반 `\$`는 금액 리터럴일 수 있으므로, 해설에서
       therefore 명령 직후이면서 한글 문장이 이어지는 경우에만 닫는 구분자로 복구한다. */
    t=String(t||"").replace(/(\\therefore(?:\\[,;:!])?)\\\$(?=\s*[가-힣])/g,"$1$");
    t=solutionOcrJunk(t, ans);
    const sp=splitAnswerHead(t);
    /* 내신 서술형 복합문항에는 `[정답] (1) ... (2) ...`처럼 실제 정답 한 줄이 아니라
       하위 문항별 풀이 전체가 들어온 구 적재분이 있다. `(1)`을 정답 배지로 떼면 사용자는
       이를 최종 정답으로 오해하고 첫 풀이 단계도 사라진다. 뒤에 다음 하위 번호가 확인될
       때만 복합 풀이로 판정해 `(1)`을 본문으로 되돌린다. DB 원문은 변경하지 않는다. */
    if(sp.ans!=null && /^\(\s*1\s*\)$/.test(String(sp.ans)) && /\(\s*[2-9]\d*\s*\)/.test(sp.rest||"")){
      sp.rest=String(sp.ans)+(sp.rest?" "+sp.rest:"");
      sp.ans=null;
    }
    const answer = sp.ans!=null ? sp.ans
                 : (ans!=null&&String(ans).trim()!=="" ? String(ans).trim() : null);
    let s=commonGlyphs(esc(sp.rest||"").replace(WON,"\\").replace(NGD,"").replace(NGD_PLAIN,""));
    /* 출판사 미주 해설의 [풀이]·STEP A/B/C를 읽기 구조로 승격한다. 원문 순서는 보존한다. */
    s=s.replace(/^\s*\[\s*풀이\s*\]\s*/,"<div class=\"sollead\">풀이</div>\n")
       .replace(/^STEP\s+([A-Z])\s*(.*)$/gm,"<div class=\"solstep\"><span>STEP $1</span><div>$2</div></div>");
    s=stripHwpDump(s);
    /* 조판은 [정답] 머리표를 먼저 분리한 해설을 넘길 수 있다. 그 뒤 `수식입니다.`·
       20011 덤프를 걷으면 선두에 빈 줄만 남아 <br><br> 두 줄 여백이 생긴다.
       풀이 내부 문단 간격은 보존하고, 실제 내용보다 앞선 빈 줄만 제거한다. */
    s=s.replace(/^(?:[ \t]*\n)+/,"");
    s=aiSolNormalize(s);
    s=solutionCaseBreak(solutionLetterChoiceBreak(solutionProofBreak(solutionConclusionBreak(solutionBreakResidue(outsideClean(s))))))
       .replace(/이다(?=따라서)/g,"이다.\n");
    /* 출판 해설은 수식 끝의 증명 번호와 다음 경우/종합 결론 사이 개행을 잃고
       `…㉠(ⅱ)`, `…㉢㉠, ㉡, ㉢에서`처럼 저장되기도 한다. 앞쪽도 증명 번호이고
       뒤쪽도 다음 로마자 경우 또는 ㉠부터 시작하는 종합 참조일 때만 줄을 나눈다.
       따라서 문제 본문의 `㉠, ㉡, ㉢에 알맞은…` 같은 일반 열거는 대상이 아니다. */
    s=s.replace(/([㉠-㉥])(?=[ \t]*\([ⅰ-ⅹ]+\))/g,"$1\n")
       .replace(/([㉠-㉥])(?=[ \t]*㉠\s*[,，·]\s*㉡(?:\s*[,，·]\s*㉢)?\s*(?:에서|로부터|에\s*(?:의하여|의해)))/g,"$1\n");
    /* 보기별 풀이를 한 문단으로 저장한 자료는 앞 보기의 판정과 다음 머리표가
       `(X)ㄴ.`처럼 붙는다. 수식 밖에서 판정기호 뒤에 ㄱ~ㅎ+마침표가 확인될 때만
       경계를 복원한다. `(O)따라서` 같은 최종 결론과 수식 괄호는 바꾸지 않는다. */
    s=splitMath(s).map(k=>k.t==null?k.o+k.b+k.c:k.t.replace(/([（(]\s*(?:O|X|○|×)\s*[)）])(?=[ \t]*[ㄱ-ㅎ]\s*[.．])/g,"$1\n")).join("");
    /* 선지마다 참/거짓을 판정한 해설에서 구분 공백·개행이 유실된 `참③` 경계.
       수식 밖의 완전한 판정어 뒤에 다음 원문자 선지가 붙을 때만 분리한다. */
    s=splitMath(s).map(k=>k.t==null?k.o+k.b+k.c:k.t.replace(/(참|거짓)(?=[ \t]*[①-⑳])/g,"$1\n")).join("");
    /* 경우 표지(ⅰ), ⅱ), …)가 앞 문장·단위에 붙은 `9개ⅰ)`만 분리한다.
       수식 토큰 안의 로마자는 건드리지 않아 첨자·기호 오인 가능성을 차단한다. */
    s=splitMath(s).map(k=>k.t==null?k.o+k.b+k.c:k.t.replace(/([^\n(])(?=[ \t]*[ⅰ-ⅹ]\))/g,"$1\n")).join("");
    /* 일부 적재 해설은 Markdown 굵게 표기(**…**)를 보존한다. esc() 이후의 평문에서만,
       앞 문자가 식별자가 아닌 완결 표기만 허용해 x**2 같은 수식·연산 표기는 건드리지 않는다. */
    s=s.replace(/(?<![0-9A-Za-z가-힣])\*\*([^*\n]{1,200})\*\*/g,(all,body)=>
      /[0-9A-Za-z가-힣]/.test(body)?"<strong>"+body+"</strong>":all);
    let body=variationTables(linesToHtml(fixSegsK(s)));
    /* 파서 마커를 제거한 자리에 남은 연속 빈 행은 풀이 단계가 아니다.
       해설은 본문 행간이 이미 넓으므로 연속 <br>을 하나로 정규화한다. */
    body=body.replace(/(?:<br>\s*){2,}/g,"<br>").replace(/^\s*<br>|<br>\s*$/g,"");
    const out=solutionFigures(withSolFigures(body, figs));   // 선지 격자 없음
    return (answer!=null?ansHead(answer):"")+out;
  }
  /* 평문(raw_text 계열) 표시 보정 — (v1.2) 구조 HTML 경로와 동일 규칙(분수·lim·조건 박스·선지) 적용.
     figs = 따로 오는 그림 URL 배열(미러 image_urls). 없으면 종전과 동일. */
  /* (2026-08-15 재웅 신고 "수식이 왕창 깨져") bank_pick_random 은 원본·기출(items)에는 body_html
     (구조 HTML: hp/heq/hscore…)을 그대로 body 로 싣는다. 이것이 평문 경로로 들어오면 esc() 가
     태그를 이스케이프해 <p class="hp">… 가 문자 그대로 찍힌다(내신기출 랜덤 카드 #13208 실측).
     입력이 구조 HTML 로 판별되면 저장 HTML 경로(fix→조건박스→선지)로 위임한다 — 규칙 단일 출처 유지. */
  const STRUCT_HTML=/<(?:p|span|div|table|img)\b[^>]*class="h(?:p|eq|score|box|fig|tbl|choice)/;
  function looksStructHtml(t){ return STRUCT_HTML.test(String(t||"")); }
  function mathText(t, figs){
    /* (2026-08-24 최적화 25회차) 본문 선두의 고아 `$$` 줄(#8251 실측, 전수 1건) — 이후 전체가
       미완결 display 수식으로 묶여 원문 그대로 노출된다. 내용 없는 선두 $$ 줄만 걷는다. */
    t=String(t||"").replace(/^\s*\$\$[ \t]*\n/,"");
    if(looksStructHtml(t)) return problemFigures(withFigures(choices(condBoxHtml(fix(t))), figs));
    /* (2026-08-23 클로드 최적화 2차) 문제 본문에도 '수식입니다.' 덤프가 실존 — 해설과 동일 정리 */
    let s=fixSegsK(stripHwpDump(commonGlyphs(esc(mirrorLegacyRepair(typeonLegacyDisplayRepair(t||""))).replace(WON,"\\").replace(NGD,"").replace(NGD_PLAIN,""))));
    return problemFigures(withFigures(choices(linesToHtml(s)), figs));
  }
  /* 선지 ①~⑤ 균등 배치(원문자 3종↑, 구조HTML 자체 선지·해설 프로즈 보호)
     (v1.3) 선지가 두 문단에 걸쳐 저장된 학평 본문(`<p>①②③</p><p>④⑤</p>`, 실측 #8349)에서
     문단 태그가 .nchoice 안에 섞여 들어가 브라우저가 태그를 재봉합 → 넷째·다섯째 선지가
     오른쪽으로 밀려 찍히던 문제. 선지 조각에서 블록 태그(<p>·<br>)와 조판 공백을 걷어낸다. */
  const CH_CLEAN = p => p.replace(/<\/?p\b[^>]*>/gi," ").replace(/<br\s*\/?>/gi," ")
                         .replace(/&emsp;|&ensp;|&nbsp;/gi," ").replace(/\s+/g," ").trim();
  /* HML 원문은 탭 사이에도 ②·③·⑤가 있지만 일부 공식시험 적재본은 탭 정리 때
     머리표만 빠졌다. 일반 수식 나열을 선지로 오인하지 않도록 문항 맨 끝에 수식값이
     정확히 3개+2개이고 남은 머리표가 ①·④뿐인 형식만 복원한다(2027 6월 실측 3건). */
  function restoreTabbedFiveChoices(html){
    if(/[②③⑤]/.test(html)||!/[①④]/.test(html))return html;
    const tex='(\\$(?!\\$)(?:\\\\.|[^$])*?\\$)';
    const rx=new RegExp('(①\\s*)'+tex+'\\s*'+tex+'\\s*'+tex+'\\s*(?:<br\\s*\\/?>)\\s*(④\\s*)'+tex+'\\s*'+tex+'\\s*$','s');
    return String(html||'').replace(rx,(_all,one,a,b,c,four,d,e)=>`${one}${a} ② ${b} ③ ${c}<br>${four}${d} ⑤ ${e}`);
  }
  function choiceGrid(html){
    html=restoreTabbedFiveChoices(String(html||''));
    /* 구조 HTML은 이미 .hchoices>.hch라는 정본 선지 구조를 가진다. .nchoices만
       보호하면 hchoices 내부의 ①~⑤를 다시 nchoices로 감싸 invalid span>div가 되고,
       브라우저 재봉합 뒤 빈 hch와 폭 28px짜리 세로 선지가 생긴다(items #20739). */
    if(/class=["'][^"']*(?:nchoices|hchoices)/.test(html))return html;
    const found=[...new Set(html.match(/[①②③④⑤]/g)||[])];
    if(found.length<3) return html;
    const first=html.indexOf('①'); if(first<0) return html;
    const parts=html.slice(first).split(/(?=[②③④⑤])/);
    /* (v1.2) 선지 블록 앞의 잉여 <br>·빈 여는 문단 제거 — 선지 위에 빈 줄이 하나 더 생기던 문제 */
    const head=html.slice(0,first).replace(/(?:<br\s*\/?>\s*)+$/i,"").replace(/(?:<p\b[^>]*>\s*)+$/i,"");
    return head+'<div class="nchoices">'+parts.map(p=>
      '<span class="nchoice">'+CH_CLEAN(p).replace(/^([①②③④⑤])\s*/,'<span class="ncnum">$1</span> ')+'</span>')
      .join('')+'</div>';
  }
  /* HWP가 선지와 그림을 한 표에 좌우 배치한 경우 표를 그대로 두면 선지는 한 열,
     그림은 오른쪽 셀에 남는다. 그림형 선지는 보존하고 일반 선지 표만 그림과 분리한다. */
  function normalizeChoiceTables(html){
    const box=document.createElement("div");box.innerHTML=String(html||"");
    box.querySelectorAll("table.hchoice,table.hchoicegrid").forEach(table=>{
      const marks=[...new Set((table.textContent||"").match(/[①②③④⑤]/g)||[])];if(marks.length<3)return;
      const cells=[...table.querySelectorAll("td")],figCells=cells.filter(td=>td.querySelector(".hfigwrap,.hfigs,.nvfig,figure,img,svg"));
      const graphical=figCells.length>=3&&figCells.every(td=>/[①②③④⑤]/.test(td.textContent||""));if(graphical)return;
      const media=[];
      table.querySelectorAll(".hfigwrap,.hfigs,.nvfig,figure,img,svg").forEach(n=>{
        const c=n.closest(".hfigwrap")||n.closest(".hfigs")||n.closest(".nvfig")||n.closest("figure")||n;
        if(media.some(x=>x===c||x.contains(c))||c.closest(".hbox"))return;media.push(c);
      });
      const clone=table.cloneNode(true);clone.querySelectorAll(".hfigwrap,.hfigs,.nvfig,figure,img,svg").forEach(n=>n.remove());
      const raw=[...clone.querySelectorAll("td")].map(td=>td.innerHTML).join(" ");
      const tmp=document.createElement("div");tmp.innerHTML=choiceGrid(raw);
      const grid=tmp.querySelector(".nchoices");if(!grid)return;
      const frag=document.createDocumentFragment();media.forEach(n=>frag.appendChild(n));frag.appendChild(grid);table.replaceWith(frag);
    });
    return box.innerHTML;
  }
  function choices(html){return choiceGrid(normalizeChoiceTables(html));}
  /* 렌더 후 선지 폭 실측 → 표준 5지선다는 5개 한 줄 → 3+2 → 1개씩만 허용한다.
     최대 선지폭×열수로 어림잡지 않고 실제 열 트랙 폭을 합산한다. 짧은 분수 선지 다섯 개가
     불필요하게 세로로 떨어지는 일을 막고, 긴 선지는 겹치기 전에 3+2 또는 1열로 내린다. */
  const CH_GAP = 14;
  function layoutChoices(el){
    el.querySelectorAll(".nchoices,.hchoices").forEach(c=>{
      const kids=[...c.children]; if(!kids.length) return;
      c.classList.remove("c5","c4","c3","c2","c1","vert");
      /* 자연폭 실측: 잠깐 블록+인라인블록으로 되돌려 각 선지의 내용 폭을 잰다 */
      const cd=c.style.display; c.style.display="block";
      const W=c.clientWidth||el.clientWidth||520;
      const wid=kids.map(k=>{const d=k.style.display;k.style.display="inline-block";
                             const w=k.offsetWidth;k.style.display=d;return w;});
      c.style.display=cd;
      let n=1;
      if(kids.length===5){
        const five=wid.reduce((a,b)=>a+b,0)+CH_GAP*4;
        const three=Math.max(wid[0],wid[3])+Math.max(wid[1],wid[4])+wid[2]+CH_GAP*2;
        n=five<=W+1?5:(three<=W+1?3:1);
      }else{
        const oneRow=wid.reduce((a,b)=>a+b,0)+CH_GAP*Math.max(0,kids.length-1);
        n=oneRow<=W+1?Math.min(5,kids.length):1;
      }
      c.classList.add("c"+n);
    });
  }
  /* (v1.3 재웅) "위아래로 긴 수식이 들어오면 행간을 좀 넓혀서 답답함 해소"
     분수·분수의 거듭제곱처럼 세로로 큰 인라인 수식은 줄상자를 꽉 채워 위아래 줄과 맞닿는다.
     실측 높이가 글자크기의 1.75배를 넘으면 그 수식(.base 인라인블록)에만 상하 여백을 준다.
     — 문단 전체 line-height 를 올리면 짧은 줄까지 늘어져서, 해당 수식에만 준다. */
  function layoutLead(el){
    el.querySelectorAll(".katex").forEach(k=>{
      if(k.parentElement && k.parentElement.classList.contains("katex-display")) return;
      const h=k.getBoundingClientRect().height; if(!h) return;
      const fs=parseFloat(getComputedStyle(k).fontSize)||15;
      if(h<=fs*1.75) return;
      const pad=Math.min(Math.round((h-fs*1.75)*0.34)+2, 14);
      k.querySelectorAll(":scope > .base").forEach(b=>{
        b.style.marginTop=pad+"px"; b.style.marginBottom=pad+"px"; });
      k.classList.add("ktall");
    });
  }
  /* v2.6 모든 수직 중괄호 공통 보정 — 종전에는 cases 의 큰 왼쪽 중괄호만 얇고 길게 했다.
     집합·조건제시법·연립조건의 \{, \left\{, \bigl\{ 등도 같은 시각 규격을 써야 한다.
     KaTeX 시각 트리에서 내용이 오직 중괄호 글리프/조립조각인 mopen·mclose만 표시하므로
     LaTeX 그룹용 { }·괄호·절댓값·가로 underbrace/overbrace에는 영향을 주지 않는다. */
  const VBRACE=/^[{}⎧⎨⎩⎫⎬⎭]+$/;
  function markVerticalBraces(k){
    const mark=(d)=>{
      const glyph=String(d.textContent||"").replace(/\s+/g,"");
      if(!glyph||!VBRACE.test(glyph)) return false;
      d.classList.add("kvbrace");
      d.classList.add(/[}⎫⎬⎭]/.test(glyph)?"kvbrace-r":"kvbrace-l");
      return true;
    };
    k.querySelectorAll(".mopen,.mclose").forEach(mark);
    /* \big\{처럼 delimiter wrapper가 mopen/mclose 밖에 놓이는 형태까지 포함한다. */
    k.querySelectorAll(".delimsizing").forEach(d=>{
      if(!d.closest(".kvbrace")) mark(d);
    });
  }
  /* Piecewise functions additionally receive row spacing. */
  function layoutMathDetails(el){
    el.querySelectorAll(".katex").forEach(k=>{
      const ann=k.querySelector('annotation[encoding="application/x-tex"]');
      const tex=ann ? String(ann.textContent||"") : "";
      markVerticalBraces(k);
      if(/\\begin\s*\{cases\}/.test(tex)){
        k.classList.add("kcases");
        k.querySelectorAll(".kvbrace-l").forEach(d=>d.classList.add("kcasebrace"));
        k.querySelectorAll(".mtable>.col-align-l>.vlist-t>.vlist-r>.vlist").forEach(v=>{
          const rows=[...v.children].filter(r=>/top\s*:/.test(r.getAttribute("style")||""));
          const n=rows.length;
          rows.forEach((r,i)=>{
            r.classList.add("kcaserow");
            const shift=n>1 ? ((i/(n-1))-.5)*.30 : 0;
            r.style.setProperty("--kcase-row-shift",shift.toFixed(3)+"em");
          });
        });
      }
      k.querySelectorAll(".mbin").forEach(op=>{
        if(String(op.textContent||"").trim()==="∘") op.classList.add("kcompose");
      });
    });
  }
  /* Print-preview math must describe the paper itself. A horizontal scrollbar is
     never printable, so display equations in inherited(print) mode are reduced
     only when their natural width exceeds the available column width. */
  function fitPrintDisplayMath(el){
    el.querySelectorAll(".ngd2-inherit .katex-display, .ngd2-body.ngd2-inherit.katex-display").forEach(d=>{
      d.style.overflow="visible";
      d.style.overflowX="visible";
      d.style.overflowY="visible";
      const k=d.querySelector(":scope > .katex")||d.querySelector(".katex");
      if(!k)return;
      k.style.fontSize="";
      const html=k.querySelector(".katex-html")||k;
      const cs=getComputedStyle(d);
      const ecs=getComputedStyle(el);
      const rootWidth=Math.max(0,el.clientWidth-parseFloat(ecs.paddingLeft||0)-parseFloat(ecs.paddingRight||0)-2);
      const available=Math.min(rootWidth||Infinity,Math.max(0,d.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0)-2));
      const natural=Math.max(html.scrollWidth,html.getBoundingClientRect().width);
      if(!available||!natural||natural<=available+1)return;
      const parentSize=parseFloat(getComputedStyle(d).fontSize)||16;
      const currentSize=parseFloat(getComputedStyle(k).fontSize)||parentSize;
      const currentEm=currentSize/parentSize;
      const fitted=Math.max(.20,currentEm*(available/natural)*.985);
      k.style.fontSize=fitted.toFixed(4)+"em";
    });
  }
  /* 해설의 긴 인라인 행렬·등식도 인쇄 단 밖으로 침범하지 않게 한다.
     일반 인라인 수식은 건드리지 않고, 단 폭을 실제로 넘는 한 수식만 최소 46%까지
     축소한다. PDF에서 스크롤바나 옆 단 침범은 인쇄될 수 없다. */
  function fitPrintInlineMath(el){
    el.querySelectorAll(".ngd2-inherit .katex:not(.katex-display .katex)").forEach(k=>{
      if(k.parentElement&&k.parentElement.closest(".katex"))return;
      k.style.fontSize="";
      k.style.display="";
      const cs=getComputedStyle(el);
      const available=Math.max(0,el.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0)-2);
      const natural=k.getBoundingClientRect().width;
      if(!available||!natural||natural<=available+1)return;
      const parentSize=parseFloat(getComputedStyle(k.parentElement||el).fontSize)||16;
      const currentSize=parseFloat(getComputedStyle(k).fontSize)||parentSize;
      const fitted=Math.max(.20,(currentSize/parentSize)*(available/natural)*.985);
      k.style.display="inline-block";
      k.style.fontSize=fitted.toFixed(4)+"em";
      k.style.maxWidth="100%";
    });
  }
  /* 통합 렌더: KaTeX 4구분자 + 선지 레이아웃 + 긴 수식 행간 */
  /* Keep the bitmap and HWP overlay labels on the same coordinate plane. */
  const _figObservers=new WeakMap();
  function layoutFigures(el){
    const ratioOf=n=>{
      const im=n.matches&&n.matches("img")?n:n.querySelector&&n.querySelector("img");
      if(im&&im.naturalWidth&&im.naturalHeight)return im.naturalWidth/im.naturalHeight;
      const sv=n.matches&&n.matches("svg")?n:n.querySelector&&n.querySelector("svg");
      if(sv){const vb=(sv.getAttribute("viewBox")||"").trim().split(/[ ,]+/).map(Number);if(vb.length===4&&vb[2]&&vb[3])return vb[2]/vb[3];
        const w=parseFloat(sv.getAttribute("width")),h=parseFloat(sv.getAttribute("height"));if(w&&h)return w/h;}
      return 1.25;
    };
    const classify=n=>{
      n.classList.remove("ngd2-fig-wide","ngd2-fig-standard","ngd2-fig-tall");
      const r=ratioOf(n);n.classList.add(r>=1.65?"ngd2-fig-wide":r<=.82?"ngd2-fig-tall":"ngd2-fig-standard");
      const im=n.matches("img")?n:n.querySelector("img");
      if(im&&!im.complete&&!im.dataset.ngd2SizeWatch){im.dataset.ngd2SizeWatch="1";im.addEventListener("load",()=>classify(n),{once:true});}
    };
    el.querySelectorAll(".ngd2-figure-zone").forEach(z=>[...z.children].filter(n=>!n.classList.contains("hfigslot")).forEach(classify));
    el.querySelectorAll(".hfigwrap").forEach(w=>{
      const place=()=>{
        if(!w.dataset.ngd2BaseWidth){
          const declared=parseFloat(w.style.width);if(declared>0)w.dataset.ngd2BaseWidth=String(declared);
        }
        const baseWidth=parseFloat(w.dataset.ngd2BaseWidth)||w.getBoundingClientRect().width;
        const factor=Math.max(.4,Math.min(1,parseFloat(getComputedStyle(w).getPropertyValue("--qfig-factor"))||1));
        if(baseWidth>0)w.style.setProperty("width",`min(${(baseWidth*factor).toFixed(2)}px, 100%)`,"important");
        const wr=w.getBoundingClientRect();
        if(!wr.width||!wr.height) return;
        [...w.children].forEach(l=>{
          if(l.tagName!=="SPAN") return;
          l.classList.add("hfiglabel");
          l.style.removeProperty("--hfig-shift");
          /* 문자도 그림 본체와 같은 비율로 축소한다. 원문 좌표(-8~108%)는 의도된 축·점 라벨일 수
             있으므로 가장자리라는 이유로 안쪽으로 밀지 않는다. 완전히 이탈한 경우만 숨긴다. */
          const labelScale=Math.max(.4,Math.min(1,wr.width/baseWidth));
          l.style.setProperty("--hfig-label-scale",labelScale.toFixed(4));
          const left=parseFloat(l.style.left),top=parseFloat(l.style.top);
          l.classList.toggle("hfiglabel-invalid",Number.isFinite(left)&&Number.isFinite(top)&&(left < -15||left > 115||top < -15||top > 115));
        });
      };
      place();
      if(typeof ResizeObserver!=="undefined"&&!_figObservers.has(w)){
        const ro=new ResizeObserver(place); ro.observe(w); _figObservers.set(w,ro);
      }
    });
  }
  function layoutInlineFractions(el){
    if(!el||!el.querySelectorAll)return;
    el.querySelectorAll('.ngd2-inline-frac').forEach(k=>k.classList.remove('ngd2-inline-frac'));
    el.querySelectorAll('.ngd2-tall-inline').forEach(k=>k.classList.remove('ngd2-tall-inline'));
    el.querySelectorAll('.ngd2-frac-line').forEach(line=>line.classList.remove('ngd2-frac-line'));
    el.querySelectorAll('.katex .mfrac').forEach(frac=>{
      const math=frac.closest('.katex');
      if(!math||math.closest('.katex-display'))return;
      math.classList.add('ngd2-inline-frac');
      const line=math.closest('.hp,.solstep>div,.cpb-worked-problem,.cpb-worked-steps>li,.cpb-worked-answer,.cpb-callout-body,.cpb-check-item,p,li,td');
      if(line&&el.contains(line))line.classList.add('ngd2-frac-line');
    });
    el.querySelectorAll('.katex').forEach(math=>{
      if(math.closest('.katex-display'))return;
      const size=parseFloat(getComputedStyle(math).fontSize)||16;
      const height=math.getBoundingClientRect().height;
      if(math.querySelector('.array,.mfrac')||height>size*1.65)math.classList.add('ngd2-tall-inline');
    });
  }
  const UNIT_REL=/^\s*(?:=|≠|≤|≥|≒|<|>|\\(?:le|ge|leq|geq|ne|neq|approx|equiv|sim|fallingdotseq)(?![A-Za-z]))/;
  const UNIT_REL_END=/(?:=|≠|≤|≥|≒|<|>|\\(?:le|ge|leq|geq|ne|neq|approx|equiv|sim|fallingdotseq))\s*$/;
  function rawHeqTex(n){
    return String(n&&n.textContent||"").trim()
      .replace(/^\\\(/,"").replace(/\\\)$/,"").replace(/^\$+|\$+$/g,"").trim();
  }
  function groupEquationUnits(el){
    if(!el||!el.querySelectorAll)return;
    [...el.querySelectorAll('.heq:not(.ngd2-unit-done)')].forEach(first=>{
      if(first.closest('.ngd2-math-unit'))return;
      let between=[],n=first.nextSibling;
      while(n&&n.nodeType===3&&!String(n.textContent||"").trim()){between.push(n);n=n.nextSibling;}
      if(!n||n.nodeType!==1||!n.classList.contains('heq'))return;
      /* 관계기호가 다음 조각의 시작뿐 아니라 앞 조각의 끝에 붙은 OCR도 한 식 단위로 묶는다.
         예: `BP =` + `3`이 카드 경계에서 갈라지는 것을 막는다. */
      if(!UNIT_REL.test(rawHeqTex(n))&&!UNIT_REL_END.test(rawHeqTex(first)))return;
      const unit=document.createElement('span'); unit.className='ngd2-math-unit';
      first.parentNode.insertBefore(unit,first); unit.appendChild(first);
      between.forEach(x=>unit.appendChild(x)); unit.appendChild(n);
      first.classList.add('ngd2-unit-done'); n.classList.add('ngd2-unit-done');
    });
  }
  function layoutEquationUnits(el){
    if(!el||!el.querySelectorAll)return;
    el.querySelectorAll('.ngd2-math-unit').forEach(unit=>{
      unit.classList.remove('ngd2-math-unit-long');
      if(unit.clientWidth&&unit.scrollWidth>unit.clientWidth+1)unit.classList.add('ngd2-math-unit-long');
    });
  }
  /* 원문 정규식이 아니라 사용자가 실제로 보는 최종 DOM을 검사한다. KaTeX는 닫히지
     않은 `$`를 .katex-error로 만들지 않고 평문으로 남기므로 별도 리터럴 검사가 필요하다.
     선택지 검사는 이미 선택지 구조가 존재하는 카드에만 적용해 서술형을 오탐하지 않는다. */
  function displayDiagnostics(el){
    const issues=[];
    const add=(code,detail)=>{if(!issues.some(x=>x.code===code&&x.detail===detail))issues.push({code,detail});};
    const choiceBoxes=[...el.querySelectorAll('.nchoices,.hchoices')];
    choiceBoxes.forEach((box,index)=>{
      const direct=[...box.children].filter(k=>k.matches('.nchoice,.hch'));
      const marks=direct.flatMap(k=>(k.textContent||'').match(/[①②③④⑤]/g)||[]);
      const unique=[...new Set(marks)];
      if(box.parentElement&&box.parentElement.matches('.nchoice,.hch'))
        add('choice_container_nested_in_choice',`선지 컨테이너 ${index+1}이 선지 안에 중첩됨`);
      const blank=direct.filter(k=>!(k.textContent||'').replace(/\s+/g,'').replace(/[①②③④⑤]/g,'')&&!k.querySelector('img,svg,math,.katex'));
      if(blank.length)add('empty_choice_nodes',`빈 선택지 ${blank.length}개`);
      if(unique.includes('①')&&unique.length>=3&&(!unique.includes('⑤')||unique.some((m,i)=>m!=='①②③④⑤'[i])))
        add('incomplete_choice_sequence',`선지 번호 ${unique.join('')||'없음'}`);
      if(unique.length>=5&&el.clientWidth>=300&&box.clientWidth>0&&box.clientWidth<Math.min(120,el.clientWidth*.25))
        add('collapsed_choice_container',`선지 폭 ${Math.round(box.clientWidth)}px / 카드 ${Math.round(el.clientWidth)}px`);
    });
    /* SHOW_TEXT=4. 일부 검수 DOM(linkedom·WebView)은 전역 NodeFilter를 노출하지 않는다. */
    const walker=document.createTreeWalker(el,4);
    const literal=[];let node;
    while((node=walker.nextNode())){
      const parent=node.parentElement;
      if(!parent||parent.closest('.katex,.katex-mathml,script,style,textarea,code,pre'))continue;
      const text=node.nodeValue||'';
      if(/\$|\\(?:int|frac|sqrt|left|right|displaystyle|sum|lim|overline|begin|end)\b/.test(text))literal.push(text.trim().slice(0,80));
    }
    if(literal.length)add('literal_math_residue',literal[0]||'원시 수식 구분자/명령 잔존');
    return issues;
  }
  function render(el){
    if(!el) return {errors:["missing_root"],katexErrorCount:0,displayIssues:[]};
    const errors=[];
    /* (2026-08-06 전수검수 #4664·#4669) 저장 원문에 src가 없는 장식용 img가 섞여
       브라우저의 깨진 이미지 아이콘으로 노출된다. 실제 이미지 URL이 있는 노드는 건드리지 않는다. */
    el.querySelectorAll('img:not([src]),img[src=""],img[src=" "]').forEach(img=>img.remove());
    groupEquationUnits(el);
    try{ renderMathInElement(el,{delimiters:[
      {left:"$$",right:"$$",display:true},{left:"\\[",right:"\\]",display:true},
      {left:"\\(",right:"\\)",display:false},{left:"$",right:"$",display:false}],
      throwOnError:false,strict:false,errorCallback:function(message){errors.push(String(message||"katex_error"));}}); }
    catch(e){errors.push(String(e&&e.message||e));}
    layoutInlineFractions(el);
    layoutEquationUnits(el);
    layoutLead(el);
    layoutChoices(el);
    layoutMathDetails(el);
    fitPrintDisplayMath(el);
    fitPrintInlineMath(el);
    layoutFigures(el);
    if(typeof requestAnimationFrame!=="undefined") requestAnimationFrame(()=>layoutFigures(el));
    const errorNodes=Array.from(el.querySelectorAll('.katex-error'));
    errorNodes.forEach(node=>{
      const detail=node.getAttribute('title')||node.textContent||'katex_error';
      if(!errors.includes(detail))errors.push(detail);
    });
    el.dataset.ngdKatexErrors=String(errorNodes.length);
    const displayIssues=displayDiagnostics(el);
    el.dataset.ngdDisplayIssueCount=String(displayIssues.length);
    el.dataset.ngdDisplayIssues=displayIssues.map(x=>x.code).join(',');
    return {errors:errors,katexErrorCount:errorNodes.length,displayIssues};
  }
  function html(bodyHtml){ return problemFigures(choices(condBoxHtml(fix(bodyHtml)))); }

  /* ── 표시 규격 CSS (단일 출처) ── */
  try{
    const st=document.createElement("style");
    st.textContent=`
.ngd2-body{--ngd2-problem-size:14.5px;--ngd2-problem-leading:1.9;--ngd2-choice-gap:14px;
  font-family:'Noto Serif KR','바탕',Batang,serif;font-size:var(--ngd2-problem-size);line-height:var(--ngd2-problem-leading);
  letter-spacing:-0.015em;word-spacing:0.02em;color:#141a28;word-break:keep-all;overflow-wrap:break-word}
/* (v1.4) 조판도구처럼 자체 시험지 타이포(용지·pt 설정)를 쓰는 화면용 옵트아웃.
   class="ngd2-body ngd2-inherit" 로 쓰면 구조 규격(선지·박스·그림·수식)만 받고 서체·크기는 그 화면 것을 따른다. */
.ngd2-body.ngd2-inherit{font-family:inherit;font-size:inherit;line-height:inherit;letter-spacing:inherit;word-spacing:inherit;color:inherit}
.ngd2-body .katex{white-space:normal;font-size:1.06em}
.ngd2-body .ngd2-math-unit{display:inline-block;white-space:nowrap;max-width:100%;vertical-align:baseline}
.ngd2-body .ngd2-math-unit .katex{white-space:nowrap}
.ngd2-body .ngd2-math-unit-long{display:block;overflow-x:auto;overflow-y:hidden;padding:2px 0;scrollbar-width:thin}
/* (v3.5) 인라인 분수는 글자 몸체보다 위아래가 크다. 분수가 있는 줄만 자동으로
   높여 다음 행과 분자·분모가 맞닿지 않게 한다. display 수식은 기존 문단 여백을 유지한다. */
.ngd2-body .katex.ngd2-inline-frac,.cpb-wrap .katex.ngd2-inline-frac{display:inline-block;white-space:nowrap!important;padding:.14em 0 .22em;vertical-align:-.06em}
.ngd2-body .katex.ngd2-tall-inline,.cpb-wrap .katex.ngd2-tall-inline{display:inline-block;white-space:nowrap!important;padding:.28em 0 .34em;vertical-align:middle}
.ngd2-body:not(.ngd2-inherit) .ngd2-frac-line{line-height:2.04!important}
.ngd2-body.ngd2-inherit .ngd2-frac-line{line-height:calc(var(--body-leading,1.9) + .12)!important}
.cpb-wrap .ngd2-frac-line{line-height:2.04!important}
.ngd2-inherit .cpb-wrap .ngd2-frac-line{line-height:calc(var(--body-leading,1.9) + .12)!important}
/* (v1.2 재웅) "지수가 좀 더 컸으면" — KaTeX 첨자 기본 0.70em(scriptstyle)/0.50em(scriptscriptstyle) 를 상향.
   수직 위치(top/pstrut)는 부모 크기 기준 em 이라 건드리지 않아도 그대로 유지된다.
   \sum·\int 의 위·아래 극한(.op-limits)에는 적용하지 않는다 — 거긴 이미 충분히 큼. */
.ngd2-body .katex .msupsub .reset-size6.size3{font-size:.79em}
.ngd2-body .katex .msupsub .reset-size6.size1{font-size:.58em}
.ngd2-body .katex-display{overflow-x:auto;overflow-y:hidden;max-width:100%;margin:6px 0;padding:2px 0}
.ngd2-body.ngd2-inherit .katex-display{overflow:visible!important;max-width:100%;scrollbar-width:none}
.ngd2-body.ngd2-inherit .katex-display::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
.ngd2-body .katex .kvbrace{display:inline-block;transform:scaleX(.72) scaleY(1.16);transform-origin:center center}
.ngd2-body .katex .kvbrace-l{margin-left:-.04em;margin-right:-.08em}
.ngd2-body .katex .kvbrace-r{margin-left:-.08em;margin-right:-.04em}
.ngd2-body .katex.kcases{display:inline-block;padding:.12em 0}
.ngd2-body .katex.kcases .kcasebrace{transform:scaleX(.68) scaleY(1.20)}
.ngd2-body .katex.kcases .kcaserow{transform:translateY(var(--kcase-row-shift,0));transform-origin:center}
.ngd2-body .katex .kcompose{display:inline-block;font-size:.70em;position:relative;top:-.03em}
.ngd2-body img{max-width:100%}
.ngd2-body:not(.ngd2-inherit) .hp{margin:4px 0;line-height:1.85}
.ngd2-body:not(.ngd2-inherit) .hp.htall{line-height:2.5;margin:7px 0}
/* 해설은 풀이 단계 사이를 문제 본문보다 넉넉히 띄운다. 조판 상속 모드는 별도 종이 규격을 유지한다. */
.pksol.ngd2-body:not(.ngd2-inherit) .hp,
.detailsolution.ngd2-body:not(.ngd2-inherit) .hp,
.sol.ngd2-body:not(.ngd2-inherit) .hp,
.qi .sol.ngd2-body:not(.ngd2-inherit) .hp{margin:6px 0;line-height:2.05}
.pksol.ngd2-body:not(.ngd2-inherit) .hp.htall,
.detailsolution.ngd2-body:not(.ngd2-inherit) .hp.htall,
.sol.ngd2-body:not(.ngd2-inherit) .hp.htall,
.qi .sol.ngd2-body:not(.ngd2-inherit) .hp.htall{margin:9px 0;line-height:2.65}
.pksol.ngd2-body:not(.ngd2-inherit) .katex-display,
.detailsolution.ngd2-body:not(.ngd2-inherit) .katex-display,
.sol.ngd2-body:not(.ngd2-inherit) .katex-display{margin:.55em 0 .7em}
.ngd2-body .hdisp{display:block;margin:.35em 0 .35em 1.4em}
/* 해설의 HWP 증감표 복원. 칸 넓이를 같게 나누고 기준값·부호·함수값을
   행으로 묶어 세로 텍스트 나열로 붕괴하지 않게 한다. */
.ngd2-body .ngd2-variation-table{width:100%;max-width:34em;margin:.65em auto;border-collapse:collapse;table-layout:fixed;font-size:.96em;line-height:1.55}
.ngd2-body .ngd2-variation-table th,.ngd2-body .ngd2-variation-table td{border:1px solid #8f99a8;padding:.42em .34em;text-align:center;vertical-align:middle;white-space:nowrap}
.ngd2-body .ngd2-variation-table th{width:4.5em;background:#f4f6f9;font-weight:700;color:#243451}
.ngd2-body .ngd2-variation-table .katex{white-space:nowrap}
.ngd2-body .hflow{display:block}
.ngd2-body .htbl{border-collapse:collapse;margin:8px auto;font-size:.95em}
.ngd2-body .htbl td{border:1px solid #333;padding:4px 10px;text-align:center}
.ngd2-body .hchoice{border-collapse:collapse;margin:6px 0;width:100%}
.ngd2-body .hchoice td{border:none;padding:2px 8px;text-align:left}
.ngd2-body .hchoicegrid{border-collapse:collapse;margin:10px auto;max-width:100%}
.ngd2-body .hchoicegrid td.hchoicecell{border:none!important;padding:4px 8px;text-align:center;vertical-align:middle}
.ngd2-body .hchoices{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));
  column-gap:14px;row-gap:9px;margin:10px 0 2px;align-items:baseline}
.ngd2-body .hch{min-width:0;white-space:nowrap}
.ngd2-body .hbox{border:1.5px solid #333;border-radius:2px;padding:8px 12px;margin:8px 0}
/* (v1.2) 조건 박스 — 조건마다 한 줄, 접힘줄은 라벨 폭만큼 들여쓰기(시험지 관례) */
.ngd2-body .hbox.hcond{padding:9px 14px;margin:10px 0}
.ngd2-body .hcondr,.ngd2-body .hbox.hcond>.hp{padding-left:2.05em;text-indent:-2.05em;margin:3px 0;line-height:1.85}
/* (v1.6) 〈보 기〉 박스 — 머리표는 가운데, 항목은 표지 폭만큼 행잉 인덴트 */
.ngd2-body .hbox.hbogi{position:relative;padding-top:18px;margin-top:18px}
/* 보기 제목이 상단 테두리 중앙에 걸쳐 배경으로 선을 끊는 시험지 범례 형태 */
.ngd2-body .hbogit{position:absolute;z-index:1;top:0;left:50%;transform:translate(-50%,-50%);white-space:nowrap;
  box-sizing:border-box;min-width:92px;padding:1px 12px;background:#fff;text-align:center;font-weight:700;
  letter-spacing:.28em;line-height:1.35;margin:0;border:0;color:#202839}
.pksol.ngd2-body .hbogit{background:#f7f9ff}
.ngd2-body .hbogi .hcondr{padding-left:1.5em;text-indent:-1.5em}
.ngd2-body:not(.ngd2-inherit) .hfig,.ngd2-body:not(.ngd2-inherit) img.hfig{display:inline-block;vertical-align:middle;margin:4px 6px;
  max-width:min(100%,440px);max-height:300px;height:auto !important;object-fit:contain}
.ngd2-body:not(.ngd2-inherit) svg{max-width:min(100%,440px);max-height:300px}
/* 조판도구(.ngd2-inherit)는 용지 기준으로 그림을 실제 크기대로 앉힌다 — 화면용 300px 상한을 적용하지 않는다 */
.ngd2-body.ngd2-inherit .hfig,.ngd2-body.ngd2-inherit img.hfig{max-width:100%;height:auto}
.ngd2-body .hfigwrap{position:relative;overflow:visible;line-height:1}
.ngd2-body .hfigwrap>img.hfig{display:block!important;margin:0!important;width:100%!important;height:100%!important;
  max-width:none!important;max-height:none!important;object-fit:fill!important}
.ngd2-body .hfigwrap>.hfiglabel,.ngd2-body .hfigwrap>span:not(.hfigwrap){display:block;max-width:none;
  white-space:nowrap!important;overflow:visible;transform:var(--hfig-shift,translate(0,0)) scale(var(--hfig-label-scale,1));transform-origin:left top}
.ngd2-body .hfigwrap>.hfiglabel-invalid{display:none!important}
.ngd2-body .hfigwrap>span .katex,.ngd2-body .hfigwrap>span .katex *{white-space:nowrap!important}
/* (v1.9) 아무도 채우지 않은 그림 자리표시는 흔적을 남기지 않는다 */
.ngd2-body .hfigslot{display:none}
/* (2026-08-09) 해설 읽기 규격 — 인라인 수식은 줄 중간에서 쪼개지 않는다. 긴 display 수식은 가로 스크롤. */
.pksol .katex,.sol .katex,.qi .sol .katex{white-space:nowrap}
.pksol .katex-display .katex,.sol .katex-display .katex{white-space:normal}
.pksol b,.sol b{color:#123c78}
/* KaTeX 파싱 실패 시 빨간 원문 대신 본문색으로 — 읽기 방해 최소화 */
.ngd2-body .katex-error{color:inherit!important}
/* (2026-08-09) 표준 정답 배지 — 해설 최상단 통일 표기 */
.ngd2-body .solans{display:flex;align-items:center;gap:9px;margin:0 0 9px;padding:0 0 8px;border-bottom:1px solid #dbe4f6}
.ngd2-body .solans .solansl{flex:none;background:#123c78;color:#fff;border-radius:6px;padding:3px 9px;
  font:800 11px/1 -apple-system,'Noto Sans KR',sans-serif;letter-spacing:.04em}
.ngd2-body .solans .solansv{font-weight:700;color:#123c78;min-width:0}
.ngd2-body .sollead{margin:2px 0 8px;font:800 12px/1.35 -apple-system,'Noto Sans KR',sans-serif;color:#304a78;letter-spacing:.04em}
.ngd2-body .solstep{display:grid;grid-template-columns:3.25em minmax(0,1fr);gap:.35em;margin:10px 0 4px;padding:0;text-indent:0}
.ngd2-body .solstep>span{display:block;color:#365a96;font:800 10.5px/1.35 -apple-system,'Noto Sans KR',sans-serif;letter-spacing:.03em}
.ngd2-body .solstep>div{min-width:0;line-height:1.55}
.ngd2-body .hfigs{text-align:center;margin:9px 0;line-height:1}
.ngd2-body .hfigs img.hfig{margin:2px 5px}
.ngd2-body .ngd2-figure-zone{display:flex;clear:both;width:100%;box-sizing:border-box;align-items:center;justify-content:center;
  gap:10px;margin:.85em 0 1.05em;text-align:center;line-height:1;break-inside:avoid;page-break-inside:avoid}
.ngd2-body .ngd2-figure-zone>img,.ngd2-body .ngd2-figure-zone>svg,
.ngd2-body .ngd2-figure-zone>.hfigs,.ngd2-body .ngd2-figure-zone>.nvfig,
.ngd2-body .ngd2-figure-zone>figure,.ngd2-body .ngd2-figure-zone>.hfigwrap{flex:0 1 auto;margin:0!important;max-width:min(82%,420px);max-height:300px}
.ngd2-body .ngd2-figure-zone>.hfigs{display:flex;align-items:center;justify-content:center;gap:10px}
.ngd2-body .ngd2-figure-zone>img{height:auto!important;object-fit:contain}
.ngd2-body .ngd2-figure-zone>svg{height:auto!important}
.ngd2-body .ngd2-figure-zone>.hfigs img.hfig{margin:0!important;max-width:min(100%,420px);max-height:300px}
.ngd2-body .ngd2-figure-zone>.nvfig>svg,.ngd2-body .ngd2-figure-zone>figure>svg{display:block;margin:auto;width:100%;height:auto;max-width:100%;max-height:300px}
.ngd2-body .ngd2-figure-zone>.ngd2-fig-standard{width:min(72%,420px)}
.ngd2-body .ngd2-figure-zone>.ngd2-fig-wide{width:min(88%,440px)}
.ngd2-body .ngd2-figure-zone>.ngd2-fig-tall{width:min(54%,300px)}
/* 같은 문제에 그림이 여러 장이면 한 장이 폭을 독점하지 않게 한다. */
.ngd2-body .ngd2-figure-zone>img:nth-last-child(n+2),.ngd2-body .ngd2-figure-zone>img:nth-last-child(n+2)~img{max-width:46%}
/* 조판에서는 화면 px가 아니라 단 폭과 종이 높이를 기준으로 통일한다. */
.ngd2-body.ngd2-inherit .ngd2-figure-zone>img,.ngd2-body.ngd2-inherit .ngd2-figure-zone>svg,
.ngd2-body.ngd2-inherit .ngd2-figure-zone>.hfigs,.ngd2-body.ngd2-inherit .ngd2-figure-zone>.nvfig,
.ngd2-body.ngd2-inherit .ngd2-figure-zone>figure,.ngd2-body.ngd2-inherit .ngd2-figure-zone>.hfigwrap{max-width:82%;max-height:72mm}
.ngd2-body.ngd2-inherit .ngd2-figure-zone>.ngd2-fig-standard{width:72%}
.ngd2-body.ngd2-inherit .ngd2-figure-zone>.ngd2-fig-wide{width:88%}
.ngd2-body.ngd2-inherit .ngd2-figure-zone>.ngd2-fig-tall{width:54%}
.ngd2-body .ngd2-figure-zone+.nchoices,.ngd2-body .ngd2-figure-zone+.hchoices,
.ngd2-body .ngd2-figure-zone+.hchoicegrid,.ngd2-body .ngd2-figure-zone+.hchoice{margin-top:1.1em;padding-top:.8em;text-align:left}
.ngd2-body .hchoices .hch,.ngd2-body .nchoices .nchoice{text-align:left}
.ngd2-body .ngd2-solution-figures{margin:.8em 0 1em}
.ngd2-body .hpic{color:#888;font-size:.85em;border:1px dashed #bbb;padding:1px 6px;border-radius:3px}
/* 표준 5지선다는 실폭 기준 5개 한 줄 → 3+2 → 1개씩. max-content 트랙을 써 짧은 선지는
   한 줄에 넉넉히 펴고, 3+2의 둘째 줄은 첫 두 열에 놓는다. */
.ngd2-body .nchoices{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));
  column-gap:var(--ngd2-choice-gap);row-gap:9px;margin-top:12px;padding-top:10px;border-top:1px dashed #e8ebf3;align-items:baseline}
.ngd2-body .nchoice{min-width:0;white-space:nowrap}
.ngd2-body .ncnum{color:#123c78;font-weight:600;margin-right:2px}
.ngd2-body .nchoices.c5{grid-template-columns:repeat(5,max-content);justify-content:space-between}
.ngd2-body .nchoices.c4{grid-template-columns:repeat(4,max-content);justify-content:space-between}
.ngd2-body .nchoices.c3{grid-template-columns:repeat(3,max-content);justify-content:space-between}
.ngd2-body .nchoices.c2{grid-template-columns:repeat(2,minmax(0,1fr))}
.ngd2-body .nchoices.c1,.ngd2-body .nchoices.vert{grid-template-columns:minmax(0,1fr);row-gap:5px}
.ngd2-body .nchoices.c1 .nchoice,.ngd2-body .nchoices.vert .nchoice{white-space:normal}
.ngd2-body .hchoices.c5{grid-template-columns:repeat(5,max-content);justify-content:space-between}
.ngd2-body .hchoices.c4{grid-template-columns:repeat(4,max-content);justify-content:space-between}
.ngd2-body .hchoices.c3{grid-template-columns:repeat(3,max-content);justify-content:space-between}
.ngd2-body .hchoices.c2{grid-template-columns:repeat(2,minmax(0,1fr))}
.ngd2-body .hchoices.c1,.ngd2-body .hchoices.vert{grid-template-columns:minmax(0,1fr);row-gap:5px}
.ngd2-body .hchoices.c1 .hch,.ngd2-body .hchoices.vert .hch{white-space:normal}`;
    (document.head||document.documentElement).appendChild(st);
  }catch(e){}

  /* ── (v1.7) 화면 로컬 math() 자동 흡수 ──
     규약상 표시 규칙은 이 파일에만 둔다. 그런데 화면 파일(문제은행2.html 등)이 다른 작업으로 되돌아가면서
     구판 로컬 math() 가 되살아나는 일이 반복됐고(2026-07-28 3회), 그때마다 body_html 없는 교재 문항 576건이
     줄바꿈·선지 배치·조건 박스 없이 한 덩어리로 다시 뭉개졌다.
     → 로드 직후 전역 math 가 '구판 로컬 구현'이면(소스에 ₩ 복원 정규식이 있는 것으로 식별) mathText 로 갈아끼운다.
       스크립트 실행 직후·네트워크 응답 전에 끼므로 첫 렌더부터 적용된다. 이미 위임된 화면은 건드리지 않는다. */
  try{ setTimeout(function(){ try{
    var m=window.math;
    if(typeof m==="function" && !m.__ngd2 && /₩/.test(String(m))){
      var f=function(t){ return mathText(t); };
      f.__ngd2=1; window.math=f;
      if(window.console&&console.info) console.info("[표시공통] 로컬 math() → NGD2Display.mathText 로 위임(자동)");
    }
  }catch(e){} },0); }catch(e){}

  return {fix,mathText,solText,inline,clip,choices,render,html,esc,layoutChoices,layoutLead,displayDiagnostics,condBoxHtml,linesToHtml,casesTable,flowBreaks,
          figures,withFigures,withSolFigures,problemFigures,solutionFigures,figSlots,dropSlots,stripHwpDump,splitMath,solutionOcrJunk};
})();

/* NGD2 조판 진입/복귀 세션 규약 (2026-08-14)
   - 조판으로 새 자료를 보내면 이전 조판 초안은 섞지 않는다.
   - 조판에서 직전 화면으로 돌아갈 때 그 화면의 브라우저 상태를 그대로 복원한다.
   - 복귀한 화면에서 사용자가 처음 조작하면 방금 조판 초안을 폐기한다.
   개인 브랜드/확대율 설정은 조판 초안과 별도 키이므로 보존한다. */
(function(){
  "use strict";
  var K={
    draft:"ngd2_layout_draft_v2",
    ret:"ngd2_typeset_return_v1",
    entry:"ngd2_typeset_entry_v1",
    armed:"ngd2_typeset_reset_armed_v1"
  };
  var interactionGuard=false;
  function nowToken(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
  function read(k){try{return JSON.parse(sessionStorage.getItem(k)||"null");}catch(e){return null;}}
  function write(k,v){try{sessionStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  function isTypesetHref(href){return /(?:조판도구|typeset)\.html(?:[?#]|$)/i.test(String(href||""));}
  function clearDraft(){
    try{sessionStorage.removeItem(K.draft);}catch(e){}
    /* 과거 버전이 localStorage에 남아 재유입되는 것도 차단한다. */
    try{localStorage.removeItem(K.draft);}catch(e){}
  }
  function enter(url,meta){
    var token=nowToken();
    write(K.ret,{href:location.href,title:document.title||"직전 화면",at:Date.now(),token:token,source:meta&&meta.source||""});
    write(K.entry,{token:token,at:Date.now(),incoming:String(url||"")});
    try{sessionStorage.removeItem(K.armed);}catch(e){}
    clearDraft();
    location.href=url;
  }
  function ensureReturnContext(){
    var cur=read(K.ret);
    if(cur&&cur.href&&!isTypesetHref(cur.href))return cur;
    var ref=document.referrer||"";
    if(ref&&!isTypesetHref(ref)){
      cur={href:ref,title:"직전 화면",at:Date.now(),token:nowToken(),source:"referrer"};
      write(K.ret,cur);
      return cur;
    }
    return null;
  }
  function returnToPrevious(fallback){
    var ctx=ensureReturnContext();
    write(K.armed,{token:ctx&&ctx.token||nowToken(),at:Date.now(),from:location.href});
    /* history.back()이 폼·스크롤·선택 상태를 가장 정확하게 되살린다. */
    if(ctx&&history.length>1){history.back();return;}
    location.href=ctx&&ctx.href||fallback||"문제은행2.html";
  }
  function armResetOnInteraction(){
    if(interactionGuard||isTypesetHref(location.href)||!read(K.armed))return;
    interactionGuard=true;
    var events=["pointerdown","keydown","input","change","submit"];
    var done=false;
    function reset(e){
      if(done||e&&e.isTrusted===false)return;
      done=true;interactionGuard=false;clearDraft();
      try{sessionStorage.removeItem(K.entry);sessionStorage.removeItem(K.armed);}catch(x){}
      events.forEach(function(n){document.removeEventListener(n,reset,true);});
    }
    events.forEach(function(n){document.addEventListener(n,reset,true);});
  }
  window.NGD2TypesetSession={keys:K,enter:enter,clearDraft:clearDraft,
    ensureReturnContext:ensureReturnContext,returnToPrevious:returnToPrevious,
    armResetOnInteraction:armResetOnInteraction,isTypesetHref:isTypesetHref};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",armResetOnInteraction,{once:true});
  else armResetOnInteraction();
  /* history.back()의 bfcache 복원은 스크립트를 다시 실행하지 않으므로 pageshow에서 다시 무장한다. */
  window.addEventListener("pageshow",armResetOnInteraction);
})();
