import type { HardwareId } from '@/hardware/types';

/**
 * Sidebar thumbnails — miniature grayscale "product shots" of each hardware
 * model, drawn as self-contained SVGs so they render crisply at any DPI on
 * the white tile without shipping raster assets.
 */

const G = {
  metal: '#C9C9C6',
  metalDark: '#9C9C99',
  metalLight: '#E4E4E1',
  dark: '#26262A',
  darker: '#141416',
  pcb: '#1D2024',
  gold: '#D9A741',
  accent: '#F6821F',
  shadow: 'rgba(20,20,20,0.16)',
} as const;

function Shadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={G.shadow} />;
}

function GpuThumb() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <Shadow cx={32} cy={50} rx={24} ry={4} />
      <rect x={8} y={38} width={48} height={7} rx={1.5} fill={G.pcb} />
      <rect x={12} y={45} width={20} height={3} rx={0.8} fill={G.gold} />
      <rect x={6} y={18} width={52} height={22} rx={5} fill={G.metal} />
      <rect x={6} y={18} width={52} height={5} rx={2.5} fill={G.metalLight} />
      <circle cx={21} cy={29} r={8.4} fill={G.metalDark} />
      <circle cx={21} cy={29} r={7} fill={G.metalLight} />
      <circle cx={21} cy={29} r={2.2} fill={G.dark} />
      <circle cx={43} cy={29} r={8.4} fill={G.metalDark} />
      <circle cx={43} cy={29} r={7} fill={G.metalLight} />
      <circle cx={43} cy={29} r={2.2} fill={G.dark} />
      <path d="M21 22.6a6.4 6.4 0 0 1 5.5 3.2l-5.5 3.2Z" fill={G.metal} />
      <path d="M43 22.6a6.4 6.4 0 0 1 5.5 3.2l-5.5 3.2Z" fill={G.metal} />
      <path d="M21 35.4a6.4 6.4 0 0 1-5.5-3.2l5.5-3.2Z" fill={G.metal} />
      <path d="M43 35.4a6.4 6.4 0 0 1-5.5-3.2l5.5-3.2Z" fill={G.metal} />
    </svg>
  );
}

function CpuThumb() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <Shadow cx={32} cy={51} rx={20} ry={3.6} />
      <rect x={13} y={13} width={38} height={38} rx={3} fill={G.pcb} />
      <rect x={18} y={18} width={28} height={28} rx={2.5} fill={G.metal} />
      <rect x={18} y={18} width={28} height={7} rx={2.5} fill={G.metalLight} />
      <rect x={26} y={26} width={12} height={12} rx={1} fill={G.metalDark} />
      <circle cx={16.5} cy={16.5} r={1.4} fill={G.gold} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`t${i}`} x={16 + i * 6} y={9.4} width={2.4} height={3} rx={0.6} fill={G.gold} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`b${i}`} x={16 + i * 6} y={51.6} width={2.4} height={3} rx={0.6} fill={G.gold} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`l${i}`} x={9.4} y={16 + i * 6} width={3} height={2.4} rx={0.6} fill={G.gold} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={`r${i}`} x={51.6} y={16 + i * 6} width={3} height={2.4} rx={0.6} fill={G.gold} />
      ))}
    </svg>
  );
}

function RamThumb() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <Shadow cx={32} cy={52} rx={23} ry={3.4} />
      <path d="M9 20h46a2 2 0 0 1 2 2v20a1.6 1.6 0 0 1-1.6 1.6H42l-2 3h-16l-2-3H8.6A1.6 1.6 0 0 1 7 42V22a2 2 0 0 1 2-2Z" fill={G.metal} />
      <path d="M9 20h46a2 2 0 0 1 2 2v5H7v-5a2 2 0 0 1 2-2Z" fill={G.metalLight} />
      <rect x={11} y={30} width={42} height={10} rx={1.2} fill={G.metalDark} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={12.5 + i * 5.1} y={31.4} width={3.6} height={7.2} rx={0.7} fill={G.dark} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={`g${i}`} x={10 + i * 3.2} y={44.4} width={2} height={3.6} rx={0.4} fill={G.gold} />
      ))}
    </svg>
  );
}

function SsdThumb() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <Shadow cx={32} cy={48} rx={24} ry={3.6} />
      <rect x={6} y={26} width={52} height={16} rx={2.4} fill={G.pcb} />
      <circle cx={52.6} cy={34} r={2.6} fill="#fff" />
      <rect x={10} y={29} width={11} height={10} rx={1.2} fill={G.dark} />
      <rect x={23.5} y={29} width={8} height={10} rx={1.2} fill={G.metalDark} />
      <rect x={34} y={29} width={12} height={10} rx={1.2} fill={G.dark} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={7.4 + i * 1.9} y={42.2} width={1.2} height={3.2} rx={0.3} fill={G.gold} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`k${i}`} x={19.4 + i * 1.9} y={42.2} width={1.2} height={3.2} rx={0.3} fill={G.gold} />
      ))}
    </svg>
  );
}

function MotherboardThumb() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <Shadow cx={32} cy={53} rx={22} ry={3.2} />
      <rect x={10} y={9} width={44} height={44} rx={2.5} fill={G.pcb} />
      <rect x={16} y={15} width={16} height={16} rx={1.6} fill={G.metal} />
      <rect x={19.5} y={18.5} width={9} height={9} rx={1} fill={G.metalDark} />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} x={37 + i * 3.6} y={14} width={2.2} height={19} rx={0.8} fill={G.metalDark} />
      ))}
      <rect x={15} y={37} width={26} height={3.4} rx={1} fill={G.metalDark} />
      <rect x={15} y={43} width={20} height={3.4} rx={1} fill={G.metalDark} />
      <rect x={44} y={38} width={8} height={8} rx={1.4} fill={G.metal} />
      <circle cx={17.6} cy={49.4} r={1.6} fill={G.metalLight} />
      <rect x={46} y={15} width={5} height={12} rx={1} fill={G.dark} />
    </svg>
  );
}

function FanThumb() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <Shadow cx={32} cy={53} rx={20} ry={3.2} />
      <rect x={10} y={10} width={44} height={44} rx={7} fill={G.metal} />
      <circle cx={32} cy={32} r={19} fill={G.dark} />
      <circle cx={32} cy={32} r={17.4} fill={G.metalLight} />
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const x = 32 + Math.cos(a) * 9.5;
        const y = 32 + Math.sin(a) * 9.5;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={8}
            ry={3.6}
            fill={G.metal}
            transform={`rotate(${(a * 180) / Math.PI + 58} ${x} ${y})`}
          />
        );
      })}
      <circle cx={32} cy={32} r={6.4} fill={G.dark} />
      <circle cx={32} cy={32} r={4.8} fill={G.darker} />
      <circle cx={32} cy={32} r={1.6} fill={G.accent} />
      <circle cx={14.6} cy={14.6} r={1.8} fill={G.metalDark} />
      <circle cx={49.4} cy={14.6} r={1.8} fill={G.metalDark} />
      <circle cx={14.6} cy={49.4} r={1.8} fill={G.metalDark} />
      <circle cx={49.4} cy={49.4} r={1.8} fill={G.metalDark} />
    </svg>
  );
}

const THUMBS: Record<HardwareId, () => JSX.Element> = {
  cpu: CpuThumb,
  gpu: GpuThumb,
  ram: RamThumb,
  ssd: SsdThumb,
  motherboard: MotherboardThumb,
  'cooling-fan': FanThumb,
};

export function HardwareThumb({ id }: { id: HardwareId }) {
  const Thumb = THUMBS[id];
  return <Thumb />;
}
