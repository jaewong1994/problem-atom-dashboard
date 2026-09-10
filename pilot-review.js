const LABELS = {
  all: "전체",
  concept: "개념",
  decision: "판단",
  skill: "스킬",
  strategy: "전략",
  problem_pattern: "유형",
};
const MARKS = {
  hold: "보류",
  fix: "정정 필요",
  compose_ok: "조합은 가능",
};
const VERDICTS = {
  confirm: "확인",
  fix: "정정 필요",
  hold: "보류",
};
const EPISTEMIC = {
  observed: "관찰",
  derived: "도출",
  hypothesis: "출제 가설",
  unverified: "미확인",
};
const ORIGIN = {
  sheet: "분석지",
  handwritten: "손풀이",
};
const STORAGE_ACTOR = "seminar-actor";
const STORAGE_MARK = "pa-pilot-review-mark";

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

let data = null;
let sheetAuthor = "김연수";
const tex = (value) => (window.PAMath ? window.PAMath.mathify(value) : esc(value));

function renderMath(node) {
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

function actorName() {
  return $("actor").value.trim();
}

function showError(message) {
  const banner = $("loadError");
  banner.hidden = false;
  banner.removeAttribute("aria-hidden");
  banner.querySelector("p").textContent = message;
}

function setMarkStatus(text) {
  $("markStatus").textContent = text;
}

function setReviewSync(text, live = false) {
  const node = $("reviewSync");
  node.textContent = text;
  node.classList.toggle("live", live);
}

function assets() {
  return (data.assets || []).filter((row) => row.kind !== "question");
}

function issuesFor(candidateId) {
  const found = [];
  (data.sheets || []).forEach((sheet) => {
    (sheet.review_issues || []).forEach((issue) => {
      if ((issue.candidate_ids || []).includes(candidateId)) found.push({ ...issue, author: sheet.author });
    });
  });
  return found;
}

function renderStats() {
  const counts = data.counts || {};
  const cards = [
    ["검토 대기 자산", counts.reviewAssets || 0],
    ["분석 문항", counts.reviewQuestions || 0],
    ["검토 쟁점", counts.reviewIssues || 0],
    ["회수된 강사 검토", counts.instructorReviews || 0],
    ["비준 자산", counts.ratified || 0],
    ["배포 문항", counts.publishedItems || 0],
  ];
  $("stats").innerHTML = cards.map(([label, value]) => (
    `<article><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`
  )).join("");
}

function renderAssets() {
  const rows = assets();
  const handwriting = rows.filter((row) => row.from_handwriting || row.origin === "general_notes" || row.origin === "handwritten").length;
  $("queueCount").textContent = `${rows.length}개 후보 · 손글씨·메모 유래 ${handwriting}개 · 정본 아님`;
}

function sheets() {
  return data.sheets || [];
}

function usedMark(usedIn) {
  const match = String(usedIn || "").match(/[①②③④⑤⑥⑦⑧⑨⑩]/);
  return match ? match[0] : "";
}

function stepBlocks(text) {
  const parts = String(text || "").split(/(?=[①②③④⑤⑥⑦⑧⑨⑩])/).map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1 && !/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(parts[0])) {
    return `<p class="sheet-step">${esc(parts[0])}</p>`;
  }
  return parts.map((part) => {
    const mark = /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(part) ? part[0] : "";
    const body = mark ? part.slice(1).trim() : part;
    return `<p class="sheet-step" data-mark="${esc(mark)}">${mark ? `<b>${esc(mark)}</b>` : ""}${esc(body)}</p>`;
  }).join("");
}

function renderSheetFilters() {
  const rows = sheets();
  $("sheetFilters").innerHTML = rows.map((row) => (
    `<button type="button" data-author="${esc(row.author)}" aria-pressed="${sheetAuthor === row.author}">${esc(row.author)}${row.model ? " · 정본" : ""}<i>${(row.review_issues || []).length}</i></button>`
  )).join("");
}

function renderSheet() {
  const rows = sheets();
  const sheet = rows.find((row) => row.author === sheetAuthor) || rows[0];
  if (!sheet) {
    $("sheetView").innerHTML = "<p class=\"empty-note\">기록지가 없습니다.</p>";
    return;
  }
  const boxes = (sheet.concept_boxes || []).map((box) => {
    const mark = usedMark(box.used_in);
    return `
      <article class="concept-box" data-used="${esc(mark)}" tabindex="0">
        <header><span>[개념 ${String(box.slot).padStart(2, "0")}]</span> 이름: <strong>${tex(box.name)}</strong></header>
        <p><b>설명</b> ${tex(box.description)}</p>
        <p class="used-in">사용된 곳: ${esc(box.used_in || "비움")}</p>
      </article>
    `;
  }).join("");
  const margin = (sheet.margin_notes || []).length
    ? `<div class="sheet-margin"><h4>여백 손글씨·전사 밖 메모</h4><ul>${sheet.margin_notes.map((note) => `<li>${tex(note)}</li>`).join("")}</ul></div>`
    : "";
  const issues = (sheet.review_issues || []).length
    ? `<div class="sheet-issues"><h4>검토 쟁점 <i>${sheet.review_issues.length}</i></h4><ol>${sheet.review_issues.map((issue) => `
        <li>
          <b>${esc(issue.label)}</b>
          <span>${tex(issue.text)}</span>
          ${(issue.candidate_ids || []).length ? `<p class="issue-links">${issue.candidate_ids.map((id) => `<button type="button" data-jump="${esc(id)}">${esc(id)}</button>`).join("")}</p>` : ""}
        </li>`).join("")}</ol></div>`
    : "";
  const blockers = (sheet.blockers || []).length
    ? `<p class="sheet-blockers"><b>승격 차단</b> ${sheet.blockers.map((text) => esc(text)).join(" · ")}</p>`
    : "";
  $("sheetView").innerHTML = `
    <header>
      <h3>${esc(sheet.author)}</h3>
      <p>${esc(sheet.exam_label)} · 정답 ${esc(sheet.official_answer)} · 후보 ${esc(sheet.candidate_count ?? "")}개${sheet.model ? " · 기록지 정본" : ""}</p>
    </header>
    <p class="sheet-problem">${esc(sheet.question_text)}</p>
    <div class="sheet-steps" aria-label="풀이과정">${stepBlocks(sheet.solution_text)}</div>
    <div class="concept-boxes">${boxes}</div>
    ${margin}
    ${issues}
    ${blockers}
    ${sheet.form_lesson ? `<p class="sheet-lesson">${esc(sheet.form_lesson)}</p>` : ""}
  `;
  renderMath($("sheetView"));
}

function linkSheet(mark) {
  if (!mark) return;
  $("sheetView").querySelectorAll(".sheet-step, .concept-box").forEach((node) => {
    const linked = node.dataset.mark === mark || node.dataset.used === mark;
    node.classList.toggle("is-linked", linked);
  });
}

function jumpToCandidate(id) {
  window.location.href = `promotion-board.html#cand-${encodeURIComponent(id)}`;
}

function fillItem(prefix, item) {
  $(`${prefix}Meta`).textContent = `${item.score}점 · ${item.elapsed_minutes}분 · 정답 ${item.answer}`;
  $(`${prefix}Stem`).textContent = item.stem || item.summary || "초안 전문은 공개 화면에 싣지 않습니다.";
  $(`${prefix}Solution`).textContent = item.solution || (item.defects || []).map((text) => `· ${text}`).join("\n") || "구성 메모 없음";
  renderMath($(`${prefix}Stem`));
  renderMath($(`${prefix}Solution`));
}

function renderComposition() {
  const composition = data.composition || {};
  const picked = composition.assets || [];
  $("composeMeta").textContent =
    `시드 ${composition.seed} · ${composition.attempt}번째 추출 · ${(composition.source_questions || []).join(", ")}`;
  $("pickedAssets").innerHTML = picked.map((row) => (
    `<span><b>${esc(LABELS[row.kind] || row.kind)}</b>${tex(row.name)}</span>`
  )).join("");
  renderMath($("pickedAssets"));
  fillItem("assetItem", composition.asset_item);
  fillItem("blankItem", composition.blank_item);
}

function renderRegression() {
  const regression = data.regression || {};
  const time = regression.time || {};
  const totals = regression.totals || {};
  $("timeCompare").innerHTML = `
    <article><span>자산 조합 초안</span><strong>${esc(time.with_assets)}분</strong></article>
    <article><span>공백 초안</span><strong>${esc(time.no_assets)}분</strong></article>
  `;
  $("scoreBody").innerHTML = (regression.rubric || []).map((row) => `
    <tr>
      <th scope="row">${esc(row.label)}</th>
      <td>${esc(regression.scores.with_assets[row.id])}</td>
      <td>${esc(regression.scores.no_assets[row.id])}</td>
    </tr>
  `).join("") + `
    <tr>
      <th scope="row">합</th>
      <td>${esc(totals.with_assets)} / ${esc(totals.max)}</td>
      <td>${esc(totals.no_assets)} / ${esc(totals.max)}</td>
    </tr>
  `;
  $("findings").innerHTML = (regression.findings || []).map((text) => `<li>${esc(text)}</li>`).join("");
  $("upgrades").innerHTML = (regression.next_upgrades || []).map((text) => `<li>${esc(text)}</li>`).join("");
}

function restoreMark() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_MARK) || "null");
    if (saved?.mark && MARKS[saved.mark]) {
      setMarkStatus(`${saved.actor || "이름 없이"} · ${MARKS[saved.mark]}`);
    }
  } catch (_error) {
    localStorage.removeItem(STORAGE_MARK);
  }
}

function bind() {
  $("sheetFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-author]");
    if (!button) return;
    sheetAuthor = button.dataset.author;
    renderSheetFilters();
    renderSheet();
  });
  $("sheetView").addEventListener("click", (event) => {
    const jump = event.target.closest("button[data-jump]");
    if (jump) {
      jumpToCandidate(jump.dataset.jump);
      return;
    }
    const box = event.target.closest(".concept-box[data-used]");
    const step = event.target.closest(".sheet-step[data-mark]");
    linkSheet((box || step)?.dataset.used || (box || step)?.dataset.mark);
  });
  $("sheetView").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const box = event.target.closest(".concept-box[data-used]");
    if (!box) return;
    event.preventDefault();
    linkSheet(box.dataset.used);
  });
  $("actor").addEventListener("change", () => {
    localStorage.setItem(STORAGE_ACTOR, actorName());
  });
  document.querySelector(".mark-row").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mark]");
    if (!button) return;
    const error = $("markError");
    error.hidden = true;
    const actor = actorName();
    if (!actor) {
      error.hidden = false;
      error.textContent = "강사 이름을 먼저 입력하세요.";
      $("actor").focus();
      return;
    }
    const record = {
      mark: button.dataset.mark,
      actor,
      itemId: data.composition?.asset_item?.id,
      at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_MARK, JSON.stringify(record));
    setMarkStatus(`${actor} · ${MARKS[record.mark]} · 승격되지 않음`);
  });
}

async function boot() {
  const stored = localStorage.getItem(STORAGE_ACTOR);
  if (stored) $("actor").value = stored;
  try {
    const response = await fetch("pilot-review.json", { cache: "no-store" });
    if (!response.ok) throw new Error("pilot-review.json");
    data = await response.json();
  } catch (_error) {
    showError("pilot-review.json을 읽지 못했습니다. 로컬 서버로 열었는지 확인하세요.");
    return;
  }
  renderStats();
  renderSheetFilters();
  renderSheet();
  renderAssets();
  renderComposition();
  renderRegression();
  restoreMark();
  bind();
  setReviewSync("검토 표시와 댓글은 승격 대기 자산 탭에서 합니다.");
}

boot();
