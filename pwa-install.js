(function () {
  "use strict";

  const DISMISS_KEY = "problemAtomInstallDismissedAt";
  const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;
  let deferredPrompt = null;
  let lastFocused = null;

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isIOSSafari = () => isIOS() && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);

  const isMobile = () => Boolean(
    navigator.userAgentData?.mobile ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1024) ||
    window.innerWidth <= 900
  );

  function wasRecentlyDismissed() {
    const timestamp = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return timestamp > 0 && Date.now() - timestamp < DISMISS_FOR_MS;
  }

  function appIcon() {
    return '<span class="pwa-install-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3h14v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  }

  function createUI() {
    const bar = document.createElement("aside");
    bar.className = "pwa-install-bar";
    bar.hidden = true;
    bar.setAttribute("aria-label", "앱 설치 안내");
    bar.innerHTML = `${appIcon()}
      <div class="pwa-install-copy"><strong>홈 화면에 설치</strong><span>앱처럼 빠르게 열 수 있습니다</span></div>
      <button class="pwa-install-action" type="button">설치</button>
      <button class="pwa-install-dismiss" type="button" aria-label="설치 안내 닫기">×</button>`;

    const dialog = document.createElement("dialog");
    dialog.className = "pwa-install-dialog";
    dialog.setAttribute("aria-labelledby", "pwa-install-title");
    dialog.innerHTML = `<div class="pwa-dialog-content">
      <div class="pwa-dialog-head">
        ${appIcon()}
        <div><h2 id="pwa-install-title">홈 화면에 설치하기</h2><p class="pwa-dialog-summary"></p></div>
        <button class="pwa-dialog-close" type="button" aria-label="설치 방법 닫기">×</button>
      </div>
      <ol class="pwa-install-steps"></ol>
      <p class="pwa-install-note">설치하면 브라우저 주소창 없이 독립된 앱 화면으로 열립니다.</p>
    </div>`;

    document.body.append(bar, dialog);
    return { bar, dialog };
  }

  function setInstructions(dialog) {
    const summary = dialog.querySelector(".pwa-dialog-summary");
    const steps = dialog.querySelector(".pwa-install-steps");
    if (isIOS()) {
      summary.textContent = isIOSSafari() ? "Safari 메뉴에서 한 번만 추가하면 됩니다." : "아이폰·아이패드는 Safari에서 설치할 수 있습니다.";
      steps.innerHTML = `${isIOSSafari() ? "" : "<li>이 페이지를 Safari에서 엽니다.</li>"}<li>Safari 아래쪽의 <strong>공유</strong> 버튼을 누릅니다.</li><li>메뉴에서 <strong>홈 화면에 추가</strong>를 누릅니다.</li><li>오른쪽 위의 <strong>추가</strong>를 누릅니다.</li>`;
    } else if (isAndroid()) {
      summary.textContent = "브라우저 메뉴에서도 직접 설치할 수 있습니다.";
      steps.innerHTML = "<li>오른쪽 위의 브라우저 메뉴를 엽니다.</li><li><strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 누릅니다.</li><li>표시되는 설치 확인 버튼을 누릅니다.</li>";
    } else {
      summary.textContent = "모바일 브라우저 메뉴에서 홈 화면 바로가기를 만들 수 있습니다.";
      steps.innerHTML = "<li>브라우저의 공유 또는 메뉴 버튼을 누릅니다.</li><li><strong>홈 화면에 추가</strong> 또는 <strong>앱 설치</strong>를 선택합니다.</li>";
    }
  }

  function openInstructions(dialog) {
    lastFocused = document.activeElement;
    setInstructions(dialog);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    dialog.querySelector(".pwa-dialog-close").focus();
  }

  function closeInstructions(dialog) {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    lastFocused?.focus?.();
  }

  async function installOrExplain(dialog, bar) {
    if (!deferredPrompt) {
      openInstructions(dialog);
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === "accepted") bar.hidden = true;
  }

  function registerServiceWorker() {
    const supportedOrigin = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if ("serviceWorker" in navigator && supportedOrigin) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();
    if (!isMobile() || isStandalone()) return;

    const { bar, dialog } = createUI();
    const installButton = bar.querySelector(".pwa-install-action");
    const dismissButton = bar.querySelector(".pwa-install-dismiss");
    const closeButton = dialog.querySelector(".pwa-dialog-close");

    installButton.addEventListener("click", () => installOrExplain(dialog, bar));
    dismissButton.addEventListener("click", () => {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      bar.hidden = true;
    });
    closeButton.addEventListener("click", () => closeInstructions(dialog));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeInstructions(dialog);
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      installButton.textContent = "설치";
      if (!wasRecentlyDismissed()) bar.hidden = false;
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      bar.hidden = true;
      if (dialog.open) closeInstructions(dialog);
    });

    if (!wasRecentlyDismissed()) {
      window.setTimeout(() => { bar.hidden = false; }, 700);
    }
  });
})();
