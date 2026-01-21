(function () {
  "use strict";

  // Get widget configuration from script tag
  const currentScript = document.currentScript;
  const widgetKey = currentScript?.getAttribute("data-widget-key");

  if (!widgetKey) {
    console.error("Chatfolio: Missing data-widget-key attribute");
    return;
  }

  // Configuration
  const API_BASE = currentScript?.src.replace("/widget.js", "") || "";

  // State
  let config = null;
  let isOpen = false;
  let messages = [];
  let sessionId = null;
  let isLoading = false;

  // Styles
  const styles = `
    .chatfolio-widget * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .chatfolio-button {
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
    
    .chatfolio-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    
    .chatfolio-button.bottom-right {
      right: 20px;
    }
    
    .chatfolio-button.bottom-left {
      left: 20px;
    }
    
    .chatfolio-button svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    
    .chatfolio-panel {
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
      animation: chatfolioSlideUp 0.3s ease;
    }
    
    .chatfolio-panel.open {
      display: flex;
    }
    
    .chatfolio-panel.bottom-right {
      right: 20px;
    }
    
    .chatfolio-panel.bottom-left {
      left: 20px;
    }
    
    @keyframes chatfolioSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .chatfolio-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .chatfolio-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chatfolio-header-icon svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    
    .chatfolio-header-text h3 {
      color: white;
      font-size: 16px;
      font-weight: 600;
    }
    
    .chatfolio-header-text p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
    }
    
    .chatfolio-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .chatfolio-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    
    .chatfolio-message.user {
      align-self: flex-end;
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .chatfolio-message.assistant {
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    
    .chatfolio-typing {
      display: flex;
      gap: 4px;
      padding: 14px 18px;
      align-self: flex-start;
      border-radius: 12px;
    }
    
    .chatfolio-typing span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: chatfolioBounce 1.4s infinite ease-in-out both;
    }
    
    .chatfolio-typing span:nth-child(1) { animation-delay: -0.32s; }
    .chatfolio-typing span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes chatfolioBounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }
    
    .chatfolio-input-area {
      padding: 12px 16px;
      display: flex;
      gap: 8px;
      border-top: 1px solid;
    }
    
    .chatfolio-input {
      flex: 1;
      padding: 10px 14px;
      border-radius: 24px;
      border: 1px solid;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .chatfolio-input:focus {
      border-color: var(--primary-color);
    }
    
    .chatfolio-send {
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
    
    .chatfolio-send:hover:not(:disabled) {
      transform: scale(1.05);
    }
    
    .chatfolio-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .chatfolio-send svg {
      width: 18px;
      height: 18px;
      fill: white;
    }
    
    /* Theme: Light */
    .chatfolio-widget.light .chatfolio-panel {
      background: #ffffff;
    }
    
    .chatfolio-widget.light .chatfolio-messages {
      background: #f8fafc;
    }
    
    .chatfolio-widget.light .chatfolio-message.assistant {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }
    
    .chatfolio-widget.light .chatfolio-typing {
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    
    .chatfolio-widget.light .chatfolio-typing span {
      background: #94a3b8;
    }
    
    .chatfolio-widget.light .chatfolio-input-area {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    
    .chatfolio-widget.light .chatfolio-input {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #1e293b;
    }
    
    .chatfolio-widget.light .chatfolio-input::placeholder {
      color: #94a3b8;
    }
    
    /* Theme: Dark */
    .chatfolio-widget.dark .chatfolio-panel {
      background: #1e293b;
    }
    
    .chatfolio-widget.dark .chatfolio-messages {
      background: #0f172a;
    }
    
    .chatfolio-widget.dark .chatfolio-message.assistant {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
    }
    
    .chatfolio-widget.dark .chatfolio-typing {
      background: #1e293b;
      border: 1px solid #334155;
    }
    
    .chatfolio-widget.dark .chatfolio-typing span {
      background: #64748b;
    }
    
    .chatfolio-widget.dark .chatfolio-input-area {
      background: #1e293b;
      border-color: #334155;
    }
    
    .chatfolio-widget.dark .chatfolio-input {
      background: #0f172a;
      border-color: #334155;
      color: #f1f5f9;
    }
    
    .chatfolio-widget.dark .chatfolio-input::placeholder {
      color: #64748b;
    }
    
    @media (max-width: 480px) {
      .chatfolio-panel {
        width: calc(100vw - 32px);
        left: 16px !important;
        right: 16px !important;
        bottom: 90px;
        height: calc(100vh - 120px);
        max-height: calc(100vh - 120px);
      }
    }
  `;

  // Icons
  const chatIcon = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`;
  const closeIcon = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  const sendIcon = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const botIcon = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;

  // Initialize
  async function init() {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}`);
      if (!res.ok) throw new Error("Widget not found");
      config = await res.json();
      render();
    } catch (err) {
      console.error("Chatfolio: Failed to load widget", err);
    }
  }

  // Render widget
  function render() {
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
    container.className = `chatfolio-widget ${theme}`;
    container.innerHTML = `
      <button class="chatfolio-button ${config.position}" style="background: ${config.primaryColor}">
        ${chatIcon}
      </button>
      <div class="chatfolio-panel ${config.position}">
        <div class="chatfolio-header" style="background: ${config.primaryColor}">
          <div class="chatfolio-header-icon">${botIcon}</div>
          <div class="chatfolio-header-text">
            <h3>Chat Assistant</h3>
            <p>Ask me anything</p>
          </div>
        </div>
        <div class="chatfolio-messages"></div>
        <div class="chatfolio-input-area">
          <input type="text" class="chatfolio-input" placeholder="Type a message...">
          <button class="chatfolio-send" style="background: ${config.primaryColor}">${sendIcon}</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Elements
    const button = container.querySelector(".chatfolio-button");
    const panel = container.querySelector(".chatfolio-panel");
    const messagesContainer = container.querySelector(".chatfolio-messages");
    const input = container.querySelector(".chatfolio-input");
    const sendBtn = container.querySelector(".chatfolio-send");

    // Add welcome message
    if (config.welcomeMessage) {
      messages.push({ role: "assistant", content: config.welcomeMessage });
      renderMessages();
    }

    // Event listeners
    button.addEventListener("click", () => {
      isOpen = !isOpen;
      panel.classList.toggle("open", isOpen);
      button.innerHTML = isOpen ? closeIcon : chatIcon;
      if (isOpen) input.focus();
    });

    async function sendMessage() {
      const text = input.value.trim();
      if (!text || isLoading) return;

      messages.push({ role: "user", content: text });
      input.value = "";
      renderMessages();

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

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    function renderMessages() {
      messagesContainer.innerHTML = messages
        .map(
          (msg) => `
        <div class="chatfolio-message ${msg.role}" ${msg.role === "user" ? `style="background: ${config.primaryColor}"` : ""}>
          ${escapeHtml(msg.content)}
        </div>
      `,
        )
        .join("");

      if (isLoading) {
        messagesContainer.innerHTML += `
          <div class="chatfolio-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        `;
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      sendBtn.disabled = isLoading;
    }
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
