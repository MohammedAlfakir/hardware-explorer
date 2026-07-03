/**
 * Core domain types for the hardware library. Every model in the sidebar is
 * described by a HardwareDefinition; every selectable mesh by a
 * PartDefinition. The registry is fully data-driven so future hardware
 * (PSU, HDD, NVMe, coolers, NICs, …) can be added without touching systems.
 */

export type HardwareId =
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'ssd'
  | 'motherboard'
  | 'cooling-fan';

export type MaterialKey =
  | 'brushedAluminum'
  | 'anodizedAluminum'
  | 'paintedMetal'
  | 'shroudLight'
  | 'copper'
  | 'silicon'
  | 'plasticMatte'
  | 'plasticGloss'
  | 'plasticLight'
  | 'glass'
  | 'pcbGreen'
  | 'pcbBlack'
  | 'goldContact'
  | 'thermalPaste'
  | 'steel'
  | 'darkMetal'
  | 'fanBlade'
  | 'fanBladeLight'
  | 'rgbRing'
  | 'chipLabel'
  | 'chipSilk';

export type MaterialVariant = 'factory' | 'polished' | 'stealth';

export type ViewPreset =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'isometric';

export type Vec3 = [number, number, number];

export interface PartDefinition {
  id: string;
  name: string;
  description: string;
  /** Direction (normalized-ish) the part travels in exploded view. */
  explodeDir: Vec3;
  /** Distance multiplier for the exploded view. */
  explodeDist: number;
  /** Preferred label anchor offset in local space (world units). */
  labelOffset: Vec3;
  /** Whether this part is internal (only visible in exploded / x-ray). */
  internal?: boolean;
  /** Extra spec lines shown in the info card when selected. */
  specs?: Array<{ label: string; value: string }>;
  /** Educational blurb for the info card. */
  education?: string;
}

export interface AnimationDefinition {
  id: string;
  name: string;
  description: string;
  /** Loop duration in seconds at 1× speed. */
  duration: number;
}

/** Headline stat rendered as a card under the viewport (icon is an IconName). */
export interface HighlightStat {
  icon: string;
  label: string;
  value: string;
}

export interface HardwareDefinition {
  id: HardwareId;
  name: string;
  shortName: string;
  category: 'Processing' | 'Memory' | 'Storage' | 'Platform' | 'Cooling';
  tagline: string;
  description: string;
  /** Physical footprint used by camera fit; [w, h, d] in world units. */
  bounds: Vec3;
  parts: PartDefinition[];
  animations: AnimationDefinition[];
  specs: Array<{ label: string; value: string }>;
  /** The four headline stat cards shown beneath the viewport. */
  highlights: [HighlightStat, HighlightStat, HighlightStat, HighlightStat];
  facts: string[];
}
