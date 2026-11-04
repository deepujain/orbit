import type { WhiskersOptions } from "./whiskers/index.js";
import type { RecordOptions } from "./record.js";
import type { CrayonOptions } from "./crayon.js";

export type Theme = "aura" | "crayon" | "whiskers" | "record";

export declare const THEMES: Theme[];
export declare const THEME_NAMES: Record<Theme, string>;
export declare const CHANGE_EVENT: "playskin-change";
export { mountCrayonDoodles } from "./crayon-doodles.js";
export { startCrayon } from "./crayon.js";

export interface PlayskinOptions {
  themes?: string[];
  storageKey?: string | null;
  attribute?: string;
  root?: Element;
  effects?: boolean;
  crayon?: CrayonOptions;
  whiskers?: WhiskersOptions;
  record?: RecordOptions | null;
}

export interface Playskin {
  get(): string | null;
  set(theme: string | null): string | null;
  subscribe(fn: (theme: string | null) => void): () => void;
  destroy(): void;
}

export declare function createPlayskin(options?: PlayskinOptions): Playskin;
export declare function setTheme(theme: string | null): string | null;
export declare function getTheme(): string | null;
export declare function bootScript(options?: { storageKey?: string; attribute?: string; themes?: string[] }): string;
