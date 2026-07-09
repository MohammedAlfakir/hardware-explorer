'use client';

import { HeroStory } from '@/landing/HeroStory';
import { LandingNav } from '@/landing/LandingNav';

/**
 * HardwareLab landing — a single full-screen hero: the GPU floats and slowly
 * spins in a blueprint-grid studio beside the headline, with one path in:
 * the workspace.
 */
export default function LandingPage() {
  return (
    <div className="bg-bg">
      <LandingNav />
      <main>
        <HeroStory />
      </main>
    </div>
  );
}
