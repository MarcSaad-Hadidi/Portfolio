import { create } from 'zustand';
import type { Vector3 } from 'three';

export type Phase = 'ROOM' | 'TRANSITION' | 'TERMINAL';

export type Line = {
    type: 'input' | 'output' | 'error' | 'system';
    content: string;
};

export type TerminalLink = {
    label: string;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

const welcomeLines: Line[] = [
    { type: 'system', content: 'PORTFOLIO_TERMINAL v2.6' },
    { type: 'output', content: 'Interactive workspace ready.' },
    { type: 'output', content: 'Type help, work or contact.' },
];

interface State {
    phase: Phase;
    setPhase: (phase: Phase) => void;
    lines: Line[];
    addLine: (line: Line) => void;
    setLines: (lines: Line[]) => void;
    currentInput: string;
    setCurrentInput: (input: string | ((prev: string) => string)) => void;
    targetPosition: Vector3 | null;
    setTargetPosition: (pos: Vector3) => void;
    cameraPosition: Vector3 | null;
    setCameraPosition: (pos: Vector3) => void;
    isBooting: boolean;
    setIsBooting: (booting: boolean) => void;
    sceneReady: boolean;
    setSceneReady: (ready: boolean) => void;
    sceneLoadingProgress: number;
    setSceneLoadingProgress: (progress: number) => void;
    sceneLoadingError: boolean;
    setSceneLoadingError: (error: boolean) => void;
    terminalLinks: TerminalLink[];
    setTerminalLinks: (links: TerminalLink[]) => void;
}

export const useStore = create<State>((set) => ({
    phase: 'ROOM',
    setPhase: (phase) => set((state) => {
        const enteringTerminal = phase === 'TERMINAL' && state.phase !== 'TERMINAL';
        const leavingTerminal = phase !== 'TERMINAL';

        return {
            phase,
            isBooting: enteringTerminal ? true : leavingTerminal ? false : state.isBooting,
            lines: enteringTerminal ? welcomeLines : state.lines,
            currentInput: enteringTerminal ? '' : state.currentInput,
            terminalLinks: enteringTerminal || leavingTerminal ? [] : state.terminalLinks,
        };
    }),
    lines: welcomeLines,
    addLine: (line) => set((state) => ({ lines: [...state.lines, line] })),
    setLines: (lines) => set({ lines }),
    currentInput: '',
    setCurrentInput: (input: string | ((prev: string) => string)) =>
        set((state) => ({
            currentInput: typeof input === 'function' ? input(state.currentInput) : input
        })),
    targetPosition: null,
    setTargetPosition: (targetPosition) => set({ targetPosition }),
    cameraPosition: null,
    setCameraPosition: (cameraPosition) => set({ cameraPosition }),
    isBooting: false,
    setIsBooting: (isBooting) => set((state) => (
        state.isBooting === isBooting ? state : { isBooting }
    )),
    sceneReady: false,
    setSceneReady: (sceneReady) => set({ sceneReady }),
    sceneLoadingProgress: 0,
    setSceneLoadingProgress: (sceneLoadingProgress) => set({ sceneLoadingProgress }),
    sceneLoadingError: false,
    setSceneLoadingError: (sceneLoadingError) => set({ sceneLoadingError }),
    terminalLinks: [],
    setTerminalLinks: (terminalLinks) => set({ terminalLinks }),
}));
