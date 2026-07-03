import type { Config } from 'tailwindcss';
import {
  color,
  fontSize,
  radius,
  elevation,
  breakpoints,
} from './src/design/tokens';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: color.bg,
        surface1: color.surface1,
        surface2: color.surface2,
        surface3: color.surface3,
        border: color.border,
        'border-subtle': color.borderSubtle,
        'border-strong': color.borderStrong,
        'text-primary': color.textPrimary,
        'text-secondary': color.textSecondary,
        'text-tertiary': color.textTertiary,
        accent: color.accent,
        'accent-bright': color.accentBright,
        'accent-soft': color.accentSoft,
        cyan: color.cyan,
        amber: color.amber,
        danger: color.danger,
        success: color.success,
        'sidebar-bg': color.sidebarBg,
        'sidebar-surface': color.sidebarSurface,
        'sidebar-hover': color.sidebarSurfaceHover,
        'sidebar-border': color.sidebarBorder,
        'sidebar-border-strong': color.sidebarBorderStrong,
        'sidebar-text': color.sidebarText,
        'sidebar-dim': color.sidebarTextDim,
      },
      backgroundColor: {
        'accent-muted': color.accentMuted,
        glass: color.surfaceGlass,
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': [fontSize['2xs'], { lineHeight: '1rem' }],
        xs: [fontSize.xs, { lineHeight: '1.1rem' }],
        sm: [fontSize.sm, { lineHeight: '1.25rem' }],
        base: [fontSize.base, { lineHeight: '1.4rem' }],
        md: [fontSize.md, { lineHeight: '1.5rem' }],
        lg: [fontSize.lg, { lineHeight: '1.6rem' }],
        xl: [fontSize.xl, { lineHeight: '1.75rem' }],
        '2xl': [fontSize['2xl'], { lineHeight: '2rem' }],
        '3xl': [fontSize['3xl'], { lineHeight: '2.4rem' }],
        '4xl': [fontSize['4xl'], { lineHeight: '2.9rem' }],
      },
      borderRadius: {
        xs: radius.xs,
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
        xl: radius.xl,
      },
      boxShadow: {
        'elevation-1': elevation[1],
        'elevation-2': elevation[2],
        'elevation-3': elevation[3],
        glow: elevation.glow,
      },
      screens: {
        mobile: `${breakpoints.mobile}px`,
        tablet: `${breakpoints.tablet}px`,
        'tablet-lg': `${breakpoints.tabletLg}px`,
        laptop: `${breakpoints.laptop}px`,
        desktop: `${breakpoints.desktop}px`,
      },
    },
  },
  plugins: [],
};
export default config;
