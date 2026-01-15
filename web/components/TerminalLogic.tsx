'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { processCommand } from '@/utils/commandProcessor';

export default function TerminalLogic() {
    const { phase, currentInput, setCurrentInput, addLine, setLines, setPhase, lines, isBooting } = useStore();

    // Refs to hold latest values for the event listener without re-binding
    const linesRef = useRef(lines);
    const inputRef = useRef(currentInput);
    const isBootingRef = useRef(isBooting);

    // Keep refs in sync
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
        if (phase !== 'TERMINAL') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Ignore input during "boot" to avoid confusion
            if (isBootingRef.current) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = inputRef.current.trim();
                if (cmd) {
                    processCommand(cmd, addLine, setLines, setPhase, linesRef.current);
                    setCurrentInput('');
                } else {
                    // Just add an empty line/prompt if empty
                    setLines([...linesRef.current, { type: 'system', content: '' }, { type: 'input', content: `guest@dev_os:~$ ` }]);
                }
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                setCurrentInput((prev: string) => prev.slice(0, -1));
            } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                setCurrentInput((prev: string) => prev + e.key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase]); // Only depend on phase

    return null;
}
