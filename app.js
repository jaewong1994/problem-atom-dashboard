const state = {
  data: null,
  seasonConfig: null,
  merged: new Map(),
  aliases: new Map(),
  actor: localStorage.getItem("seminar-actor") || "",
  score: "all",
  subject: localStorage.getItem("seminar-subject-filter") || "all",
  academicYear: localStorage.getItem("seminar-year-filter") || "all",
  sortOrder: localStorage.getItem("seminar-sort-order") || "newest",
  group: localStorage.getItem("seminar-exam-group") === "education" ? "education" : "kice",
  query: "",
  openBodies: new Set(),
  lastProgress: "",
  lastData: "",
  staticMode: false,
  claims: new Map(),
  realtimeReady: false,
  realtimeUserId: "",
  publishedSources: [],
  draftEvents: JSON.parse(localStorage.getItem("seminar-progress-draft") || "[]"),
};

const $ = (selector) => document.querySelector(selector);
const els = {
  list: $("#examList"),
  actor: $("#actor"),
  search: $("#search"),
  subjectFilter: $("#subjectFilter"),
  yearFilter: $("#yearFilter"),
  sortOrder: $("#sortOrder"),
  notice: $("#notice"),
  empty: $("#empty"),
  syncDot: $("#syncDot"),
  syncLabel: $("#syncLabel"),
  syncDetail: $("#syncDetail"),
  memberIdentity: $("#memberIdentity"),
  seasonGrid: $("#seasonGrid"),
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

async function api(path, options) {
  const response = await fetch(path, { cache: "no-store", ...options });
  if (!response.ok) throw new Error((await response.text()) || response.statusText);
  return response.json();
}

function sync(ok, label, detail) {
  els.syncDot.className = `sync-dot ${ok ? "ok" : "error"}`;
  els.syncLabel.textContent = label;
  els.syncDetail.textContent = detail;
}

function allQuestions(exam) {
  return (exam.sections || []).flatMap((section) => section.questions || []);
}

function examInGroup(exam, group = state.group) {
  const examGroup = exam.examGroup || "mock";
  return group === "kice" ? examGroup === "mock" || examGroup === "csat" : examGroup === group;
}

function buildAliases() {
  state.aliases.clear();
  for (const exam of state.data?.exams || []) {
    for (const question of allQuestions(exam)) {
      state.aliases.set(question.id, question.id);
      for (const legacyId of question.legacyIds || []) {
        state.aliases.set(legacyId, question.id);
      }
    }
  }
}

function mergeProgress(sources) {
  const latestByActor = new Map();
  for (const source of sources || []) {
    const actor = source.actor || "이름 미상";
    for (const event of source.events || []) {
      const canonicalId = state.aliases.get(event.questionId) || event.questionId;
      const key = `${canonicalId}\n${actor}`;
      const previous = latestByActor.get(key);
      if (!previous || String(event.updatedAt) > String(previous.updatedAt)) {
        latestByActor.set(key, { ...event, actor, questionId: canonicalId });
      }
    }
  }

  const merged = new Map();
  for (const event of latestByActor.values()) {
    if (!merged.has(event.questionId)) {
      merged.set(event.questionId, { done: false, presenters: [], actorEvents: new Map() });
    }
    merged.get(event.questionId).actorEvents.set(event.actor, event);
  }
  for (const entry of merged.values()) {
    entry.presenters = [...entry.actorEvents.values()]
      .filter((event) => event.done)
      .map((event) => event.actor)
      .sort((a, b) => a.localeCompare(b, "ko"));
    entry.done = entry.presenters.length > 0;
  }
  state.merged = merged;
}

function draftSource() {
  return state.staticMode && state.draftEvents.length
    ? [{ actor: state.actor || "이름 미상", events: state.draftEvents }]
    : [];
}

function mergeAllProgress() {
  mergeProgress([...state.publishedSources, ...draftSource()]);
}

function questionState(questionId) {
  const stored = state.merged.get(questionId) || { done: false, presenters: [], actorEvents: new Map() };
  const completedNames = questionClaims(questionId)
    .filter((claim) => claim.status === "completed")
    .map((claim) => claim.owner_name)
    .filter(Boolean);
  if (!completedNames.length) return stored;
  const presenters = [...new Set([...stored.presenters, ...completedNames])]
    .sort((a, b) => a.localeCompare(b, "ko"));
  return { ...stored, done: true, presenters };
}

function questionClaims(questionId) {
  return state.claims.get(questionId) || [];
}

function ownClaim(questionId) {
  return questionClaims(questionId).find((claim) => claim.owner_id === state.realtimeUserId) || null;
}

function applyClaims(rows) {
  const grouped = new Map();
  for (const row of rows || []) {
    if (!grouped.has(row.question_id)) grouped.set(row.question_id, []);
    grouped.get(row.question_id).push(row);
  }
  for (const claims of grouped.values()) {
    claims.sort((a, b) => String(a.claimed_at).localeCompare(String(b.claimed_at)));
  }
  state.claims = grouped;
}

function isPresentedBy(questionId, actor) {
  if (!actor) return false;
  return Boolean(
    questionState(questionId).actorEvents.get(actor)?.done
    || questionClaims(questionId).some((claim) => claim.owner_id === state.realtimeUserId && claim.status === "completed"),
  );
}

function percent(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

function questionVisible(question, exam, section) {
  const scoreMatches =
    state.score === "all" ||
    (state.score === "unknown" ? question.score == null : Number(question.score) === Number(state.score));
  const subjectMatches = state.subject === "all"
    || (state.subject === "unknown" ? !question.courseCode : question.courseCode === state.subject);
  const searchText = `${exam.year} ${academicYear(exam)}학년도 ${exam.session} ${exam.title} ${section.title} ${question.number}번 ${question.courseLabel || ""} ${question.unit || ""}`.toLowerCase();
  return scoreMatches && subjectMatches && (!state.query || searchText.includes(state.query));
}

function examMetrics(exam, questions = allQuestions(exam)) {
  const completed = questions.filter((question) => questionState(question.id).done);
  const fourPoint = questions.filter((question) => question.score === 4);
  const fourPointDone = fourPoint.filter((question) => questionState(question.id).done);
  const presenterNames = new Set(completed.flatMap((question) => questionState(question.id).presenters));
  return {
    done: completed.length,
    total: questions.length,
    four: fourPoint.length,
    fourDone: fourPointDone.length,
    presenters: presenterNames.size,
  };
}

function presenterMarkup(question) {
  const presenters = questionState(question.id).presenters;
  const completed = presenters.map((name) => `<span class="presenter-chip">${escapeHtml(name)} · 완료</span>`).join("");
  const reservedNames = [...new Set(questionClaims(question.id)
    .filter((claim) => claim.status === "claimed" && !presenters.includes(claim.owner_name))
    .map((claim) => claim.owner_name)
    .filter(Boolean))];
  const reserved = reservedNames
    .map((name) => `<span class="presenter-chip claimed">${escapeHtml(name)} · 분석 중</span>`)
    .join("");
  return `${completed}${reserved}` || '<span class="presenter-empty">미선점</span>';
}

function academicYear(exam) {
  return exam.session === "수능" ? Number(exam.year) : Number(exam.year) + 1;
}

function seasonQuestionNumbers() {
  return new Set(state.seasonConfig?.activeSeason?.questionNumbers || [13, 14, 15, 20, 21, 22]);
}

function seasonExamsFor(year) {
  const order = { "6월": 0, "9월": 1, "수능": 2 };
  const found = (state.data?.exams || [])
    .filter((exam) => examInGroup(exam, "kice") && academicYear(exam) === year)
    .sort((a, b) => (order[a.session] ?? 9) - (order[b.session] ?? 9));
  const bySession = new Map(found.map((exam) => [exam.session, exam]));
  return ["6월", "9월", "수능"].map((session) => {
    if (bySession.has(session)) return bySession.get(session);
    const calendarYear = session === "수능" ? year : year - 1;
    const examId = session === "수능" ? `csat-${year}` : `kice-${calendarYear}-${session[0]}`;
    return {
      id: examId,
      examGroup: session === "수능" ? "csat" : "mock",
      organizer: "평가원",
      year: calendarYear,
      session,
      title: session === "수능" ? `${year}학년도 대학수학능력시험` : `${session} 평가원`,
      assetStatus: "scheduled",
      seasonPlaceholder: true,
      sections: [],
    };
  });
}

function seasonQuestions(exam) {
  const targets = seasonQuestionNumbers();
  const section = (exam.sections || []).find((item) => item.kind === "common") || exam.sections?.[0];
  return (section?.questions || []).filter((question) =>
    targets.has(Number(question.number)) && question.courseCode === "M2",
  );
}

function claimStateMarkup(claims) {
  if (!claims.length) return '<span>아직 참여한 강사 없음</span>';
  const byName = new Map();
  for (const claim of claims) {
    const previous = byName.get(claim.owner_name);
    if (!previous || claim.status === "completed") byName.set(claim.owner_name, claim);
  }
  return [...byName.values()].map((claim) => {
    const label = claim.status === "completed" ? "완료" : "분석 중";
    return `<span class="season-person ${escapeHtml(claim.status)}"><b>${escapeHtml(claim.owner_name)}</b> · ${label}</span>`;
  }).join("");
}

function seasonActionMarkup(question) {
  const claims = questionClaims(question.id);
  const mine = ownClaim(question.id);
  if (!state.realtimeReady) {
    return '<button type="button" disabled>실시간 연결 대기</button>';
  }
  if (!mine) {
    const label = claims.length ? "교차분석 참여" : "선점하기";
    return `<button class="primary" type="button" data-claim-action="claim" data-question-id="${escapeHtml(question.id)}">${label}</button>`;
  }
  if (mine.status === "completed") {
    return '<button type="button" disabled>내 분석 완료</button>';
  }
  return `
    <button type="button" data-claim-action="release" data-question-id="${escapeHtml(question.id)}">선점 취소</button>
    <button class="complete" type="button" data-claim-action="complete" data-question-id="${escapeHtml(question.id)}">분석 완료</button>`;
}

function renderSeasonQuestion(exam, question) {
  const claims = questionClaims(question.id);
  const status = claims.some((claim) => claim.status === "completed") ? "completed" : claims.length ? "claimed" : "";
  const card = document.createElement("article");
  card.className = `season-question${status ? ` ${status}` : ""}`;
  card.innerHTML = `
    <div class="season-question-head"><strong>${question.number}번</strong><span class="badge ${question.score === 4 ? "four" : ""}">${question.score ? `${question.score}점` : "-"}</span></div>
    <div class="season-state">${claimStateMarkup(claims)}</div>
    <div class="claim-actions">
      ${seasonActionMarkup(question)}
      <button type="button" data-season-preview="${escapeHtml(question.id)}" ${question.preview ? "" : "disabled"}>문제 보기</button>
    </div>`;
  card.querySelectorAll("[data-claim-action]").forEach((button) => {
    button.addEventListener("click", () => updateClaim(button.dataset.claimAction, question.id, button));
  });
  const preview = card.querySelector("[data-season-preview]");
  if (question.preview) {
    const section = (exam.sections || []).find((item) => item.kind === "common") || exam.sections?.[0];
    preview.addEventListener("click", () => showPreview(exam, section, question));
  }
  return card;
}

function renderSeason() {
  if (!els.seasonGrid || !state.data) return;
  const openYears = new Set([...els.seasonGrid.querySelectorAll("details[open]")].map((node) => Number(node.dataset.year)));
  els.seasonGrid.innerHTML = "";
  let total = 0;
  let completed = 0;
  let claimed = 0;
  let firstPending = null;
  const years = state.seasonConfig?.activeSeason?.academicYears || [2022, 2023, 2024, 2025, 2026, 2027];
  for (const year of years) {
    const exams = seasonExamsFor(year);
    const questions = exams.flatMap(seasonQuestions);
    const yearCompleted = questions.filter((question) =>
      questionClaims(question.id).some((claim) => claim.status === "completed") || questionState(question.id).done,
    ).length;
    const yearClaimed = questions.filter((question) =>
      questionClaims(question.id).some((claim) => claim.status === "claimed"),
    ).length;
    total += questions.length;
    completed += yearCompleted;
    claimed += yearClaimed;
    if (firstPending == null && yearCompleted < questions.length && questions.length) firstPending = year;
    const details = document.createElement("details");
    details.className = "season-year";
    details.dataset.year = String(year);
    details.open = openYears.has(year) || (!openYears.size && year === (firstPending || 2022));
    details.innerHTML = `<summary><strong>${year}학년도</strong><span>${exams.length ? `${exams.length}개 시험 · ${questions.length}문항` : "문항 적재 대기"}</span><b>${yearCompleted}/${questions.length || 0} 완료${yearClaimed ? ` · ${yearClaimed} 선점` : ""}</b></summary><div class="season-year-body"></div>`;
    const body = details.querySelector(".season-year-body");
    if (!exams.length) {
      body.innerHTML = '<div class="season-exam"><header><strong>자료 적재 대기</strong><span>해당 학년도 6·9월 평가원 또는 수능 원문이 연결되면 자동 표시됩니다.</span></header></div>';
    }
    for (const exam of exams) {
      const wrap = document.createElement("section");
      wrap.className = "season-exam";
      const questionsForExam = seasonQuestions(exam);
      const statusText = exam.seasonPlaceholder
        ? "원문·과목 태그 적재 대기"
        : questionsForExam.length
          ? `미적분Ⅰ ${questionsForExam.length}문항`
          : "지정 번호 내 미적분Ⅰ 문항 없음";
      wrap.innerHTML = `<header><strong>${escapeHtml(exam.session === "수능" ? `${year}학년도 수능` : `${exam.year}년 ${exam.session} 평가원`)}</strong><span>${statusText}</span></header><div class="season-question-grid"></div>`;
      const grid = wrap.querySelector(".season-question-grid");
      questionsForExam.forEach((question) => grid.append(renderSeasonQuestion(exam, question)));
      if (!questionsForExam.length) grid.innerHTML = '<p class="season-empty">표시할 미적분Ⅰ 문항이 없습니다.</p>';
      body.append(wrap);
    }
    els.seasonGrid.append(details);
  }
  $("#seasonProgress").textContent = `${completed} / ${total}`;
  $("#seasonProgressDetail").textContent = `분석 완료${claimed ? ` · ${claimed}문항 선점 중` : ""}`;
}

async function updateClaim(action, questionId, button) {
  const actor = els.actor.value.trim();
  if (!actor) {
    els.actor.focus();
    els.notice.hidden = false;
    els.notice.textContent = "먼저 이름을 입력해 주세요.";
    return;
  }
  if (!state.realtimeReady) {
    els.notice.hidden = false;
    els.notice.textContent = "실시간 저장소 연결 전이라 선점할 수 없습니다. 운영자가 Problem Atom 전용 Supabase 설정을 완료해야 합니다.";
    return;
  }
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  try {
    if (action === "claim") await window.PARealtime.claim(questionId, actor);
    if (action === "release") await window.PARealtime.release(questionId);
    if (action === "complete") await window.PARealtime.complete(questionId);
    applyClaims(await window.PARealtime.listClaims());
    render();
    els.notice.hidden = false;
    els.notice.textContent = action === "claim" ? "선점했습니다. 모든 구성원의 화면에 바로 표시됩니다." : action === "release" ? "선점을 취소했습니다." : "분석 완료로 표시했습니다.";
    if (navigator.vibrate) navigator.vibrate(10);
  } catch (error) {
    els.notice.hidden = false;
    els.notice.textContent = error.message || "실시간 저장에 실패했습니다.";
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function renderMathBody(container, text, images = []) {
  if (window.ProblemDisplay?.mathText && window.ProblemDisplay?.render) {
    container.innerHTML = window.ProblemDisplay.mathText(text, images);
    window.ProblemDisplay.render(container);
    return;
  }
  container.textContent = text;
  for (const src of images) {
    const figure = document.createElement("img");
    figure.src = src;
    figure.alt = "문제에 포함된 그림";
    figure.className = "problem-figure-fallback";
    container.append(figure);
  }
  if (typeof window.renderMathInElement !== "function") return;
  window.renderMathInElement(container, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
}

function setProblemBody(card, question, open) {
  const body = card.querySelector(".problem-body");
  const button = card.querySelector(".body-button");
  body.hidden = !open;
  card.classList.toggle("body-open", open);
  button.textContent = open ? "문제 접기" : "문제 펼치기";
  button.setAttribute("aria-expanded", String(open));
  if (open && !body.dataset.rendered) {
    renderMathBody(body, question.body, question.images || []);
    body.dataset.rendered = "true";
  }
}

function renderQuestion(exam, section, question) {
  const entry = questionState(question.id);
  const currentActor = els.actor.value.trim();
  const checked = isPresentedBy(question.id, currentActor);
  const card = document.createElement("article");
  card.className = `question${entry.done ? " done" : ""}${question.preview ? "" : " no-preview"}`;
  card.innerHTML = `
    <input type="checkbox" ${checked ? "checked" : ""}
      aria-label="${escapeHtml(`${exam.year} ${exam.session} ${section.title} ${question.number}번 발표 기록`)}">
    <div class="q-info">
      <strong>${question.number}번</strong>
      <div class="question-tags">
        <span class="course-chip ${question.courseCode ? "" : "unknown"}">${escapeHtml(question.courseLabel || "과목 미분류")}</span>
        <small>${escapeHtml(question.unit || "단원 태그 미입력")}</small>
      </div>
      <div class="presenter-list" aria-label="발표자">${presenterMarkup(question)}</div>
    </div>
    <span class="badge ${question.score === 4 ? "four" : ""}">${question.score ? `${question.score}점` : "미분류"}</span>
    <div class="question-actions">
      <button type="button" class="body-button" ${question.body ? "" : "disabled"}>${question.body ? "문제 펼치기" : "본문 등록 대기"}</button>
      <button type="button" class="preview-button" ${question.preview ? "" : "disabled"}>${question.preview ? "원본 이미지 보기" : "이미지 없음"}</button>
    </div>
    <div class="problem-body problem-render-body" hidden></div>
  `;
  const checkbox = card.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", (event) => toggle(question.id, event.target.checked, event.target));
  const previewButton = card.querySelector(".preview-button");
  if (question.preview) {
    previewButton.addEventListener("click", () => showPreview(exam, section, question));
  }
  const bodyButton = card.querySelector(".body-button");
  if (question.body) {
    bodyButton.addEventListener("click", () => {
      const open = !state.openBodies.has(question.id);
      if (open) state.openBodies.add(question.id);
      else state.openBodies.delete(question.id);
      setProblemBody(card, question, open);
    });
    setProblemBody(card, question, state.openBodies.has(question.id));
  }
  return card;
}

function render() {
  if (!state.data) return;
  renderSeason();
  const openIds = new Set(
    [...els.list.querySelectorAll("details[open]")].map((element) => element.dataset.examId),
  );
  els.list.innerHTML = "";
  let shown = 0;

  const sessionOrder = { "6월": 0, "9월": 1, "수능": 2 };
  const direction = state.sortOrder === "oldest" ? 1 : -1;
  const activeExams = state.data.exams
    .filter((exam) => examInGroup(exam))
    .filter((exam) => state.academicYear === "all" || academicYear(exam) === Number(state.academicYear))
    .sort((a, b) => direction * (academicYear(a) - academicYear(b)) || (sessionOrder[a.session] ?? 9) - (sessionOrder[b.session] ?? 9));
  for (const exam of activeExams) {
    const visibleSections = (exam.sections || [])
      .map((section) => ({
        ...section,
        visibleQuestions: (section.questions || [])
          .filter((question) => questionVisible(question, exam, section))
          .sort((a, b) => Number(a.number) - Number(b.number)),
      }))
      .filter((section) => section.visibleQuestions.length);
    if (!visibleSections.length) continue;

    shown += 1;
    const node = $("#examTemplate").content.firstElementChild.cloneNode(true);
    const visibleQuestions = visibleSections.flatMap((section) => section.visibleQuestions);
    const metrics = examMetrics(exam, visibleQuestions);
    node.dataset.examId = exam.id;
    node.open = openIds.has(exam.id);
    node.querySelector(".year").textContent = academicYear(exam);
    node.querySelector(".title").textContent = exam.session === "수능" ? exam.title : `${exam.year}년 ${exam.title}`;
    node.querySelector(".asset-label").textContent =
      exam.assetStatus === "ready"
        ? `${exam.organizer || "평가원"} · LaTeX 본문·도형·원본 이미지 연결됨`
        : exam.assetStatus === "source-only"
          ? `${exam.organizer || "평가원"} · 원문 HWP ${exam.sourceFiles?.length || 1}개 확인, 문항별 분리 대기`
          : `${exam.organizer || "평가원"} · 원본 HWP 있음, 문항 메타 등록 대기`;
    node.querySelector(".count").textContent =
      `전체 ${metrics.done}/${metrics.total} · 4점 ${metrics.fourDone}/${metrics.four || "미분류"}`;
    node.querySelector(".percent").textContent = metrics.four
      ? `${percent(metrics.fourDone, metrics.four)}%`
      : "대기";
    node.querySelector(".mini-meter i").style.width = `${percent(metrics.fourDone, metrics.four)}%`;

    const threes = visibleQuestions.filter((question) => question.score === 3).length;
    const unknown = visibleQuestions.filter((question) => question.score == null).length;
    node.querySelector(".score-breakdown").textContent =
      `4점 ${metrics.four}문항 · 3점 ${threes}문항${unknown ? ` · 미분류 ${unknown}문항` : ""}`;
    node.querySelector(".expand-previews").addEventListener("click", () => {
      const section = visibleSections.find((item) => item.visibleQuestions.some((question) => question.preview));
      const question = section?.visibleQuestions.find((item) => item.preview);
      if (section && question) showPreview(exam, section, question);
    });
    const hasPreview = visibleSections.some((section) => section.visibleQuestions.some((question) => question.preview));
    node.querySelector(".expand-previews").disabled = !hasPreview;
    node.querySelector(".expand-previews").textContent = hasPreview ? "첫 원본 이미지 보기" : "연결 이미지 없음";

    const body = node.querySelector(".question-grid");
    body.className = "section-list";
    for (const section of visibleSections) {
      const sectionNode = document.createElement("section");
      sectionNode.className = `question-section ${section.kind || "track"}`;
      const complete = section.visibleQuestions.filter((question) => questionState(question.id).done).length;
      sectionNode.innerHTML = `
        <header class="section-heading">
          <div><strong>${escapeHtml(section.title)}</strong><small>${section.kind === "common" ? "모든 선택과목 공통" : "해당 과정만 표시"}</small></div>
          <span>${complete}/${section.visibleQuestions.length} 완료</span>
        </header>
        <div class="question-grid"></div>
      `;
      const grid = sectionNode.querySelector(".question-grid");
      for (const question of section.visibleQuestions) {
        grid.append(renderQuestion(exam, section, question));
      }
      body.append(sectionNode);
    }
    els.list.append(node);
  }
  els.empty.hidden = shown > 0;
  if (!shown && state.group === "education") {
    $("#emptyTitle").textContent = "교육청 학력평가 탭을 준비해 두었습니다.";
    $("#emptyDetail").textContent = "추후 교육청 문항 JSON을 적재하면 이곳에 연도별 카드가 자동 표시됩니다.";
  } else {
    $("#emptyTitle").textContent = "조건에 맞는 문항이 없습니다.";
    $("#emptyDetail").textContent = "검색어나 배점 필터를 바꿔 보세요.";
  }
  document.querySelectorAll(".source-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.group === state.group));
  updateStats();
}

function updateStats() {
  const exams = state.data.exams
    .filter((exam) => examInGroup(exam))
    .filter((exam) => state.academicYear === "all" || academicYear(exam) === Number(state.academicYear));
  const questions = exams.flatMap((exam) => (exam.sections || []).flatMap((section) =>
    (section.questions || []).filter((question) => questionVisible(question, exam, section)),
  ));
  const fourPoint = questions.filter((question) => question.score === 4);
  const completed = questions.filter((question) => questionState(question.id).done);
  const fourPointDone = fourPoint.filter((question) => questionState(question.id).done);
  $("#fourStat").textContent = `${fourPointDone.length} / ${fourPoint.length}`;
  $("#fourBar").style.width = `${percent(fourPointDone.length, fourPoint.length)}%`;
  $("#allStat").textContent = `${completed.length} / ${questions.length}`;
  const bodies = questions.filter((question) => question.body).length;
  const previews = questions.filter((question) => question.preview).length;
  $("#previewStat").textContent = `${bodies} / ${previews}`;
  $("#assetStatDetail").textContent = "LaTeX 본문·도형 / 원본 이미지";
  $("#yearStat").textContent = `${new Set(exams.map(academicYear)).size}개년`;
  const activeSubject = els.subjectFilter?.selectedOptions?.[0]?.textContent || "전체 과목";
  $("#yearStatDetail").textContent = `${activeSubject} · ${state.group === "kice" ? "평가원 6·9월·수능" : "교육청 학력평가"}`;
  for (const group of ["kice", "education"]) {
    const count = state.data.exams.filter((exam) => examInGroup(exam, group)).length;
    const target = document.querySelector(`[data-tab-count="${group}"]`);
    if (target) target.textContent = `${count}개`;
  }
}

async function toggle(questionId, done, input) {
  const actor = els.actor.value.trim();
  if (!actor) {
    input.checked = !done;
    els.actor.focus();
    els.notice.hidden = false;
    els.notice.textContent = "먼저 발표자의 이름 또는 별칭을 입력해 주세요.";
    return;
  }
  localStorage.setItem("seminar-actor", actor);
  state.actor = actor;
  input.disabled = true;
  if (state.staticMode) {
    state.draftEvents.push({ questionId, done, updatedAt: new Date().toISOString() });
    localStorage.setItem("seminar-progress-draft", JSON.stringify(state.draftEvents));
    mergeAllProgress();
    render();
    sync(true, "임시 저장됨", "이 브라우저에 저장 · 세미나 후 JSON 내보내기");
    input.disabled = false;
    return;
  }
  try {
    await api("/api/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor, questionId, done }),
    });
    await refreshProgress(true);
  } catch (error) {
    input.checked = !done;
    sync(false, "저장 실패", error.message);
  } finally {
    input.disabled = false;
  }
}

async function refreshProgress(force = false) {
  try {
    const progress = await api("/api/progress");
    state.publishedSources = progress.sources || [];
    const signature = JSON.stringify(progress.sources);
    if (force || signature !== state.lastProgress) {
      state.lastProgress = signature;
      mergeAllProgress();
      render();
    }
    sync(
      true,
      "동기화됨",
      `${progress.sources.length}명 기록 · ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`,
    );
  } catch (error) {
    sync(false, "서버 연결 안 됨", "현황판_시작.cmd로 열어 주세요");
    els.notice.hidden = false;
    els.notice.textContent =
      "index.html을 직접 연 상태에서는 공유 JSON에 저장할 수 없습니다. 현황판_시작.cmd를 실행해 주세요.";
  }
}

function downloadDraft() {
  const actor = els.actor.value.trim();
  if (!actor) {
    els.actor.focus();
    els.notice.hidden = false;
    els.notice.textContent = "JSON을 내보내려면 발표자 이름 또는 별칭을 먼저 입력해 주세요.";
    return;
  }
  const payload = { actor, events: state.draftEvents };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${actor}-세미나-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function clearDraft() {
  if (!state.draftEvents.length || !window.confirm("이 브라우저의 임시 체크 기록을 모두 지울까요?")) return;
  state.draftEvents = [];
  localStorage.removeItem("seminar-progress-draft");
  mergeAllProgress();
  render();
  sync(true, "공유 현황 표시 중", "임시 기록을 초기화했습니다");
}

async function loadStaticMode() {
  state.staticMode = true;
  const [data, progress] = await Promise.all([
    api("dashboard-data.json"),
    api("progress-summary.json").catch(() => ({ sources: [] })),
  ]);
  state.data = data;
  state.publishedSources = progress.sources || [];
  state.lastData = `${data.generatedAt}|${data.schemaVersion}|${data.exams?.length}`;
  buildAliases();
  populateYearFilter();
  mergeAllProgress();
  $("#staticActions").hidden = false;
  els.notice.hidden = false;
  els.notice.textContent = "공유 완료 현황을 보고 있습니다. 새 체크는 이 브라우저에 임시 저장되며, 세미나 후 JSON으로 내보내 운영자에게 전달하면 다음 배포에 반영됩니다.";
  render();
  sync(true, "GitHub 공유본", `${state.publishedSources.length}명 반영 · 새 기록은 임시 저장`);
}

function showPreview(exam, section, question) {
  $("#previewTitle").textContent =
    `${exam.year} ${exam.session} ${section.title} · ${question.number}번 · ${question.score || "?"}점`;
  const image = $("#previewImage");
  image.src = question.preview;
  image.alt = `${exam.year} ${exam.session} ${section.title} ${question.number}번 문제`;
  const dialog = $("#previewDialog");
  dialog.showModal();
  dialog.scrollTop = 0;
}

async function refreshData() {
  try {
    const next = await api("/api/data");
    const signature = `${next.generatedAt}|${next.schemaVersion}|${next.exams?.length}`;
    if (state.lastData && signature !== state.lastData) {
      state.data = next;
      buildAliases();
      populateYearFilter();
      await refreshProgress(true);
    }
    state.lastData = signature;
  } catch {
    // 연결 오류 표시는 진행 기록 갱신에서 담당한다.
  }
}

async function initRealtime() {
  if (!window.PARealtime) {
    els.memberIdentity.textContent = "실시간 모듈을 읽지 못했습니다";
    return;
  }
  try {
    const result = await window.PARealtime.init(state.actor, (rows) => {
      applyClaims(rows);
      render();
      sync(true, "실시간 연결됨", `${rows.length}개 문항 상태 · 방금 갱신`);
    });
    if (!result.enabled) {
      els.memberIdentity.textContent = "실시간 저장소 설정 전 · 선점 비활성";
      return;
    }
    state.realtimeReady = true;
    state.realtimeUserId = result.userId;
    applyClaims(result.claims);
    els.memberIdentity.textContent = state.actor ? `${state.actor} 강사 · 실시간 연결` : "강사 이름 입력 후 선점 가능";
    els.memberIdentity.classList.add("live");
    render();
    sync(true, "실시간 연결됨", "선점 상태를 즉시 공유합니다");
  } catch (error) {
    state.realtimeReady = false;
    els.memberIdentity.textContent = "실시간 연결 실패";
    els.notice.hidden = false;
    els.notice.textContent = `실시간 저장소 연결 실패: ${error.message}`;
  }
}

function populateYearFilter() {
  const years = [...new Set((state.data?.exams || []).map(academicYear))].sort((a, b) => b - a);
  els.yearFilter.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
  for (const year of years) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `${year}학년도`;
    els.yearFilter.append(option);
  }
  if (![...els.yearFilter.options].some((option) => option.value === state.academicYear)) state.academicYear = "all";
  els.yearFilter.value = state.academicYear;
}

async function init() {
  state.seasonConfig = await api("season-config.json").catch(() => null);
  els.actor.value = state.actor;
  els.actor.addEventListener("input", () => {
    const nextActor = els.actor.value.trim();
    localStorage.setItem("seminar-actor", nextActor);
    state.actor = nextActor;
    els.memberIdentity.textContent = state.realtimeReady && nextActor ? `${nextActor} 강사 · 실시간 연결` : "강사 이름 입력 후 선점 가능";
    if (state.staticMode) mergeAllProgress();
  });
  els.actor.addEventListener("change", async () => {
    if (!state.realtimeReady || !els.actor.value.trim()) {
      render();
      return;
    }
    try {
      await window.PARealtime.saveProfile(els.actor.value.trim());
      render();
    } catch (error) {
      els.notice.hidden = false;
      els.notice.textContent = `이름 저장 실패: ${error.message}`;
    }
  });
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });
  els.subjectFilter.value = state.subject;
  els.sortOrder.value = state.sortOrder;
  els.subjectFilter.addEventListener("change", () => {
    state.subject = els.subjectFilter.value;
    localStorage.setItem("seminar-subject-filter", state.subject);
    render();
  });
  els.yearFilter.addEventListener("change", () => {
    state.academicYear = els.yearFilter.value;
    localStorage.setItem("seminar-year-filter", state.academicYear);
    render();
  });
  els.sortOrder.addEventListener("change", () => {
    state.sortOrder = els.sortOrder.value;
    localStorage.setItem("seminar-sort-order", state.sortOrder);
    render();
  });
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.score = button.dataset.score;
      render();
    });
  });
  document.querySelectorAll(".source-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.group = button.dataset.group;
      localStorage.setItem("seminar-exam-group", state.group);
      render();
    });
  });
  $("#closePreview").addEventListener("click", () => $("#previewDialog").close());
  $("#previewDialog").addEventListener("click", (event) => {
    if (event.target.id === "previewDialog") event.target.close();
  });
  $("#exportProgress").addEventListener("click", downloadDraft);
  $("#clearDraft").addEventListener("click", clearDraft);

  try {
    state.data = await api("/api/data");
    state.lastData = `${state.data.generatedAt}|${state.data.schemaVersion}|${state.data.exams?.length}`;
    buildAliases();
    populateYearFilter();
    await refreshProgress(true);
    setInterval(refreshProgress, 5000);
    setInterval(refreshData, 5000);
  } catch (error) {
    try {
      await loadStaticMode();
    } catch (staticError) {
      sync(false, "자료 불러오기 실패", staticError.message);
      els.notice.hidden = false;
      els.notice.textContent = "현황판 자료를 읽지 못했습니다. 페이지를 새로고침해 주세요.";
    }
  }
  await initRealtime();
}

init();
