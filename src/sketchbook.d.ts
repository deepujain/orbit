export declare const SKETCHBOOK_FONTS: string;
export declare const SKETCHBOOK_ART: { walk: string; ride: string; talk: string };

export interface PosterOptions {
  letters?: string;
  art?: string;
  alt?: string;
  title?: string;
  /** "script" for a brush title with a yellow swash, "marker" for a bold handwritten title. */
  titleStyle?: "script" | "marker";
  lines?: string[];
  /** "right" puts the words on the left; "left" puts them on the right. */
  side?: "right" | "left";
  ticks?: boolean;
}

/** Markup for a Sketchbook poster, styled by orbit/sketchbook.css. */
export declare function poster(options?: PosterOptions): string;
