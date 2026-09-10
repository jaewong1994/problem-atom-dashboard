(function () {
  const CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  let client = null;
  let user = null;
  let channel = null;

  function config() {
    return window.PA_REALTIME_CONFIG || {};
  }

  function enabled() {
    const cfg = config();
    return Boolean(cfg.enabled && cfg.url && cfg.publishableKey);
  }

  function loadLibrary() {
    if (window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CDN;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("실시간 모듈을 불러오지 못했습니다."));
      document.head.append(script);
    });
  }

  async function init(displayName, onChange) {
    if (!enabled()) return { enabled: false, reason: "실시간 저장소 설정 대기" };
    await loadLibrary();
    const cfg = config();
    client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    let session = (await client.auth.getSession()).data.session;
    if (!session) {
      const result = await client.auth.signInAnonymously();
      if (result.error) throw result.error;
      session = result.data.session;
    }
    user = session.user;
    if (displayName) await saveProfile(displayName);
    const claims = await listClaims();
    channel = client.channel("pa-question-claims")
      .on("postgres_changes", { event: "*", schema: "public", table: "pa_question_claims" }, async () => {
        onChange(await listClaims());
      })
      .subscribe();
    return { enabled: true, userId: user.id, claims };
  }

  async function saveProfile(displayName) {
    const cleanName = String(displayName || "").trim();
    if (!client || !user || !cleanName) return;
    const { error } = await client.from("pa_members").upsert({
      user_id: user.id,
      display_name: cleanName,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    const { error: claimError } = await client.from("pa_question_claims").update({
      owner_name: cleanName,
      updated_at: new Date().toISOString(),
    }).eq("owner_id", user.id);
    if (claimError) throw claimError;
  }

  async function listClaims() {
    const { data, error } = await client.from("pa_question_claims").select("question_id,owner_id,owner_name,status,claimed_at,updated_at");
    if (error) throw error;
    return data || [];
  }

  async function claim(questionId, ownerName) {
    if (!client || !user) throw new Error("실시간 로그인이 필요합니다.");
    await saveProfile(ownerName);
    const { data, error } = await client.from("pa_question_claims").insert({
      question_id: questionId,
      owner_id: user.id,
      owner_name: ownerName,
      status: "claimed",
    }).select().single();
    if (error?.code === "23505") {
      throw new Error("이미 이 문항의 분석에 참여하고 있습니다.");
    }
    if (error) throw error;
    return data;
  }

  async function release(questionId) {
    if (!client || !user) throw new Error("실시간 로그인이 필요합니다.");
    const { error } = await client.from("pa_question_claims").delete().eq("question_id", questionId).eq("owner_id", user.id);
    if (error) throw error;
  }

  async function complete(questionId) {
    if (!client || !user) throw new Error("실시간 로그인이 필요합니다.");
    const { error } = await client.from("pa_question_claims").update({
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("question_id", questionId).eq("owner_id", user.id);
    if (error) throw error;
  }

  function mapComment(row) {
    return {
      commentId: row.comment_id,
      assetId: row.asset_id,
      actor: row.owner_name,
      ownerId: row.owner_id,
      kind: row.kind,
      body: row.body,
      createdAt: row.created_at,
      status: "open",
    };
  }

  function commentsUnavailable(error) {
    const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
    return text.includes("pa_asset_comments") || error?.code === "42P01" || error?.code === "PGRST205";
  }

  async function listComments() {
    if (!client) throw new Error("실시간 로그인이 필요합니다.");
    const { data, error } = await client.from("pa_asset_comments")
      .select("comment_id,asset_id,owner_id,owner_name,kind,body,created_at")
      .order("created_at", { ascending: true });
    if (error) {
      if (commentsUnavailable(error)) return { unavailable: true, comments: [] };
      throw error;
    }
    return { unavailable: false, comments: (data || []).map(mapComment) };
  }

  async function addComment(assetId, kind, body, ownerName) {
    if (!client || !user) throw new Error("실시간 로그인이 필요합니다.");
    await saveProfile(ownerName);
    const { data, error } = await client.from("pa_asset_comments").insert({
      asset_id: assetId,
      owner_id: user.id,
      owner_name: ownerName,
      kind,
      body,
    }).select("comment_id,asset_id,owner_id,owner_name,kind,body,created_at").single();
    if (error) throw error;
    return mapComment(data);
  }

  async function deleteComment(commentId) {
    if (!client || !user) throw new Error("실시간 로그인이 필요합니다.");
    const { error } = await client.from("pa_asset_comments")
      .delete()
      .eq("comment_id", commentId)
      .eq("owner_id", user.id);
    if (error) throw error;
  }

  async function initComments(displayName, onChange) {
    const started = await init(displayName, () => {});
    if (!started.enabled) return started;
    const listed = await listComments();
    if (listed.unavailable) {
      return { enabled: false, reason: "댓글 테이블 설정 대기", comments: [], userId: user.id };
    }
    client.channel("pa-asset-comments")
      .on("postgres_changes", { event: "*", schema: "public", table: "pa_asset_comments" }, async () => {
        const next = await listComments();
        onChange(next.comments || []);
      })
      .subscribe();
    return { enabled: true, userId: user.id, comments: listed.comments };
  }

  window.PARealtime = {
    enabled, init, saveProfile, claim, release, complete, listClaims,
    initComments, listComments, addComment, deleteComment,
  };
})();
