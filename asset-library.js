const labels = {
  all: "전체",
  concept: "개념",
  skill: "스킬",
  decision: "판단",
  problem_pattern: "유형",
  strategy: "전략",
  question: "문항",
  family: "문항군",
  mockExam: "모의고사",
};
const kindLabels = { addition: "추가", correction: "정정", question: "질문" };
const STORAGE_COMMENTS = "pa-asset-comments";
const STORAGE_ACTOR = "seminar-actor";

let records = [];
let active = "all";
let comments = [];
let remoteEnabled = false;
let remoteUserId = "";

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

const $ = (id) => document.getElementById(id);
const tex = (value) => (window.PAMath ? window.PAMath.mathify(value) : esc(value));

function actorName() {
  return $("actor").value.trim();
}

function setSync(text, live = false) {
  const node = $("commentSync");
  node.textContent = text;
  node.classList.toggle("live", live);
}

function loadLocalComments() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_COMMENTS) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveLocalComments(rows) {
  localStorage.setItem(STORAGE_COMMENTS, JSON.stringify(rows));
}

function mergeComments(remoteRows) {
  const local = loadLocalComments();
  const byId = new Map();
  [...remoteRows, ...local].forEach((row) => {
    if (row?.commentId) byId.set(row.commentId, row);
  });
  comments = [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function commentsFor(assetId) {
  return comments.filter((row) => row.assetId === assetId);
}

function renderComments(assetId) {
  const rows = commentsFor(assetId);
  if (!rows.length) {
    return `<p class="comment-empty">아직 댓글이 없습니다. 추가할 내용이나 정정을 남겨 주세요.</p>`;
  }
  return rows.map((row) => `
    <article class="comment-item">
      <header>
        <b>${esc(kindLabels[row.kind] || row.kind)}</b>
        <span>${esc(row.actor || "이름 미상")}</span>
      </header>
      <p>${tex(row.body)}</p>
    </article>
  `).join("");
}

function cardHtml(item) {
  const id = item.id || item.questionId;
  const review = item.status === "ai_candidate" ? "검토 대기" : item.status;
  return `
    <article class="asset-card" data-id="${esc(id)}">
      <header>
        <code>${esc(id)}</code>
        <em>${esc(labels[item.kind] || item.kind)} · ${esc(review)}</em>
      </header>
      <h3>${tex(item.name || item.title || "이름 미정")}</h3>
      <p>${tex(item.definition || item.flow || "설명 준비 중")}</p>
      <div class="chips">${[...(item.tags || []), ...(item.bottlenecks || [])].slice(0, 6).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
      <section class="comment-thread" aria-label="${esc(id)} 댓글">
        <h4>댓글</h4>
        <div class="comment-list">${renderComments(id)}</div>
        <form class="comment-form" data-asset="${esc(id)}">
          <label>
            <span class="visually-hidden">댓글 종류</span>
            <select name="kind" aria-label="댓글 종류">
              <option value="addition">추가</option>
              <option value="correction">정정</option>
              <option value="question">질문</option>
            </select>
          </label>
          <label>
            <span class="visually-hidden">댓글 내용</span>
            <textarea name="body" required maxlength="2000" placeholder="추가할 내용이나 정정할 문장을 적어 주세요."></textarea>
          </label>
          <button type="submit">댓글 달기</button>
        </form>
      </section>
    </article>
  `;
}

function render() {
  const query = $("search").value.trim().toLowerCase();
  const shown = records.filter((item) => {
    const id = item.id || item.questionId;
    const haystack = `${JSON.stringify(item)} ${commentsFor(id).map((row) => row.body).join(" ")}`.toLowerCase();
    return (active === "all" || item.kind === active) && haystack.includes(query);
  });
  $("resultCount").textContent = `${shown.length}개 표시`;
  $("assetGrid").innerHTML = shown.map(cardHtml).join("");
  $("empty").hidden = shown.length > 0;
  if (window.PAMath) window.PAMath.render($("assetGrid"));
  $("assetGrid").querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitComment(form.dataset.asset, form.kind.value, form.body.value);
    });
  });
}

async function submitComment(assetId, kind, body) {
  const actor = actorName();
  const text = String(body || "").trim();
  const target = String(assetId || "").trim();
  if (!actor) {
    $("actor").focus();
    setSync("댓글을 남기려면 강사 이름을 먼저 입력해 주세요.");
    return;
  }
  if (!target || !text) return;
  const localRow = {
    commentId: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    assetId: target,
    kind,
    body: text,
    actor,
    createdAt: new Date().toISOString(),
    status: "open",
    localOnly: true,
  };
  const local = loadLocalComments();
  local.push(localRow);
  saveLocalComments(local);
  if (remoteEnabled) {
    try {
      const saved = await window.PARealtime.addComment(target, kind, text, actor);
      saveLocalComments(local.filter((row) => row.commentId !== localRow.commentId));
      mergeComments([saved, ...comments.filter((row) => row.commentId !== localRow.commentId)]);
      setSync("실시간 댓글 저장됨", true);
    } catch (error) {
      mergeComments(comments);
      setSync(`로컬에 저장됨 · ${error.message || "실시간 저장 실패"}`);
    }
  } else {
    mergeComments(comments);
    setSync("이 브라우저에 임시 저장됨. JSON으로 내보내 주세요.");
  }
  render();
}

function downloadComments() {
  const actor = actorName() || "이름미상";
  const payload = {
    schema: "problem-atom/asset-comment-batch/1.0",
    actor,
    exportedAt: new Date().toISOString(),
    comments,
  };
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  link.download = `${actor}-자산댓글-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function clearLocal() {
  if (!loadLocalComments().length || !window.confirm("이 브라우저에만 있는 임시 댓글을 지울까요? 이미 보낸 JSON은 그대로입니다.")) return;
  saveLocalComments([]);
  mergeComments(comments.filter((row) => !String(row.commentId).startsWith("local-")));
  render();
  setSync("임시 댓글을 지웠습니다.");
}

async function start() {
  $("actor").value = localStorage.getItem(STORAGE_ACTOR) || "";
  $("actor").addEventListener("input", () => {
    localStorage.setItem(STORAGE_ACTOR, actorName());
  });
  $("exportComments").addEventListener("click", downloadComments);
  $("clearLocalComments").addEventListener("click", clearLocal);
  $("idCommentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitComment($("manualAssetId").value, $("manualKind").value, $("manualBody").value);
    $("manualBody").value = "";
  });
  mergeComments([]);
  try {
    const data = await fetch("asset-library.json", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw Error();
      return response.json();
    });
    const summary = data.summary || {};
    $("stats").innerHTML = [
      ["승인·검토 5축 카드", summary.entities || 0],
      ["분석 문항", summary.questions || 0],
      ["검토 대기", summary.reviewQueue || 0],
      ["완성 모의고사", summary.mockExams || 0],
    ].map(([label, count]) => `<article class="stat"><span>${label}</span><strong>${count}</strong></article>`).join("");
    records = [
      ...(data.entities || []),
      ...(data.questions || []).map((item) => ({ ...item, kind: "question" })),
      ...(data.families || []).map((item) => ({ ...item, kind: "family" })),
      ...(data.mockExams || []).map((item) => ({ ...item, kind: "mockExam" })),
      ...(data.reviewQueue || []),
    ];
    const kinds = ["all", "concept", "skill", "decision", "problem_pattern", "strategy", "question", "family", "mockExam"];
    $("filters").innerHTML = kinds.map((kind) => `<button class="filter${kind === "all" ? " active" : ""}" data-kind="${kind}" type="button">${labels[kind]}</button>`).join("");
    document.querySelectorAll(".filter").forEach((button) => {
      button.onclick = () => {
        document.querySelector(".filter.active")?.classList.remove("active");
        button.classList.add("active");
        active = button.dataset.kind;
        render();
      };
    });
    $("search").oninput = render;
    render();
  } catch (_error) {
    $("empty").hidden = false;
    $("empty").querySelector("strong").textContent = "공유 자산 파일을 읽지 못했습니다.";
  }

  if (window.PARealtime?.initComments) {
    try {
      const result = await window.PARealtime.initComments(actorName(), (rows) => {
        mergeComments(rows);
        render();
        setSync("실시간 댓글 연결됨", true);
      });
      remoteEnabled = Boolean(result.enabled);
      remoteUserId = result.userId || "";
      if (result.enabled) {
        mergeComments(result.comments || []);
        setSync("실시간 댓글 연결됨", true);
        render();
      } else {
        mergeComments([]);
        setSync(result.reason || "실시간 댓글 대기 · 로컬 JSON으로 보낼 수 있습니다.");
      }
    } catch (error) {
      mergeComments([]);
      setSync(`로컬 댓글 모드 · ${error.message || "실시간 연결 실패"}`);
    }
  }
}

start();
