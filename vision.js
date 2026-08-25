const atoms = [
  {
    id: "substitute",
    code: "A-S-FUN-001",
    type: "S",
    stage: 1,
    name: "특정값 대입으로 항 소거",
    description: "주어진 값을 대입해 불필요한 항을 없애고 계수 관계를 만든다.",
    vector: [0, 1, 1, 0, 0, 1],
  },
  {
    id: "represent",
    code: "A-R-FUN-002",
    type: "R",
    stage: 1,
    name: "교점 개수를 실근 구조로 전환",
    description: "그래프의 교점 정보를 방정식의 실근·중근 조건으로 바꾼다.",
    vector: [0, 1, 1, 2, 0, 0],
  },
  {
    id: "monotonic",
    code: "A-I-CAL-003",
    type: "I",
    stage: 2,
    name: "도함수 부호로 단조구간 확정",
    description: "도함수의 영점과 부호 변화에서 극값과 함수의 형태를 추론한다.",
    vector: [1, 1, 2, 0, 1, 0],
  },
  {
    id: "integer",
    code: "A-C-ALG-004",
    type: "C",
    stage: 3,
    name: "정수 조건으로 후보 필터",
    description: "연속 범위로 얻은 매개변수 후보를 정수성으로 유한 집합까지 줄인다.",
    vector: [0, 1, 1, 0, 2, 1],
  },
  {
    id: "coefficient",
    code: "A-M-ALG-005",
    type: "M",
    stage: 4,
    name: "계수비교로 미지량 결정",
    description: "항등식의 동차항 계수를 비교해 남은 미지수를 계산한다.",
    vector: [1, 1, 0, 0, 0, 2],
  },
  {
    id: "boundary",
    code: "A-T-FUN-006",
    type: "T",
    stage: 5,
    name: "경계값·중근 누락 점검",
    description: "부등식의 경계와 중근을 제외해 생기는 대표 오답을 마지막에 검증한다.",
    vector: [0, 1, 1, 0, 1, 1],
  },
];

const selected = new Set(["represent", "monotonic", "integer"]);
const $ = (selector) => document.querySelector(selector);
const controls = { hint: $("#hint"), branch: $("#branch"), calc: $("#calc") };
const labels = {
  hint: ["직접 제시", "부분 암시", "암시 제거"],
  branch: ["단일 경로", "2~3개", "다중 분기"],
  calc: ["정리된 수치", "보통", "고위험 계산"],
};

function selectedAtoms() {
  return atoms.filter((atom) => selected.has(atom.id)).sort((a, b) => a.stage - b.stage);
}

function renderAtomList() {
  const list = $("#atomList");
  list.innerHTML = "";
  for (const atom of atoms) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `atom-card${selected.has(atom.id) ? " selected" : ""}`;
    button.setAttribute("aria-pressed", String(selected.has(atom.id)));
    button.innerHTML = `<header><span>${atom.code}</span><b>${atom.type} · ${atom.name}</b></header><p>${atom.description}</p>`;
    button.addEventListener("click", () => {
      if (selected.has(atom.id)) selected.delete(atom.id);
      else selected.add(atom.id);
      render();
    });
    list.append(button);
  }
}

function vectorFor(items) {
  const score = [0, 0, 0, 0, 0, 0];
  for (const atom of items) atom.vector.forEach((value, index) => { score[index] += value; });
  score[1] += Math.max(0, items.length - 2);
  score[2] += Number(controls.hint.value) - 1;
  score[4] += Number(controls.branch.value) - 1;
  score[5] += Number(controls.calc.value) - 1;
  return score.map((value) => Math.max(0, Math.min(4, value)));
}

function difficultyLabel(vector) {
  const [K, L, I, R, B, A] = vector;
  const raw = 0.15 * K + 0.20 * L + 0.25 * I + 0.15 * R + 0.10 * B + 0.15 * A;
  const level = Math.max(1, Math.min(5, 1 + Math.round(raw)));
  return [`기초 확인 · ${level}/5`, `개념 적용 · ${level}/5`, `중간 탐색 · ${level}/5`, `고난도 탐색 · ${level}/5`, `최상위 탐색 · ${level}/5`][level - 1];
}

function compatibility(items) {
  if (items.length < 2) return { type: "warn", text: "원자 2개 이상을 선택해야 재조합 관계를 볼 수 있습니다." };
  if (items.length > 4) return { type: "warn", text: "파일럿 권장 범위인 필수 원자 2~4개를 넘었습니다. 과잉조건과 계산 팽창을 확인하세요." };
  if (!items.some((atom) => atom.stage === 1)) return { type: "warn", text: "풀이에 진입할 전략(S) 또는 표현 전환(R)이 없습니다." };
  if (!items.some((atom) => atom.stage === 2)) return { type: "warn", text: "핵심 결론을 만드는 추론(I)이 없어 계산형 문항이 될 가능성이 큽니다." };
  return { type: "ok", text: "앞 원자의 결과를 다음 원자의 조건으로 연결할 수 있습니다. 조건 충돌과 정답이 하나인지 여부는 아직 확인하지 않았습니다." };
}

function draftFor(items) {
  const ids = new Set(items.map((atom) => atom.id));
  const hint = Number(controls.hint.value);
  const branch = Number(controls.branch.value);
  const calc = Number(controls.calc.value);
  const lines = ["대상: 수학Ⅱ · 다항함수 / 목표: 매개변수 결정"];

  if (!items.length) {
    return { title: "원자를 선택하면 설계 초안이 만들어집니다.", body: "왼쪽 카드에서 풀이의 역할이 다른 원자 2~4개를 골라 보세요." };
  }

  lines.push("기본 객체: 최고차항 계수가 1인 삼차함수 $f(x)$와 정수 $k$");
  if (ids.has("represent")) lines.push("조건: $y=f(x)$와 $y=kx$의 교점 개수를 주고, $f(x)-kx=0$의 실근 구조로 전환하게 한다.");
  if (ids.has("substitute")) lines.push("조건: $f(1)$과 $f(-1)$의 값을 배치해 특정 항을 소거하고 계수 관계를 얻도록 한다.");
  if (ids.has("monotonic")) {
    const cue = ["도함수의 부호표를 직접 제공한다.", "도함수의 두 영점만 암시한다.", "극값 구조를 발문에서 숨긴다."][hint];
    lines.push(`핵심 추론: ${cue} 단조구간과 극값의 위치를 스스로 확정하게 한다.`);
  }
  if (ids.has("integer")) lines.push(`제약: $k\\in\\mathbb{Z}$를 적용해 ${["하나의 구간", "겹치는 두 구간", "여러 경계 구간"][branch]}에서 가능한 값만 남긴다.`);
  if (ids.has("coefficient")) lines.push(`계산: ${["대칭적인 계수", "일반 계수", "분수·비대칭 계수"][calc]}를 사용해 항등식의 계수를 비교한다.`);
  if (ids.has("boundary")) lines.push("검산: 경계에서 생기는 중근을 교점 하나로 세는지 확인하고, 후보를 원식에 다시 대입한다.");

  const selectedNames = items.map((atom) => atom.name.replace(/으로|로|해|를/g, "")).slice(0, 3).join(" · ");
  return {
    title: `${selectedNames}을 순서대로 사용한 문제 제작 조건`,
    body: `${lines.join("\n\n")}\n\n발문 후보: 위 조건을 만족시키는 정수 $k$의 값을 구하도록 하되, 앞 원자에서 얻은 결과가 다음 원자의 조건으로 쓰이게 배치한다.\n\n※ 이것은 AI에 전달할 제작 조건이다. AI가 수치와 표현을 바꾼 뒤 정답이 하나인지, 교육과정에 맞는지, 원문과 지나치게 비슷하지 않은지 강사가 확인한다.`,
  };
}

function renderDraftMath(element, text) {
  element.textContent = text;
  if (typeof window.renderMathInElement !== "function") return;
  window.renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
}

function render() {
  renderAtomList();
  const items = selectedAtoms();
  const check = compatibility(items);
  const checkNode = $("#compatibility");
  checkNode.className = `compatibility ${check.type}`;
  checkNode.textContent = check.text;

  const chain = $("#chain");
  chain.innerHTML = "";
  if (!items.length) chain.textContent = "선택된 원자 없음";
  items.forEach((atom, index) => {
    if (index) chain.insertAdjacentHTML("beforeend", "<i>→</i>");
    const node = document.createElement("span");
    node.textContent = `${atom.type} ${atom.name}`;
    chain.append(node);
  });

  const vector = vectorFor(items);
  $("#levelLabel").textContent = difficultyLabel(vector);
  const vectorNode = $("#vector");
  vectorNode.innerHTML = "";
  ["K", "L", "I", "R", "B", "A"].forEach((label, index) => {
    const node = document.createElement("div");
    node.innerHTML = `<b style="--score:${vector[index]}">${vector[index]}</b><small>${label}</small>`;
    vectorNode.append(node);
  });

  const draft = draftFor(items);
  $("#draftTitle").textContent = draft.title;
  renderDraftMath($("#draftBody"), draft.body);
  for (const name of Object.keys(controls)) $(`#${name}Value`).textContent = labels[name][Number(controls[name].value)];
}

const presets = {
  entry: { atoms: ["substitute", "monotonic", "coefficient"], hint: 0, branch: 0, calc: 0 },
  reasoning: { atoms: ["represent", "monotonic", "integer"], hint: 2, branch: 1, calc: 0 },
  fusion: { atoms: ["represent", "monotonic", "integer", "boundary"], hint: 2, branch: 2, calc: 1 },
};

document.querySelectorAll(".controls input").forEach((input) => input.addEventListener("input", render));
document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = presets[button.dataset.preset];
    selected.clear();
    preset.atoms.forEach((id) => selected.add(id));
    controls.hint.value = preset.hint;
    controls.branch.value = preset.branch;
    controls.calc.value = preset.calc;
    render();
  });
});

render();
