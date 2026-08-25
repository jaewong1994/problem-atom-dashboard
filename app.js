const state = {
  data: null,
  merged: new Map(),
  aliases: new Map(),
  actor: localStorage.getItem("seminar-actor") || "",
  score: "all",
  group: localStorage.getItem("seminar-exam-group") === "education" ? "education" : "kice",
  query: "",
  openBodies: new Set(),
  lastProgress: "",
  lastData: "",
  staticMode: false,
  publishedSources: [],
  draftEvents: JSON.parse(localStorage.getItem("seminar-progress-draft") || "[]"),
};

const $ = (selector) => document.querySelector(selector);
const els = {
  list: $("#examList"),
  actor: $("#actor"),
  search: $("#search"),
  notice: $("#notice"),
  empty: $("#empty"),
  syncDot: $("#syncDot"),
  syncLabel: $("#syncLabel"),
  syncDetail: $("#syncDetail"),
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
  return state.merged.get(questionId) || { done: false, presenters: [], actorEvents: new Map() };
}

function isPresentedBy(questionId, actor) {
  if (!actor) return false;
  return Boolean(questionState(questionId).actorEvents.get(actor)?.done);
}

function percent(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

function questionVisible(question, exam, section) {
  const scoreMatches =
    state.score === "all" ||
    (state.score === "unknown" ? question.score == null : Number(question.score) === Number(state.score));
  const searchText = `${exam.year} ${exam.session} ${exam.title} ${section.title} ${question.number}번 ${question.unit || ""}`.toLowerCase();
  return scoreMatches && (!state.query || searchText.includes(state.query));
}

function examMetrics(exam) {
  const questions = allQuestions(exam);
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
  if (!presenters.length) return '<span class="presenter-empty">발표자 미정</span>';
  return presenters.map((name) => `<span class="presenter-chip">${escapeHtml(name)}</span>`).join("");
}

function renderMathBody(container, text) {
  container.textContent = text;
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
    renderMathBody(body, question.body);
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
      <small>${escapeHtml(question.unit || "개념 태그 미입력")}</small>
      <div class="presenter-list" aria-label="발표자">${presenterMarkup(question)}</div>
    </div>
    <span class="badge ${question.score === 4 ? "four" : ""}">${question.score ? `${question.score}점` : "미분류"}</span>
    <div class="question-actions">
      <button type="button" class="body-button" ${question.body ? "" : "disabled"}>${question.body ? "문제 펼치기" : "본문 등록 대기"}</button>
      <button type="button" class="preview-button" ${question.preview ? "" : "disabled"}>${question.preview ? "원본 이미지 보기" : "이미지 없음"}</button>
    </div>
    <div class="problem-body" hidden></div>
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
  const openIds = new Set(
    [...els.list.querySelectorAll("details[open]")].map((element) => element.dataset.examId),
  );
  els.list.innerHTML = "";
  let shown = 0;

  const activeExams = state.data.exams
    .filter((exam) => examInGroup(exam))
    .sort((a, b) => b.year - a.year || ({ "6월": 0, "9월": 1, "수능": 2 }[a.session] ?? 9) - ({ "6월": 0, "9월": 1, "수능": 2 }[b.session] ?? 9));
  for (const exam of activeExams) {
    const visibleSections = (exam.sections || [])
      .map((section) => ({
        ...section,
        visibleQuestions: (section.questions || []).filter((question) => questionVisible(question, exam, section)),
      }))
      .filter((section) => section.visibleQuestions.length);
    if (!visibleSections.length) continue;

    shown += 1;
    const node = $("#examTemplate").content.firstElementChild.cloneNode(true);
    const metrics = examMetrics(exam);
    node.dataset.examId = exam.id;
    node.open = openIds.has(exam.id);
    node.querySelector(".year").textContent = exam.year;
    node.querySelector(".title").textContent = exam.title;
    node.querySelector(".asset-label").textContent =
      exam.assetStatus === "ready"
        ? `${exam.organizer || "평가원"} · LaTeX 본문과 원본 이미지 연결됨`
        : exam.assetStatus === "source-only"
          ? `${exam.organizer || "평가원"} · 원문 HWP ${exam.sourceFiles?.length || 1}개 확인, 문항별 분리 대기`
          : `${exam.organizer || "평가원"} · 원본 HWP 있음, 문항 메타 등록 대기`;
    node.querySelector(".count").textContent =
      `전체 ${metrics.done}/${metrics.total} · 4점 ${metrics.fourDone}/${metrics.four || "미분류"}`;
    node.querySelector(".percent").textContent = metrics.four
      ? `${percent(metrics.fourDone, metrics.four)}%`
      : "대기";
    node.querySelector(".mini-meter i").style.width = `${percent(metrics.fourDone, metrics.four)}%`;

    const threes = allQuestions(exam).filter((question) => question.score === 3).length;
    const unknown = allQuestions(exam).filter((question) => question.score == null).length;
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
      const complete = section.questions.filter((question) => questionState(question.id).done).length;
      sectionNode.innerHTML = `
        <header class="section-heading">
          <div><strong>${escapeHtml(section.title)}</strong><small>${section.kind === "common" ? "모든 선택과목 공통" : "해당 과정만 표시"}</small></div>
          <span>${complete}/${section.questions.length} 완료</span>
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
  const exams = state.data.exams.filter((exam) => examInGroup(exam));
  const questions = exams.flatMap(allQuestions);
  const fourPoint = questions.filter((question) => question.score === 4);
  const completed = questions.filter((question) => questionState(question.id).done);
  const fourPointDone = fourPoint.filter((question) => questionState(question.id).done);
  $("#fourStat").textContent = `${fourPointDone.length} / ${fourPoint.length}`;
  $("#fourBar").style.width = `${percent(fourPointDone.length, fourPoint.length)}%`;
  $("#allStat").textContent = `${completed.length} / ${questions.length}`;
  const bodies = questions.filter((question) => question.body).length;
  const previews = questions.filter((question) => question.preview).length;
  $("#previewStat").textContent = `${bodies} / ${previews}`;
  $("#assetStatDetail").textContent = "LaTeX 본문 / 원본 이미지";
  $("#yearStat").textContent = `${new Set(exams.map((exam) => exam.year)).size}개년`;
  $("#yearStatDetail").textContent = state.group === "kice" ? "평가원 6·9월 모의평가 · 수능" : "교육청 학력평가";
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
      await refreshProgress(true);
    }
    state.lastData = signature;
  } catch {
    // 연결 오류 표시는 진행 기록 갱신에서 담당한다.
  }
}

async function init() {
  els.actor.value = state.actor;
  els.actor.addEventListener("input", () => {
    const nextActor = els.actor.value.trim();
    localStorage.setItem("seminar-actor", nextActor);
    state.actor = nextActor;
    if (state.staticMode) mergeAllProgress();
    render();
  });
  els.search.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
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
}

init();
