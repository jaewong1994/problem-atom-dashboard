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

  function shortId(id) {
    return `PA-${String(id).replaceAll("-", "").slice(0, 8).toUpperCase()}`;
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
    return { enabled: true, userId: user.id, memberCode: shortId(user.id), claims };
  }

  async function saveProfile(displayName) {
    if (!client || !user || !displayName) return;
    const { error } = await client.from("pa_members").upsert({
      user_id: user.id,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
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
      const existing = await client.from("pa_question_claims").select("owner_name,status").eq("question_id", questionId).maybeSingle();
      throw new Error(existing.data ? `${existing.data.owner_name}님이 먼저 선점했습니다.` : "다른 구성원이 먼저 선점했습니다.");
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

  window.PARealtime = { enabled, init, saveProfile, claim, release, complete, listClaims };
})();

