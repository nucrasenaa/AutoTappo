// AutoTappo 前端主逻辑 (支持原生浏览器独立双击预览 & Gitee国内直连检测 & 可自定义全局热键)

(function () {
  "use strict";

  const CURRENT_VERSION = "v0.2.0";
  const GITEE_API_URL = "https://gitee.com/api/v5/repos/To0Ru/AutoTappo/releases/latest";
  const GITHUB_API_URL = "https://api.github.com/repos/To0Ru/AutoTappo/releases/latest";

  // 兜底源：仓库内置的 version.json。
  // Release API 在部分网络下会 404（Gitee 未发版）或被限流（GitHub 未认证 403），
  // 而 raw 文件读取不受这些限制，所以作为最后一道保险。
  const VERSION_FILE_URLS = [
    "https://gitee.com/To0Ru/AutoTappo/raw/main/version.json",
    "https://raw.githubusercontent.com/To0Ru/AutoTappo/main/version.json",
    "https://cdn.jsdelivr.net/gh/To0Ru/AutoTappo@main/version.json",
  ];
  const UPDATE_FETCH_TIMEOUT_MS = 6000;

  // 检测是否在 Tauri 原生客户端运行
  const isTauri = typeof window.__TAURI__ !== "undefined" && typeof window.__TAURI__.core !== "undefined";

  // 安全 invoke 包装
  const invoke = isTauri
    ? window.__TAURI__.core.invoke
    : async (cmd, args) => {
        console.log("[Browser Preview Mode] Invoke called:", cmd, args);
        return null;
      };

  // DOM 元素引用
  const statusBadge = document.getElementById("status-badge");
  const counterValue = document.getElementById("counter-value");
  const btnToggle = document.getElementById("btn-toggle");
  const btnToggleIcon = document.getElementById("btn-toggle-icon");
  const btnToggleText = document.getElementById("btn-toggle-text");
  const btnReset = document.getElementById("btn-reset");
  const speedButtons = document.querySelectorAll(".speed-btn");
  const btnBell = document.getElementById("btn-bell");
  const updateDot = document.getElementById("update-dot");
  const btnHide = document.getElementById("btn-hide");
  const btnDock = document.getElementById("btn-dock");
  const btnQuit = document.getElementById("btn-quit");

  // 热键自定义 DOM
  const btnHotkey = document.getElementById("btn-hotkey");
  const lblHotkey = document.getElementById("lbl-hotkey");
  const hotkeyTip = document.getElementById("hotkey-tip");

  // Modal 弹窗元素
  const updateModal = document.getElementById("update-modal");
  const btnModalClose = document.getElementById("btn-modal-close");
  const lblCurVersion = document.getElementById("lbl-cur-version");
  const lblLatestVersion = document.getElementById("lbl-latest-version");
  const updateStatusBox = document.getElementById("update-status-box");
  const updateStatusText = document.getElementById("update-status-text");
  const updateSpinner = document.getElementById("update-spinner");
  const changelogArea = document.getElementById("changelog-area");
  const changelogContent = document.getElementById("changelog-content");
  const updateGuideCard = document.getElementById("update-guide-card");
  const linkGithubRepo = document.getElementById("link-github-repo");
  const lblGithubRepoUrl = document.getElementById("lbl-github-repo-url");
  const linkGiteeRepo = document.getElementById("link-gitee-repo");
  const lblGiteeRepoUrl = document.getElementById("lbl-gitee-repo-url");
  const btnCheckNow = document.getElementById("btn-check-now");
  const btnCheckText = document.getElementById("btn-check-text");
  const btnDownload = document.getElementById("btn-download");
  const btnGitee = document.getElementById("btn-gitee");

  // 两个仓库地址（发版页），供指引卡片与底部按钮共用
  const GITHUB_RELEASES_URL = "https://github.com/To0Ru/AutoTappo/releases";
  const GITEE_RELEASES_URL = "https://gitee.com/To0Ru/AutoTappo/releases";

  // 状态变量
  let currentRunning = false;
  let currentSpeed = 0;
  let localSentCount = 0;
  let previewInterval = null;
  let lastCheckTime = 0;
  let cachedLatestData = null;

  // 热键状态 (默认 F6, VK: 0x75 = 117)
  let currentHotkeyName = localStorage.getItem("autotappo_hotkey_name") || "F6";
  let currentHotkeyVK = parseInt(localStorage.getItem("autotappo_hotkey_vk"), 10) || 0x75;
  let isRecordingHotkey = false;

  const versionText = document.querySelector(".version-text");
  if (versionText) versionText.textContent = CURRENT_VERSION;
  if (lblCurVersion) lblCurVersion.textContent = CURRENT_VERSION;
  if (lblHotkey) lblHotkey.textContent = currentHotkeyName;

  // 更新主界面 UI
  function updateUI(status) {
    if (!status) return;

    currentRunning = status.running;
    currentSpeed = status.speed_mode;
    localSentCount = status.total_sent;

    // 1. 运行状态徽章
    if (statusBadge) {
      if (currentRunning) {
        statusBadge.textContent = "Running";
        statusBadge.classList.add("running");
      } else {
        statusBadge.textContent = "Paused";
        statusBadge.classList.remove("running");
      }
    }

    // 2. 模拟点击计数
    if (counterValue) {
      counterValue.textContent = localSentCount.toLocaleString();
    }

    // 3. 大按钮状态
    if (btnToggle && btnToggleText && btnToggleIcon) {
      if (currentRunning) {
        btnToggle.classList.add("running");
        btnToggleIcon.textContent = "⏸";
        btnToggleText.textContent = `Pause automation (${currentHotkeyName})`;
      } else {
        btnToggle.classList.remove("running");
        btnToggleIcon.textContent = "▶";
        btnToggleText.textContent = `Start automation (${currentHotkeyName})`;
      }
    }

    // 4. 速度档位高亮
    speedButtons.forEach((btn) => {
      const sp = parseInt(btn.dataset.speed, 10);
      if (sp === currentSpeed) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // 轮询同步状态
  async function pollStatus() {
    if (isTauri) {
      try {
        const status = await invoke("get_status");
        updateUI(status);
      } catch (err) {
        console.error("Failed to fetch status:", err);
      }
    }
  }

  // ---------------- 浏览器独立预览模式支持 ----------------
  if (!isTauri) {
    console.info("💡 Running in browser preview mode; interaction simulation is enabled.");
    updateUI({
      running: false,
      speed_mode: 0,
      total_sent: 0,
    });

    function startPreviewLoop() {
      if (previewInterval) clearInterval(previewInterval);
      const speedIntervals = [100, 45, 22]; // 休闲(~10/s), 快速(~22/s), 极速(~45/s)
      previewInterval = setInterval(() => {
        if (currentRunning) {
          localSentCount += 1;
          if (counterValue) counterValue.textContent = localSentCount.toLocaleString();
        }
      }, speedIntervals[currentSpeed] || 100);
    }
    startPreviewLoop();
  }

  // ---------------- 交互事件绑定 ----------------
  if (btnToggle) {
    btnToggle.addEventListener("click", async () => {
      if (isTauri) {
        try {
          const newRunning = await invoke("toggle_running");
          currentRunning = newRunning;
          await pollStatus();
        } catch (err) {
          console.error("Failed to toggle running:", err);
        }
      } else {
        currentRunning = !currentRunning;
        updateUI({
          running: currentRunning,
          speed_mode: currentSpeed,
          total_sent: localSentCount,
        });
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", async () => {
      if (isTauri) {
        try {
          await invoke("reset_sent_count");
        } catch (err) {
          console.error("Failed to reset count:", err);
        }
      }
      localSentCount = 0;
      if (counterValue) counterValue.textContent = "0";
    });
  }

  speedButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mode = parseInt(btn.dataset.speed, 10);
      currentSpeed = mode;
      if (isTauri) {
        try {
          await invoke("set_speed", { mode });
          await pollStatus();
        } catch (err) {
          console.error("Failed to set speed:", err);
        }
      } else {
        updateUI({
          running: currentRunning,
          speed_mode: currentSpeed,
          total_sent: localSentCount,
        });
      }
    });
  });

  const hideWindow = async () => {
    if (isTauri) {
      try {
        await invoke("minimize_to_tray");
      } catch (err) {
        console.error("Failed to minimize:", err);
      }
    } else {
      alert("Preview mode: the packaged app will hide to the menu bar and keep running in the background.");
    }
  };

  if (btnHide) btnHide.addEventListener("click", hideWindow);

  // macOS menu-bar utility mode: keep the tray icon and control panel, but
  // optionally remove AutoTappo from the Dock. The preference is local-only.
  const isMacOS =
    isTauri && /Macintosh|Mac OS X/i.test(`${navigator.platform} ${navigator.userAgent}`);
  let hideDock = localStorage.getItem("autotappo.hideDock") === "1";
  const setDockVisibility = async () => {
    if (!isMacOS || !window.__TAURI__?.app?.setDockVisibility) return;
    const shouldHide = hideDock;
    await window.__TAURI__.app.setDockVisibility(!shouldHide);

    // Tauri uses macOS's TransformProcessType API. macOS ignores a hide call
    // made immediately after a show call, so retry a hide after its cooldown.
    if (shouldHide) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (hideDock === shouldHide) {
        await window.__TAURI__.app.setDockVisibility(false);
      }
    }
  };
  const renderDockButton = () => {
    if (!btnDock) return;
    btnDock.hidden = !isMacOS;
    btnDock.textContent = hideDock ? "Show Dock icon" : "Hide Dock icon";
    btnDock.setAttribute("aria-pressed", hideDock ? "true" : "false");
  };
  if (btnDock) {
    btnDock.addEventListener("click", async () => {
      hideDock = !hideDock;
      localStorage.setItem("autotappo.hideDock", hideDock ? "1" : "0");
      renderDockButton();
      try {
        await setDockVisibility();
      } catch (err) {
        console.error("Failed to change Dock visibility:", err);
      }
    });
  }
  renderDockButton();
  if (hideDock) {
    setDockVisibility().catch((err) => console.error("Failed to apply Dock visibility:", err));
  }

  if (btnQuit) {
    btnQuit.addEventListener("click", async () => {
      if (isTauri) {
        try {
          await invoke("quit_app");
        } catch (err) {
          console.error("Failed to quit app:", err);
        }
      } else {
        alert("Preview mode: the packaged app will quit completely.");
      }
    });
  }

  // ---------------- 全局热键自定义录制逻辑 ----------------
  const FORBIDDEN_HOTKEYS = {
    F7: "F7 is reserved by WuwaTappo game mode and cannot be assigned",
    F8: "F8 is reserved by WuwaTappo display switching and cannot be assigned",
    F9: "F9 is reserved by WuwaTappo hide mode and cannot be assigned",
  };

  function getWinVirtualKey(e) {
    if (e.code.startsWith("F") && !isNaN(e.code.slice(1))) {
      const num = parseInt(e.code.slice(1), 10);
      if (num >= 1 && num <= 12) return { vk: 0x6f + num, name: e.code };
    }
    const specialMap = {
      Home: { vk: 0x24, name: "Home" },
      End: { vk: 0x23, name: "End" },
      PageUp: { vk: 0x21, name: "PgUp" },
      PageDown: { vk: 0x22, name: "PgDn" },
      Insert: { vk: 0x2d, name: "Ins" },
      Delete: { vk: 0x2e, name: "Del" },
      Pause: { vk: 0x13, name: "Pause" },
      ScrollLock: { vk: 0x91, name: "ScrLk" },
      Backquote: { vk: 0xc0, name: "`" },
      NumpadAdd: { vk: 0x6b, name: "Num+" },
      NumpadSubtract: { vk: 0x6d, name: "Num-" },
      NumpadMultiply: { vk: 0x6a, name: "Num*" },
      NumpadDivide: { vk: 0x6f, name: "Num/" },
    };
    if (specialMap[e.code]) return specialMap[e.code];

    if (e.code.startsWith("Key")) {
      const char = e.code.slice(3).toUpperCase();
      return { vk: char.charCodeAt(0), name: char };
    }

    return null;
  }

  if (btnHotkey) {
    btnHotkey.addEventListener("click", () => {
      if (isRecordingHotkey) {
        cancelRecording();
        return;
      }
      startRecording();
    });
  }

  function startRecording() {
    isRecordingHotkey = true;
    if (btnHotkey) btnHotkey.classList.add("recording");
    if (lblHotkey) lblHotkey.textContent = "Press a key...";
    if (hotkeyTip) hotkeyTip.textContent = "Press Esc to cancel";

    window.addEventListener("keydown", handleRecordKey, { capture: true });
  }

  function cancelRecording() {
    isRecordingHotkey = false;
    if (btnHotkey) btnHotkey.classList.remove("recording");
    if (lblHotkey) lblHotkey.textContent = currentHotkeyName;
    if (hotkeyTip) hotkeyTip.textContent = "Click to change";
    window.removeEventListener("keydown", handleRecordKey, { capture: true });
  }

  async function handleRecordKey(e) {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      cancelRecording();
      return;
    }

    if (FORBIDDEN_HOTKEYS[e.key]) {
      alert(`[Hint] ${FORBIDDEN_HOTKEYS[e.key]}. Choose another key.`);
      cancelRecording();
      return;
    }

    const result = getWinVirtualKey(e);
    if (!result) {
      alert("[Hint] Press a supported key such as F1-F6, F10-F12, Home, PgUp, or a numpad key.");
      cancelRecording();
      return;
    }

    currentHotkeyName = result.name;
    currentHotkeyVK = result.vk;

    localStorage.setItem("autotappo_hotkey_name", currentHotkeyName);
    localStorage.setItem("autotappo_hotkey_vk", currentHotkeyVK.toString());

    if (lblHotkey) lblHotkey.textContent = currentHotkeyName;
    if (btnHotkey) btnHotkey.classList.remove("recording");
    if (hotkeyTip) {
      hotkeyTip.textContent = "Saved";
      setTimeout(() => {
        hotkeyTip.textContent = "Click to change";
      }, 1500);
    }

    if (isTauri) {
      try {
        await invoke("set_hotkey", { vk: currentHotkeyVK });
      } catch (err) {
        console.error("Failed to set hotkey in backend:", err);
      }
    }

    updateUI({
      running: currentRunning,
      speed_mode: currentSpeed,
      total_sent: localSentCount,
    });

    isRecordingHotkey = false;
    window.removeEventListener("keydown", handleRecordKey, { capture: true });
  }

  if (isTauri) {
    invoke("set_hotkey", { vk: currentHotkeyVK }).catch(() => {});
  }

  // ---------------- 检查更新逻辑 (Gitee 国内直连优先 + 红点感知) ----------------
  function openUpdateModal() {
    if (updateModal) updateModal.classList.add("show");
    if (cachedLatestData) {
      applyUpdateData(cachedLatestData);
    } else {
      checkUpdate({ silent: false });
    }
  }

  function closeUpdateModal() {
    if (updateModal) updateModal.classList.remove("show");
  }

  if (btnBell) btnBell.addEventListener("click", openUpdateModal);
  if (btnModalClose) btnModalClose.addEventListener("click", closeUpdateModal);
  if (updateModal) {
    updateModal.addEventListener("click", (e) => {
      if (e.target === updateModal) {
        closeUpdateModal();
      }
    });
  }

  function compareVersions(v1, v2) {
    const clean1 = (v1 || "").replace(/^v/, "").split(".").map(Number);
    const clean2 = (v2 || "").replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
      const num1 = clean1[i] || 0;
      const num2 = clean2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  async function checkUpdate({ silent = false } = {}) {
    lastCheckTime = Date.now();

    if (!silent) {
      if (updateSpinner) updateSpinner.style.display = "inline-block";
      if (updateStatusBox) updateStatusBox.className = "update-status-box";
      if (updateStatusText) updateStatusText.textContent = "Checking for the latest version through Gitee...";
      if (btnCheckNow) btnCheckNow.disabled = true;
      if (btnCheckText) btnCheckText.textContent = "Checking...";
      if (changelogArea) changelogArea.style.display = "none";
      if (updateGuideCard) updateGuideCard.style.display = "none";
      if (btnDownload) btnDownload.style.display = "none";
      if (btnGitee) btnGitee.style.display = "none";
      if (btnCheckNow) btnCheckNow.style.display = "inline-flex";
    }

    let latestData = null;
    let source = "Gitee";

    // 带超时的 JSON 拉取：任一源卡住都不会拖慢整体检查
    async function fetchReleaseJson(url, label) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), UPDATE_FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) {
          console.warn(`[update] ${label} 返回 HTTP ${res.status}`);
          return null;
        }
        const data = await res.json();
        if (data && data.tag_name) return { data, source: label };
        console.warn(`[update] ${label} 无 tag_name 字段`);
      } catch (e) {
        console.warn(`[update] ${label} 获取失败:`, e && e.message ? e.message : e);
      } finally {
        clearTimeout(timer);
      }
      return null;
    }

    // 多源并发查询，然后取版本号最高的一个。
    // 不能「谁先成功就用谁」——某个源滞后（如 Gitee 未发新版）会导致漏报更新。
    const candidates = (
      await Promise.all([
        fetchReleaseJson(GITEE_API_URL, "Gitee"),
        fetchReleaseJson(GITHUB_API_URL, "GitHub"),
        fetchReleaseJson(VERSION_FILE_URLS[0], "Gitee 镜像"),
        fetchReleaseJson(VERSION_FILE_URLS[1], "GitHub 镜像"),
        fetchReleaseJson(VERSION_FILE_URLS[2], "jsDelivr"),
      ])
    ).filter(Boolean);

    if (candidates.length > 0) {
      candidates.sort((a, b) => compareVersions(b.data.tag_name, a.data.tag_name));
      latestData = candidates[0].data;
      source = candidates[0].source;
      console.log(
        `[update] 候选版本: ${candidates.map((c) => `${c.data.tag_name}(${c.source})`).join(", ")} -> 采用 ${latestData.tag_name}`
      );
    }

    cachedLatestData = { data: latestData, source };

    if (!silent) {
      if (updateSpinner) updateSpinner.style.display = "none";
      if (btnCheckNow) btnCheckNow.disabled = false;
      if (btnCheckText) btnCheckText.textContent = "Check again";
    }

    applyUpdateData(cachedLatestData, silent);
  }

  function applyUpdateData(result, silent = false) {
    if (!result) return;
    const { data: latestData, source } = result;

    if (latestData && latestData.tag_name) {
      const latestTag = latestData.tag_name;
      if (lblLatestVersion) lblLatestVersion.textContent = latestTag;

      const cmp = compareVersions(latestTag, CURRENT_VERSION);
      if (cmp > 0) {
        if (updateDot) updateDot.classList.add("active");
        if (updateStatusBox) updateStatusBox.className = "update-status-box has-new";
        if (updateStatusText) {
          updateStatusText.innerHTML = `🎉 <strong>New version ${latestTag} available (${source})</strong>`;
        }

        const body = latestData.body || latestData.description || "Includes stability and experience improvements.";
        if (changelogContent) changelogContent.textContent = body;
        if (changelogArea) changelogArea.style.display = "block";

        // 两个仓库分别按 tag 拼出直达链接，避免某个源返回的 html_url 指向另一个平台
        const ghUrl = `${GITHUB_RELEASES_URL}/tag/${latestTag}`;
        const giteeUrl = `${GITEE_RELEASES_URL}/tag/${latestTag}`;

        // 指引卡片展示稳定的 releases 页地址（不带 tag，避免换行折行），
        // 底部按钮才用带 tag 的直达链接
        if (updateGuideCard) {
          updateGuideCard.style.display = "flex";
          if (linkGithubRepo) linkGithubRepo.href = GITHUB_RELEASES_URL;
          if (lblGithubRepoUrl) lblGithubRepoUrl.textContent = GITHUB_RELEASES_URL;
          if (linkGiteeRepo) linkGiteeRepo.href = GITEE_RELEASES_URL;
          if (lblGiteeRepoUrl) lblGiteeRepoUrl.textContent = GITEE_RELEASES_URL;
        }

        // 已确认有新版本，再点「立即检查更新」毫无意义：
        // 收起检查按钮，换成 GitHub / Gitee 两个下载入口
        if (btnCheckNow) btnCheckNow.style.display = "none";
        if (btnDownload) {
          btnDownload.href = ghUrl;
          btnDownload.style.display = "inline-flex";
        }
        if (btnGitee) {
          btnGitee.href = giteeUrl;
          btnGitee.style.display = "inline-flex";
        }
      } else {
        if (updateDot) updateDot.classList.remove("active");
        if (updateStatusBox) updateStatusBox.className = "update-status-box is-latest";
        if (updateStatusText) updateStatusText.textContent = `✨ You are up to date! (synced from ${source})`;
        if (changelogArea) changelogArea.style.display = "none";
        if (updateGuideCard) updateGuideCard.style.display = "none";
        if (btnDownload) btnDownload.style.display = "none";
        if (btnGitee) btnGitee.style.display = "none";
        if (btnCheckNow) btnCheckNow.style.display = "inline-flex";
      }
    } else {
      if (updateDot) updateDot.classList.remove("active");
      if (lblLatestVersion) lblLatestVersion.textContent = CURRENT_VERSION;
      if (updateStatusBox) updateStatusBox.className = "update-status-box is-latest";
      if (updateStatusText) {
        updateStatusText.textContent = `✨ ${CURRENT_VERSION} is the latest stable version!`;
      }
      if (changelogArea) changelogArea.style.display = "none";
      if (updateGuideCard) updateGuideCard.style.display = "none";
      if (btnDownload) btnDownload.style.display = "none";
      if (btnGitee) btnGitee.style.display = "none";
      if (btnCheckNow) btnCheckNow.style.display = "inline-flex";
    }
  }

  if (btnCheckNow) btnCheckNow.addEventListener("click", () => checkUpdate({ silent: false }));

  // ---------------- 界面唤醒 / 打开时的静默自动检测逻辑 ----------------
  function triggerAutoCheck() {
    const now = Date.now();
    if (now - lastCheckTime > 60000) {
      checkUpdate({ silent: true });
    }
  }

  window.addEventListener("focus", triggerAutoCheck);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      triggerAutoCheck();
    }
  });
  triggerAutoCheck();

  // ==================== 自动开箱 ====================
  const chestCard = document.getElementById("chest-card");
  const chestSwitch = document.getElementById("chest-switch");
  const chestBadge = document.getElementById("chest-badge");
  const chestHint = document.getElementById("chest-hint");
  const chestCount = document.getElementById("chest-count");
  const chestWarn = document.getElementById("chest-warn");
  const btnElevate = document.getElementById("btn-elevate");
  const slotLeft = document.getElementById("slot-left");
  const slotRight = document.getElementById("slot-right");

  // 默认：正式版关闭，浏览器预览模式打开（方便直接双击查看效果）
  const storedChest = localStorage.getItem("autotappo.autoChest");
  let autoChest = (storedChest !== null ? storedChest : isTauri ? "0" : "1") === "1";

  function renderChestSwitch() {
    if (!chestSwitch) return;
    chestSwitch.setAttribute("aria-checked", autoChest ? "true" : "false");
    chestCard.classList.toggle("is-on", autoChest);
    chestBadge.textContent = autoChest ? "Enabled" : "Disabled";
  }

  function stateTag(text) {
    const t = (text || "").trim();
    if (!t || t === "-") return ["idle", "—"];
    if (t.includes("Ready") || t.includes("就绪")) return ["ready", "Ready"];
    if (t.includes("Cooling down") || t.includes("冷却")) return ["cooldown", "Cooling down"];
    if (t.includes("Occluded") || t.includes("被遮挡")) return ["cooldown", "Occluded"];
    if (
      t.includes("Unable to determine") ||
      t.includes("无法判定") ||
      t.includes("Screenshot failed") ||
      t.includes("截取失败")
    ) {
      return ["idle", "Checking"];
    }
    if (t.includes("Managed by target app") || t.includes("目标应用管理")) {
      return ["idle", "Managed by target app"];
    }
    return ["idle", translateChestText(t)];
  }

  function translateChestText(text) {
    const t = (text || "").trim();
    const exact = {
      "已关闭": "Disabled",
      "待机": "Idle",
      "未找到桌宠进程": "WuwaTappo process not found",
      "桌宠面板打开或已隐藏": "WuwaTappo panel is open or hidden",
      "桌宠正在移动": "WuwaTappo is moving",
      "暂无宝箱（累计点击数不足）": "No chests yet (not enough clicks)",
      "需要管理员权限（官方桌宠以管理员运行）": "Administrator permission is required",
      "画面异常，本轮跳过": "Screen recognition failed; skipping this cycle",
      "冷却中，稍后探测": "Cooling down; checking again later",
      "已退出": "Stopped",
      "目标应用管理": "Managed by target app",
    };
    if (exact[t]) return exact[t];
    if (t.startsWith("已开启 ")) return t.replace("已开启 ", "Opened ").replace(" 宝箱", " chest");
    if (t.startsWith("未连接 WuwaTappo Global Mac：")) {
      return `WuwaTappo Global Mac is not connected: ${t.slice("未连接 WuwaTappo Global Mac：".length)}`;
    }
    if (t.startsWith("关闭自动开箱失败：")) {
      return `Failed to disable Auto Chest: ${t.slice("关闭自动开箱失败：".length)}`;
    }
    if (t.startsWith("点击投递失败")) return t.replace("点击投递失败", "Click delivery failed");
    if (t.startsWith("宝箱点击未生效")) return t.replace("宝箱点击未生效", "Chest click had no effect");
    return t;
  }

  function applySlot(el, text) {
    if (!el) return;
    const res = stateTag(text);
    el.dataset.state = res[0];
    const stateEl = el.querySelector(".slot-state");
    if (stateEl) stateEl.textContent = res[1];
  }

  const STATE_HINT = {
    idle: "Idle",
    "no-pet": "WuwaTappo was not found; start it first",
    "no-chest": "No chests yet; keep automating to unlock them",
    cooldown: "Cooling down; it will open when ready",
    occluded: "WuwaTappo is covered by another window; waiting",
    moving: "WuwaTappo is moving; retrying shortly",
    unknown: "Screen recognition failed; skipping this cycle",
    opened: "A chest was just opened",
    retry: "The click had no effect; retrying shortly",
    connecting: "Connecting to WuwaTappo Global Mac",
    "relay-enabled": "Connected; waiting for the target app to open chests",
    "no-target": "WuwaTappo Global Mac was not found; start it first",
    "need-admin": "Administrator permission is required to open chests",
    error: "Click delivery failed; retrying shortly",
    stopped: "Stopped",
    unsupported: "Auto Chest is not supported by this macOS build",
  };

  // 开关状态由前端（localStorage）唯一决定，绝不用后端快照反向覆盖：
  // 后端快照只在它自己那一轮循环里更新，刚切换时必然是旧值，
  // 一旦拿它回写就会把刚打开的开关又关掉。
  function applyChestStatus(s) {
    if (!s) return;
    applySlot(slotLeft, s.left);
    applySlot(slotRight, s.right);
    if (chestHint) chestHint.textContent = STATE_HINT[s.state] || translateChestText(s.detail) || "Idle";
    if (chestCount) { const count = s.opens_ok || 0; chestCount.textContent = `Opened ${count} time${count === 1 ? "" : "s"}`; }
    if (chestWarn) chestWarn.hidden = !(autoChest && s.elevated === false && s.state !== "unsupported");
  }

  async function pollChestStatus() {
    if (!autoChest) return;
    if (!isTauri) {
      applyChestStatus({
        enabled: true,
        elevated: false,
        state: "cooldown",
        detail: "Cooling down",
        left: "Cooling down",
        right: "Ready",
        opens_ok: 3,
        opens_failed: 0,
      });
      return;
    }
    try {
      const s = await invoke("get_chest_status");
      applyChestStatus(s);
    } catch (e) {
      /* Ignore transient polling failures. */
    }
  }

  if (chestSwitch) {
    chestSwitch.addEventListener("click", async () => {
      autoChest = !autoChest;
      localStorage.setItem("autotappo.autoChest", autoChest ? "1" : "0");
      renderChestSwitch();
      if (chestWarn) chestWarn.hidden = true;
      if (isTauri) {
        try {
          await invoke("set_auto_chest", { enabled: autoChest });
        } catch (e) {}
      }
      if (autoChest) pollChestStatus();
    });
  }

  if (btnElevate) {
    btnElevate.addEventListener("click", async () => {
      if (!isTauri) {
        alert("Browser preview mode: the packaged app can restart with administrator privileges.");
        return;
      }
      try {
        await invoke("relaunch_as_admin");
      } catch (e) {}
    });
  }

  renderChestSwitch();
  if (isTauri) {
    invoke("set_auto_chest", { enabled: autoChest }).catch(() => {});
    setInterval(pollChestStatus, 1000);
  } else {
    pollChestStatus();
  }

  // 启动状态轮询
  pollStatus();
  if (isTauri) {
    setInterval(pollStatus, 500);
  }

  // 挂载全局测试钩子
  window.testNewVersionUI = function () {
    openUpdateModal();
    applyUpdateData({
      data: {
        tag_name: "v0.2.0",
        html_url: "https://github.com/To0Ru/AutoTappo/releases",
        body: "1. Added Auto Chest support\n2. Improved background pause behavior for long sessions\n3. Added more custom global hotkey options",
      },
      source: "Gitee",
    });
  };
})();
