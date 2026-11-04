export interface WhiskersOptions {
  root?: Element;
  attribute?: string;
  show?: () => boolean;
  reducedMotion?: () => boolean;
  global?: string;
  storage?: string;
  floor?: string;
  ignore?: string;
  meow?: string;
  music?: { readonly on: boolean; cue?: (name: string, options?: object) => boolean; ring?: (name: string, options?: { gain?: number }) => void };
  /** A game module played on the timeline, as a host's cat-game.js. */
  game?: object | null;
  boss?: (id: string) => unknown;
  /** The host's own scenes, each returning a scene for the page or null; tried before the room. */
  scenes?: Array<(context: { doc: Document; win: Window; chipY: (e: Element) => number; onScreen: (r: DOMRect) => boolean; CAT_W: number; CAT_H: number }) => object | null>;
  /** false keeps the cat to the host's scenes and the timeline. */
  room?: boolean;
  /** false drops its name, hunger and feeding. */
  pet?: boolean;
  label?: string;
  jokes?: string[];
  /** Read its lines aloud while the music is on. */
  aloud?: boolean;
  /** Shoves push cards along their row too, not just down. */
  slide?: boolean;
  /** Scroll the page to keep the cat in sight. */
  follow?: boolean;
  line?: (id: string) => unknown;
  read?: (id: string) => string;
  home?: (id: string) => unknown;
}

export interface WhiskersCat {
  reset?: () => void;
  [control: string]: unknown;
}

export declare const MEOWS: string[];
export declare const JOKES: string[];
export declare const REVIEW_JOKES: string[];
export declare const STATION_LINES: { author: Record<string, string>; review: Record<string, string> };
export declare function catLine(options?: object): string;
export declare function startWhiskers(options?: WhiskersOptions): WhiskersCat | undefined;
