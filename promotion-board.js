const KIND = { concept: "개념", decision: "판단", skill: "스킬", strategy: "전략", problem_pattern: "유형" };
const STAGE = {
  ai_candidate: "AI 후보",
  author_confirmed: "작성자 확인",
  reviewed: "reviewed",
  ratified: "ratified",
  merged: "합쳐짐",
  rejected: "폐기",
};
const VERDICT = { confirm: "확인", fix: "정정 필요", hold: "보류" };
const COMMENT_KIND = { addition: "추가", correction: "정정", question: "질문" };
const EPISTEMIC = { observed: "관찰", derived: "도출", hypothesis: "출제 가설", unknown: "미확인" };
const ORIGIN = { sheet: "분석지", handwritten: "손풀이", handwriting: "여백 손글씨", general_notes: "일반 메모" };
const FIELD_LABEL = {
  statement: "명제", prerequisites: "선수 개념", common_confusions: "흔한 혼동",
  trigger_condition: "발동 신호", alternatives: "선택하지 않은 대안", selected_action: "선택한 행동",
  guard_conditions: "안전조건", failure_cost: "실패 비용",
  input: "입력", action: "수행", output: "출력", action_type: "행동 종류", error_conditions: "오류 조건",
  special_meaning: "특수 의미", member_positions: "포함 요소(번호)", applicability: "적용 조건", misuse_patterns: "오용",
  given_structure: "주어진 구조", target_output: "요구 산출물", invariants: "유지 조건", variation_handles: "변형 손잡이",
};
const PROPOSAL = { new: "새 자산", merge_into: "정본에 합치기 제안", merge_candidates: "후보끼리 합치기 제안", refine: "고도화 제안" };
const STORAGE_ACTOR = "seminar-actor";
const STORAGE_REVIEWS = "pa-pilot-candidate-reviews";
const STORAGE_COMMENTS = "pa-asset-comments";

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const tex = (value) => (window.PAMath ? window.PAMath.mathify(value) : esc(value));

let data = null;
let instructor = "";
let stageFilter = "all";
let kindFilter = "all";
let handwritingOnly = false;
let reviews = {};
let comments = [];
let remoteEnabled = false;

function renderMath(node) {
  if (window.PAMath) window.PAMath.render(node);
}

function actorName() {
  return $("actor").value.trim();
}

function setSync(text, live = false) {
  const node = $("boardSync");
  node.textContent = text;
  node.classList.toggle("live", live);
}

function showError(message) {
  const banner = $("loadError");
  banner.hidden = false;
  banner.removeAttribute("aria-hidden");
  banner.querySelector("p").textContent = message;
}

function fieldError(message) {
  const node = $("boardError");
  node.hidden = !message;
  node.textContent = message || "";
}

function readStore(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed ?? fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    setSync("이 브라우저에 저장하지 못했습니다. JSON으로 바로 내보내세요.");
  }
}

function current() {
  return (data.instructors || []).find((row) => row.name === instructor) || data.instructors[0];
}

function allCandidates() {
  return (data.instructors || []).flatMap((row) => row.candidates.map((cand) => ({ ...cand, author: row.name })));
}

function localComments() {
  return readStore(STORAGE_COMMENTS, []);
}

function commentsFor(id, ledgerRows) {
  const merged = new Map();
  (ledgerRows || []).forEach((row) => merged.set(row.commentId || `${row.actor}|${row.createdAt}`, { ...row, source: "ledger" }));
  comments.filter((row) => row.assetId === id).forEach((row) => merged.set(row.commentId, row));
  return [...merged.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function renderStages() {
  const totals = data.totals || {};
  $("stageStrip").innerHTML = (data.stages || []).map((stage) => `
    <li class="stage stage-${esc(stage.id)}">
      <strong>${esc(stage.label)}<i>${esc(totals[stage.id] || 0)}</i></strong>
      <span><b>${esc(stage.who)}</b> ${esc(stage.how)}</span>
    </li>
  `).join("") + `
    <li class="stage stage-side">
      <strong>합쳐짐 · 폐기<i>${esc((totals.merged || 0) + (totals.rejected || 0))}</i></strong>
      <span><b>운영자</b> 같은 풀이 가족은 하나로, 근거 없는 일반론은 폐기</span>
    </li>`;
}

function renderTabs() {
  const me = actorName();
  $("instructorTabs").innerHTML = (data.instructors || []).map((row) => {
    const done = row.candidates.filter((cand) => cand.stage !== "ai_candidate").length;
    const mine = row.name === me ? " is-me" : "";
    return `<button type="button" role="tab" data-instructor="${esc(row.name)}" aria-selected="${row.name === instructor}" class="${mine}">
      <b>${esc(row.name)}</b><span>${row.questions.map((q) => esc(q.exam_label.replace("평가원 ", ""))).join(", ") || "손풀이"}</span>
      <i>${row.candidates.length}개 · 진행 ${done}</i>
    </button>`;
  }).join("");
  const stages = ["all", ...Object.keys(STAGE)];
  $("stageFilters").innerHTML = stages.map((key) => (
    `<button type="button" data-stage="${key}" aria-pressed="${stageFilter === key}">${key === "all" ? "모든 단계" : STAGE[key]}</button>`
  )).join("");
  const kinds = ["all", ...Object.keys(KIND)];
  $("kindFilters").innerHTML = kinds.map((key) => (
    `<button type="button" data-kind="${key}" aria-pressed="${kindFilter === key}">${key === "all" ? "모든 종류" : KIND[key]}</button>`
  )).join("");
}

function stepHtml(step) {
  return `<p class="step" data-no="${step.no}">${step.mark ? `<b>${esc(step.mark)}</b>` : ""}${tex(step.text)}</p>`;
}

function renderQuestion() {
  const row = current();
  if (!row || !row.questions.length) {
    $("questionPanel").innerHTML = `<p class="empty-note">이 강사의 결과지가 없습니다. 손풀이 후보만 있습니다.</p>`;
    return;
  }
  $("questionPanel").innerHTML = row.questions.map((q) => `
    <article class="question-card">
      <header>
        <div><p class="eyebrow">${esc(q.exam_label)} · 정답 ${esc(q.official_answer)}</p><h2>${esc(row.name)}의 결과지</h2></div>
        <p class="muted">${esc(q.form_kind === "named_concept_boxes" ? "이름·설명·사용된 곳 박스(정본 양식)" : "공식 3칸 양식")}</p>
      </header>
      <details class="question-text" open>
        <summary>문제</summary>
        <p>${tex(q.question_text)}</p>
      </details>
      <details class="solution" open>
        <summary>풀이 단계 <small>번호를 누르면 그 단계를 쓰는 후보가 강조됩니다</small></summary>
        <div class="steps">${q.steps.map(stepHtml).join("")}</div>
      </details>
      ${q.margin_notes.length ? `<details class="margin"><summary>여백 손글씨·전사 밖 메모 <i>${q.margin_notes.length}</i></summary><ul>${q.margin_notes.map((note) => `<li>${tex(note)}</li>`).join("")}</ul></details>` : ""}
      ${q.review_issues.length ? `<details class="issues"><summary>검토 쟁점 <i>${q.review_issues.length}</i></summary><ol>${q.review_issues.map((issue) => `<li><b>${esc(issue.label)}</b> ${tex(issue.text)}${(issue.candidate_ids || []).length ? `<span class="links">${issue.candidate_ids.map((id) => `<button type="button" data-jump="${esc(id)}">${esc(id)}</button>`).join("")}</span>` : ""}</li>`).join("")}</ol></details>` : ""}
    </article>
  `).join("");
  renderMath($("questionPanel"));
}

function fieldsHtml(fields) {
  const keys = Object.keys(fields || {});
  if (!keys.length) return "";
  return `<dl class="fields">${keys.map((key) => {
    const value = fields[key];
    const text = Array.isArray(value) ? value.map((item) => tex(item)).join(" · ") : tex(value);
    return `<div><dt>${esc(FIELD_LABEL[key] || key)}</dt><dd>${text}</dd></div>`;
  }).join("")}</dl>`;
}

function proposalHtml(proposal) {
  if (!proposal || proposal.proposal === "new") return "";
  const best = proposal.best_match || {};
  const decided = proposal.decided_by_human ? ` · 결정: ${esc(proposal.human_decision || "")}` : " · 미결";
  return `<p class="proposal"><b>${esc(PROPOSAL[proposal.proposal] || proposal.proposal)}</b> ↔ <button type="button" data-jump="${esc(best.target_id)}">${esc(best.target_id)}</button> ${tex(best.target_name)} <i>(${esc(best.score)})</i>${decided}</p>`;
}

function candidateCard(cand) {
  const saved = reviews[cand.id];
  const me = actorName();
  const isOwn = me && cand.author === me;
  const rows = commentsFor(cand.id, cand.comments);
  const handwriting = cand.from_handwriting || cand.origin === "general_notes";
  return `
    <article class="cand${saved ? " has-review" : ""}${isOwn ? " is-own" : ""}${handwriting ? " is-handwriting" : ""} stage-${esc(cand.stage)}" id="cand-${esc(cand.id)}" data-id="${esc(cand.id)}" data-steps="${esc((cand.step_nos || []).join(","))}">
      <header class="cand-head">
        <code>${esc(cand.id)}</code>
        <span class="kind">${esc(cand.kind_label)}</span>
        <span class="stage-badge">${esc(STAGE[cand.stage] || cand.stage)}</span>
        <span class="origin origin-${esc(cand.origin)}">${esc(ORIGIN[cand.origin] || cand.origin)}</span>
        ${cand.epistemic ? `<span class="epistemic">${esc(EPISTEMIC[cand.epistemic] || cand.epistemic)}</span>` : ""}
        ${cand.domain ? `<span class="domain">${esc(cand.domain)}</span>` : ""}
        ${(cand.step_nos || []).length ? `<span class="steps-used">단계 ${cand.step_nos.map((n) => "①②③④⑤⑥⑦⑧⑨⑩"[n - 1] || n).join("")}</span>` : ""}
        ${cand.ratified_atom_id ? `<span class="canonical">${esc(cand.ratified_atom_id)}</span>` : ""}
        ${cand.merged_into ? `<span class="merged">→ ${esc(cand.merged_into)}</span>` : ""}
      </header>
      <div class="cand-body">
        <h3>${tex(cand.name)}</h3>
        <p class="definition">${tex(cand.definition)}</p>
        ${handwriting ? `<p class="handwriting-note"><b>${cand.from_handwriting ? "손글씨 주의" : "일반 메모"}</b> ${tex(cand.handwriting_note || data.handwriting_rule)}</p>` : ""}
        ${(cand.evidence || []).length ? `<p class="evidence"><b>근거</b> ${cand.evidence.map((text) => tex(text)).join(" · ")}</p>` : ""}
        <details class="detail"><summary>축별 필드</summary>${fieldsHtml(cand.fields) || "<p class=\"muted\">필드 없음</p>"}</details>
        ${proposalHtml(cand.merge_proposal)}
        ${cand.instructor_reviews.length ? `<ul class="remote-reviews">${cand.instructor_reviews.map((item) => `<li><b>${esc(VERDICT[item.verdict] || item.verdict)}</b> ${esc(item.actor)}${item.memo ? ` · ${tex(item.memo)}` : ""}</li>`).join("")}</ul>` : ""}
        ${cand.decision_log.length ? `<ul class="decisions">${cand.decision_log.map((item) => `<li><b>${esc(item.action)}</b> ${esc(item.decided_by)} · ${tex(item.note || "")}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="cand-review">
        <div class="verdict-row" role="group" aria-label="${esc(cand.id)} 검토 표시">
          ${Object.entries(VERDICT).map(([key, label]) => `<button type="button" data-verdict="${key}" data-id="${esc(cand.id)}" aria-pressed="${saved?.verdict === key}">${label}</button>`).join("")}
        </div>
        <small class="review-meta">${saved ? `${esc(saved.actor)} · ${esc(VERDICT[saved.verdict])} · 이 브라우저` : "표시 없음"}</small>
        <section class="thread" aria-label="${esc(cand.id)} 댓글">
          <h4>댓글 <i>${rows.length}</i></h4>
          <div class="comment-list">${rows.length ? rows.map((row) => `<article class="comment"><header><b>${esc(COMMENT_KIND[row.kind] || row.kind)}</b><span>${esc(row.actor || "이름 미상")}${row.localOnly ? " · 임시" : ""}</span></header><p>${tex(row.body)}</p></article>`).join("") : `<p class="muted">아직 댓글이 없습니다.</p>`}</div>
          <form class="comment-form" data-asset="${esc(cand.id)}">
            <select name="kind" aria-label="댓글 종류">
              <option value="correction">정정</option>
              <option value="addition">추가</option>
              <option value="question">질문</option>
            </select>
            <input name="body" maxlength="2000" required placeholder="이름 수정안, 빠진 전제, 반례, 합칠 후보" aria-label="댓글 내용">
            <button type="submit">달기</button>
          </form>
        </section>
      </div>
    </article>
  `;
}

function renderCandidates() {
  const row = current();
  if (!row) return;
  const me = actorName();
  const list = row.candidates.filter((cand) => {
    if (stageFilter !== "all" && cand.stage !== stageFilter) return false;
    if (kindFilter !== "all" && cand.kind !== kindFilter) return false;
    if (handwritingOnly && !(cand.from_handwriting || cand.origin === "general_notes")) return false;
    return true;
  });
  $("candCount").textContent = `${row.name} · ${list.length}개 표시 · 전체 ${row.candidates.length}개`;
  $("candEmpty").hidden = list.length > 0;
  $("candidateList").innerHTML = list.map((cand) => candidateCard({ ...cand, author: row.name })).join("");
  renderMath($("candidateList"));
  const mine = allCandidates().filter((cand) => cand.author === me);
  const marked = Object.keys(reviews).length;
  const localCount = localComments().length;
  if (!me) {
    $("reviewSummary").textContent = `표시 ${marked}개 · 임시 댓글 ${localCount}개 · 강사 이름을 입력하면 내 후보 진행률이 보입니다.`;
  } else {
    const done = mine.filter((cand) => reviews[cand.id]).length;
    $("reviewSummary").textContent = `${me} · 내 후보 ${mine.length}개 중 ${done}개 표시 · 전체 표시 ${marked}개 · 임시 댓글 ${localCount}개`;
  }
}

function renderRatified() {
  const rows = data.ratified || [];
  $("ratMeta").textContent = `${rows.length}개 · crosswalk 대기 ${data.crosswalk?.pending || 0}개 · 정본은 공유 자산 탭에도 표시됩니다`;
  $("ratifiedList").innerHTML = rows.length ? rows.map((row) => `
    <article class="ratified">
      <code>${esc(row.pa_asset_id)}</code>
      <div><h3>${tex(row.name)}</h3><p>${esc(KIND[row.kind] || row.kind)} · 후보 ${esc(row.candidate_id)} · 검토 ${esc((row.reviewers || []).join(", "))}</p></div>
      <small>해시 ${esc(String(row.content_hash).slice(0, 12))}… · NGD2 crosswalk ${esc(row.crosswalk || "not_started")}</small>
    </article>
  `).join("") : `<p class="empty-note">아직 비준된 자산이 없습니다. reviewed 후보를 다른 강사가 확인하면 운영자가 정본 ID를 발급합니다.</p>`;
}

function highlightStep(no) {
  document.querySelectorAll(".cand").forEach((node) => {
    const steps = String(node.dataset.steps || "").split(",").filter(Boolean).map(Number);
    node.classList.toggle("is-linked", steps.includes(no));
  });
  document.querySelectorAll(".step").forEach((node) => node.classList.toggle("is-linked", Number(node.dataset.no) === no));
}

function jumpTo(id) {
  const target = allCandidates().find((cand) => cand.id === id);
  if (!target) return;
  if (target.author !== instructor) instructor = target.author;
  stageFilter = "all";
  kindFilter = "all";
  handwritingOnly = false;
  $("handwritingOnly").checked = false;
  renderTabs();
  renderQuestion();
  renderCandidates();
  const node = document.getElementById(`cand-${id}`);
  if (!node) return;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  node.classList.add("is-jumped");
  window.setTimeout(() => node.classList.remove("is-jumped"), 2400);
}

function setVerdict(id, verdict) {
  const actor = actorName();
  fieldError("");
  if (!actor) {
    fieldError("검토 표시를 남기려면 강사 이름을 먼저 입력하세요.");
    $("actor").focus();
    return;
  }
  if (reviews[id]?.verdict === verdict) delete reviews[id];
  else reviews[id] = { candidateId: id, verdict, memo: reviews[id]?.memo || "", actor, at: new Date().toISOString() };
  writeStore(STORAGE_REVIEWS, reviews);
  renderCandidates();
  setSync(`검토 표시 ${Object.keys(reviews).length}개 · JSON으로 보내야 반영`, true);
}

async function submitComment(assetId, kind, body) {
  const actor = actorName();
  const text = String(body || "").trim();
  fieldError("");
  if (!actor) {
    fieldError("댓글을 남기려면 강사 이름을 먼저 입력하세요.");
    $("actor").focus();
    return;
  }
  if (!text) return;
  const row = {
    commentId: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    assetId, kind, body: text, actor, createdAt: new Date().toISOString(), status: "open", localOnly: true,
  };
  const local = localComments();
  local.push(row);
  writeStore(STORAGE_COMMENTS, local);
  comments = [...comments, row];
  if (remoteEnabled) {
    try {
      const saved = await window.PARealtime.addComment(assetId, kind, text, actor);
      writeStore(STORAGE_COMMENTS, local.filter((item) => item.commentId !== row.commentId));
      comments = [...comments.filter((item) => item.commentId !== row.commentId), saved];
      setSync("실시간 댓글 저장됨", true);
    } catch (error) {
      setSync(`로컬에 저장됨 · ${error.message || "실시간 저장 실패"}`);
    }
  } else {
    setSync("이 브라우저에 임시 저장됨. 댓글 JSON을 내보내 주세요.");
  }
  renderCandidates();
}

function download(name, payload) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportReviews() {
  const actor = actorName();
  const rows = Object.values(reviews);
  fieldError("");
  if (!actor) return fieldError("내보내기 전에 강사 이름을 입력하세요.");
  if (!rows.length) return fieldError("내보낼 검토 표시가 없습니다.");
  download(`${actor}-후보검토-${new Date().toISOString().slice(0, 10)}.json`, {
    schema: "problem-atom/pilot-candidate-review-batch/1.0",
    pilot_id: data.pilot_id, actor, exportedAt: new Date().toISOString(),
    reviews: rows.map((row) => ({ ...row, actor: row.actor || actor })),
  });
  setSync(`검토 ${rows.length}개를 JSON으로 내보냈습니다.`, true);
}

function exportComments() {
  const actor = actorName() || "이름미상";
  const rows = comments;
  fieldError("");
  if (!rows.length) return fieldError("내보낼 댓글이 없습니다.");
  download(`${actor}-자산댓글-${new Date().toISOString().slice(0, 10)}.json`, {
    schema: "problem-atom/asset-comment-batch/1.0", actor, exportedAt: new Date().toISOString(), comments: rows,
  });
  setSync(`댓글 ${rows.length}개를 JSON으로 내보냈습니다.`, true);
}

function clearLocal() {
  if (!window.confirm("이 브라우저에만 있는 검토 표시와 임시 댓글을 지울까요? 이미 보낸 JSON은 그대로입니다.")) return;
  reviews = {};
  writeStore(STORAGE_REVIEWS, reviews);
  writeStore(STORAGE_COMMENTS, []);
  comments = comments.filter((row) => !row.localOnly);
  renderCandidates();
  setSync("이 브라우저 기록을 지웠습니다.");
}

function bind() {
  $("instructorTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-instructor]");
    if (!button) return;
    instructor = button.dataset.instructor;
    renderTabs();
    renderQuestion();
    renderCandidates();
  });
  $("stageFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-stage]");
    if (!button) return;
    stageFilter = button.dataset.stage;
    renderTabs();
    renderCandidates();
  });
  $("kindFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-kind]");
    if (!button) return;
    kindFilter = button.dataset.kind;
    renderTabs();
    renderCandidates();
  });
  $("handwritingOnly").addEventListener("change", (event) => {
    handwritingOnly = event.target.checked;
    renderCandidates();
  });
  $("questionPanel").addEventListener("click", (event) => {
    const jump = event.target.closest("button[data-jump]");
    if (jump) return jumpTo(jump.dataset.jump);
    const step = event.target.closest(".step[data-no]");
    if (step) highlightStep(Number(step.dataset.no));
  });
  $("candidateList").addEventListener("click", (event) => {
    const jump = event.target.closest("button[data-jump]");
    if (jump) return jumpTo(jump.dataset.jump);
    const verdict = event.target.closest("button[data-verdict]");
    if (verdict) setVerdict(verdict.dataset.id, verdict.dataset.verdict);
  });
  $("candidateList").addEventListener("submit", (event) => {
    const form = event.target.closest("form.comment-form");
    if (!form) return;
    event.preventDefault();
    submitComment(form.dataset.asset, form.kind.value, form.body.value);
    form.body.value = "";
  });
  $("exportReviews").addEventListener("click", exportReviews);
  $("exportComments").addEventListener("click", exportComments);
  $("clearLocal").addEventListener("click", clearLocal);
  $("actor").addEventListener("change", () => {
    localStorage.setItem(STORAGE_ACTOR, actorName());
    renderTabs();
    renderCandidates();
  });
}

async function connectComments() {
  if (!window.PARealtime?.initComments) return;
  try {
    const result = await window.PARealtime.initComments(actorName(), (rows) => {
      comments = [...rows, ...localComments()];
      renderCandidates();
    });
    remoteEnabled = Boolean(result.enabled);
    if (result.enabled) {
      comments = [...(result.comments || []), ...localComments()];
      setSync("실시간 댓글 연결됨", true);
      renderCandidates();
    } else {
      setSync(result.reason || "실시간 댓글 대기 · 로컬 JSON으로 보낼 수 있습니다.");
    }
  } catch (error) {
    setSync(`로컬 댓글 모드 · ${error.message || "실시간 연결 실패"}`);
  }
}

async function boot() {
  $("actor").value = localStorage.getItem(STORAGE_ACTOR) || "";
  reviews = readStore(STORAGE_REVIEWS, {});
  comments = localComments();
  try {
    const response = await fetch("promotion-board.json", { cache: "no-store" });
    if (!response.ok) throw new Error("promotion-board.json");
    data = await response.json();
  } catch (_error) {
    showError("promotion-board.json을 읽지 못했습니다. 로컬 서버로 열었는지 확인하세요.");
    return;
  }
  const me = actorName();
  instructor = (data.instructors.find((row) => row.name === me) || data.instructors[0] || {}).name || "";
  renderStages();
  renderTabs();
  renderQuestion();
  renderCandidates();
  renderRatified();
  renderMath($("ratifiedList"));
  bind();
  connectComments();
}

boot();
