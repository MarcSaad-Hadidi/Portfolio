import { create } from 'zustand';
import * as THREE from 'three';

type Phase = 'ROOM' | 'TRANSITION' | 'TERMINAL';

type Line = {
    type: 'input' | 'output' | 'error' | 'system';
    content: string;
};

interface State {
    phase: Phase;
    setPhase: (phase: Phase) => void;
    lines: Line[];
    addLine: (line: Line) => void;
    setLines: (lines: Line[]) => void;
    currentInput: string;
    setCurrentInput: (input: string | ((prev: string) => string)) => void;
    targetPosition: THREE.Vector3 | null;
    setTargetPosition: (pos: THREE.Vector3) => void;
    cameraPosition: THREE.Vector3 | null;
    setCameraPosition: (pos: THREE.Vector3) => void;
    isBooting: boolean;
    setIsBooting: (booting: boolean) => void;
}

export const useStore = create<State>((set) => ({
    phase: 'ROOM',
    setPhase: (phase) => set((state) => ({
        phase,
        isBooting: phase === 'TERMINAL' ? true : state.isBooting
    })),
    lines: [
        { type: 'system', content: '>>> SYSTEM_READY. WELCOME BACK.' },
    ],
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
    setIsBooting: (isBooting) => set({ isBooting }),
}));
