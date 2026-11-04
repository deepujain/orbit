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
  music?: { readonly on: boolean };
}

export interface WhiskersCat {
  reset?: () => void;
  [control: string]: unknown;
}

export declare const MEOWS: string[];
export declare function startWhiskers(options?: WhiskersOptions): WhiskersCat | undefined;
