export { mountCrayonDoodles } from "./crayon-doodles";

export declare const PLANE_SVG: string;
export declare const LADYBUG_SVG: string;
export declare const SNAIL_SVG: string;
export declare const CRAYON_TOGGLE: string;
export declare const CRAYON_ICON: string;
export declare const BUNTING: string;
export declare const PLANE_MS: number;

export interface PlaneFrame {
  offset: number;
  opacity?: number;
  transform: string;
}
export declare function planeFrames(from: { cx: number; cy: number }, width?: number): PlaneFrame[];

export interface CrayonPlaneOptions {
  doc?: Document;
  win?: Window;
  /** The element the plane takes off from; defaults to [data-brand], then [data-wordmark]. */
  anchor?: () => Element | null;
  /** Whether the plane may fly; defaults to <html data-orbit="crayon">. */
  active?: () => boolean;
  reducedMotion?: () => boolean;
  /** Milliseconds between flights, as [shortest, longest]. */
  every?: [number, number];
  /** Milliseconds before the first flight, as [shortest, longest]. */
  first?: [number, number];
}
export interface CrayonPlane {
  /** Flies now, even under reduced motion, if active and the anchor is on the page; true when it took off. */
  fly(force?: boolean): boolean;
  flights(): number;
  stop(): void;
}
export declare function startCrayonPlane(options?: CrayonPlaneOptions): CrayonPlane;

export interface CrayonOptions {
  doc?: Document;
  win?: Window;
  reducedMotion?: () => boolean;
  /** The element the plane takes off from; defaults to [data-brand], then [data-wordmark]. */
  anchor?: () => Element | null;
  /** false to leave out the doodles behind the page. */
  doodles?: boolean;
  /** false to leave out the paper plane. */
  plane?: boolean;
}
export interface Crayon {
  fly(force?: boolean): boolean;
  flights(): number;
  /** Takes every part away again and gives the wordmark back its text. */
  stop(): void;
}
/** Brings out the doodles, the plane, the sun or moon, the bunting and the crayon wordmark. */
export declare function startCrayon(options?: CrayonOptions): Crayon;
