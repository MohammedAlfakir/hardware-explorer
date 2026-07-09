/**
 * Design tokens — the single source of truth for every visual value in the
 * application. UI components consume these through Tailwind (see
 * tailwind.config.ts) or by importing this module directly (Three.js side).
 *
 * Theme: HardwareLab — light chrome, charcoal sidebar, signal-orange accent.
 * Never hardcode a visual value in a component.
 */

export const color = {
  /** App chrome (light) */
  bg: '#F6F6F4',
  surface1: '#FFFFFF',
  surface2: '#F4F4F1',
  surface3: '#EBEBE7',
  surfaceGlass: 'rgba(255, 255, 255, 0.92)',

  border: '#E6E5E1',
  borderSubtle: '#EFEEEA',
  borderStrong: '#D5D4CF',

  /** Typography */
  textPrimary: '#191919',
  textSecondary: '#5C5F66',
  textTertiary: '#9B9EA4',

  /** Brand & accents */
  accent: '#F6821F',
  accentMuted: 'rgba(246, 130, 31, 0.12)',
  accentBright: '#E0700D',
  accentSoft: '#FDEFE1',
  cyan: '#0FA48E',
  amber: '#D99114',
  danger: '#DE4257',
  success: '#1FA060',

  /** Sidebar (dark) */
  sidebarBg: '#121212',
  sidebarSurface: '#1C1C1D',
  sidebarSurfaceHover: '#252526',
  sidebarBorder: '#2A2A2C',
  sidebarBorderStrong: '#3A3A3D',
  sidebarText: '#F4F4F2',
  sidebarTextDim: '#8D8D93',

  /** 3D viewport */
  viewportTop: '#EFEEEC',
  viewportBottom: '#D9D8D4',
  selectionEmissive: '#F6821F',
  hoverEmissive: '#F8B36B',
  labelLine: '#8D8D89',
} as const;

export const font = {
  sans: 'var(--font-geist-sans), system-ui, sans-serif',
  mono: 'var(--font-geist-mono), ui-monospace, monospace',
} as const;

export const fontSize = {
  '2xs': '0.6875rem', // 11px
  xs: '0.75rem', // 12px
  sm: '0.8125rem', // 13px
  base: '0.875rem', // 14px
  md: '0.9375rem', // 15px
  lg: '1.0625rem', // 17px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  '4xl': '2.625rem', // 42px
} as const;

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
} as const;

export const elevation = {
  1: '0 1px 2px rgba(25,25,25,0.05)',
  2: '0 4px 16px rgba(25,25,25,0.07), 0 1px 3px rgba(25,25,25,0.05)',
  3: '0 16px 40px rgba(25,25,25,0.10), 0 3px 10px rgba(25,25,25,0.06)',
  glow: '0 0 0 1px rgba(246,130,31,0.45), 0 4px 20px rgba(246,130,31,0.18)',
} as const;

export const spacing = {
  /** Base grid: 4px */
  grid: 4,
  sidebarWidth: 288,
  topNavHeight: 64,
  infoCardWidth: 320,
} as const;

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
} as const;

export const motion = {
  duration: {
    instant: 0.12,
    fast: 0.2,
    base: 0.32,
    slow: 0.55,
    camera: 0.9,
    explode: 1.1,
  },
  ease: {
    /** UI standard */
    out: [0.22, 1, 0.36, 1] as [number, number, number, number],
    inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
    /** GSAP string equivalents */
    gsapOut: 'power3.out',
    gsapInOut: 'power2.inOut',
    gsapExplode: 'expo.inOut',
  },
} as const;

export const breakpoints = {
  mobile: 480,
  tablet: 768,
  tabletLg: 1024,
  laptop: 1280,
  desktop: 1536,
} as const;

export const zIndex = {
  viewport: 0,
  labels: 10,
  chrome: 20,
  drawer: 30,
  overlay: 40,
} as const;
