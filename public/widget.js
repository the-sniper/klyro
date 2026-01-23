"use strict";(()=>{var _=(E,b,u)=>new Promise((L,S)=>{var e=d=>{try{l(u.next(d))}catch(k){S(k)}},m=d=>{try{l(u.throw(d))}catch(k){S(k)}},l=d=>d.done?L(d.value):Promise.resolve(d.value).then(e,m);l((u=u.apply(E,b)).next())});(function(){"use strict";console.log("[Klyro] Widget script loaded, version:","2.3.1");let b=document.currentScript,u=b==null?void 0:b.getAttribute("data-widget-key");if(console.log("[Klyro] Widget key:",u),!u){console.error("Klyro: Missing data-widget-key attribute");return}let L=(b==null?void 0:b.src.replace("/widget.js",""))||"",S=`klyro_${u}`,e=null,m=!1,l=[],d=null,k=!1,x=null,T=null;function H(){try{let o=localStorage.getItem(S);if(o){let n=JSON.parse(o);return l=n.messages||[],d=n.sessionId||null,console.log("[Klyro] Loaded persisted chat:",l.length,"messages"),!0}}catch(o){console.error("[Klyro] Failed to load persisted chat:",o)}return!1}function C(){try{let o={messages:l,sessionId:d,lastUpdated:new Date().toISOString()};localStorage.setItem(S,JSON.stringify(o))}catch(o){console.error("[Klyro] Failed to persist chat:",o)}}function O(){try{localStorage.removeItem(S)}catch(o){console.error("[Klyro] Failed to clear persisted chat:",o)}}function q(){if(l.length===0)return;let o=(e==null?void 0:e.headerTitle)||"Chat Transcript",n=new Date().toLocaleString(),t=`${o}
`;t+=`Downloaded: ${n}
`,t+="=".repeat(50)+`

`,l.forEach((s,y)=>{let a=s.role==="user"?"You":(e==null?void 0:e.headerTitle)||"Assistant";t+=`${a}:
${s.content}

`});let c=new Blob([t],{type:"text/plain"}),r=URL.createObjectURL(c),f=document.createElement("a");f.href=r,f.download=`chat-transcript-${new Date().toISOString().split("T")[0]}.txt`,document.body.appendChild(f),f.click(),document.body.removeChild(f),URL.revokeObjectURL(r)}let U=`
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
      content: "\u2022";
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
  `,I='<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',W='<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',A='<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',z='<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',D='<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',N='<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';function R(o){if(!o||o.length===0)return!0;let n=window.location.pathname;for(let t of o){let c=t.trim();if(c===n)return!0;if(c.endsWith("/*")){let r=c.slice(0,-2);if(n===r||n.startsWith(r+"/"))return!0}if(c==="/"&&n==="/")return!0}return!1}function K(){if(!x||!e)return;let o=window.location.pathname;if(o===T)return;if(T=o,R(e.allowedRoutes))x.style.display="",console.log("[Klyro] Widget shown on route:",o);else{if(x.style.display="none",m){m=!1;let t=x.querySelector(".klyro-panel");t&&t.classList.remove("open")}console.log("[Klyro] Widget hidden on route:",o)}}function F(){T=window.location.pathname,window.addEventListener("popstate",()=>{console.log("[Klyro] Popstate detected"),K()});let o=history.pushState;history.pushState=function(...t){o.apply(this,t),console.log("[Klyro] PushState detected"),setTimeout(K,0)};let n=history.replaceState;history.replaceState=function(...t){n.apply(this,t),console.log("[Klyro] ReplaceState detected"),setTimeout(K,0)},console.log("[Klyro] Route change listeners set up")}function B(){return _(this,null,function*(){console.log("[Klyro] Initializing, API_BASE:",L);try{let o=`${L}/api/widget/${u}`;console.log("[Klyro] Fetching config from:",o);let n=yield fetch(o);if(console.log("[Klyro] Response status:",n.status),!n.ok)throw new Error("Widget not found");e=yield n.json(),console.log("[Klyro] Config loaded:",e),H(),l.length>0&&e.welcomeMessage&&l[0].role==="assistant"&&l[0].content===e.welcomeMessage&&(console.log("[Klyro] Removing legacy welcome message from history"),l.shift(),C()),V(),F(),!R(e.allowedRoutes)&&x&&(x.style.display="none",console.log("[Klyro] Widget hidden on initial route:",window.location.pathname))}catch(o){console.error("Klyro: Failed to load widget",o)}})}function V(){console.log("[Klyro] Rendering widget...");let o=document.createElement("style");o.textContent=U,document.head.appendChild(o);let n=e.theme;n==="auto"&&(n=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");let t=document.createElement("div");t.className=`klyro-widget ${n}`,t.style.setProperty("--primary-color",e.primaryColor);let c=e.launcherMode==="text"&&e.launcherText;t.innerHTML=`
      <button class="klyro-button ${e.position} ${c?"text-mode":""}" style="background: ${e.primaryColor}">
        ${I}
        ${c?`<span class="klyro-button-text">${w(e.launcherText)}</span>`:""}
      </button>
      <div class="klyro-panel ${e.position}">
        <div class="klyro-header" style="background: ${e.primaryColor}">
          <div class="klyro-header-icon">${z}</div>
          <div class="klyro-header-text">
            <h3>${w(e.headerTitle||"Chat Assistant")}</h3>
            <p>Your personal guide to this site</p>
          </div>
          <div class="klyro-header-actions">
            <button class="klyro-header-btn download-btn" title="Download Transcript">
              ${D}
            </button>
            <button class="klyro-header-btn reset-btn" title="Reset Chat">
              ${N}
            </button>
          </div>
        </div>
        <div class="klyro-messages"></div>
        <div class="klyro-input-area">
          <input type="text" class="klyro-input" placeholder="Type a message...">
          <button class="klyro-send" style="background: ${e.primaryColor}">${A}</button>
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
    `,document.body.appendChild(t),x=t;let r=t.querySelector(".klyro-button"),f=t.querySelector(".klyro-panel"),s=t.querySelector(".klyro-messages"),y=t.querySelector(".klyro-input"),a=t.querySelector(".klyro-send"),p=t.querySelector(".reset-btn"),g=t.querySelector(".download-btn"),v=t.querySelector(".klyro-popover-overlay"),G=v.querySelector(".confirm"),J=v.querySelector(".cancel");$(),r.addEventListener("click",()=>{m=!m,f.classList.toggle("open",m);let h=e.launcherMode==="text"&&e.launcherText;m?(r.innerHTML=W,r.classList.remove("text-mode"),y.focus(),$()):(r.innerHTML=I+(h?`<span class="klyro-button-text">${w(e.launcherText)}</span>`:""),h&&r.classList.add("text-mode"))}),p.addEventListener("click",()=>{v.classList.add("open")}),J.addEventListener("click",()=>{v.classList.remove("open")}),G.addEventListener("click",()=>{l=[],d=null,O(),$(),v.classList.remove("open")}),g.addEventListener("click",q);function P(h){return _(this,null,function*(){let i=h||y.value.trim();if(!(!i||k)){l.push({role:"user",content:i}),h||(y.value=""),$(),C(),k=!0,$();try{let M=yield fetch(`${L}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:i,widgetKey:u,sessionId:d})}),j=yield M.json();k=!1,M.ok?(d=j.sessionId,l.push({role:"assistant",content:j.response}),C()):l.push({role:"assistant",content:"Sorry, I encountered an error. Please try again."})}catch(M){k=!1,l.push({role:"assistant",content:"Unable to connect. Please try again later."})}$()}})}a.addEventListener("click",P),y.addEventListener("keypress",h=>{h.key==="Enter"&&P()});function $(){let h=l.filter((i,M)=>!(M===0&&i.role==="assistant"&&e.welcomeMessage&&i.content.trim()===e.welcomeMessage.trim()));if(g.disabled=h.length===0,h.length===0){let i=(e.headerTitle||"Assistant").split(" ")[0];s.innerHTML=`
          <div class="klyro-empty-state">
            <div class="klyro-empty-icon" style="background: ${e.primaryColor}20">
              ${z}
            </div>
            <h4>Hey! I'm ${w(i)}'s copilot</h4>
            <p>I can help answer questions about them</p>
          </div>
        `}else s.innerHTML=h.map(i=>`
          <div class="klyro-message ${i.role}" ${i.role==="user"?`style="background: ${e.primaryColor}"`:""}>
            ${i.role==="assistant"?Y(i.content):w(i.content)}
          </div>
        `).join("");k&&(s.innerHTML+=`
          <div class="klyro-typing">
            <span style="background: ${e.primaryColor}"></span>
            <span style="background: ${e.primaryColor}"></span>
            <span style="background: ${e.primaryColor}"></span>
          </div>
        `),s.scrollTop=s.scrollHeight,a.disabled=k}}function Y(o){if(!o)return"";console.log("[Klyro] formatMessage called with:",o.substring(0,100));let n=[],t=o.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,(a,p,g)=>{let v=`__LINK_${n.length}__`;return n.push({text:p,url:g}),v}),c=[];t=t.replace(/(https?:\/\/[^\s<\]]+)/g,(a,p)=>{if(a.includes("__LINK_"))return a;console.log("[Klyro] Found raw URL:",p);let g=`__URL_${c.length}__`;return c.push(p),g});let r=w(t);n.forEach((a,p)=>{let g=w(a.text);r=r.replace(`__LINK_${p}__`,`<a href="${a.url}" target="_blank" rel="noopener noreferrer">${g}</a>`)}),c.forEach((a,p)=>{r=r.replace(`__URL_${p}__`,`<a href="${a}" target="_blank" rel="noopener noreferrer">${a}</a>`)}),r=r.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),r=r.replace(new RegExp("(?<!^|\\n)\\*([^*\\n]+)\\*","g"),"<em>$1</em>");let f=r.split(`
`),s=!1,y=[];for(let a=0;a<f.length;a++){let p=f[a],g=p.match(/^[\s]*[•\-\*]\s+(.+)$/);g?(s||(y.push("<ul>"),s=!0),y.push(`<li>${g[1]}</li>`)):(s&&(y.push("</ul>"),s=!1),y.push(p))}return s&&y.push("</ul>"),r=y.join(`
`),r=r.replace(/\n(?!<\/?[uo]l|<\/?li)/g,"<br>"),r=r.replace(/\n/g,""),console.log("[Klyro] formatMessage result:",r.substring(0,100)),r}function w(o){let n=document.createElement("div");return n.textContent=o,n.innerHTML}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B):B()})();})();
