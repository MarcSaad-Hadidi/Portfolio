'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { commandNames, processCommand } from '@/utils/commandProcessor';

export default function TerminalLogic() {
    const phase = useStore((state) => state.phase);
    const currentInput = useStore((state) => state.currentInput);
    const setCurrentInput = useStore((state) => state.setCurrentInput);
    const setLines = useStore((state) => state.setLines);
    const setPhase = useStore((state) => state.setPhase);
    const lines = useStore((state) => state.lines);
    const isBooting = useStore((state) => state.isBooting);

    // Refs to hold latest values for the event listener without re-binding
    const phaseRef = useRef(phase);
    const linesRef = useRef(lines);
    const inputRef = useRef(currentInput);
    const isBootingRef = useRef(isBooting);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number | null>(null);

    // Keep refs in sync
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        linesRef.current = lines;
    }, [lines]);

    useEffect(() => {
        inputRef.current = currentInput;
    }, [currentInput]);

    useEffect(() => {
        isBootingRef.current = isBooting;
    }, [isBooting]);

    // Reset terminal lines when leaving phase
    useEffect(() => {
        if (phase !== 'TERMINAL') {
            setLines([]);
        }
    }, [phase, setLines]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isEscape = e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape';

            if (isEscape && phaseRef.current === 'TERMINAL') {
                e.preventDefault();
                e.stopPropagation();
                setPhase('ROOM');
                setLines([]);
                setCurrentInput('');
                return;
            }

            if (phaseRef.current !== 'TERMINAL') return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Ignore input during "boot" to avoid confusion
            if (isBootingRef.current) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = inputRef.current.trim();
                if (cmd) {
                    historyRef.current = [...historyRef.current.filter((item) => item !== cmd), cmd].slice(-20);
                    historyIndexRef.current = null;
                    processCommand(cmd, setLines, setPhase, linesRef.current);
                    setCurrentInput('');
                } else {
                    // Just add an empty line/prompt if empty
                    setLines([...linesRef.current, { type: 'system', content: '' }, { type: 'input', content: `marc@workspace:~$ ` }]);
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const current = inputRef.current.toLowerCase();
                if (!current) {
                    setCurrentInput('help');
                    return;
                }

                const match = commandNames.find((command) => command.startsWith(current));
                if (match) setCurrentInput(match);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!historyRef.current.length) return;

                const nextIndex = historyIndexRef.current === null
                    ? historyRef.current.length - 1
                    : Math.max(0, historyIndexRef.current - 1);

                historyIndexRef.current = nextIndex;
                setCurrentInput(historyRef.current[nextIndex]);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndexRef.current === null) return;

                const nextIndex = historyIndexRef.current + 1;
                if (nextIndex >= historyRef.current.length) {
                    historyIndexRef.current = null;
                    setCurrentInput('');
                } else {
                    historyIndexRef.current = nextIndex;
                    setCurrentInput(historyRef.current[nextIndex]);
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                setCurrentInput((prev: string) => prev.slice(0, -1));
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                setCurrentInput((prev: string) => prev + e.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [setCurrentInput, setLines, setPhase]);

    return null;
}
