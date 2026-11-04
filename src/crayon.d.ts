export { mountCrayonDoodles } from "./crayon-doodles";

export declare const PLANE_SVG: string;
export declare const LADYBUG_SVG: string;
export declare const SNAIL_SVG: string;
export declare const CRAYON_TOGGLE: string;
export declare const CRAYON_ICON: string;
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
  /** The element the plane takes off from; defaults to [data-brand]. */
  anchor?: () => Element | null;
  /** Whether the plane may fly; defaults to <html data-playskin="crayon">. */
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
