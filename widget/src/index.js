(function () {
  "use strict";

  const WIDGET_VERSION = "2.3.1"; // Version for cache debugging - SPA route change detection
  console.log("[Klyro] Widget script loaded, version:", WIDGET_VERSION);

  // Get widget configuration from script tag
  const currentScript = document.currentScript;
  const widgetKey = currentScript?.getAttribute("data-widget-key");

  console.log("[Klyro] Widget key:", widgetKey);

  if (!widgetKey) {
    console.error("Klyro: Missing data-widget-key attribute");
    return;
  }

  // Configuration
  const API_BASE = currentScript?.src.replace("/widget.js", "") || "";

  // Storage key for persistence
  const STORAGE_KEY = `klyro_${widgetKey}`;

  // State
  let config = null;
  let isOpen = false;
  let messages = [];
  let sessionId = null;
  let isLoading = false;
  let widgetContainer = null; // Reference to the widget DOM container
  let lastCheckedPath = null; // Track last path for route change detection

  // Load persisted chat from localStorage
  function loadPersistedChat() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        messages = data.messages || [];
        sessionId = data.sessionId || null;
        console.log(
          "[Klyro] Loaded persisted chat:",
          messages.length,
          "messages",
        );
        return true;
      }
    } catch (err) {
      console.error("[Klyro] Failed to load persisted chat:", err);
    }
    return false;
  }

  // Save chat to localStorage
  function persistChat() {
    try {
      const data = {
        messages,
        sessionId,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("[Klyro] Failed to persist chat:", err);
    }
  }

  // Clear persisted chat
  function clearPersistedChat() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("[Klyro] Failed to clear persisted chat:", err);
    }
  }

  // Download chat transcript
  function downloadTranscript() {
    if (messages.length === 0) return;

    const header = config?.headerTitle || "Chat Transcript";
    const timestamp = new Date().toLocaleString();

    let transcript = `${header}\n`;
    transcript += `Downloaded: ${timestamp}\n`;
    transcript += "=".repeat(50) + "\n\n";

    messages.forEach((msg, index) => {
      const role =
        msg.role === "user" ? "You" : config?.headerTitle || "Assistant";
      transcript += `${role}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Styles
  const styles = `
    .klyro-widget * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .klyro-button {
      position: fixed;
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 9999;
    }
    
    .klyro-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    
    .klyro-button.bottom-right {
      right: 20px;
    }
    
    .klyro-button.bottom-left {
      left: 20px;
    }
    
    .klyro-button svg {
      width: 28px;
      height: 28px;
      fill: white;
      flex-shrink: 0;
    }

    .klyro-button.text-mode {
      width: auto;
      height: 48px;
      border-radius: 24px;
      padding: 0 20px;
      gap: 10px;
    }

    .klyro-button.text-mode .klyro-button-text {
      color: white;
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .klyro-panel {
      position: fixed;
      bottom: 100px;
      width: 380px;
      height: 520px;
      max-height: calc(100vh - 140px);
      border-radius: 16px;
      overflow: hidden;
      display: none;
      flex-direction: column;
      z-index: 9998;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: klyroSlideUp 0.3s ease;
    }
    
    .klyro-panel.open {
      display: flex;
    }
    
    .klyro-panel.bottom-right {
      right: 20px;
    }
    
    .klyro-panel.bottom-left {
      left: 20px;
    }
    
    @keyframes klyroSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .klyro-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .klyro-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .klyro-header-icon svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
    .klyro-header-text h3 {
      color: white;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }
    
    .klyro-header-text p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      margin: 0;
    }

    .klyro-header-actions {
      display: flex;
      gap: 4px;
      margin-left: auto;
    }

    .klyro-header-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      transition: background 0.2s, transform 0.2s;
    }

    .klyro-header-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }

    .klyro-header-btn svg {
      width: 16px;
      height: 16px;
      fill: white;
    }

    .klyro-header-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .klyro-header-btn:disabled:hover {
      transform: none;
      background: rgba(255, 255, 255, 0.15);
    }

    .klyro-empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }

    .klyro-empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .klyro-empty-icon svg {
      width: 32px;
      height: 32px;
    }

    .klyro-empty-state h4 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .klyro-empty-state p {
      font-size: 13px;
      opacity: 0.8;
      line-height: 1.5;
      margin-bottom: 0;
      max-width: 300px;
    }
    
    .klyro-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .klyro-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    
    .klyro-message.user {
      align-self: flex-end;
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .klyro-message.assistant {
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    
    .klyro-typing {
      display: flex;
      gap: 4px;
      padding: 14px 18px;
      align-self: flex-start;
      border-radius: 12px;
    }
    
    .klyro-typing span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: klyroBounce 1.4s infinite ease-in-out both;
    }
    
    .klyro-typing span:nth-child(1) { animation-delay: -0.32s; }
    .klyro-typing span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes klyroBounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    
    .klyro-input-area {
      padding: 12px 16px;
      display: flex;
      gap: 8px;
      border-top: 1px solid;
    }

    .klyro-branding {
      padding: 10px 16px;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s ease;
      letter-spacing: 0.3px;
    }

    .klyro-branding:hover {
      opacity: 1;
      transform: translateY(-1px);
    }

    .klyro-branding a {
      color: inherit;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .klyro-branding a:hover {
      opacity: 1;
    }

    .klyro-branding .brand-name {
      color: #3b82f6; /* Klyro Brand Electric Blue */
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .klyro-branding svg {
      width: 14px;
      height: 14px;
      color: #3b82f6; /* Klyro Brand Electric Blue */
    }
    
    .klyro-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 24px;
      border: 1px solid;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .klyro-input:focus {
      border-color: var(--primary-color);
    }

    .klyro-message a {
      color: inherit;
      text-decoration: underline;
      font-weight: 600;
      transition: opacity 0.2s;
    }

    .klyro-message a:hover {
      opacity: 0.8;
    }

    .klyro-message.assistant a {
      color: var(--primary-color);
    }

    .klyro-message strong {
      font-weight: 600;
    }

    .klyro-message ul {
      margin: 8px 0;
      padding-left: 0;
      list-style: none;
    }

    .klyro-message li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
    }

    .klyro-message li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--primary-color);
      font-weight: bold;
    }
    
    .klyro-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    
    .klyro-send:hover:not(:disabled) {
      transform: scale(1.05);
    }
    
    .klyro-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .klyro-send svg {
      width: 18px;
      height: 18px;
      fill: white;
    }
    
    /* Theme: Light */
    .klyro-widget.light .klyro-panel {
      background: #ffffff;
    }
    
    .klyro-widget.light .klyro-messages {
      background: #f8fafc;
    }
    
    .klyro-widget.light .klyro-message.assistant {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }
    
    .klyro-widget.light .klyro-typing {
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    
    .klyro-widget.light .klyro-typing span {
      background: #94a3b8;
    }
    
    .klyro-widget.light .klyro-input-area {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    
    .klyro-widget.light .klyro-input {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #1e293b;
    }
    
    .klyro-widget.light .klyro-input::placeholder {
      color: #94a3b8;
    }

    .klyro-widget.light .klyro-branding {
      background: #ffffff;
      color: #475569;
      border-top: 1px solid #e2e8f0;
    }

    .klyro-widget.light .klyro-empty-state {
      background: #f8fafc;
    }

    .klyro-widget.light .klyro-empty-state h4 {
      color: #1e293b;
    }

    .klyro-widget.light .klyro-empty-state p {
      color: #64748b;
    }

    .klyro-widget.light .klyro-empty-icon {
      background: rgba(0, 0, 0, 0.05);
    }

    .klyro-widget.light .klyro-empty-icon svg {
      fill: var(--primary-color);
    }
    
    /* Theme: Dark */
    .klyro-widget.dark .klyro-panel {
      background: #1e293b;
    }
    
    .klyro-widget.dark .klyro-messages {
      background: #0f172a;
    }
    
    .klyro-widget.dark .klyro-message.assistant {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
    }
    
    .klyro-widget.dark .klyro-typing {
      background: #1e293b;
      border: 1px solid #334155;
    }
    
    .klyro-widget.dark .klyro-typing span {
      background: #64748b;
    }
    
    .klyro-widget.dark .klyro-input-area {
      background: #1e293b;
      border-color: #334155;
    }
    
    .klyro-widget.dark .klyro-input {
      background: #0f172a;
      border-color: #334155;
      color: #f1f5f9;
    }
    
    .klyro-widget.dark .klyro-input::placeholder {
      color: #94a3b8;
    }

    .klyro-widget.dark .klyro-branding {
      background: #1e293b;
      color: #94a3b8;
      border-top: 1px solid #334155;
    }

    .klyro-widget.dark .klyro-branding .brand-name,
    .klyro-widget.dark .klyro-branding svg {
      color: #60a5fa;
    }

    .klyro-widget.dark .klyro-empty-state {
      background: #0f172a;
    }

    .klyro-widget.dark .klyro-empty-state h4 {
      color: #f1f5f9;
    }

    .klyro-widget.dark .klyro-empty-state p {
      color: #94a3b8;
    }

    .klyro-widget.dark .klyro-empty-icon {
      background: rgba(255, 255, 255, 0.1);
    }

    .klyro-widget.dark .klyro-empty-icon svg {
      fill: var(--primary-color);
    }
    
    @media (max-width: 480px) {
      .klyro-panel {
        width: calc(100vw - 32px);
        left: 16px !important;
        right: 16px !important;
        bottom: 90px;
        height: calc(100vh - 120px);
        max-height: calc(100vh - 120px);
      }
    }

    .klyro-popover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
      padding: 20px;
    }
    
    .klyro-popover-overlay.open {
      display: flex;
    }
    
    .klyro-popover {
      background: #ffffff;
      width: 100%;
      max-width: 280px;
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      animation: klyroPopoverScale 0.2s ease-out;
    }

    @keyframes klyroPopoverScale {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .klyro-popover h4 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .klyro-popover p {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    
    .klyro-popover-actions {
      display: flex;
      gap: 12px;
    }
    
    .klyro-popover-btn {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .klyro-popover-btn.cancel {
      background: #f1f5f9;
      color: #475569;
    }

    .klyro-popover-btn.cancel:hover {
      background: #e2e8f0;
    }
    
    .klyro-popover-btn.confirm {
      background: var(--primary-color);
      color: white;
    }

    .klyro-popover-btn.confirm:hover {
      filter: brightness(1.1);
    }

    .klyro-widget.dark .klyro-popover {
      background: #1e293b;
      border: 1px solid #334155;
    }

    .klyro-widget.dark .klyro-popover h4 {
      color: #f1f5f9;
    }

    .klyro-widget.dark .klyro-popover p {
      color: #94a3b8;
    }

    .klyro-widget.dark .klyro-popover-btn.cancel {
      background: #334155;
      color: #cbd5e1;
    }

    .klyro-widget.dark .klyro-popover-btn.cancel:hover {
      background: #475569;
    }
  `;

  // Icons
  const chatIcon = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`;
  const closeIcon = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  const sendIcon = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const botIcon = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
  const downloadIcon = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
  const resetIcon = `<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;

  // Check if current route matches any of the allowed routes
  function shouldDisplayOnRoute(allowedRoutes) {
    // If no routes specified, show everywhere
    if (!allowedRoutes || allowedRoutes.length === 0) {
      return true;
    }

    const currentPath = window.location.pathname;

    for (const route of allowedRoutes) {
      const trimmedRoute = route.trim();

      // Exact match
      if (trimmedRoute === currentPath) {
        return true;
      }

      // Handle wildcard patterns like /blog/*
      if (trimmedRoute.endsWith("/*")) {
        const basePath = trimmedRoute.slice(0, -2); // Remove /*
        if (
          currentPath === basePath ||
          currentPath.startsWith(basePath + "/")
        ) {
          return true;
        }
      }

      // Handle root path specifically
      if (trimmedRoute === "/" && currentPath === "/") {
        return true;
      }
    }

    return false;
  }

  // Update widget visibility based on current route
  function updateWidgetVisibility() {
    if (!widgetContainer || !config) return;

    const currentPath = window.location.pathname;

    // Only process if path actually changed
    if (currentPath === lastCheckedPath) return;
    lastCheckedPath = currentPath;

    const shouldShow = shouldDisplayOnRoute(config.allowedRoutes);

    if (shouldShow) {
      widgetContainer.style.display = "";
      console.log("[Klyro] Widget shown on route:", currentPath);
    } else {
      widgetContainer.style.display = "none";
      // Also close the panel if it's open
      if (isOpen) {
        isOpen = false;
        const panel = widgetContainer.querySelector(".klyro-panel");
        if (panel) panel.classList.remove("open");
      }
      console.log("[Klyro] Widget hidden on route:", currentPath);
    }
  }

  // Setup route change listeners for SPA navigation
  function setupRouteChangeListeners() {
    // Store initial path
    lastCheckedPath = window.location.pathname;

    // Listen for browser back/forward navigation
    window.addEventListener("popstate", () => {
      console.log("[Klyro] Popstate detected");
      updateWidgetVisibility();
    });

    // Intercept history.pushState for SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      console.log("[Klyro] PushState detected");
      // Use setTimeout to let the URL update complete
      setTimeout(updateWidgetVisibility, 0);
    };

    // Intercept history.replaceState for SPA navigation
    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      console.log("[Klyro] ReplaceState detected");
      setTimeout(updateWidgetVisibility, 0);
    };

    console.log("[Klyro] Route change listeners set up");
  }

  // Initialize
  async function init() {
    console.log("[Klyro] Initializing, API_BASE:", API_BASE);
    try {
      const url = `${API_BASE}/api/widget/${widgetKey}`;
      console.log("[Klyro] Fetching config from:", url);
      const res = await fetch(url);
      console.log("[Klyro] Response status:", res.status);
      if (!res.ok) throw new Error("Widget not found");
      config = await res.json();
      console.log("[Klyro] Config loaded:", config);

      // Load chat before rendering
      loadPersistedChat();

      // Migration: Remove welcome message if it's the first message
      // (Since we now have the empty state placeholder)
      if (
        messages.length > 0 &&
        config.welcomeMessage &&
        messages[0].role === "assistant" &&
        messages[0].content === config.welcomeMessage
      ) {
        console.log("[Klyro] Removing legacy welcome message from history");
        messages.shift();
        persistChat();
      }

      // Always render the widget
      render();

      // Setup route change listeners for SPA navigation
      setupRouteChangeListeners();

      // Check initial visibility (will hide if not on allowed route)
      const shouldShow = shouldDisplayOnRoute(config.allowedRoutes);
      if (!shouldShow && widgetContainer) {
        widgetContainer.style.display = "none";
        console.log(
          "[Klyro] Widget hidden on initial route:",
          window.location.pathname,
        );
      }
    } catch (err) {
      console.error("Klyro: Failed to load widget", err);
    }
  }

  // Render widget
  function render() {
    console.log("[Klyro] Rendering widget...");
    // Add styles
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Determine theme
    let theme = config.theme;
    if (theme === "auto") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Create container
    const container = document.createElement("div");
    container.className = `klyro-widget ${theme}`;
    container.style.setProperty("--primary-color", config.primaryColor);

    const isTextMode = config.launcherMode === "text" && config.launcherText;

    container.innerHTML = `
      <button class="klyro-button ${config.position} ${isTextMode ? "text-mode" : ""}" style="background: ${config.primaryColor}">
        ${chatIcon}
        ${isTextMode ? `<span class="klyro-button-text">${escapeHtml(config.launcherText)}</span>` : ""}
      </button>
      <div class="klyro-panel ${config.position}">
        <div class="klyro-header" style="background: ${config.primaryColor}">
          <div class="klyro-header-icon">${botIcon}</div>
          <div class="klyro-header-text">
            <h3>${escapeHtml(config.headerTitle || "Chat Assistant")}</h3>
            <p>Your personal guide to this site</p>
          </div>
          <div class="klyro-header-actions">
            <button class="klyro-header-btn download-btn" title="Download Transcript">
              ${downloadIcon}
            </button>
            <button class="klyro-header-btn reset-btn" title="Reset Chat">
              ${resetIcon}
            </button>
          </div>
        </div>
        <div class="klyro-messages"></div>
        <div class="klyro-input-area">
          <input type="text" class="klyro-input" placeholder="Type a message...">
          <button class="klyro-send" style="background: ${config.primaryColor}">${sendIcon}</button>
        </div>
        <div class="klyro-branding">
          <a href="https://klyro-pro.vercel.app" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>Powered by <span class="brand-name">Klyro</span></span>
          </a>
        </div>
        <div class="klyro-popover-overlay">
          <div class="klyro-popover">
            <h4>Reset Chat?</h4>
            <p>This will clear your entire conversation history. This action cannot be undone.</p>
            <div class="klyro-popover-actions">
              <button class="klyro-popover-btn cancel">Cancel</button>
              <button class="klyro-popover-btn confirm">Clear All</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Store reference to container for route visibility control
    widgetContainer = container;

    // Elements
    const button = container.querySelector(".klyro-button");
    const panel = container.querySelector(".klyro-panel");
    const messagesContainer = container.querySelector(".klyro-messages");
    const input = container.querySelector(".klyro-input");
    const sendBtn = container.querySelector(".klyro-send");
    const resetBtn = container.querySelector(".reset-btn");
    const downloadBtn = container.querySelector(".download-btn");

    const popover = container.querySelector(".klyro-popover-overlay");
    const confirmResetBtn = popover.querySelector(".confirm");
    const cancelResetBtn = popover.querySelector(".cancel");

    // Initial render
    renderMessages();

    // Event listeners
    button.addEventListener("click", () => {
      isOpen = !isOpen;
      panel.classList.toggle("open", isOpen);

      const isTextMode = config.launcherMode === "text" && config.launcherText;

      if (isOpen) {
        button.innerHTML = closeIcon;
        button.classList.remove("text-mode");
        input.focus();
        renderMessages(); // Fresh render when opening
      } else {
        button.innerHTML =
          chatIcon +
          (isTextMode
            ? `<span class="klyro-button-text">${escapeHtml(config.launcherText)}</span>`
            : "");
        if (isTextMode) button.classList.add("text-mode");
      }
    });

    resetBtn.addEventListener("click", () => {
      popover.classList.add("open");
    });

    cancelResetBtn.addEventListener("click", () => {
      popover.classList.remove("open");
    });

    confirmResetBtn.addEventListener("click", () => {
      messages = [];
      sessionId = null;
      clearPersistedChat();
      renderMessages();
      popover.classList.remove("open");
    });

    downloadBtn.addEventListener("click", downloadTranscript);

    async function sendMessage(textOverride) {
      const text = textOverride || input.value.trim();
      if (!text || isLoading) return;

      messages.push({ role: "user", content: text });
      if (!textOverride) input.value = "";
      renderMessages();
      persistChat();

      isLoading = true;
      renderMessages();

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            widgetKey,
            sessionId,
          }),
        });

        const data = await res.json();
        isLoading = false;

        if (res.ok) {
          sessionId = data.sessionId;
          messages.push({ role: "assistant", content: data.response });
          persistChat();
        } else {
          messages.push({
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          });
        }
      } catch (err) {
        isLoading = false;
        messages.push({
          role: "assistant",
          content: "Unable to connect. Please try again later.",
        });
      }

      renderMessages();
    }

    sendBtn.addEventListener("click", () => sendMessage());
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    function renderMessages() {
      // Filter out legacy welcome message from display if it's the first one
      // (Since we now have the empty state placeholder)
      const displayMessages = messages.filter((msg, idx) => {
        if (
          idx === 0 &&
          msg.role === "assistant" &&
          config.welcomeMessage &&
          msg.content.trim() === config.welcomeMessage.trim()
        ) {
          return false;
        }
        return true;
      });

      // Show/Hide download button based on displayable message count
      downloadBtn.disabled = displayMessages.length === 0;

      if (displayMessages.length === 0) {
        // ... show empty state ...
        const firstName = (config.headerTitle || "Assistant").split(" ")[0];
        messagesContainer.innerHTML = `
          <div class="klyro-empty-state">
            <div class="klyro-empty-icon" style="background: ${config.primaryColor}20">
              ${botIcon}
            </div>
            <h4>Hey! I'm ${escapeHtml(firstName)}'s copilot</h4>
            <p>I can help answer questions about them</p>
          </div>
        `;
      } else {
        messagesContainer.innerHTML = displayMessages
          .map(
            (msg) => `
          <div class="klyro-message ${msg.role}" ${msg.role === "user" ? `style="background: ${config.primaryColor}"` : ""}>
            ${msg.role === "assistant" ? formatMessage(msg.content) : escapeHtml(msg.content)}
          </div>
        `,
          )
          .join("");
      }

      if (isLoading) {
        messagesContainer.innerHTML += `
          <div class="klyro-typing">
            <span style="background: ${config.primaryColor}"></span>
            <span style="background: ${config.primaryColor}"></span>
            <span style="background: ${config.primaryColor}"></span>
          </div>
        `;
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      sendBtn.disabled = isLoading;
    }
  }

  function formatMessage(text) {
    if (!text) return "";

    console.log("[Klyro] formatMessage called with:", text.substring(0, 100));

    // Step 1: Protect and extract markdown links: [text](url)
    const linkPlaceholders = [];
    let content = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      (match, linkText, url) => {
        const placeholder = `__LINK_${linkPlaceholders.length}__`;
        linkPlaceholders.push({ text: linkText, url });
        return placeholder;
      },
    );

    // Step 2: Extract and protect raw URLs
    const urlPlaceholders = [];
    content = content.replace(/(https?:\/\/[^\s<\]]+)/g, (match, url) => {
      // Don't double-process URLs that were part of markdown links
      if (match.includes("__LINK_")) return match;
      console.log("[Klyro] Found raw URL:", url);
      const placeholder = `__URL_${urlPlaceholders.length}__`;
      urlPlaceholders.push(url);
      return placeholder;
    });

    // Step 3: Now escape HTML on the remaining content
    let html = escapeHtml(content);

    // Step 4: Restore markdown links as actual <a> tags
    linkPlaceholders.forEach((link, i) => {
      const safeText = escapeHtml(link.text);
      html = html.replace(
        `__LINK_${i}__`,
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer">${safeText}</a>`,
      );
    });

    // Step 5: Restore raw URLs as <a> tags
    urlPlaceholders.forEach((url, i) => {
      html = html.replace(
        `__URL_${i}__`,
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
      );
    });

    // Markdown: Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Markdown: Italic *text* (but not if it's a bullet point at start of line)
    html = html.replace(/(?<!^|\n)\*([^*\n]+)\*/g, "<em>$1</em>");

    // Convert bullet points (•, -, *) at the start of lines into list items
    const lines = html.split("\n");
    let inList = false;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.+)$/);

      if (bulletMatch) {
        if (!inList) {
          result.push("<ul>");
          inList = true;
        }
        result.push(`<li>${bulletMatch[1]}</li>`);
      } else {
        if (inList) {
          result.push("</ul>");
          inList = false;
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push("</ul>");
    }

    html = result.join("\n");

    // Newlines to <br> (but not inside lists)
    html = html.replace(/\n(?!<\/?[uo]l|<\/?li)/g, "<br>");
    // Clean up any remaining newlines
    html = html.replace(/\n/g, "");

    console.log("[Klyro] formatMessage result:", html.substring(0, 100));

    return html;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
