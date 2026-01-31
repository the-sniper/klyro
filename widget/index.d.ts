export interface KlyroConfig {
  key: string;
  apiBase?: string;
}

export function initKlyro(config: KlyroConfig): void;
