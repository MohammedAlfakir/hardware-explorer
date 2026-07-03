import type { SVGProps } from 'react';
import { iconSize } from '@/design/tokens';

export type IconName =
  | 'logo'
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'ssd'
  | 'motherboard'
  | 'fan'
  | 'explode'
  | 'tag'
  | 'wireframe'
  | 'xray'
  | 'section'
  | 'ruler'
  | 'isolate'
  | 'reset'
  | 'fit'
  | 'play'
  | 'pause'
  | 'restart'
  | 'loop'
  | 'fullscreen'
  | 'fullscreenExit'
  | 'chevronDown'
  | 'chevronRight'
  | 'close'
  | 'eyeOff'
  | 'focus'
  | 'layers'
  | 'menu'
  | 'cameraPerspective'
  | 'cameraOrtho'
  | 'palette'
  | 'info'
  | 'search'
  | 'book'
  | 'rotate'
  | 'pan'
  | 'zoom'
  | 'chip'
  | 'gauge'
  | 'target'
  | 'bolt'
  | 'user'
  | 'grid'
  | 'box';

const PATHS: Record<IconName, React.ReactNode> = {
  logo: (
    <>
      <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
      <path d="M12 21.5V12M3.5 7 12 12l8.5-5" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <path d="M9 3.5V6M15 3.5V6M9 18v2.5M15 18v2.5M3.5 9H6m-2.5 6H6M18 9h2.5M18 15h2.5" />
    </>
  ),
  gpu: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="1.5" />
      <circle cx="9" cy="12" r="2.6" />
      <circle cx="16" cy="12" r="2.6" />
      <path d="M5 17v3M9 17v3" />
    </>
  ),
  ram: (
    <>
      <rect x="3" y="7.5" width="18" height="8" rx="1" />
      <path d="M6.5 10.5v2.5m3.5-2.5v2.5m3.5-2.5v2.5m3.5-2.5v2.5M4 15.5V18m4-2.5V18m4-2.5V18m4-2.5V18m4-2.5V18" />
    </>
  ),
  ssd: (
    <>
      <rect x="4.5" y="8" width="15" height="8" rx="1" />
      <path d="M4.5 10.5h-2m2 3h-2M8 11.5h3m2.5 0h3" />
    </>
  ),
  motherboard: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
      <rect x="7" y="7" width="5" height="5" rx="0.5" />
      <path d="M15.5 7v5M18 7v5M7 15.5h10" />
      <circle cx="17" cy="17" r="1.2" />
    </>
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="1.8" />
      <path d="M12 10.2c0-3.2-1.4-5.7-3.6-5.7C6.2 4.5 5 6 5 7.7c0 2.4 3.4 2.7 7 2.5Zm1.8 3.1c2.8 1.6 5.6 1.7 6.7-.2 1.1-1.9.2-3.7-1.3-4.5-2.1-1.2-4.2 1.5-5.4 4.7Zm-3.6 0c-2.8 1.6-4.2 4-3.1 5.9 1.1 1.9 3.1 2 4.6 1.1 2.1-1.2.8-4.4-1.5-7Z" />
    </>
  ),
  explode: (
    <>
      <path d="M12 8.5 8.5 10.5v4l3.5 2 3.5-2v-4L12 8.5Z" />
      <path d="M12 5V2.5M12 21.5V19M5.5 8 3.4 6.8M20.6 17.2 18.5 16M5.5 16l-2.1 1.2M20.6 6.8 18.5 8" />
    </>
  ),
  tag: (
    <>
      <path d="m3.5 12.5 8 8 9-9v-8h-8l-9 9Z" />
      <circle cx="16.5" cy="7.5" r="1.3" />
    </>
  ),
  wireframe: (
    <>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9M4 16.5 12 12l8 4.5" opacity="0.55" />
    </>
  ),
  xray: (
    <>
      <path d="M12 4c5 0 8.5 4.5 9.5 8-1 3.5-4.5 8-9.5 8S3.5 15.5 2.5 12C3.5 8.5 7 4 12 4Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  section: (
    <>
      <path d="M4 4h7v7H4zM13 4l7 7M13 8l4 4M13 13h7v7h-7z" />
      <path d="M4 13v7h7" opacity="0.55" />
    </>
  ),
  ruler: (
    <>
      <rect x="2.5" y="9" width="19" height="6" rx="1" transform="rotate(-35 12 12)" />
      <path d="m8 13.5 1-1.4m2.2-1 1-1.4m2.2-1 1-1.4" />
    </>
  ),
  isolate: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5V6M12 18v3.5M2.5 12H6m12 0h3.5" />
    </>
  ),
  reset: (
    <>
      <path d="M4 9a8.5 8.5 0 1 1-1 5.5" />
      <path d="M4 4v5h5" />
    </>
  ),
  fit: (
    <>
      <path d="M8 3.5H4.5A1 1 0 0 0 3.5 4.5V8M16 3.5h3.5a1 1 0 0 1 1 1V8M8 20.5H4.5a1 1 0 0 1-1-1V16M16 20.5h3.5a1 1 0 0 0 1-1V16" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
    </>
  ),
  play: <path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11-7.2c.6-.4.6-1.4 0-1.8l-11-7.2c-.7-.4-1.6.1-1.6.9Z" />,
  pause: (
    <>
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </>
  ),
  restart: (
    <>
      <path d="M20 15a8.5 8.5 0 1 1-1-8" />
      <path d="M20 3v5h-5" />
    </>
  ),
  loop: (
    <>
      <path d="M17 4.5 20 7l-3 2.5" />
      <path d="M20 7H8a4.5 4.5 0 0 0-4.5 4.5M7 19.5 4 17l3-2.5" />
      <path d="M4 17h12a4.5 4.5 0 0 0 4.5-4.5" />
    </>
  ),
  fullscreen: (
    <path d="M9 3.5H4.5a1 1 0 0 0-1 1V9M15 3.5h4.5a1 1 0 0 1 1 1V9M9 20.5H4.5a1 1 0 0 1-1-1V15M15 20.5h4.5a1 1 0 0 0 1-1V15" />
  ),
  fullscreenExit: (
    <path d="M9 3.5V8a1 1 0 0 1-1 1H3.5M15 3.5V8a1 1 0 0 0 1 1h4.5M9 20.5V16a1 1 0 0 0-1-1H3.5M15 20.5V16a1 1 0 0 1 1-1h4.5" />
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  eyeOff: (
    <>
      <path d="M4 4l16 16M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7- .3 1-1 2.3-2 3.5M6.6 6.6C4.6 8 3.1 10.2 2.5 12c1 2.5 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      <path d="M12 2.5V5M12 19v2.5M2.5 12H5m14 0h2.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="m4.5 11.5 7.5 3.8 7.5-3.8M4.5 15.5 12 19.3l7.5-3.8" opacity="0.6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cameraPerspective: (
    <>
      <path d="M4 6.5 20 4v16L4 17.5v-11Z" />
      <path d="M4 6.5 20 9M4 17.5 20 15" opacity="0.5" />
    </>
  ),
  cameraOrtho: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16" opacity="0.4" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.9 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4a2 2 0 0 1 2-2h2.4A3.8 3.8 0 0 0 21 10.5C20.6 6.2 16.7 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
    </>
  ),
  rotate: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M18.5 2.5v4h-4" />
    </>
  ),
  pan: (
    <>
      <path d="M12 2.5v19M2.5 12h19" />
      <path d="m9.5 5 2.5-2.5L14.5 5M9.5 19l2.5 2.5L14.5 19M5 9.5 2.5 12 5 14.5M19 9.5l2.5 2.5L19 14.5" />
    </>
  ),
  zoom: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5M8.5 11h5M11 8.5v5" />
    </>
  ),
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7m-3.5 4H7M17 10h3.5M17 14h3.5" />
    </>
  ),
  gauge: (
    <>
      <path d="M4.5 18a8.5 8.5 0 1 1 15 0" />
      <path d="m12 13 3.5-4.5" />
      <circle cx="12" cy="13.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  bolt: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
    </>
  ),
  box: (
    <>
      <path d="M12 2.8 20.5 7.4v9.2L12 21.2 3.5 16.6V7.4L12 2.8Z" />
      <path d="M12 21.2V12M3.5 7.4 12 12l8.5-4.6" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: keyof typeof iconSize | number;
}

export function Icon({ name, size = 'md', ...rest }: IconProps) {
  const px = typeof size === 'number' ? size : iconSize[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
