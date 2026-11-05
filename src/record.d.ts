export interface RecordStep {
  /** Text of a heading on the page; the part around it is ringed. */
  heading?: string;
  /** A CSS selector to ring instead of a heading. */
  target?: string;
  /** The line to say and caption. */
  say: string;
  /** A control to click before the line, only while it matches. */
  press?: string;
  /** The control that undoes press at the end; defaults to press with aria-pressed="true"; false undoes nothing. */
  restore?: string | false;
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
  /** Marked data-playskin-recording while filming. */
  root?: Element;
  /** false draws no button; the app's own button calls start(). */
  button?: boolean;
  /** Whether the button is out; defaults to always while the page has a script. */
  show?: () => boolean;
  headings?: string;
  sectionOf?: (heading: Element) => Element;
  offset?: number;
  label?: string;
  onChange?: (state: RecordState) => void;
  onMessage?: (text: string, tone: "error" | "done") => void;
}

export interface RecordState {
  /** The page has a script, or a recording is under way. */
  available: boolean;
  /** Getting the voice ready or waiting for the tab to be shared. */
  busy: boolean;
  recording: boolean;
}

export interface Record {
  refresh(): void;
  start(): Promise<void>;
  stop(): void;
  readonly running: boolean;
  available(): boolean;
  destroy(): void;
}

export declare const RECORD_TYPES: string[];
export declare function startRecord(options?: RecordOptions): Record;
export declare function readMs(text: string): number;
export declare function pickType(isTypeSupported: (type: string) => boolean, types?: string[]): string;
export declare function restoreOf(step: RecordStep): string | null;
export declare function withIntro(script: RecordScript | null, intro?: RecordStep[]): RecordScript | null;
export declare function scriptWords(script: RecordScript | null): number;
export declare function recordingName(title: string, type: string, at?: Date): string;
