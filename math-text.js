/* 평문 속 수식 조각을 KaTeX용 $…$로 감싼다.
 * 이미 $…$가 있는 텍스트는 그대로 두고, 한글 사이의 수식 토막(∫_a^x f(t)dt, f'(0)>1, |x|/x, p=1 등)만 찾는다.
 * window.PAMath.mathify(text) → HTML-escaped 문자열(수식은 $…$ 그대로). window.PAMath.render(node)로 KaTeX auto-render.
 */
(function () {
  const ESC = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
  const UNICODE = [
    [/∫/g, "\\int "], [/∂/g, "\\partial "], [/≥/g, "\\ge "], [/≤/g, "\\le "], [/≠/g, "\\ne "],
    [/±/g, "\\pm "], [/·/g, "\\cdot "], [/×/g, "\\times "], [/∈/g, "\\in "], [/∞/g, "\\infty "],
    [/⇔/g, "\\Leftrightarrow "], [/⇒/g, "\\Rightarrow "], [/α/g, "\\alpha "], [/β/g, "\\beta "], [/γ/g, "\\gamma "],
    [/²/g, "^2"], [/³/g, "^3"], [/√/g, "\\sqrt "],
  ];
  // 수식 토막: 라틴 문자·숫자·연산자·괄호·그리스 문자·특수 기호의 연속
  const RUN = /[A-Za-z0-9αβγ∫∂∑√∞≥≤≠±·×∈⇔⇒²³^_{}()\[\]|'=+\-*\/<>,.\s]+/g;
  const NEEDS = /[=<>^_∫∂≥≤≠±²³√]|\|[^|]+\||[A-Za-z]'?\(/;
  const IDLIKE = /^(PA|KICE|SEMINAR|CAL|FUN|ALG|SEQ|GEO|VEC|PROB|STAT|LOGIC|COMMON|JSON|PDF|HWPX|AI|Q\d)[A-Z0-9\-]*$/;

  function toLatex(run) {
    let text = run;
    UNICODE.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
    text = text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
    // f(x)^4, x^2 처럼 ^ 뒤 한 글자는 그대로 두고, ^{…}는 위에서 \{로 바뀌었으니 되돌린다
    text = text.replace(/\^\\\{([^}]*)\\\}/g, "^{$1}").replace(/_\\\{([^}]*)\\\}/g, "_{$1}");
    text = text.replace(/\bdt\b/g, "\\,dt").replace(/\bdx\b/g, "\\,dx");
    return text.trim();
  }

  function mathify(value) {
    const text = String(value ?? "");
    if (!text) return "";
    if (text.includes("$")) return ESC(text);
    let out = "";
    let last = 0;
    for (const match of text.matchAll(RUN)) {
      const run = match[0];
      const start = match.index;
      const trimmed = run.trim();
      const isMath = trimmed.length >= 2 && NEEDS.test(trimmed) && !IDLIKE.test(trimmed) && !/^[\d.,\s]+$/.test(trimmed);
      if (!isMath) continue;
      // 앞뒤 공백·문장부호는 수식 밖에 둔다
      const lead = run.length - run.trimStart().length;
      const tail = run.length - run.trimEnd().length;
      let core = run.slice(lead, run.length - tail);
      let trailing = "";
      let leading = "";
      const head = core.match(/^[.,]+\s*/);
      if (head) { leading = head[0]; core = core.slice(head[0].length); }
      const punct = core.match(/[.,]+$/);
      if (punct) { core = core.slice(0, -punct[0].length); trailing = punct[0]; }
      if (!NEEDS.test(core)) continue;
      out += ESC(text.slice(last, start + lead)) + ESC(leading);
      out += "$" + toLatex(core) + "$" + ESC(trailing) + ESC(run.slice(run.length - tail));
      last = start + run.length;
    }
    out += ESC(text.slice(last));
    return out;
  }

  function render(node) {
    if (!node || !window.renderMathInElement) return;
    window.renderMathInElement(node, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }

  window.PAMath = { mathify, render, toLatex };
})();
