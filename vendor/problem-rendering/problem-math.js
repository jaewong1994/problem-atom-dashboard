/* 수식공통.js — Problem rendering 수식 표현·수선 공통 모듈 (2026-07-17 페이블)
   문제은행·매칭검수·표시검수 3페이지가 각자 복사해 쓰던 수선 로직을 단일화.
   ★ 수식 문법 수선은 반드시 이 파일에만 추가할 것 — 페이지별 복사 금지(누락 사고 방지). */
window.ProblemMath = (function(){
  var VERSION = '2026-08-29-solution-math-v6';
/* (2026-08-08b 페이블) 수식 토크나이저 (?:\\.|[^$])*? 의 [^$] 가 백슬래시를 중복 포함해
   \, 가 많은 문항(#5165 실측 무한대기)에서 지수적 역추적 발생 — [^\\$] 로 대안을 분리해 선형화.
   매칭 결과는 동일(백슬래시는 항상 \\[\s\S] 쪽이 소비). */
/* (2026-08-03b 재웅 신고 #7717 후속) 위 규칙은 '내용 없는 껍데기'만 잡는다. 내용이 들어 있는데
   둘째 줄부터가 eqalign{ } 로 묶여 들어온 꼴(실측 41문항)은 여전히 eqalign 이 글자로 찍히고
   줄도 어긋난다. eqalign 은 "이 칸에 여러 줄을 세로로 쌓아라"는 뜻이므로, 왼쪽·오른쪽 eqalign 을
   각각 줄로 풀어 같은 순서끼리 짝지어 진짜 cases 행으로 되돌린다.
   예) \begin{cases}A&(c1) \\ eqalign{ \\ B}&eqalign{ \\ (c2)}\end{cases}
       → \begin{cases}A & (c1) \\ B & (c2)\end{cases}                                        */
function _casesSplitTop(str, byRow){
  const out=[]; let d=0, cur="";
  for(let i=0;i<str.length;i++){
    const c=str[i];
    if(c==="\\"){
      if(byRow && str[i+1]==="\\" && d===0){ out.push(cur); cur=""; i++; continue; }
      cur+=c+(str[i+1]!=null?str[i+1]:""); i++; continue;
    }
    if(c==="{") d++;
    else if(c==="}") d--;
    if(!byRow && c==="&" && d===0){ out.push(cur); cur=""; continue; }
    cur+=c;
  }
  out.push(cur); return out;
}
const _casesBlank = t => !String(t).replace(/\\(?:,|;|:|!|quad|qquad)|\s/g,"").length;
function balanceEnvironments(s){
  const rx=/\\(begin|end)\s*\{([A-Za-z*]+)\}/g, stack=[];let out='',pos=0,m;
  while((m=rx.exec(s))){out+=s.slice(pos,m.index);const kind=m[1],env=m[2];
    if(kind==='begin'){stack.push(env);out+=m[0]}
    else if(stack.length&&stack[stack.length-1]===env){stack.pop();out+=m[0]}
    else if(stack.includes(env)){while(stack.length&&stack[stack.length-1]!==env)out+='\\end{'+stack.pop()+'}';stack.pop();out+=m[0]}
    pos=rx.lastIndex;
  }
  out+=s.slice(pos);while(stack.length)out+='\\end{'+stack.pop()+'}';return out;
}
function fixEqalignCases(m){
  if(m.indexOf("eqalign")<0) return m;
  return m.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, function(all, body){
    if(body.indexOf("eqalign")<0) return all;
    if(/\\begin\{/.test(body)) return all;          /* 중첩 환경이 섞이면 손대지 않는다 */
    const rows=[];
    _casesSplitTop(body, true).forEach(function(raw){
      const cols=_casesSplitTop(raw, false).map(function(c){
        const mm=c.trim().match(/^(?:\\,|\s)*eqalign\s*\{([\s\S]*)\}(?:\\,|\s)*$/);
        if(!mm) return [c.trim()];
        /* eqalign 안의 빈 줄은 칸 사이 간격용이라 행이 아니다 — 걷어내고 짝지어야 줄이 맞는다 */
        const col=_casesSplitTop(mm[1], true).map(function(x){ return x.trim(); }).filter(function(x){ return !_casesBlank(x); });
        return col.length?col:[""];
      });
      const h=Math.max.apply(null, cols.map(function(c){ return c.length; }));
      for(let r=0;r<h;r++){
        const line=cols.map(function(c){ return c[r]!=null?c[r]:""; });
        if(line.every(_casesBlank)) continue;
        rows.push(line.map(function(x){ return _casesBlank(x)?"":x; }).join(" & "));
      }
    });
    if(!rows.length) return all;                    /* 전부 빈 줄이면 원본 유지(위 껍데기 규칙 소관) */
    return "\\begin{cases}"+rows.join(" \\\\ ")+"\\end{cases}";
  });
}
function repairMathSeg(m){
  /* (2026-08-08b 페이블) 전수검수 실측 잔재 일괄 —
     ① 세그먼트 안에 남은 미이스케이프 $: 인접 인라인 수식이 병합된 구분자 잔재. KaTeX가
        "Can't use function '$'"로 중단되므로 공백으로 치환(실측 표본 330건).
     ② 이중 인코딩 &amp; / 고아 amp; : 행렬 열 구분자가 글자로 노출(실측 &amp;→amp;).
     ③ HWP 행 구분자 # : pile/matrix 밖에서 남으면 파스 오류 — 간격으로 강등.
     ④ LSUB/LSUP: 왼쪽 첨자 잔재 → 표준 prescript.
     ⑤ 소문자 맨몸 집합·관계어(emptyset·subset·notin·leq…): 백슬래시 누락 적재분(실측 402문항).
     ⑥ from/To 2001x·220134·3090280 파서 마커 제거. */
  m = m.replace(/(?<!\\)\$/g, " ");
  /* (2026-08-29 재웅 신고 9건) 미러 해설의 `$...$` 안에도 HWP 원시
     수식어가 일부 남았다. 기존 hwpInputToTex는 '사용자 입력' 경로만 타서,
     저장 수식 경로의 alpha·prime·overroot가 이탤릭 영문으로 노출됐다.
     의미가 확정된 토큰만 공통 수선에서 멱등적으로 복원한다. */
  m = m.replace(/(?<![A-Za-z\\])([A-Za-z])\s*`?\s*prime\s*prime(?![A-Za-z])/gi, "$1''")
       .replace(/(?<![A-Za-z\\])([A-Za-z])\s*`?\s*prime(?![A-Za-z])/gi, "$1'")
       .replace(/([A-Za-z])\s*`+\s*('{1,3})(?=\s*\()/g, "$1$2")
       .replace(/(?<![A-Za-z\\])(alpha|beta|gamma|delta|theta|lambda|sigma|phi|omega)(?![A-Za-z])/g, "\\$1")
       .replace(/(?<![A-Za-z\\])(?:root|sqrt)\s*([0-9]+)(?![A-Za-z0-9])/gi, "\\sqrt{$1}")
       .replace(/(?<![A-Za-z0-9}])([+\-]?)\s*1\s*over\s*\\sqrt\{([^{}]+)\}/gi,
                function(_all, sign, body){return (sign||"")+"\\frac{1}{\\sqrt{"+body+"}}";})
       .replace(/(?<![A-Za-z0-9}])([+\-]?)\s*1\s*overroot\s*([0-9]+)(?![A-Za-z0-9])/gi,
                function(_all, sign, body){return (sign||"")+"\\frac{1}{\\sqrt{"+body+"}}";})
       .replace(/(?<![A-Za-z\\])(sin|cos|tan|sec)t(?![A-Za-z])/g, "\\$1 t")
       .replace(/(?<![A-Za-z\\])THEREFORE(?![A-Za-z])/g, "\\therefore ")
       .replace(/(?<![A-Za-z\\])(?:INFTY|INF)(?![A-Za-z])/gi, "\\infty ");
  /* 구 변환기가 괄호를 생략한 반복분수. 분모가 정확히 1+2x^2인
     실측 계열만 먼저 확정해 `4x over1+2x^2`를 하나의 분수로 복원한다. */
  m = m.replace(/([0-9A-Za-z{}'^]+)\s*over\s*1\s*\+\s*2x\s*\^\s*\{?2\}?/g,
                "\\frac{$1}{1+2x^{2}}");
  /* 함수값 나눗셈의 괄호가 있는 형식: f'(2) over f(2). */
  m = m.replace(/\{?([A-Za-z](?:'{1,3})?\s*\([^(){}]*\))\}?\s*over\s*\{?([A-Za-z](?:'{1,3})?\s*\([^(){}]*\))\}?/g,
                "\\frac{$1}{$2}");
  /* (2026-08-13 내신 미주 #23789) HWP 로만체 지시자 `rm`이 구 변환기에서
     `r m`으로 분리된 꼴. 뒤가 도형·선분 명령 또는 대문자 변수일 때만 글꼴 표식을
     제거한다. 일반 변수 곱 r m은 보존한다. */
  m = m.replace(/(?<![A-Za-z\\])r\s+m(?=\s*(?:\\(?:overline|triangle|angle|vec|hat)|(?:bar|triangle|angle)\b|[A-Z]))/g, "");
  /* (2026-08-12 유형ON 해설 전수감사) 구 PDF 디코더가 근호를 Unicode U+221A로 남긴
     168해설 방어. 범위가 명확한 숫자·단일 문자·괄호식만 LaTeX로 승격한다.
     남은 고아 √는 범위를 추측하지 않고 검수 대상으로 보존한다. */
  m = m.replace(/√\s*\\(?=\d)/g,"√")
       .replace(/√\s*\(([^()]*)\)/g,"\\sqrt{$1}")
       .replace(/√\s*\{([^{}]*)\}/g,"\\sqrt{$1}")
       .replace(/√\s*([0-9]+(?:\.\d+)?|[A-Za-z])/g,"\\sqrt{$1}");
  /* (2026-08-08b) 수식 세그먼트로 들어간 워터마크 — `bold{N G D`·`NGD공동작업물입니다` 변형까지.
     세그먼트 내용 전체가 워터마크일 때만 통째로 비운다(실측 #66724 `$bold{N G D$`). */
  if (/^[\s{}\\]*(?:(?:\\)?(?:bold|rm|it)\b)?[\s{}]*N\s*G\s*D[\s{}.,']*(?:공\s*동\s*작\s*업\s*물\s*입\s*니\s*다)?[\s{}.,']*$/.test(m)) return "";
  m = m.replace(/&amp;/g, "&").replace(/(?<![A-Za-z&])amp;/g, "&");
  /* (2026-08-24 최적화 15회차) HWP 세로쌓기 pile{r1#r2}가 변환기에서 pi+le로 쪼개진
     `\pi \leq {1#2}` 계열 — 전수 1,108문항(#6985 열벡터·#7043 2×2 행렬·#6893 스페이서 실측).
     중괄호 안 #(HWP 행 구분자)가 시그니처라 진짜 π≤ 부등식과 충돌하지 않는다.
     아래 # 강등 규칙보다 반드시 먼저 실행. 행은 #, 열은 & 기준. 전 칸 공백류면 스페이서로 제거. */
  m = m.replace(/\\pi\s*\\leq\s*\{([^{}]*#[^{}]*)\}/g, function(_, inner){
    var rows = inner.split("#");
    if(rows.every(function(r){ return /^[\s\\,]*$/.test(r); })) return " ";
    var body = rows.map(function(r){
      return r.split(/&+/).map(function(c){ return c.trim(); }).join(" & ");
    }).join(" \\\\ ");
    return "\\begin{pmatrix}" + body + "\\end{pmatrix}";
  });
  /* pile 원문이 \left( … \right)로 감싸여 있던 경우 pmatrix 괄호와 이중이 되므로 바깥을 걷는다 */
  m = m.replace(/\\left\(\s*(\\begin\{pmatrix\}[\s\S]*?\\end\{pmatrix\})\s*\\right\)/g, "$1");
  /* (2026-08-24 최적화 16회차) 글꼴 토큰이 행렬 원문에 접착된 itpmatrix{..}(#7145·#40118 실측,
     전수 79문항) — it/rm만 박리하면 아래 규칙이 처리한다. */
  m = m.replace(/(?<![A-Za-z\\])(?:it|rm)(?=[pbvd]?matrix\s*\{)/gi, "");
  /* 한글 수식 편집기의 행렬 원문: pmatrix{a&b#c&d}. #은 행, &는 열이다.
     (2026-08-24 최적화 16회차) # 강등 규칙보다 먼저 실행하도록 이 위치로 이동(기존 위치에서는
     #이 이미 \;로 강등돼 행 구분이 소실되는 잠복 버그가 있었다). dmatrix(사선공식)는 vmatrix로. */
  m = m.replace(/(?<![A-Za-z\\])(p|b|v|d)?matrix\s*\{([^{}]*)\}/gi,
        function(_all, kind, inner){
          var env=(kind?kind.toLowerCase():"")+"matrix";
          if(env==="dmatrix") env="vmatrix";
          /* 앞당긴 실행 시점에는 gt/lt 엔티티가 아직 살아 있어 &lt;의 &가 열 구분자로 오인될 수 있다 */
          inner=inner.replace(/&(?:amp;)*(?:gt|#62);/gi,">").replace(/&(?:amp;)*(?:lt|#60);/gi,"<");
          /* 전 칸이 빈 레이아웃 껍데기(`{&#&#&}` 류, #14723 실측)면 서식 잔재로 보고 제거 */
          if(inner.replace(/&amp;/gi,"").replace(/[#&\s~{}\\,]/g,"")==="") return " ";
          var rows=inner.split("#").map(function(row){
            return row.split(/(?:&amp;|&)/).map(function(cell){return cell.replace(/~/g,"\\; ").trim();}).join(" & ");
          });
          return "\\begin{"+env+"}"+rows.join(" \\\\ ")+"\\end{"+env+"}";
        });
  /* (2026-08-24 최적화 16회차) 원문에 이미 저장된 빈 matrix 환경 껍데기
     `\begin{matrix}{& \\ & \\ &}\end{matrix}`(#14723 실측, empty_matrix 계열) — 내용이
     공백·&·중괄호·역슬래시뿐이면 레이아웃 잔재로 보고 용해한다. */
  m = m.replace(/\\begin\{([pbv]?matrix)\}[\s&{}\\]*\\end\{\1\}/g, " ");
  m = m.replace(/(?<![\\])#/g, "\\;");
  m = m.replace(/LSUB\s*\{([^{}]*)\}/g, "{}_{$1}{}").replace(/LSUP\s*\{([^{}]*)\}/g, "{}^{$1}{}")
       .replace(/(?<![A-Za-z\\])LSUB\s*([A-Za-z0-9])/g, "{}_{$1}{}")
       .replace(/(?<![A-Za-z\\])LSUP\s*([A-Za-z0-9])/g, "{}^{$1}{}");
  /* (2026-08-09 재웅 실측 모아보기 #12173·#12400·#12755) 집합 기호 잔재 추가 변형 —
     ① `EMPTY SET`(띄어쓴 대문자) ② `nin`(HWP not-in) ③ 맨몸 `in`(∅ in A · {0,1} in A 꼴)
     ④ 피연산자가 붙은 `subsetA`·`ninA` — 단어 뒤 대문자/기호가 바로 오면 공백부터 분리 */
  /* (2026-08-09b) AI 해설 이중 이스케이프 잔재 — \\\\dfrac 처럼 줄바꿈+명령으로 붙은 꼴은
     원래 \\dfrac 의 과잉 이스케이프다(solutions.body 실측 68건, DB는 복구했지만 표시도 방어).
     \\\\ 뒤 공백 없이 알려진 명령이 바로 붙은 경우만 접는다 — aligned 의 정상 줄바꿈(\\\\ + 공백)은 불변. */
  m = m.replace(/\\\\(?=(?:dfrac|tfrac|cfrac|frac|sqrt|times|div|pm|mp|cdot|sin|cos|tan|cot|sec|csc|log|ln|pi|theta|alpha|beta|gamma|left|right|boxed|circ|angle|overline|underline|triangle|le|ge|ne|leq|geq|neq|therefore|because|displaystyle|text|mathrm|infty|sum|prod|int|lim|varnothing|subset|supset|cup|cap|in|notin)(?![a-zA-Z]))/g, "\\");
  /* (2026-08-09b) 미러 해설 잔재 \\CAP·\\CUP (실측 #19459) */
  m = m.replace(/\\CAP(?![A-Za-z])/g, "\\cap ").replace(/\\CUP(?![A-Za-z])/g, "\\cup ");
  /* (2026-08-09c 검수 반려 10건 실측) HWP 집합 토큰 잔재 일괄 수선 —
     대문자 관계어(SUBSET·IN·OWNS·NSUBSET·EMPTYSET), 자간 분리(e m p t y s e t),
     서체 접미(emptysetit), 중괄호 낀 {subset}·{in{, 유니코드 ∊·⊄, 화살표 -> */
  m = m.replace(/(?<![A-Za-z])[eE]\s*[mM]\s*[pP]\s*[tT]\s*[yY]\s*[sS]\s*[eE]\s*[tT](?![A-Za-z])/g, " \\varnothing ");
  m = m.replace(/(?<![A-Za-z\\])(emptyset|varnothing)(?:it|rm|bf)(?![A-Za-z])/g, "$1 ");
  var _REL = function(w){ return w==="nin" ? "\\notin" : "\\"+w; };
  m = m.replace(/\{+\s*(subset|supset|notin|nin|in)\s*\}+/g, function(_,w){ return " "+_REL(w)+" "; });
  m = m.replace(/\{+\s*(subset|supset|notin|nin|in)\s*(?=\{)/g, function(_,w){ return " "+_REL(w)+" "; });
  m = m.replace(/(?<![A-Za-z\\])EMPTYSET(?![a-z])/g, " \\varnothing ");
  m = m.replace(/(?<![A-Za-z\\])EMPTYSET(?=(?:subset|supset|notin|nin|in)(?![a-z]))/g, " \\varnothing ");
  m = m.replace(/(?<![A-Za-z\\])NSUBSET(?![a-z])/g, " \\not\\subset ");
  m = m.replace(/(?<![A-Za-z\\])NSUPERSET(?![a-z])/g, " \\not\\supset ");
  m = m.replace(/(?<![A-Za-z\\])SUBSET(?![a-z])/g, " \\subset ");
  m = m.replace(/(?<![A-Za-z\\])SUPERSET(?![a-z])/g, " \\supset ");
  m = m.replace(/(?<![A-Za-z\\])NOTIN(?![a-z])/g, " \\notin ");
  m = m.replace(/(?<![A-Za-z\\])NIN(?![a-z])/g, " \\notin ");
  m = m.replace(/(?<![A-Za-z\\])OWNS(?![a-z])/g, " \\ni ");
  m = m.replace(/(?<![A-Za-z\\])IN(?![a-zA-Z])/g, " \\in ");
  m = m.replace(/(?<![A-Za-z\\])IN(?=[A-Z0-9({])/g, " \\in ");
  m = m.replace(/\u220A/g, " \\in ").replace(/\u220D/g, " \\ni ")
       .replace(/\u2284/g, " \\not\\subset ").replace(/\u2285/g, " \\not\\supset ");
  m = m.replace(/(?<![-<])->(?!>)/g, " \\to ");
  /* (2026-08-23 페이블) HWP 잔재 +-/-+ → ±/∓ 복원 — 전수 실측 2,795문항·5,432건 전부 ± 문맥
     (x= +-√…, 근의공식 -5+-√13 등). 부호표(+ - +)는 공백 분리라 비적중, +->·-+- 연쇄는 가드로 제외.
     DB 원본 불변 — 표시 단계만. */
  m = m.replace(/(?<![+\-])\+\-(?![+\->])/g, " \\pm ")
       .replace(/(?<![+\-<])\-\+(?![+\->])/g, " \\mp ");
  /* (2026-08-23 클로드 최적화) HWP 토큰 자간분해 잔재 복원 — DB 전수 실측: 화살표 계열 77문항
     ('Right a r r o w'가 #4082-4096 제주대사대부고 16건 반려 주범), 's m a l l \prod' 213문항
     (전부 중복순열 크기토큰), 'p l u s \min u s' 12문항(전부 ± 문맥), '\int e g r a l' 8문항,
     '\infty i n i t y' 5문항, 'b o x{'·'BOX{' 21문항(수학적귀납법 빈칸), 'b o l d' 6문항.
     글자가 공백으로 낱낱이 분리된 토큰은 자연 발생 불가능한 문자열이라 오탐 위험이 0에 수렴한다.
     DB 원본 불변 — 표시 단계만. */
  m = m.replace(/(?<![A-Za-z\\])Right\s+a\s+r\s+r\s+o\s+w(?![A-Za-z])/g, " \\Rightarrow ")
       .replace(/(?<![A-Za-z\\])right\s+a\s+r\s+r\s+o\s+w(?![A-Za-z])/g, " \\rightarrow ")
       .replace(/(?<![A-Za-z\\])Left\s+a\s+r\s+r\s+o\s+w(?![A-Za-z])/g, " \\Leftarrow ")
       .replace(/(?<![A-Za-z\\])left\s+a\s+r\s+r\s+o\s+w(?![A-Za-z])/g, " \\leftarrow ")
       .replace(/(?<![A-Za-z\\])a\s+r\s+r\s+o\s+w(?![A-Za-z])/g, " \\rightarrow ");
  m = m.replace(/(?<![A-Za-z\\])(?:r\s+m\s+)?s\s+m\s+a\s+l\s+l(?=\s*\\?(?:prod|Pi)(?![A-Za-z]))/g, " ");
  m = m.replace(/(?<![A-Za-z\\])p\s+l\s+u\s+s\s*(?:\\min\s*u\s*s|m\s+i\s+n\s+u\s+s)(?![A-Za-z])/g, " \\pm ");
  m = m.replace(/(\\int)\s*e\s+g\s+r\s+a\s+l(?![A-Za-z])/g, "$1 ")
       .replace(/(\\infty)\s*i\s+n\s+i\s+t\s+y(?![A-Za-z])/g, "$1 ");
  m = m.replace(/(?<![A-Za-z\\])b\s+o\s+x\s*(?=\{)/g, "\\boxed")
       .replace(/(?<![A-Za-z\\])BOX\s*(?=\{)/g, "\\boxed");
  m = m.replace(/(?<![A-Za-z\\])b\s+o\s+l\s+d(?![A-Za-z])\s*/g, " ");
  /* (2026-08-23 클로드 최적화 2차 — 사이클 71·72 '리터럴 HWP 명령어 노출' 대분류)
     수식 개체 대체텍스트 덤프('수식입니다.' 계열)에서 승격된 원시 스크립트에 남는 소문자
     명령·기호 토큰을 복원한다. 실측: therefore(#5641)·ne(#5644 ABneBA, #5653 CneE)·
     BOT(#5672)·BIGCIRC/B I G \circ(#5710·#5713·#84083)·it 부호앞(#5667 y=it-x+3). */
  m = m.replace(/(?<![A-Za-z\\])therefore(?![A-Za-z])/g, " \\therefore ")
       .replace(/(?<![A-Za-z\\])because(?![A-Za-z])/g, " \\because ");
  m = m.replace(/(?<![A-Za-z\\])ne(?=\s*[A-Z](?![a-z]))/g, " \\neq ")
       .replace(/([A-Z0-9)\]}])ne(?=[A-Z](?![a-z]))/g, "$1 \\neq ");
  m = m.replace(/(?<![A-Z\\])BOT(?![A-Z])/g, " \\perp ");
  m = m.replace(/(?<![A-Za-z\\])B\s+I\s+G\s*\\circ(?![A-Za-z])/g, " \\bigcirc ")
       .replace(/(?<![A-Za-z\\])BIGCIRC(?![A-Za-z])/g, " \\bigcirc ");
  m = m.replace(/(?<![A-Za-z\\])(?:rm|it|bf)(?=\s*[-+0-9(±])/g, "");
  m = m.replace(/(?<![A-Za-z\\])EMPTY\s+SET(?![A-Za-z])/g, " \\varnothing ");
  m = m.replace(/(?<![A-Za-z\\])(emptyset|varnothing|subset|supset|notin|nin|in)(?=[A-Z0-9∅ϕφ{(\\])/g, "$1 ");
  m = m.replace(/(?<![A-Za-z\\])nin(?![A-Za-z])/g, " \\notin ");
  m = m.replace(/(?<![A-Za-z\\])in(?![A-Za-z])(?!\s*\{)/g, " \\in ");
  m = m.replace(/(?<![A-Za-z\\])emptyset(?![A-Za-z])/g, "\\varnothing ")
       .replace(/(?<![A-Za-z\\])subset(?![A-Za-z])/g, "\\subset ")
       .replace(/(?<![A-Za-z\\])supset(?![A-Za-z])/g, "\\supset ")
       .replace(/(?<![A-Za-z\\])notin(?![A-Za-z])/g, "\\notin ")
       .replace(/(?<![A-Za-z\\])leq(?![A-Za-z])/g, "\\leq ")
       .replace(/(?<![A-Za-z\\])geq(?![A-Za-z])/g, "\\geq ")
       /* OCR/JSON 원문에 프로그래밍식 비교 연산자로 남은 부등호를 KaTeX 명령으로 복원한다. */
       /* (2026-08-23 페이블) 팩토리얼 오변환 수정 — 공백 있는 "! ="는 전수 실측상 팩토리얼(2! =2, r! = 6, (4-1)! = 3!)이라
          치환하지 않고, 붙은 "!="만 ≠로 복원한다(k!=0, f(3)!=3, P(A)!=0 등 2,600+건 실측 전부 ≠ 의미).
          단 "\\times 3!=60" 꼴(× 뒤 숫자 팩토리얼)은 붙어 있어도 팩토리얼이라 제외. DB 원본 불변 — 표시 단계만. */
       .replace(/(?<!\\times\s?\d{1,3})!=(?!=)/g, "\\neq ")
       .replace(/(?<![A-Za-z\\])neq(?![A-Za-z])/g, "\\neq ")
       .replace(/(?<![A-Za-z\\])infty(?![A-Za-z])/g, "\\infty ");
  m = m.replace(/(?:from|To)\s*2001[01](?![0-9])/g, " ")
       .replace(/\{\s*(?:220134|3090280)\s*\}/g, "").replace(/(?<![0-9])(?:220134|3090280)(?![0-9])/g, "");
  /* (2026-08-08b) \left{ · \right} — 백슬래시 빠진 중괄호(파스 중단, 실측 #3315 등) */
  m = m.replace(/\\left\s*\{/g, "\\left\\{").replace(/\\right\s*\}/g, "\\right\\}");
  /* (2026-08-08b) 함수 인자 없는 첨자 — a^ \sqrt{3} · x^\frac{2}{4} 는 그룹으로 감싼다 */
  m = m.replace(/\^\s*(\\sqrt\s*(?:\[[^\]]*\])?\s*\{[^{}]*\})/g, "^{$1}")
       .replace(/\^\s*(\\frac\s*\{[^{}]*\}\s*\{[^{}]*\})/g, "^{$1}")
       .replace(/_\s*(\\sqrt\s*(?:\[[^\]]*\])?\s*\{[^{}]*\})/g, "_{$1}")
       .replace(/_\s*(\\frac\s*\{[^{}]*\}\s*\{[^{}]*\})/g, "_{$1}");
  /* (2026-08-08b) 이중 첨자 a^b^c / a_b_c — 사이에 빈 그룹을 넣어 탑 형태로 강등(파스 오류 방지) */
  for (var _i = 0; _i < 3; _i++) {
    m = m.replace(/(\^(?:\{(?:[^{}]|\{[^{}]*\})*\}|[A-Za-z0-9]))\s*(?=\^)/g, "$1{}")
         .replace(/(_(?:\{(?:[^{}]|\{[^{}]*\})*\}|[A-Za-z0-9]))\s*(?=_)/g, "$1{}");
  }
  /* (2026-08-23 클로드 최적화) 위첨자 그룹 뒤 프라임 — `g^{-1}'(0)`(역함수 도함수 표기)은
     KaTeX가 프라임을 위첨자로 취급해 Double superscript로 중단, 세그먼트 전체가 원문 노출됐다
     (#4858 실측, 학교 무관 구문 패턴). 사이에 빈 그룹을 넣어 g^{-1}{}'로 강등한다. */
  m = m.replace(/(\^(?:\{(?:[^{}]|\{[^{}]*\})*\}|[A-Za-z0-9]))\s*(?=')/g, "$1{}");
  /* (2026-08-08b) 고아 첨자 — `D^'`·끝의 ^/_·`_ _r` */
  m = m.replace(/\^(?=')/g, "").replace(/[\^_]\s*$/g, "").replace(/[\^_](?=\s*[\^_])/g, "");
  /* (2026-08-08b) \left/\right 짝 불일치 — 전부 벗겨 구분자 글리프만 남긴다(크기 조정만 포기) */
  var _nl = (m.match(/\\left(?![A-Za-z])/g) || []).length, _nr = (m.match(/\\right(?![A-Za-z])/g) || []).length;
  if (_nl !== _nr) m = m.replace(/\\(?:left|right)(?![A-Za-z])\s*/g, "");
  /* (2026-08-08b) rm C 오변환 잔재 \C */
  m = m.replace(/\\C(?![A-Za-z])/g, "C");
  /* (2026-08-28 #15133) HWP 도형 라벨이 `\ACD`·`\CD`·`\D`처럼 알 수 없는
     LaTeX 명령으로 들어온다. 전부 대문자인 1~6자 토큰만 점·선분 라벨로 복원한다.
     `\Delta`·`\Gamma`처럼 소문자를 포함하는 정상 TeX 명령은 보존한다. */
  m = m.replace(/\\([A-Z]{1,6})(?![A-Za-z])/g, "$1");
  /* (2026-08-07 NGD1 카드 검수) 수식 개체 안 실제 개행을 카드가 <br>로 바꾸면
     $...$ 구분자가 서로 다른 DOM 노드로 갈라져 KaTeX가 식 전체를 건너뛴다.
     행렬 행구분은 LaTeX의 \\ 이므로 실제 개행은 공백으로 합쳐도 의미가 보존된다.
     HWP 개체 꼬리/중간에 남은 To+내부 ID도 이 단계에서 함께 제거한다. */
  m = m.replace(/\b(?:to|To)\s*(?:\r?\n\s*)*\{?\s*(?:20011|3090280|220134)\s*\}?/g, " ")
       .replace(/\b(?:20011|3090280|220134)\b/g, " ")
       .replace(/(?<![A-Za-z\\])To(?![A-Za-z])/g, " ")
       .replace(/\s*\r?\n\s*/g, " ");
  /* (2026-08-06 기출 84,448 전수검수) 미러 평문을 HTML로 넣는 과정에서 비교·화살표가
     `&gt;`·`&lt;`·`-&gt;`로 이중 이스케이프되어 KaTeX가 `&`에서 중단됐다.
     수식 세그먼트 안에서만 원래 연산자로 되돌려 일반 텍스트/태그에는 영향이 없다. */
  m = m.replace(/&(?:amp;)*(?:gt|#62);/gi, ">").replace(/&(?:amp;)*(?:lt|#60);/gi, "<")
        .replace(/^\s*&(?:amp;)+\s*(?==)/i, "").replace(/^\s*&\s*(?==)/, "")
        .replace(/(?<![A-Za-z\\])-\s*>/g, "\\to ");
  /* 혼합 HWP식의 절댓값/벡터 크기는 일반 LEFT/RIGHT 잔재 정리보다 먼저 확정한다. */
  m = m.replace(/(?<![A-Za-z\\])(?:LEFT|left)\s*\|/g,"\\left|")
       .replace(/(?<![A-Za-z\\])(?:RIGHT|right)\s*\|/g,"\\right|");
  /* 행렬 환경 밖의 &는 KaTeX 정렬 탭이 될 수 없다. 좌표/행벡터 구분 쉼표로 낮춘다. */
  if(!/\\begin\{(?:[pbv]?matrix|array|aligned|cases)\}/.test(m))
    m=m.replace(/(?:\\,\s*)*(?:&amp;|&)(?:\s*\\,)*/g,",\\; ");
  /* 기출의 %는 주석 의도가 아니라 백분율이다. KaTeX가 뒤 식을 주석 처리하지 않게 한다. */
  m = m.replace(/(?<!\\)%/g,"\\%");
  /* 공백 없이 붙은 HWP 분수(1over6)도 정상 LaTeX로 복원한다. */
  m = m.replace(/(?<![A-Za-z0-9])(\d+)over(\d+)(?![A-Za-z0-9])/g,"\\frac{$1}{$2}");
  /* 좌표 첨자 닫힘이 \\right\\} 안으로 잘못 들어간 과거 변환본. */
  m = m.replace(/_\{([^{}]*?)\\right\\\}\)\}/g,"_{$1}\\right)");
  /* `overline{rmBC}`를 분수 명령 over로 오인하지 않게 선분 기호를 먼저 확정한다. */
  m = m.replace(/(?<![A-Za-z\\])overline\s*\{\s*(?:rm|it|bf)?\s*([A-Za-z]{1,6})\s*\}/gi,"\\overline{$1}");
  /* 과거 변환본에서 overline이 `\\frac{{}{l} i n e{BC}}`로 잘못 저장된 형태를 복원한다. */
  m = m.replace(/\\frac\{\{\}\{l\}\s*i\s*n\s*e\s*\{([^{}]+)\}\}/gi,"\\overline{$1}");
  /* HWP 변환기의 함수 프라임 앞 얇은 공백은 KaTeX 내부 그룹 오류를 유발한다. */
  m = m.replace(/([A-Za-z])(?:\\,\s*)+('{1,3})(?=\s*\()/g, "$1$2");
  /* 로그 밑이 근호인 구문: \log_ \sqrt{3} → \log_{\sqrt{3}}. */
  m = m.replace(/\\log\s*_\s*\\sqrt\s*\{([^{}]+)\}/g, "\\log_{\\sqrt{$1}}");
  // (2026-07-28 재웅 실측 #12829 "④ 1220010") HWPX 파서 잔재 코드 ` 20010` 이 수식 끝(선지·배점·부등식 뒤)에
  // 통째로 붙어 숫자와 이어 붙어 보인다. items 1,151건 실측 — 4건 빼고 전부 세그먼트 꼬리, 나머지도 잔재.
  // 숫자 일부(2001.0 / 120010 등)를 갉아먹지 않도록 앞뒤로 숫자·소수점이 없을 때만 지운다. 원본 DB 는 불변.
  m = m.replace(/\s+20010(?![\d.])/g, "");
  /* (2026-08-06 표시검수 반려 #16053·#8238·#8375·#11469·#15322·#7419)
     HWP 조건제시법의 세로막대가 PUA 글리프(U+E04D)로 남거나 `LEFT `처럼
     괄호 명령만 고아가 되는 경우가 있다. 수식 세그먼트 안에서만 \mid 로 정규화한다. */
  m = m.replace(/(?<![A-Za-z\\])LEFT\s*(?=[\uE04D|∣])/g, "")
       .replace(/\uE04D/g, "\\mid ")
       /* HWP의 수열 중괄호 글리프(U+E04B·U+E04C). 집합 제시법 막대와 같은 글꼴 영역이다. */
       .replace(/\uE04B/g, "\\{").replace(/\uE04C/g, "\\}");
  /* \middle 은 \left...\right 사이에서만 유효하다. 짝 괄호가 없는 구세대 집합 제시법은 \mid 로 복원한다. */
  if(!/\\(?:left|right)\b/.test(m)) m = m.replace(/\\middle\s*(?:\||\\vert)/g, "\\mid ");
  // (공통) 원문자 → \\text{} (KaTeX 원문자 미지원 — 이미 \\text 안이면 이중포장 방지)
  m = m.replace(/(?<!\\text\{)([\u2460-\u2473])/g, "\\text{$1}");
  m = m.replace(/\\boxed\{\s*(?:\\vphantom\{\(\}\s*)?((?:\\text\{)?[①-⑳]\}?)\s*\}/g, "\\boxed{\\rule[-0.28em]{0pt}{1.35em}$1}");   // (2026-07-17 페이블) 원문자 정답이 박스 위로 삐져나옴 — 스트럿으로 박스 높이 강제
  m = m.replace(/(\\,\s*)+([_^'])/g, "$2");   // (2026-07-17) \, 글루가 첨자 앞에 오면 KaTeX 거부(빨간 원문 노출) — 622문항 실물, DB도 일괄 수선함
  // (2026-07-05 실측) 초기 적재 데이터에 중괄호·\left 짝이 깨진 수식이 있고,
  // 깨진 수식 1개가 파싱에 실패하면 auto-render 가 그 문단의 '나머지 수식까지 전부' 포기한다.
  // → 렌더 전에 응급 수선: { } 짝 맞춤 + \left/\right 짝 맞춤. 원본 데이터는 건드리지 않음(표시용).
  // (2026-07-05) 구버전 변환기가 남긴 HWP 키워드 보정(기존 적재분 표시용 — 진단 SQL 실측 일반화)
  m = m.replace(/\bSMALLINTER\b/gi, "\\cap").replace(/\bSMALLUNION\b/gi, "\\cup");
  // (2026-07-28 재웅 실측 #18137) HWP 거듭제곱근 잔재: \sqrt{3} of {4} → \sqrt[3]{4} (DB 78문항)
  m = m.replace(/\\sqrt\s*\{([^{}]+)\}\s*of\s*\{([^{}]+)\}/g, "\\sqrt[$1]{$2}");
  m = m.replace(/\\sqrt\s*\{([^{}]+)\}\s*of\s*([A-Za-z0-9]+)/g, "\\sqrt[$1]{$2}");
  /* (2026-08-24 최적화 17회차) n제곱근 of의 피근호가 중괄호 그룹인 꼴 `\sqrt{3} of {16^{2}}`
     (#7434·#27627 실측) — 한 단계 중첩까지 허용해 지수 그룹을 보존한다. */
  m = m.replace(/\\sqrt\s*\{([^{}]+)\}\s*of\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, "\\sqrt[$1]{$2}");
  /* (2026-08-24 최적화 17회차) bold+rm 결합 수식어(#7314 boldrm sin150)와
     숫자에 접착된 rm 단위(#7369 31rmkm) — 서체 표식 제거·단위 로만체 복원 */
  m = m.replace(/(?<![A-Za-z\\])bold\s*rm(?![A-Za-z])/g, "")
       .replace(/(\d)\s*rm(km|cm|mm|kg|g|m|s|L)(?![A-Za-z])/g, "$1\\,\\mathrm{$2}");
  /* (2026-08-24 최적화 18회차) overline 그룹 뒤 고아 닫는 중괄호 `\overline{B C}}=`
     (#7606 실측, 전수 135문항) — 여는 { 가 앞에 없는 경우만 걷는다({\overline{AB}}는 보존). */
  m = m.replace(/(?<!\{\s*)(\\overline\s*\{[^{}]*\})\}(?!\})/g, "$1");
  /* (2026-08-24 최적화 19회차) 조합·순열 prescript의 기저 소실 — `= _{7}C_{2}`·`,\, _{n}P_{r}`처럼
     =·,·+·여는괄호 뒤에 기저 없이 아래첨자가 와서 KaTeX "subscript without base"(#13830·#47817 실측).
     교과 표기 {}_nC_r의 빈 기저 복원이라 내용 변화가 없다. 위첨자 고아는 기저 추정 위험으로 제외. */
  m = m.replace(/([=,+({]|^)((?:\s|\\[,;:!])*)_(?=\s*[{\dA-Za-z])/g, "$1$2{}_");
  // (2026-07-13) HWP 수식 잔재 일괄 수선 — 매칭검수 실측(대진여고·백영고·면목고·인천교고·가림고)
  // ① 소스 메타데이터가 수식에 주입된 오염 {{from^{연}^{월}^{\text{학교}}...}} 제거
  m = m.replace(/\{\{\s*from(?:\s*\^\s*\{(?:[^{}]|\{[^{}]*\})*\})+\s*\}\}/g, "");
  // ② 시그마·총곱 first-limit 중괄호 결손: \sum_{k}=1^{n} · \sum_k=3^7 → \sum_{k=1}^{n}
  m = m.replace(/\\(sum|prod|int)(\\limits)?\s*_\{([^}=]+)\}\s*=\s*([^\s^{}]+)(?=\s*\^)/g, "\\$1$2_{$3=$4}"); // (2026-07-16) \limits 낀 꼴(#4620 계열)도 수선
  m = m.replace(/\\(sum|prod|int)\s*_\s*([A-Za-z]\w*)\s*=\s*([^\s^{}]+)(?=\s*\^)/g, "\\$1_{$2=$3}");
  /* (2026-08-24 최적화 14회차) 상한 첨자 중괄호 소실 `\int_0 ^t_1` — 상한 t_1이 그룹 없이 와서
     KaTeX Double subscript(#6324 실측, 전수 45문항). 하한이 이미 있는 연산자 한정으로 복원한다. */
  m = m.replace(/(\\(?:int|sum|prod)(?:\\limits)?\s*_\s*(?:\{[^{}]*\}|[^\s^{}]+))\s*\^\s*([A-Za-z])\s*_\s*(\{[^{}]*\}|\d+)/g,
                "$1^{$2_$3}");
  /* (2026-08-06 표시검수 반려 #17134) HWP 이항계수 `_{n} rmC _{r}`가 합 기호의
     두 번째 아래첨자로 흡착된 꼴. 합의 범위는 보존하고 이항계수만 독립된 {}_n\mathrm{C}_r로 복원한다. */
  m = m.replace(/(\\sum(?:\\limits)?\s*_\{[^{}]+\}\s*\^\{[^{}]+\})\s*_\{\s*([^{}]+)\}\s*C\s*_\{\s*([^{}]+)\}/g,
                "$1 {}_{$2}\\mathrm{C}_{$3}");
  m = m.replace(/([_^])\s*(\d{2,})(?![\d}])/g, "$1{$2}");
  // ③ HWP from/to 합기호 상·하한(중괄호형) → _{}^{}, 남은 맨몸 from/to 제거
  m = m.replace(/\\(sum|prod|int)\s*from\s*\{([^}]*)\}\s*to\s*\{([^}]*)\}/g, "\\$1_{$2}^{$3}");
  m = m.replace(/(?<![A-Za-z\\])(?:from|to)(?![A-Za-z{])/g, " ");
  // (2026-07-17) 교재 인쇄 실측(재웅): 합성함수 CIRC 등 HWP 연산 키워드 잔재 → LaTeX (gCIRCf → g\circ f)
  // 가드는 '대문자 인접'만 차단 — gCIRCf 처럼 소문자 함수명 사이에 낀 키워드가 실전 케이스(재웅 PDF 실측)
  m = m.replace(/(?<![A-Z\\])CIRC(?![A-Z])/g, " \\circ ")
       .replace(/(?<![A-Z\\])TIMES(?![A-Z])/g, " \\times ")
       .replace(/(?<![A-Z\\])DIVIDE(?![A-Z])/g, " \\div ")
       .replace(/(?<![A-Z\\])CDOT(?![A-Z])/g, " \\cdot ")
       .replace(/(?<![A-Z\\])BULLET(?![A-Z])/g, " \\cdot ")   // (2026-07-17 #17782) 내적 ∙
       .replace(/(?<![A-Z\\])(?:INFTY|INF)(?![A-Z])/g, " \\infty ")
       .replace(/(?<![A-Z\\])RARROW(?![A-Z])/g, " \\to ")
       .replace(/(?<![A-Z\\])LARROW(?![A-Z])/g, " \\leftarrow ")
       .replace(/(?<![A-Z\\])LRARROW(?![A-Z])/g, " \\leftrightarrow ")
       /* (2026-08-24 최적화 세션) 증감표 나침반 화살표 토큰 — 전수 356문항(NEARROW/SEARROW 계열,
          대·소문자 맨몸 혼재, 사이클 87~88 #6470·#6474 실측). KaTeX 명령으로 복원한다. */
       .replace(/(?<![A-Z\\])NEARROW(?![A-Z])/g, " \\nearrow ")
       .replace(/(?<![A-Z\\])SEARROW(?![A-Z])/g, " \\searrow ")
       .replace(/(?<![A-Z\\])NWARROW(?![A-Z])/g, " \\nwarrow ")
       .replace(/(?<![A-Z\\])SWARROW(?![A-Z])/g, " \\swarrow ")
       .replace(/(?<![A-Z\\])PERP(?![A-Z])/g, " \\perp ")
       .replace(/(?<![A-Z\\])PARALLEL(?![A-Z])/g, " \\parallel ")
       .replace(/(?<![A-Z\\])EQUIV(?![A-Z])/g, " \\equiv ")
       .replace(/(?<![A-Z\\])PLUSMINUS(?![A-Z])/g, " \\pm ")
       .replace(/(?<![A-Z\\])MINUSPLUS(?![A-Z])/g, " \\mp ");
  /* (2026-08-24 최적화 23회차) HWP UNDERBRACE {라벨}{내용} — 라벨이 앞, 내용이 뒤(전수 13문항,
     #7962 실측 'UNDERBRACE {22개}{1+1+⋯+1}'). LaTeX \underbrace{내용}_{\text{라벨}}로 복원. */
  m = m.replace(/(?<![A-Za-z\\])UNDERBRACE\s*\{([^{}]*)\}\s*\{((?:[^{}]|\{[^{}]*\})*)\}/gi,
                "\\underbrace{$2}_{\\text{$1}}");
  // 소문자 circ 가 함수명 사이에 낀 케이스 (gcircf 는 드묾 — g circ f 형태만)
  m = m.replace(/(?<![A-Za-z\\])circ(?![A-Za-z])/g, " \\circ ");
  /* (2026-08-24 최적화 세션) 소문자 맨몸 나침반 화살표 — \searrow 등 정상 명령은 역슬래시 가드로 보존 */
  m = m.replace(/(?<![A-Za-z\\])(nearrow|searrow|nwarrow|swarrow)(?![A-Za-z])/g, " \\$1 ");
  /* (2026-08-24 최적화 16회차) angle/triangle이 토크나이저에서 ~ang+le로 쪼개져 le→\leq 오변환된
     `ang \leq {TOM}`·`triang \leq AEF`·`rmang \leq` 계열(#7206·#20906·#16050 실측, 전수 902문항).
     triang을 먼저 잡아야 ang 규칙이 삼각형을 각으로 오변환하지 않는다. */
  m = m.replace(/(?<![A-Za-z\\])(?:rm\s*)?tri\s*ang\s*\\leq\s*/gi, "\\triangle ")   /* (20회차) rmtriang≤ 접착 변형 65문항 */
       .replace(/(?<![A-Za-z\\])(?:rm\s*)?ang\s*\\leq\s*/gi, "\\angle ");
  /* (2026-08-24 최적화 16회차) ⇔(HWP LRightarrow)가 L+\Rightarrow로 분해된 계열
     (#7194·#52212 실측, 전수 168문항) — 동치변형 문맥의 원기호로 복원. */
  m = m.replace(/(?<![A-Za-z\\])L\s*\\Rightarrow(?![A-Za-z])/g, "\\Leftrightarrow");
  /* (2026-08-24 최적화 세션) 행렬 열벡터 binom{..}{..} 백슬래시 소실 — 전수 13문항(#6618·#6620·#6627 계열).
     뒤에 { 가 따라올 때만 복원해 일반 영단어 오탐을 차단한다. */
  m = m.replace(/(?<![A-Za-z\\])binom(?=\s*\{)/g, "\\binom");
  /* (2026-08-24 최적화 세션) ASCII 합성 부등호 <= / >= — 정답·해설의 &lt;= 계열(#70609 실측).
     수식 세그먼트는 <가 &lt;로 이스케이프된 채 들어오므로 엔티티형까지 함께 잡는다.
     < 와 = 사이 공백만 허용해 `A<B, C=D` 같은 독립 관계식 나열은 건드리지 않는다. */
  m = m.replace(/(?:<|&lt;)\s*=(?!=)/g, " \\leq ").replace(/(?:>|&gt;)\s*=(?!=)/g, " \\geq ");
  /* (2026-08-24 최적화 세션) HWP 프라임 오형 `f^ '(x)` — ^ 뒤 그룹 없이 '가 와서 KaTeX
     "Expected group after ^" (#46140·#10024732 실측, 전수 33건). ^만 걷어내면 KaTeX 후위 '가 프라임 처리. */
  m = m.replace(/\^\s*(?=')/g, "");
  // ④ 맨몸 집합·관계 키워드(대문자) — SUBSET·EMPTYSET·IN·NOTIN 등(진단 SQL 실측)
  m = m.replace(/(?<![A-Za-z\\])SUBSET(?![A-Za-z])/g," \\subset ").replace(/(?<![A-Za-z\\])SUPSET(?![A-Za-z])/g," \\supset ")
       .replace(/(?<![A-Za-z\\])NOTIN(?![A-Za-z])/g," \\notin ").replace(/(?<![A-Za-z\\])EMPTYSET(?![A-Za-z])/g," \\varnothing ")
       .replace(/(?<![A-Za-z\\])NEQ(?![A-Za-z])/g," \\neq ").replace(/(?<![A-Za-z\\])LEQ(?![A-Za-z])/g," \\leq ")
       .replace(/(?<![A-Za-z\\])GEQ(?![A-Za-z])/g," \\geq ").replace(/(?<![A-Za-z\\])IN(?![A-Za-z])/g," \\in ");
  // (2026-08-06 표시검수 반려 #13890) HWP 키워드가 소문자로 내려온 AsubsetB 계열.
  m = m.replace(/(?<![A-Za-z\\])subset(?![A-Za-z])/gi, " \\subset ")
       .replace(/(?<![A-Za-z\\])supset(?![A-Za-z])/gi, " \\supset ")
       .replace(/([A-Za-z0-9}])subset([A-Z])(?![A-Za-z])/g, "$1 \\subset $2")
       .replace(/([A-Za-z0-9}])supset([A-Z])(?![A-Za-z])/g, "$1 \\supset $2");
  m = m.replace(/([a-z0-9}])NOTIN([A-Z])(?![A-Za-z])/g, "$1 \\notin $2");
  m = m.replace(/(?<![A-Za-z\\])NOTIN([A-Z])(?![A-Za-z])/g, "\\notin $1");
  m = m.replace(/([a-z0-9}])SUBSET([A-Z])(?![A-Za-z])/g, "$1 \\subset $2");
  m = m.replace(/([a-z0-9}])IN([A-Z])(?![A-Za-z])/g, "$1 \\in $2");
  m = m.replace(/(?<![A-Za-z\\])IN([A-Z])(?![A-Za-z])/g, "\\in $1");
  // (2026-07-28 재웅 실측 #12829 "x inX") 소문자 원소기호 — 대문자 IN 규칙만 있어 `x inX`·`x in X` 가 그대로 노출됐다.
  // 뒤가 '단독 대문자(집합 이름)' 일 때만 잡는다. \in·\int·\infty·\sin·\min·\begin 은 앞글자/역슬래시 가드로 제외.
  m = m.replace(/(?<![A-Za-z\\])in\s*(?=[A-Z](?![a-z]))/g, "\\in ");
  /* (2026-08-06 전수검수) HWP 괄호 제어어가 구분자 이름과 함께 맨몸으로 남은 꼴.
     leftlbracea_n/right rbrace(#5742)와 LEFT \,(...)(#8952)를 실제 LaTeX 구분자로 복원한다. */
  m = m.replace(/(?<![A-Za-z\\])(?:LEFT|left)\s*(?:\\[,;:!]\s*)*(?:lbrace|\\lbrace)/g,"\\left\\{")
       .replace(/(?<![A-Za-z\\])(?:RIGHT|right)\s*(?:\\[,;:!]\s*)*(?:rbrace|\\rbrace)/g,"\\right\\}")
       .replace(/(?<![A-Za-z\\])(?:LEFT|left)\s*(?:\\[,;:!]\s*)*(?=[([{])/g,"\\left")
       .replace(/(?<![A-Za-z\\])(?:RIGHT|right)\s*(?:\\[,;:!]\s*)*(?=[)\]}])/g,"\\right");
  /* HWP의 right 중괄호가 별도 그룹으로 감싸진 `{\\right\\}}`는 KaTeX가
     그룹 안에서 짝 없는 \\right를 만나 중단한다. 안쪽 그룹만 벗겨 짝을 복원한다. */
  m = m.replace(/\{\\right\\\}\}/g,"\\right\\}");
  m = m.replace(/(?<![A-Za-z\\])RIGHT(?=\s*[)\]}|.])/g,"\\right").replace(/(?<![A-Za-z\\])LEFT(?=\s*[([{|.])/g,"\\left");
  /* 짝이 될 구분자 없이 남은 LEFT/RIGHT는 연산자가 아니라 파서 제어어다.
     `f(x) RIGHT =`, `|a RIGHT |`, 집합 뒤 `RIGHT .`처럼 글자로 노출되므로 수식 안에서만 제거한다. */
  m = m.replace(/(?<![A-Za-z\\])(?:LEFT|RIGHT)(?![A-Za-z])/g," ");
  /* 붙어 내려온 비교·집합 키워드: x gea → x \ge a, A subsetB → A \subset B. */
  m = m.replace(/(?<![A-Za-z\\])ge([A-Za-z])(?![A-Za-z])/g,"\\ge $1")
       .replace(/(?<![A-Za-z\\])le([A-Za-z])(?![A-Za-z])/g,"\\le $1")
       .replace(/(?<![A-Za-z\\])subset(?=[A-Z](?![a-z]))/gi,"\\subset ")
       .replace(/(?<![A-Za-z\\])supset(?=[A-Z](?![a-z]))/gi,"\\supset ");
  /* 문단/수식 span 경계가 집합 제시법 한가운데를 자른 경우, 다음 span의 고아 \right는
     짝맞춤을 시도하지 않고 보이는 닫는 괄호로 낮춘다(#8375). */
  m = m.replace(/^(\s*)\\right\s*(\\[}\]])/, "$1$2");
  /* ④b (2026-07-30 전체점검) HWP 행렬 잔재 — 반려 #12147·#12163 "행렬기호 안에 r"
     HWP 는 정렬을 rmatrix·lmatrix·cmatrix 로 지정하는데, 변환기가 앞 낱글자를 떼어내
     `\left( r \begin{matrix}` 처럼 남겨 두어 괄호 안에 변수 r 이 찍혔다(실측 items 7·미러 21문항).
     또 열 구분자가 `&&` 로 겹쳐 KaTeX 가 빈 열을 하나 더 만들었다(2열 행렬이 3열로 벌어짐). */
  /* (2026-08-03 페이블 — 재웅 신고 #7717 문제은행 카드 "eqalign" 노출) HWP 조각함수 스켈레톤
     `{\begin{cases}\,&\, \\ eqalign{\, \\ \,}&\,\end{cases}}` 은 내용 없는 장식(세로 중괄호)인데
     eqalign 이 KaTeX 미정의 명령이라 이탤릭 문자가 그대로 찍혔다(실측 raw·body_html 각 54문항).
     내용이 \, & \\ eqalign{} 뿐인 스켈레톤만 세로로 늘인 왼쪽 중괄호로 치환한다(정상 cases 는 불변). */
  m = m.replace(/\{?\s*\\begin\{cases\}(?:[\s\\,]|&amp;|&)*eqalign\s*\{(?:[\s\\,]|&amp;|&)*\}(?:[\s\\,]|&amp;|&)*\\end\{cases\}\s*\}?/g,
        "\\left\\{\\rule{0pt}{2.2em}\\right.");
  m = fixEqalignCases(m);                       /* (2026-08-03b) 내용형 cases 의 eqalign 래퍼 복원 */
  m = m.replace(/(?<![A-Za-z\\])eqalign\s*(?=\{)/g, "");  /* 그래도 남으면 이름만 지운다(그룹은 유지) */
  /* (2026-08-06 전수검수 #8952) cases의 한 행 안에서 시작한 \left(를 환경 밖의
     \right.로 닫으면 KaTeX가 환경 경계를 넘는 구분자를 거부한다. 그 행만 고정 크기 괄호로 낮춘다. */
  m = m.replace(/\\begin\{cases\}([\s\S]*?)\\left\s*\(([\s\S]*?)\)\\end\{cases\}\s*\\right\./g,
        "\\begin{cases}$1\\bigl($2\\bigr)\\end{cases}");
  /* (2026-08-06 전수검수 #12585) 박스 앞 그룹이 \left. … \right) 바깥에서 닫힌 교차 중괄호.
     동일 세그먼트에 invisible-left와 boxed가 함께 있을 때만 불필요한 바깥 그룹을 걷는다. */
  if(/\\left\.\s*\([\s\S]*\\boxed/.test(m)){
    m=m.replace(/(\\left\.\s*\(\s*(?:\\,\s*)*)\{(?=\\boxed)/,"$1")
       .replace(/\\right\)\}/g,"\\right)");
  }
  m = m.replace(/(\\left\s*(?:\(|\[|\\\{|\\lbrace|\\vert|\|)\s*)[rlc](?=\s*\\begin\{(?:matrix|array)\})/g, "$1");
  m = m.replace(/\\begin\{(matrix|array|cases|aligned|pmatrix|bmatrix|vmatrix)\}([\s\S]*?)\\end\{\1\}/g,
        function(_a, env, inner){
          return "\\begin{"+env+"}"+inner.replace(/(?:&amp;|&)(?:\s*(?:&amp;|&))+/g,"&")+"\\end{"+env+"}";
        });
  // ⑤ over 분수(HWP): pi over 2 · piover2 · a over b → \frac{}{} (수식 세그 안이라 안전)
  m = m.replace(/(?<![A-Za-z])\\?pi\s*over\s*(\d+)/g,"\\frac{\\pi}{$1}").replace(/([A-Za-z0-9]+)\s+over\s+([A-Za-z0-9]+)/g,"\\frac{$1}{$2}");
  /* (2026-08-24 클로드 최적화) 중괄호 피연산자 over — `{1} over {a_{3n}}`(트랙B 표본 #34142 등).
     KaTeX에 맨몸 over는 없으므로 HWP 분수로 확정. \large는 수식 모드 미지원 크기 힌트라 제거(#10014112 lim). */
  m = m.replace(/\{((?:[^{}]|\{[^{}]*\})*)\}\s+over\s+\{((?:[^{}]|\{[^{}]*\})*)\}/g,"\\frac{$1}{$2}");
  m = m.replace(/\\large(?![A-Za-z])\s*/g,"");

  m = m.replace(/(angle|ANGLE|triangle|TRIANGLE)(?:rm|RM|it|IT|bf|BF)(?![a-z])/g, "$1"); // anglerm → angle
  // (2026-07-11) ★맨몸 HWP 키워드 수선 규칙들의 가드 통일: 종전 `(?:\b|(?<=[^A-Za-z\\]))` 는
  // \b 분기가 백슬래시 직후에도 성립해(\와 a 사이가 단어경계) 정상 `\angle`을 `\\angle`
  // (LaTeX 줄바꿈+맨글자)로 이중화 — 승인 큐 실측(상산고 19·22번 ∠·△ 깨짐). 코워크 골든셋은
  // 애초에 정상 `\angle`로 저장되므로, '백슬래시·글자 앞엔 손대지 않는다' 부정형 lookbehind 로.
  m = m.replace(/(?<!\\)\bvert\b/g, "\\mid");                                   // 조건부확률 |
  m = m.replace(/(?<![A-Za-z\\])(?:vec|VEC)\s*\{?(?:rm|RM|it|IT)?([A-Za-z]{1,3})\}?/g, "\\vec{$1}");
  m = m.replace(/(?<![\\A-Za-z])right(?=\s*[)\]}|.])/g, "\\right").replace(/(?<![\\A-Za-z])left(?=\s*[([{|.])/g, "\\left");
  m = m.replace(/(?<![A-Za-z\\])(?:rm|it|bf|RM|IT|BF)(?=[a-z](?![a-z]))/g, "");   // ita → a
  m = m.replace(/(?<![A-Za-z\\])(?:rm|it|bf)(?=angle|triangle|bar|hat|vec|[A-Z])/g, "");
  /* 출판사 HWP 미주의 글꼴 명령: bold{x}는 LaTeX 명령이 아니므로 변수 굵게로 표준화한다. */
  m = m.replace(/(?<![A-Za-z\\])bold\s*\{/gi,"\\mathbf{");
  m = m.replace(/(?<![A-Za-z])([A-Z])(CUP|CAP)([A-Z])(?![A-Za-z])/g, (mm,a,op,b)=>a+" \\c"+op.slice(1).toLowerCase()+" "+b);
  m = m.replace(/(?<![A-Za-z\\])(?:(?:rm|it|bf))?bar\s*\{?([A-Za-z]{1,4})\}?/g, "\\overline{$1}");
  /* (2026-07-30 재웅 실측 #15542 "\\PA \\PB \\AB 가 빨갛게 원문 노출") HWP 변환기가 bar PA 를
     \overline{\PA} 로 만들면서 인자 안에 잉여 백슬래시를 붙였다. \PA 는 정의된 명령이 아니라
     KaTeX 가 통째로 포기하고 원문을 그대로 찍는다. 선분·벡터·모자 표기 인자 안의 잉여 백슬래시 제거(실측 11문항). */
  m = m.replace(/(\\(?:overline|underline|vec|hat|widehat|widetilde|overrightarrow)\s*\{)\s*\\([A-Za-z]{1,4})\s*\}/g, "$1$2}");
  m = m.replace(/(?<![A-Za-z\\])(angle|ANGLE|triangle|TRIANGLE)(?![a-z])\s*/g, (mm,g)=>"\\"+g.toLowerCase()+" ");
  // (2026-07-13) 수식 세그 안 맨몸 한글 → \text{} (KaTeX math mode 한글 파싱 실패 방지)
  { const _kp=[];
    m = m.replace(/\\text\s*\{[^{}]*\}/g, s=>{_kp.push(s);return ""+(_kp.length-1)+"";});
    m = m.replace(/[가-힣]+/g, "\\text{$&}");
    m = m.replace(/(\d+)/g, (_,i)=>_kp[+i]); }
  // (2026-07-19 페이블 — LMS 이식 중 실측) 이스케이프된 \{ \} 는 괄호 글리프 — 그룹으로 세지 않는다.
  //  구판이 이걸 세서 분절 집합 표기($A=\{k \mid k$)에 잉여 } 를 붙여 렌더가 깨졌다.
  m=balanceEnvironments(m);
  let open=0, out="";
  for(let _i=0;_i<m.length;_i++){
    const ch=m[_i];
    if(ch==="\\"){ out+=ch+(m[_i+1]??""); _i++; continue; }   // \{ \} \\ 등 이스케이프 쌍 통과
    if(ch==="{") open++;
    else if(ch==="}"){ if(open===0) continue; open--; }   // 고아 닫는 괄호 제거
    out+=ch;
  }
  out += "}".repeat(open);                                 // 부족한 닫는 괄호 보충
  /* 잘린 원문에서 left/right 수가 다르면 그룹 경계를 넘어 짝을 만들지 않는다.
     크기만 유지하는 bigl/bigr로 낮추면 주변 정상 수식까지 렌더 중단되지 않는다. */
  const nl=(out.match(/\\left\b/g)||[]).length, nr=(out.match(/\\right\b/g)||[]).length;
  if(nl!==nr) out=out.replace(/\\left\s*\./g,"").replace(/\\right\s*\./g,"")
                       .replace(/\\left\b/g,"\\bigl").replace(/\\right\b/g,"\\bigr");
  /* (2026-08-24 클로드 최적화) big 강등 뒤 구분자 사이에 글루(\; \,)가 끼면 KaTeX가
     구분자를 못 찾아 중단(트랙B 표본 실측 `\bigr \;\}` 6건+). 글루를 구분자 뒤로 미룬다. */
  out=out.replace(/\\(bigl|bigr)\s*((?:\\[,;]\s*)+)(?=[()\[\]{}|]|\\[{}|])/g,"\\$1");
  /* (2026-08-24) 공백 낀 이중 프라임 `f ' ' (x)` — KaTeX Double superscript 오류(표본 실측 5건+) */
  out=out.replace(/'\s+(?=')/g,"'");
  out=out.replace(/[_^]\s*$/g,"");
  /* 표시문법 v1: 좌표·순서쌍·함수 인수의 괄호 안쪽은 붙이고, 쉼표 뒤에는
     얇은 공백 하나만 둔다. \text{} 안의 문장부호는 보호한다.
     예: ( 3 ,0 ) / (3,\;0) → (3,\, 0). 문제은행과 조판이 같은 함수를 쓴다. */
  { const _pun=[];
    out=out.replace(/\\(?:text|operatorname|mathrm)\s*\{[^{}]*\}/g,s=>{_pun.push(s);return ""+(_pun.length-1)+"";});
    /* HWP/OCR이 `left`를 `le ft`로 분절한 꼴. 관계식 `\\le`가 아니라 바로
       여는 구분자가 뒤따를 때만 복구하여 실제 부등호에는 영향을 주지 않는다. */
    out=out.replace(/\\le\s*ft\s*(?=[([{])/g,"\\left");
    /* HWP가 모든 토큰 사이에 넣은 얇은 공백은 TeX 자체 연산자 간격과 중복된다. */
    out=out.replace(/([A-Za-z])\s*(?:\\,\s*)*'\s*(?:\\,\s*)*(?=\\left\s*\()/g,"$1'");
    out=out.replace(/(?:\\,\s*)+(?=\\(?:left|bigl)\s*[([{])/g,"");
    out=out.replace(/(\\(?:right|bigr)\s*[)\]}])(?:\s*\\,)+/g,"$1");
    out=out.replace(/(?:\\,\s*)*([=+\-<>])(?:\s*\\,\s*)*/g," $1 ");
    /* `\\le` 대안이 `\\left`의 앞 두 글자를 먹지 않도록 명령 경계를 강제한다. */
    out=out.replace(/(?:\\,\s*)*(\\(?:geq|leq|neq|ge|le|ne|rightarrow|to))(?![A-Za-z])(?:\s*\\,\s*)*/g," $1 ");
    /* `\\,` 자체의 comma를 다시 잡으면 렌더할 때마다 `\\, \\, ...`가 늘어난다.
       이 규칙은 반드시 일반 문장부호 comma만 대상으로 하여 멱등성을 지킨다. */
    out=out.replace(/(?<!\\)\s*,\s*(?![,.;:])/g,",\\, ");
    out=out.replace(/(?:\\,\s*){2,}/g,"\\, ");
    out=out.replace(/(\\left\s*\(|\\bigl\s*\(|\()\s*(?:\\[,;]\s*)?/g,"$1");
    out=out.replace(/(?:\\[,;]\s*)?\s*(\\right\s*\)|\\bigr\s*\)|\))/g,"$1");
    out=out.replace(/(\d+)/g,(_,i)=>_pun[+i]); }
  return out.replace(/[ \t]{2,}/g," ").trim();
}
/* ── (2026-07-30 재웅) 한글 수식 입력 문법 → LaTeX (사용자 직접 입력용) ──
   수학그림툴 라벨에서 "한글 수식 편집창 내용을 그대로 복사·붙여넣기" 하고 싶다는 요구.
   repairMathSeg 와 목적이 다르다:
     · repairMathSeg = 이미 적재된 데이터의 **잔재 수선**(rm·it 는 오염이라 제거한다)
     · hwpInputToTex = 사람이 방금 입력한 한글 수식 → 표시 (rm·it 는 **서체 지정이라 살린다**)
   그래서 별도 함수로 둔다. 한글 수식 문법 신호가 없으면(이미 LaTeX 로 보이면) 원문을 건드리지 않는다 —
   그림툴이 자체 생성하는 라벨(\\frac·\\log_{3} 등)이 망가지지 않게 하는 안전장치. */
/* 한글 수식 고유 신호만 넣는다 — LaTeX 에도 흔한 \sin·\log 같은 건 신호로 쓰면 이미 LaTeX 인 라벨을
   건드리게 되므로, '백슬래시 없는 맨몸' 형태일 때만 신호로 인정한다. */
var HWP_SIG = /(?:^|[^A-Za-z\\])(?:LEFT|RIGHT|rm|it|bf|TIMES|DIVIDE|CDOT|CIRC|BULLET|INFTY|INF|LEQ|GEQ|NEQ|SUBSET|SUPSET|EMPTYSET|NOTIN|CUP|CAP|RARROW|LARROW|LRARROW|PERP|PARALLEL|EQUIV|PLUSMINUS|MINUSPLUS|SMALLINTER|SMALLUNION|from|to|of|over|sqrt|sum|prod|int|lim|bar|vec|angle|triangle|cup|cap|circ|times|infty|pi|alpha|beta|gamma|theta|lambda|sigma|phi|omega|sup|sub|sin|cos|tan|cot|sec|csc|log|ln|exp|cdots|ldots|mat|pile)(?![A-Za-z])|(?:^|[^A-Za-z\\])(?:rm|it|bf)[A-Za-z가-힣]|[~`]/;
/* 한글 수식은 함수·기호를 백슬래시 없이 쓴다(sqrt·sum·pi…). 앞에 백슬래시가 없을 때만 붙여 준다.
   bar·vec·angle·triangle 은 repairMathSeg 가 '맨몸' 상태를 기대하므로 여기서 건드리지 않는다. */
var HWP_BARE = ['sqrt','sum','prod','int','oint','lim','log','ln','exp','sin','cos','tan','cot','sec','csc',
                'alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda',
                'mu','nu','xi','rho','sigma','tau','upsilon','phi','chi','psi','omega',
                'Gamma','Delta','Theta','Lambda','Sigma','Phi','Psi','Omega','pi','infty',
                'cdots','ldots','vdots','ddots','partial','nabla','max','min','gcd','deg'];
function hwpInputToTex(s){
  s = String(s == null ? '' : s);
  /* HWP의 `rm bar PR`은 bar만 로만체라는 뜻이 아니라 PR을 로만체로 둔
     선분 표기다. 표시 전처리가 bar를 먼저 `\overline`으로 바꾼 경로도 받는다. */
  s = s.replace(/(?<![A-Za-z\\])rm\s+(?:bar|overline)\s*\{?\s*([A-Za-z]{1,6})\s*\}?/gi,
                '\\overline{\\mathrm{$1}}')
       .replace(/(?<![A-Za-z\\])rm\s+\\overline\s*\{\s*([A-Za-z]{1,6})\s*\}/gi,
                '\\overline{\\mathrm{$1}}');
  /* 글꼴 토큰이 괄호 전체에 붙은 `it LEFT(...)`뿐 아니라, 적재 과정에서
     LEFT/RIGHT만 먼저 정리된 `it (...)`도 같은 의미다. 좌표식 앞의 고아
     it/rm/bf를 제거해 리터럴 명령어가 남지 않게 한다. */
  s = s.replace(/(?<![A-Za-z\\])(?:rm|it|bf)\s+(?=(?:LEFT|RIGHT)\b|\\(?:left|right)\b|[([{])/gi,'');
  s = s.replace(/^\s*&(?:amp;)+\s*(?==)/i,'').replace(/^\s*&\s*(?==)/,'');
  s = s.replace(/\{\s*overline\s*\{\s*(?:rm|it|bf)?\s*([A-Za-z]{1,6})\s*\}\s*\}\s*over\s*\{([^{}]*)\}/gi,
                '\\frac{\\overline{$1}}{$2}');
  s = s.replace(/(?<![A-Za-z\\])overline\s*\{\s*(?:rm|it|bf)?\s*([A-Za-z]{1,6})\s*\}/gi,'\\overline{$1}');
  if(!HWP_SIG.test(s)) return s;                       // 이미 LaTeX — 그대로 둔다
  /* 괄호가 생략된 1+2x^2 분모는 아래 단일 토큰 over 규칙보다
     먼저 묶어야 `4x/1 + 2x^2`로 잘못 분리되지 않는다. */
  s = s.replace(/([0-9A-Za-z{}'^]+)\s*over\s*1\s*\+\s*2x\s*\^\s*\{?2\}?/g,
                '\\frac{$1}{1+2x^{2}}');
  // ① 서체: rm{...}·rm X → \mathrm, it{...}·it X → \mathit (제거하지 않는다)
  s = s.replace(/(?<![A-Za-z\\])rm\s*\{([^{}]*)\}/g, '\\mathrm{$1}')
       .replace(/(?<![A-Za-z\\])it\s*\{([^{}]*)\}/g, '\\mathit{$1}')
       .replace(/(?<![A-Za-z\\])bf\s*\{([^{}]*)\}/g, '\\mathbf{$1}')
       .replace(/(?<![A-Za-z\\])rm\s+([A-Za-z가-힣][A-Za-z가-힣0-9]*)/g, '\\mathrm{$1}')
       .replace(/(?<![A-Za-z\\])it\s+([A-Za-z][A-Za-z0-9]*)/g, '\\mathit{$1}')
       .replace(/(?<![A-Za-z\\])bf\s+([A-Za-z][A-Za-z0-9]*)/g, '\\mathbf{$1}')
       /* (2026-07-30 재웅) "rmA" 처럼 공백 없이 붙여 쓴 꼴 — 한글 수식 편집기도 rm 을 토큰으로 떼어 읽는다.
          앞에 글자가 있으면(form·term·norm·limit…) 건드리지 않는다. */
       .replace(/(?<![A-Za-z\\])rm([A-Za-z가-힣][A-Za-z가-힣0-9]*)/g, '\\mathrm{$1}')
       .replace(/(?<![A-Za-z\\])it([A-Za-z][A-Za-z0-9]*)/g, '\\mathit{$1}')
       .replace(/(?<![A-Za-z\\])bf([A-Za-z][A-Za-z0-9]*)/g, '\\mathbf{$1}');
  // ② 한글 수식의 공백 기호: ~ = 보통 공백, ` = 좁은 공백
  s = s.replace(/~/g, '\\; ').replace(/`/g, '\\, ');
  // ③ 공백을 둔 집합 연산 키워드 (repairMathSeg 의 CUP/CAP 규칙은 'ACUPB' 처럼 붙은 꼴만 본다)
  s = s.replace(/(?<![A-Za-z\\])(CUP|cup)(?![A-Za-z])/g, ' \\cup ')
       .replace(/(?<![A-Za-z\\])(CAP|cap)(?![A-Za-z])/g, ' \\cap ');
  // ④ 맨몸 함수·그리스문자에 백슬래시 (sqrt {3} of {4} → \sqrt {3} of {4} → repairMathSeg 가 \sqrt[3]{4} 로)
  s = s.replace(new RegExp('(?<![A-Za-z\\\\])(' + HWP_BARE.join('|') + ')(?![A-Za-z])', 'g'), '\\$1');
  // ④b 한글 수식의 첨자 키워드: sup = 위첨자, sub = 아래첨자
  s = s.replace(/(?<![A-Za-z\\])sup\s*\{([^{}]*)\}/g, '^{$1}')
       .replace(/(?<![A-Za-z\\])sup\s*([A-Za-z0-9]+)/g, '^{$1}')
       .replace(/(?<![A-Za-z\\])sub\s*\{([^{}]*)\}/g, '_{$1}')
       .replace(/(?<![A-Za-z\\])sub\s*([A-Za-z0-9]+)/g, '_{$1}');
  // ⑤ 합기호·극한의 상·하한: from/to. 한글 수식은 중괄호형(from{a} to{b})과
  //    맨몸형(from a to b)을 모두 허용하므로 둘 다 받는다. 화살표 -> 는 \to.
  //    (repairMathSeg 의 from/to 규칙은 \sum·\prod·\int 중괄호형만 보고 나머지 맨몸 from/to 는
  //     '적재 데이터의 오염'으로 보아 지워 버리므로, 사용자 입력 경로에서 먼저 살려 둔다.)
  s = s.replace(/-+>/g, ' \\to ').replace(/\u2192/g, ' \\to ');
  var OPS = 'lim|limsup|liminf|sum|prod|int|oint|iint|iiint|max|min|bigcup|bigcap';
  var NOTTO = '(?!to(?![A-Za-z0-9]))';
  s = s.replace(new RegExp('\\\\(' + OPS + ')\\s*from\\s*\\{([^{}]*)\\}\\s*to\\s*\\{([^{}]*)\\}', 'g'), '\\$1_{$2}^{$3}')
       .replace(new RegExp('\\\\(' + OPS + ')\\s*from\\s*\\{([^{}]*)\\}', 'g'), '\\$1_{$2}')
       .replace(new RegExp('\\\\(' + OPS + ')\\s*to\\s*\\{([^{}]*)\\}', 'g'), '\\$1^{$2}')
       .replace(new RegExp('\\\\(' + OPS + ')\\s+from\\s+' + NOTTO + '([^\\s{}]+)\\s+to\\s+([^\\s{}]+)', 'g'), '\\$1_{$2}^{$3}')
       .replace(new RegExp('\\\\(' + OPS + ')\\s+from\\s+' + NOTTO + '([^\\s{}]+)', 'g'), '\\$1_{$2}')
       .replace(new RegExp('\\\\(' + OPS + ')\\s+to\\s+([^\\s{}]+)', 'g'), '\\$1^{$2}')
       .replace(/_\{([^{}]*)\}\s*to\s*\{([^{}]*)\}/g, '_{$1}^{$2}');
  // ⑤b over 분수: 피연산자가 중괄호({a+b} over {c+d})거나 백슬래시 이름(\\pi over 2)인 꼴까지 받는다.
  var OPD = '(\\{[^{}]*\\}|\\\\?[A-Za-z0-9]+)';
  s = s.replace(new RegExp(OPD + '\\s*over\\s*' + OPD, 'g'), function(_m, a, b){
    var br = function(t){ return /^\{[\s\S]*\}$/.test(t) ? t : '{' + t + '}'; };
    return '\\frac' + br(a) + br(b);
  });
  // ⑤ 나머지(over 분수·LEFT/RIGHT·sqrt of·대문자 연산 키워드·bar·vec·angle…)는 공통 수선에 위임
  return repairMathSeg(s);
}
function repairSegmentKeepDelims(seg){
  // $..$/$$..$$/\(..\)/\[..\] 구분자 보존한 채 내부만 수선
  var m2 = seg.match(/^(\$\$|\$|\\\(|\\\[)([\s\S]*?)(\$\$|\$|\\\)|\\\])$/);
  if(!m2) return repairMathSeg(seg);
  const inner=HWP_SIG.test(m2[2])?hwpInputToTex(m2[2]):repairMathSeg(m2[2]);
  return m2[1] + inner + m2[3];
}
function closeMathDelimiters(value){
  let s=String(value==null?'':value).replace(/[\u200b\u200c\u200d\u2060\ufeff]/g,'');
  const count=rx=>(s.match(rx)||[]).length;
  if(count(/(?<!\\)\\\[/g)>count(/(?<!\\)\\\]/g))s+='\\]';
  if(count(/(?<!\\)\\\(/g)>count(/(?<!\\)\\\)/g))s+='\\)';
  if(count(/(?<!\\)\$\$/g)%2)s+='$$';
  if(count(/(?<![\\$])\$(?!\$)/g)%2)s+='$';
  return s;
}
function repairMathText(value){
  let raw=String(value==null?'':value);
  raw=raw.replace(/\$([^$]+)\$\$([ㄱ-ㅎ]\.)\s*(?:To\s*)?(?:20011|3090280|220134)?\s*\$\$([^$]+)\$/g,
                  function(_a,l,label,r){return "$"+l+"$"+label+" $"+r+"$";});
  raw=raw.replace(/\$\$\s*([ㄱ-ㅎ]\.)\s*(?:To\s*)?(?:20011|3090280|220134)?\s*\$\$/g,"$1 ");
  raw=raw.replace(/\${3,}(?=\s*$)/g,"$");
  /* 행렬 셀 뒤에 HWP 빈칸 토큰이 $$$$$로 저장된 손상본. 수식 구분자가 아니라
     닫는 중괄호 직전의 개체 잔재인 경우에만 제거한다. */
  raw=raw.replace(/(?<=[A-Za-z0-9}])\${3,}(?=\}+)/g,"");
  /* `$1240$$4200$`처럼 인라인 식 두 개가 공백 없이 맞닿으면 가운데 $$를
     display 구분자로 오인한다. 닫는 $ + 여는 $ 경계만 분리한다. */
  raw=raw.replace(/(?<=[A-Za-z0-9}%}\)])\$\$(?=[A-Za-z0-9{\\(=+\-])/g,"$ $");
  /* (2026-08-08b 페이블) 전수검수 실측 — `!$$=`·`\,$$\,`처럼 문자 클래스 밖 경계의 $$도
     인라인 병합 잔재다. 공백 없이 글자 사이에 낀 $$ 전부를 닫는 $ + 여는 $ 로 분리한다.
     (진짜 display $$…$$ 는 항상 공백·행 경계에 있어 영향 없음 — 표본 회귀로 확인) */
  raw=raw.replace(/(?<=[^\s$])\$\$(?=[^\s$])/g,"$ $");
  /* 손상 적재분의 `문장 $$의 ... $P$ ... $$`는 바깥 $$가 여러 정상 인라인 수식을
     한 덩어리 수식으로 삼켜 KaTeX가 내부 $에서 중단한다. 한글 문장과 정상 $...$가
     함께 든 바깥 display 껍데기만 벗기고 내부 수식은 그대로 보존한다. */
  raw=raw.replace(/\$\$([\s\S]*?)\$\$/g,(all,inner)=>/[가-힣]/.test(inner)&&/(?<!\\)\$(?!\$)[\s\S]*?(?<!\\)\$(?!\$)/.test(inner)?inner:all);
  const s=closeMathDelimiters(raw),rx=/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\[\s\S]|[^\\$])*?(?<!\\)\$(?!\$)/g;
  return s.replace(rx,repairSegmentKeepDelims);
}
const MATH_TOKEN_RX=/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\[\s\S]|[^\\$])*?(?<!\\)\$(?!\$)/g;
const IGNORE_TAGS=new Set(['script','noscript','style','textarea','pre','code','option']);
function collectTextNodes(root,out){
  for(const node of Array.from(root.childNodes||[])){
    if(node.nodeType===3){if(node.nodeValue&&/[\$]|\\[\[(]/.test(node.nodeValue))out.push(node);continue}
    if(node.nodeType!==1)continue;
    const tag=String(node.nodeName||'').toLowerCase(),cls=' '+String(node.className||'')+' ';
    if(!IGNORE_TAGS.has(tag)&&!cls.includes(' katex '))collectTextNodes(node,out);
  }
}
function renderTextNode(node,errors){
  const source=repairMathText(node.nodeValue||'');MATH_TOKEN_RX.lastIndex=0;
  let m,last=0,changed=false,frag=document.createDocumentFragment();
  while((m=MATH_TOKEN_RX.exec(source))){
    changed=true;if(m.index>last)frag.appendChild(document.createTextNode(source.slice(last,m.index)));
    const token=m[0],display=token.startsWith('$$')||token.startsWith('\\['),cut=token.startsWith('$$')?2:(token.startsWith('$')?1:2);
    const inner=repairMathSeg(token.slice(cut,token.length-cut)),span=document.createElement('span');
    try{window.katex.render(inner,span,{displayMode:display,throwOnError:true,strict:false,trust:false})}
    catch(e){errors.push(String(e&&e.message||e));try{window.katex.render(inner,span,{displayMode:display,throwOnError:false,strict:false,trust:false})}catch(_e){span.textContent=inner;span.className='katex-error'}}
    frag.appendChild(span);last=MATH_TOKEN_RX.lastIndex;
  }
  if(!changed)return false;
  if(last<source.length)frag.appendChild(document.createTextNode(source.slice(last)));
  const parent=node.parentNode;if(!parent)return false;
  while(frag.firstChild)parent.insertBefore(frag.firstChild,node);
  parent.removeChild(node);return true;
}
function render(root){
  if(!root||!window.katex||typeof window.katex.render!=='function')return {errors:['renderer_unavailable']};
  const errors=[];
  try{document.documentElement.dataset.ngdMathRenderCalls=String((+document.documentElement.dataset.ngdMathRenderCalls||0)+1)}catch(_e){}
  try{const nodes=[];collectTextNodes(root,nodes);let rendered=0;nodes.forEach(node=>{if(renderTextNode(node,errors))rendered++});root.dataset.ngdMathRendered=String(rendered);
      document.documentElement.dataset.ngdMathTextNodes=String(nodes.length);document.documentElement.dataset.ngdMathRendered=String(rendered)}catch(e){errors.push(String(e&&e.message||e))}
  try{document.documentElement.dataset.ngdMathLastErrors=errors.slice(0,3).join(' | ')}catch(_e){}
  return {errors:errors,repaired:true};
}
return { VERSION: VERSION, repairMathSeg: repairMathSeg, repairSegmentKeepDelims: repairSegmentKeepDelims,
         repairMathText: repairMathText, closeMathDelimiters: closeMathDelimiters, render: render,
         hwpInputToTex: hwpInputToTex };
})();

/* (2026-07-17) 페이지 공용 CSS — 선지표 무테두리(.htbl.hnob) */
(function(){try{
  var st=document.createElement('style');
  st.textContent='.htbl.hnob,.htbl.hnob td,.htbl.hnob th{border:none !important}';
  (document.head||document.documentElement).appendChild(st);
}catch(e){}})();
