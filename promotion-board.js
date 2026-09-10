const KIND = { concept: "개념", decision: "판단", skill: "스킬", strategy: "전략", problem_pattern: "유형" };
const STAGE = {
  ai_candidate: "확인 전",
  author_confirmed: "작성자 확인함",
  reviewed: "1차 승인",
  ratified: "정본 확정",
  merged: "다른 후보와 합침",
  rejected: "제외",
};
const VERDICT = { confirm: "맞아요", fix: "고쳐야 해요", hold: "보류" };
const COMMENT_KIND = { addition: "덧붙임", correction: "고칠 점", question: "질문" };
const EPISTEMIC = { observed: "풀이에 그대로 있음", derived: "풀이에서 끌어냄", hypothesis: "출제 의도 추정", unknown: "미확인" };
const ORIGIN = { sheet: "기록지", handwritten: "손풀이 사진", handwriting: "손글씨 메모", general_notes: "끝에 적은 메모" };
const FIELD_LABEL = {
  statement: "한 줄 정리", prerequisites: "먼저 알아야 할 것", common_confusions: "자주 헷갈리는 점",
  trigger_condition: "언제 쓰나", alternatives: "안 고른 다른 길", selected_action: "고른 길",
  guard_conditions: "조심할 것", failure_cost: "틀리면 생기는 일",
  input: "들어가는 것", action: "하는 일", output: "나오는 것", action_type: "일의 종류", error_conditions: "실수 포인트",
  special_meaning: "이 문제만의 의미", member_positions: "묶인 요소 번호", applicability: "쓸 수 있는 때", misuse_patterns: "잘못 쓰는 경우",
  given_structure: "주어진 것", target_output: "구하는 것", invariants: "바꾸면 안 되는 것", variation_handles: "바꿔 볼 수 있는 것",
};
const FAILURE_COST = { wrong_answer: "오답", dead_end: "막다른 길", calculation_explosion: "계산 폭발", time_loss: "시간 낭비" };
const ACTION_TYPE = { calculation: "계산", transformation: "식 변형", interpretation: "해석", construction: "구성", verification: "검산", proof: "증명", representation_change: "표현 바꾸기" };
const PROPOSAL = { new: "새 자산", merge_into: "이미 확정된 자산과 비슷해요", merge_candidates: "비슷한 후보가 있어요", refine: "기존 자산을 보강할 수도 있어요" };
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
      <strong>합침 · 제외<i>${esc((totals.merged || 0) + (totals.rejected || 0))}</i></strong>
      <span><b>운영자</b> 같은 내용은 하나로 합치고, 근거 없는 일반론은 뺍니다</span>
    </li>`;
}

function renderTabs() {
  const me = actorName();
  $("instructorTabs").innerHTML = (data.instructors || []).map((row) => {
    const done = row.candidates.filter((cand) => cand.stage !== "ai_candidate").length;
    const mine = row.name === me ? " is-me" : "";
    return `<button type="button" role="tab" data-instructor="${esc(row.name)}" aria-selected="${row.name === instructor}" class="${mine}">
      <b>${esc(row.name)}</b><span>${row.questions.map((q) => esc(q.exam_label.replace("평가원 ", ""))).join(", ") || "손풀이"}</span>
      <i>후보 ${row.candidates.length}개 · 확인 끝 ${done}개</i>
    </button>`;
  }).join("");
  const stages = ["all", ...Object.keys(STAGE)];
  $("stageFilters").innerHTML = stages.map((key) => (
    `<button type="button" data-stage="${key}" aria-pressed="${stageFilter === key}">${key === "all" ? "모든 상태" : STAGE[key]}</button>`
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
        <p class="muted">${esc(q.form_kind === "named_concept_boxes" ? "이름·설명·사용된 곳 박스 양식" : "기본 3칸 양식")}</p>
      </header>
      <details class="question-text" open>
        <summary>문제</summary>
        <div class="problem-body problem-render-body" data-problem="${esc(q.question_text)}"></div>
      </details>
      <details class="solution" open>
        <summary>풀이 <small>번호를 누르면 그 단계에서 쓴 후보가 강조됩니다</small></summary>
        <div class="steps">${q.steps.map(stepHtml).join("")}</div>
      </details>
      ${q.margin_notes.length ? `<details class="margin"><summary>손글씨·여백 메모 <i>${q.margin_notes.length}</i></summary><ul>${q.margin_notes.map((note) => `<li>${tex(note)}</li>`).join("")}</ul></details>` : ""}
      ${q.review_issues.length ? `<details class="issues"><summary>같이 봐야 할 점 <i>${q.review_issues.length}</i></summary><ol>${q.review_issues.map((issue) => `<li><b>${esc(issue.label)}</b> ${tex(issue.text)}${(issue.candidate_ids || []).length ? `<span class="links">${issue.candidate_ids.map((id) => `<button type="button" data-jump="${esc(id)}">${esc(id)}</button>`).join("")}</span>` : ""}</li>`).join("")}</ol></details>` : ""}
    </article>
  `).join("");
  $("questionPanel").querySelectorAll(".problem-body[data-problem]").forEach((node) => {
    const text = node.dataset.problem;
    if (window.ProblemDisplay?.mathText && window.ProblemDisplay?.render) {
      node.innerHTML = window.ProblemDisplay.mathText(text, []);
      window.ProblemDisplay.render(node);
    } else {
      node.innerHTML = `<p>${tex(text)}</p>`;
    }
  });
  renderMath($("questionPanel"));
}

function fieldsHtml(fields) {
  const keys = Object.keys(fields || {});
  if (!keys.length) return "";
  return `<dl class="fields">${keys.map((key) => {
    let value = fields[key];
    if (key === "failure_cost") value = FAILURE_COST[value] || value;
    if (key === "action_type") value = ACTION_TYPE[value] || value;
    if (key === "member_positions" && Array.isArray(value)) value = value.map((n) => `${n}번`);
    const text = Array.isArray(value) ? value.map((item) => tex(item)).join(" · ") : tex(value);
    return `<div><dt>${esc(FIELD_LABEL[key] || key)}</dt><dd>${text}</dd></div>`;
  }).join("")}</dl>`;
}

function proposalHtml(proposal) {
  if (!proposal || proposal.proposal === "new") return "";
  const best = proposal.best_match || {};
  const decided = proposal.decided_by_human ? ` · 결정됨: ${esc({ merge: "합침", refine: "보강", reject: "제외" }[proposal.human_decision] || proposal.human_decision || "")}` : " · 아직 결정 전";
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
        
        ${(cand.step_nos || []).length ? `<span class="steps-used">풀이 ${cand.step_nos.map((n) => "①②③④⑤⑥⑦⑧⑨⑩"[n - 1] || n).join("")}</span>` : ""}
        ${cand.ratified_atom_id ? `<span class="canonical">${esc(cand.ratified_atom_id)}</span>` : ""}
        ${cand.merged_into ? `<span class="merged">→ ${esc(cand.merged_into)}</span>` : ""}
      </header>
      <div class="cand-body">
        <h3>${tex(cand.name)}</h3>
        <p class="definition">${tex(cand.definition)}</p>
        ${handwriting ? `<p class="handwriting-note"><b>${cand.from_handwriting ? "손글씨에서 나온 내용" : "끝에 적은 메모에서 나온 내용"}</b> ${tex(cand.handwriting_note || data.handwriting_rule)}</p>` : ""}
        ${(cand.evidence || []).length ? `<p class="evidence"><b>원문 근거</b> ${cand.evidence.map((text) => tex(text)).join(" · ")}</p>` : ""}
        ${Object.keys(cand.fields || {}).length ? `<details class="detail"><summary>자세히</summary>${fieldsHtml(cand.fields)}</details>` : ""}
        ${proposalHtml(cand.merge_proposal)}
        ${cand.instructor_reviews.length ? `<ul class="remote-reviews">${cand.instructor_reviews.map((item) => `<li><b>${esc(VERDICT[item.verdict] || item.verdict)}</b> ${esc(item.actor)}${item.memo ? ` · ${tex(item.memo)}` : ""}</li>`).join("")}</ul>` : ""}
        ${cand.decision_log.length ? `<ul class="decisions">${cand.decision_log.map((item) => `<li><b>${esc(item.action)}</b> ${esc(item.decided_by)} · ${tex(item.note || "")}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="cand-review">
        <div class="verdict-row" role="group" aria-label="${esc(cand.id)} 검토 표시">
          ${Object.entries(VERDICT).map(([key, label]) => `<button type="button" data-verdict="${key}" data-id="${esc(cand.id)}" aria-pressed="${saved?.verdict === key}">${label}</button>`).join("")}
        </div>
        <small class="review-meta">${saved ? `${esc(saved.actor)} · ${esc(VERDICT[saved.verdict])} · 아직 안 보냄` : "아직 표시 안 함"}</small>
        <section class="thread" aria-label="${esc(cand.id)} 댓글">
          <h4>이 자산에 남긴 말 <i>${rows.length}</i></h4>
          <div class="comment-list">${rows.length ? rows.map((row) => `<article class="comment"><header><b>${esc(COMMENT_KIND[row.kind] || row.kind)}</b><span>${esc(row.actor || "이름 미상")}${row.localOnly ? " · 임시" : ""}</span></header><p>${tex(row.body)}</p></article>`).join("") : `<p class="muted">아직 없어요. 이름을 바꾸고 싶거나 빠진 전제가 있으면 적어 주세요.</p>`}</div>
          <form class="comment-form" data-asset="${esc(cand.id)}">
            <select name="kind" aria-label="댓글 종류">
              <option value="correction">고칠 점</option>
              <option value="addition">덧붙임</option>
              <option value="question">질문</option>
            </select>
            <input name="body" maxlength="2000" required placeholder="예: 이름을 ○○로 바꾸자 / 미분가능 전제가 빠졌다" aria-label="댓글 내용">
            <button type="submit">남기기</button>
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
  $("candCount").textContent = `${row.name} · ${list.length}개 보임 · 전체 ${row.candidates.length}개`;
  $("candEmpty").hidden = list.length > 0;
  $("candidateList").innerHTML = list.map((cand) => candidateCard({ ...cand, author: row.name })).join("");
  renderMath($("candidateList"));
  const mine = allCandidates().filter((cand) => cand.author === me);
  const marked = Object.keys(reviews).length;
  const localCount = localComments().length;
  if (!me) {
    $("reviewSummary").textContent = `위에 이름을 넣으면 내 후보가 먼저 보여요. 표시 ${marked}개 · 아직 안 보낸 댓글 ${localCount}개`;
  } else {
    const done = mine.filter((cand) => reviews[cand.id]).length;
    $("reviewSummary").textContent = `${me} · 내 후보 ${mine.length}개 중 ${done}개 표시함 · 아직 안 보낸 댓글 ${localCount}개`;
  }
}

function renderRatified() {
  const rows = data.ratified || [];
  $("ratMeta").textContent = `${rows.length}개 · 문제은행 연결 대기 ${data.crosswalk?.pending || 0}개 · 공유 자산 탭에도 나옵니다`;
  $("ratifiedList").innerHTML = rows.length ? rows.map((row) => `
    <article class="ratified">
      <code>${esc(row.pa_asset_id)}</code>
      <div><h3>${tex(row.name)}</h3><p>${esc(KIND[row.kind] || row.kind)} · 후보 ${esc(row.candidate_id)} · 확인한 사람 ${esc((row.reviewers || []).join(", "))}</p></div>
      <small>고정 번호 ${esc(String(row.content_hash).slice(0, 8))} · 문제은행 연결 ${esc(row.crosswalk === "not_started" ? "아직" : row.crosswalk || "아직")}</small>
    </article>
  `).join("") : `<p class="empty-note">아직 확정된 자산이 없어요. 작성자가 맞다고 하고 다른 강사도 확인하면 운영자가 정본 번호를 붙입니다.</p>`;
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
    fieldError("먼저 위에 강사 이름을 넣어 주세요.");
    $("actor").focus();
    return;
  }
  if (reviews[id]?.verdict === verdict) delete reviews[id];
  else reviews[id] = { candidateId: id, verdict, memo: reviews[id]?.memo || "", actor, at: new Date().toISOString() };
  writeStore(STORAGE_REVIEWS, reviews);
  renderCandidates();
  setSync(`표시 ${Object.keys(reviews).length}개 · 끝나면 "내 검토 보내기"를 눌러 주세요`, true);
}

async function submitComment(assetId, kind, body) {
  const actor = actorName();
  const text = String(body || "").trim();
  fieldError("");
  if (!actor) {
    fieldError("먼저 위에 강사 이름을 넣어 주세요.");
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
      setSync("댓글이 모두에게 공유됐어요", true);
    } catch (error) {
      setSync(`로컬에 저장됨 · ${error.message || "실시간 저장 실패"}`);
    }
  } else {
    setSync("이 기기에만 저장됐어요. 끝나면 \"댓글 파일 저장\"을 눌러 주세요.");
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
  if (!actor) return fieldError("먼저 위에 강사 이름을 넣어 주세요.");
  if (!rows.length) return fieldError("아직 표시한 후보가 없어요.");
  download(`${actor}-후보검토-${new Date().toISOString().slice(0, 10)}.json`, {
    schema: "problem-atom/pilot-candidate-review-batch/1.0",
    pilot_id: data.pilot_id, actor, exportedAt: new Date().toISOString(),
    reviews: rows.map((row) => ({ ...row, actor: row.actor || actor })),
  });
  setSync(`표시 ${rows.length}개를 파일로 저장했어요. 운영자에게 보내 주세요.`, true);
}

function exportComments() {
  const actor = actorName() || "이름미상";
  const rows = comments;
  fieldError("");
  if (!rows.length) return fieldError("저장할 댓글이 없어요.");
  download(`${actor}-자산댓글-${new Date().toISOString().slice(0, 10)}.json`, {
    schema: "problem-atom/asset-comment-batch/1.0", actor, exportedAt: new Date().toISOString(), comments: rows,
  });
  setSync(`댓글 ${rows.length}개를 파일로 저장했어요.`, true);
}

function clearLocal() {
  if (!window.confirm("이 기기에만 있는 표시와 댓글을 지울까요? 이미 보낸 파일은 그대로예요.")) return;
  reviews = {};
  writeStore(STORAGE_REVIEWS, reviews);
  writeStore(STORAGE_COMMENTS, []);
  comments = comments.filter((row) => !row.localOnly);
  renderCandidates();
  setSync("이 기기의 기록을 지웠어요.");
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
      setSync("댓글 실시간 공유 중", true);
      renderCandidates();
    } else {
      setSync(result.reason || "댓글은 이 기기에 저장되고 파일로 보낼 수 있어요.");
    }
  } catch (error) {
    setSync("댓글은 이 기기에 저장돼요. 끝나면 파일로 보내 주세요.");
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
