export interface MotionOptions {
  doc?: Document;
  win?: Window;
  /** The element whose data-orbit-recording attribute replays blocks on screen; defaults to <html>. */
  root?: Element;
  /** How much of a block must be on screen before it plays, 0 to 1; defaults to 0.15. */
  threshold?: number;
  /** Plays a block again each time it comes back on screen; defaults to true. */
  replay?: boolean;
  reducedMotion?: () => boolean;
}

export interface Motion {
  /** Plays a block, or every block on screen, again from the start. */
  replay(block?: Element): void;
  stop(): void;
}

export interface CountParts {
  pre: string;
  suf: string;
  to: number;
  dp: number;
  group: boolean;
}

export declare function startMotion(options?: MotionOptions): Motion;
export declare function parseCount(text: string): CountParts | null;
export declare function formatCount(parts: CountParts, value: number): string;
export declare function staggerParts(block: Element): void;
