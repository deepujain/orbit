export interface RecordStep {
  /** Text of a heading on the page; the part around it is ringed. */
  heading?: string;
  /** A CSS selector to ring instead of a heading. */
  target?: string;
  /** The line to say and caption. */
  say: string;
  /** A control to click before the line, only while it matches. */
  press?: string;
  /** The control that undoes press at the end; defaults to press with aria-pressed="true". */
  restore?: string;
}

export interface RecordScript {
  /** Starts the video's file name. */
  title: string;
  steps: RecordStep[];
}

export interface RecordOptions {
  script?: () => RecordScript | null;
  intro?: RecordStep[];
  voice?: ((text: string) => Promise<ArrayBuffer | null>) | null;
  root?: Element;
  attribute?: string;
  show?: () => boolean;
  headings?: string;
  sectionOf?: (heading: Element) => Element;
  offset?: number;
  label?: string;
  onMessage?: (text: string, tone: "error" | "done") => void;
}

export interface Record {
  refresh(): void;
  start(): Promise<void>;
  stop(): void;
  readonly running: boolean;
  destroy(): void;
}

export declare const RECORD_TYPES: string[];
export declare function startRecord(options?: RecordOptions): Record;
export declare function readMs(text: string): number;
export declare function pickType(isTypeSupported: (type: string) => boolean, types?: string[]): string;
export declare function restoreOf(step: RecordStep): string;
export declare function withIntro(script: RecordScript | null, intro?: RecordStep[]): RecordScript | null;
export declare function scriptWords(script: RecordScript | null): number;
export declare function recordingName(title: string, type: string, at?: Date): string;
