'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';

export function useTerminalTexture() {
    const { lines, currentInput, phase, isBooting, setIsBooting } = useStore();
    const frameRef = useRef(0);
    const startupLineRef = useRef(0);
    const startupCharRef = useRef(0);

    const startupLines = [
        "   _________________   ",
        "  | INTEGRATING ... |  ",
        "  | [][][][][][][]  |  ",
        "  |_________________|  ",
        "       _D_E_V_||       ",
        "      /________\\       ",
        "                       ",
        " >>> SYSTEM ACTIVE <<< "
    ];

    // Reset local counters when booting starts
    useEffect(() => {
        if (isBooting) {
            startupLineRef.current = 0;
            startupCharRef.current = 0;
        }
    }, [isBooting]);

    // Create canvas once
    const canvas = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 1024;
        return c;
    }, []);

    const texture = useMemo(() => {
        const t = new THREE.CanvasTexture(canvas);
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        return t;
    }, [canvas]);

    useEffect(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            frameRef.current += 1;

            // Draw background
            ctx.fillStyle = '#020202';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Screen OFF state
            if (phase !== 'TERMINAL') {
                texture.needsUpdate = true;
                return;
            }

            // CRT Glow / Subtle Flicker logic
            const flicker = Math.sin(frameRef.current * 0.1) * 0.01 + 0.99;

            // Draw scanlines with slight movement or varied intensity
            ctx.fillStyle = `rgba(0, 255, 0, ${0.05 * flicker})`;
            for (let i = 0; i < canvas.height; i += 4) {
                const shift = (frameRef.current % 4);
                ctx.fillRect(0, i + shift, canvas.width, 1.5);
            }

            // Text settings
            const fontSize = 28;
            // Precise padding from browser measurements
            const paddingLeft = 450;
            const paddingTop = 140;
            const lineHeight = 35;
            const maxLines = 18; // Reduced to ensure bottom visibility

            // Phosphor glow effect
            ctx.shadowColor = 'rgba(51, 255, 0, 0.4)';
            ctx.shadowBlur = 8;

            ctx.font = `${fontSize}px "Courier New", monospace`;
            ctx.textBaseline = 'top';

            let y = paddingTop;
            const maxWidth = 360; // Usable width within the CRT area

            if (isBooting) {
                // Drawing animation
                ctx.fillStyle = '#33ff00';
                ctx.shadowColor = 'rgba(51, 255, 0, 0.4)';

                const curLine = startupLineRef.current;
                const curChar = startupCharRef.current;

                for (let i = 0; i <= curLine; i++) {
                    const text = i === curLine
                        ? startupLines[i].substring(0, curChar)
                        : startupLines[i];
                    ctx.fillText(text, paddingLeft, y + (i * lineHeight));
                }

                if (frameRef.current % 2 === 0) {
                    startupCharRef.current++;
                    if (startupCharRef.current > startupLines[curLine].length) {
                        startupCharRef.current = 0;
                        startupLineRef.current++;
                        if (startupLineRef.current >= startupLines.length) {
                            setIsBooting(false);
                        }
                    }
                }
            } else {
                // Normal Terminal Rendering
                // First, process all lines into wrapped sub-lines
                const allRenderLines: { content: string; color: string; shadow: string }[] = [];

                lines.forEach((line) => {
                    let color = '#33ff00';
                    let shadow = 'rgba(51, 255, 0, 0.4)';

                    if (line.type === 'error') {
                        color = '#ff4444';
                        shadow = 'rgba(255, 68, 68, 0.4)';
                    } else if (line.type === 'system') {
                        color = '#44ccff';
                        shadow = 'rgba(68, 204, 255, 0.4)';
                    } else if (line.type === 'input') {
                        color = '#ffffff';
                        shadow = 'rgba(255, 255, 255, 0.4)';
                    }

                    const prefix = line.type === 'output' ? '> ' : '';
                    const fullText = `${prefix}${line.content}`;

                    // Improved wrapping logic
                    let currentWordLine = '';
                    const words = fullText.split(' ');

                    words.forEach((word) => {
                        const testLine = currentWordLine + (currentWordLine ? ' ' : '') + word;
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && currentWordLine) {
                            allRenderLines.push({ content: currentWordLine, color, shadow });
                            currentWordLine = word;
                        } else {
                            currentWordLine = testLine;
                        }
                    });
                    if (currentWordLine) {
                        allRenderLines.push({ content: currentWordLine, color, shadow });
                    }
                });

                // Add the current prompt
                const prompt = 'guest@dev_os:~$ ';
                const showCursor = Math.floor(frameRef.current / 30) % 2 === 0;
                const currentLineText = `${prompt}${currentInput}${showCursor ? '_' : ' '}`;

                // Wrap current input
                let tempInput = currentLineText;
                while (tempInput.length > 0) {
                    let sliceIdx = 0;
                    let test = '';
                    for (let i = 1; i <= tempInput.length; i++) {
                        test = tempInput.slice(0, i);
                        if (ctx.measureText(test).width > maxWidth) break;
                        sliceIdx = i;
                    }
                    if (sliceIdx === 0) sliceIdx = 1;
                    const chunk = tempInput.slice(0, sliceIdx);
                    allRenderLines.push({ content: chunk, color: '#33ff00', shadow: 'rgba(51, 255, 0, 0.4)' });
                    tempInput = tempInput.slice(sliceIdx);
                    if (tempInput.length === 0) break;
                }

                // Scroll from the bottom: only show the last N lines
                const visibleLines = allRenderLines.slice(-maxLines);

                visibleLines.forEach((line) => {
                    ctx.fillStyle = line.color;
                    ctx.shadowColor = line.shadow;
                    ctx.fillText(line.content, paddingLeft, y);
                    y += lineHeight;
                });
            }

            texture.needsUpdate = true;
            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [lines, currentInput, canvas, texture, phase]);

    return texture;
}
