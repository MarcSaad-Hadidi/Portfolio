'use client';

import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import TerminalLogic from '@/components/TerminalLogic';

// Dynamic import for R3F to avoid SSR issues
const Workspace3D = dynamic(() => import('@/components/Workspace3D'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#111] flex items-center justify-center text-[#33ff00] font-mono lowercase tracking-tighter uppercase transition-colors">INITIALIZING_SESSION...</div>
});

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <TerminalLogic />
      <Workspace3D />
    </main>
  );
}
