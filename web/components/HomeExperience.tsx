'use client';

import dynamic from 'next/dynamic';
import TerminalLogic from '@/components/TerminalLogic';
import SceneBootLoader from '@/components/SceneBootLoader';
import { useStore } from '@/store/useStore';

const Workspace3D = dynamic(() => import('@/components/Workspace3D'), {
  ssr: false,
  loading: () => null,
});

function TerminalGuide() {
  const phase = useStore((state) => state.phase);
  const sceneReady = useStore((state) => state.sceneReady);

  if (!sceneReady) return null;

  if (phase === 'TERMINAL') {
    return (
      <div className="portfolio-terminal-guide">
        Terminal active. Type <span className="text-white">help</span>, <span className="text-white">work</span> or <span className="text-white">contact</span>.
      </div>
    );
  }

  return (
    <div className="portfolio-room-guide-wrap">
      <div className="portfolio-room-guide">
        Click the computer screen to open the portfolio terminal
      </div>
    </div>
  );
}

export default function HomeExperience() {
  const sceneReady = useStore((state) => state.sceneReady);
  const sceneLoadingProgress = useStore((state) => state.sceneLoadingProgress);
  const sceneLoadingError = useStore((state) => state.sceneLoadingError);

  return (
    <main className="portfolio-experience">
      <TerminalLogic />
      <Workspace3D />
      <TerminalGuide />
      <SceneBootLoader
        progress={sceneLoadingProgress}
        visible={!sceneReady || sceneLoadingError}
        error={sceneLoadingError}
      />
    </main>
  );
}
