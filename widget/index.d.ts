export interface KlyroConfig {
  key: string;
  apiBase?: string;
  /** Render the widget inline (no floating button, panel fills its container) */
  inline?: boolean;
  /** CSS selector string or DOM element to mount into when inline is true */
  container?: string | HTMLElement;
}

export function initKlyro(config: KlyroConfig): void;
export function sendMessage(text: string): void;
