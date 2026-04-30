'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TerminalLink, useStore } from '@/store/useStore';

const linkTargets: Record<string, string> = {
    'Email: hadidimarc@gmail.com': 'mailto:hadidimarc@gmail.com',
    'GitHub: MarcSaad-Hadidi': 'https://github.com/MarcSaad-Hadidi',
    'LinkedIn: marcsaad-hadidi': 'https://www.linkedin.com/in/marcsaad-hadidi/',
    'Open website: Trouvable': 'https://www.trouvable.app/',
    'Open website: Givn': 'https://givn-ten.vercel.app/',
    'Open website: Stocks': 'https://stocks-eight-delta.vercel.app/',
};

const BOOT_WAKE_MS = 700;
const BOOT_LOAD_MS = 2600;
const EMPTY_LINKS_KEY = '[]';

export function useTerminalTexture() {
    const lines = useStore((state) => state.lines);
    const currentInput = useStore((state) => state.currentInput);
    const phase = useStore((state) => state.phase);
    const isBooting = useStore((state) => state.isBooting);
    const setIsBooting = useStore((state) => state.setIsBooting);
    const setTerminalLinks = useStore((state) => state.setTerminalLinks);
    const frameRef = useRef(0);
    const bootStartedAtRef = useRef<number | null>(null);
    const didFinishBootRef = useRef(false);
    const wasBootingRef = useRef(false);
    const lastLinksRef = useRef('');

    const bootSteps = useMemo(() => [
        'PROFILE LINKED',
        'PROJECT INDEX READY',
        'STACK MAP LOADED',
        'CONTACT ROUTE OPEN'
    ], []);

    // Reset local counters only when a fresh boot sequence starts.
    useEffect(() => {
        if (isBooting && !wasBootingRef.current) {
            bootStartedAtRef.current = null;
            didFinishBootRef.current = false;
        }
        wasBootingRef.current = isBooting;
    }, [isBooting]);

    useEffect(() => {
        if (!isBooting) return;

        const timeoutId = window.setTimeout(() => {
            didFinishBootRef.current = true;
            setIsBooting(false);
        }, BOOT_WAKE_MS + BOOT_LOAD_MS + 180);

        return () => window.clearTimeout(timeoutId);
    }, [isBooting, setIsBooting]);

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

            // Text settings tuned for the small CRT surface.
            const fontSize = 15;
            // Precise padding from browser measurements
            const paddingLeft = 470;
            const paddingTop = 92;
            const lineHeight = 20;
            const maxLines = 17;

            // Phosphor glow effect
            ctx.shadowColor = 'rgba(51, 255, 0, 0.4)';
            ctx.shadowBlur = 8;

            ctx.font = `${fontSize}px "Courier New", monospace`;
            ctx.textBaseline = 'top';

            let y = paddingTop;
            const maxWidth = 360; // Usable width within the CRT area

            const drawHeader = () => {
                ctx.shadowBlur = 10;
                ctx.font = `14px "Courier New", monospace`;
                ctx.fillStyle = '#8dff73';
                ctx.shadowColor = 'rgba(141, 255, 115, 0.45)';
                ctx.fillText('PORTFOLIO // HELP ABOUT WORK STACK CONTACT', paddingLeft, 56);

                ctx.strokeStyle = 'rgba(51, 255, 0, 0.35)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(paddingLeft, 78);
                ctx.lineTo(paddingLeft + maxWidth, 78);
                ctx.stroke();

                ctx.font = `${fontSize}px "Courier New", monospace`;
            };

            const clearTerminalLinks = () => {
                if (lastLinksRef.current === EMPTY_LINKS_KEY) return;

                lastLinksRef.current = EMPTY_LINKS_KEY;
                setTerminalLinks([]);
            };

            if (isBooting && !didFinishBootRef.current) {
                clearTerminalLinks();
                const now = performance.now();

                if (bootStartedAtRef.current === null) {
                    bootStartedAtRef.current = now;
                }

                const elapsed = now - bootStartedAtRef.current;

                if (elapsed < BOOT_WAKE_MS) {
                    const wakeProgress = Math.max(0, elapsed / BOOT_WAKE_MS);
                    const wakeAlpha = 0.2 + wakeProgress * 0.55;

                    ctx.shadowBlur = 18;
                    ctx.font = `14px "Courier New", monospace`;
                    ctx.fillStyle = `rgba(141, 255, 115, ${wakeAlpha})`;
                    ctx.shadowColor = 'rgba(51, 255, 0, 0.45)';
                    ctx.fillText('SYNCING DISPLAY...', paddingLeft, 178);

                    ctx.strokeStyle = `rgba(141, 255, 115, ${0.18 + wakeProgress * 0.35})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(paddingLeft, 210);
                    ctx.lineTo(paddingLeft + maxWidth * wakeProgress, 210);
                    ctx.stroke();

                    texture.needsUpdate = true;
                    animationFrameId = requestAnimationFrame(render);
                    return;
                }

                const loadElapsed = elapsed - BOOT_WAKE_MS;
                const progress = Math.min(1, loadElapsed / BOOT_LOAD_MS);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const displayProgress = progress >= 1
                    ? 100
                    : Math.min(99, Math.max(1, Math.floor(easedProgress * 100)));
                const panelX = paddingLeft - 22;
                const panelY = 54;
                const panelWidth = maxWidth + 44;
                const panelHeight = 300;
                const pulse = 0.5 + Math.sin(elapsed * 0.01) * 0.5;

                ctx.shadowBlur = 18;
                ctx.shadowColor = 'rgba(51, 255, 0, 0.6)';
                ctx.strokeStyle = `rgba(141, 255, 115, ${0.28 + pulse * 0.22})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

                ctx.font = `bold 24px "Courier New", monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                ctx.fillText('MARC SAAD-HADIDI', paddingLeft, 88);

                ctx.font = `15px "Courier New", monospace`;
                ctx.fillStyle = '#8dff73';
                ctx.shadowColor = 'rgba(51, 255, 0, 0.45)';
                ctx.fillText('PORTFOLIO INTERFACE', paddingLeft, 121);

                bootSteps.forEach((step, index) => {
                    const stepStart = 320 + index * 420;
                    const visible = loadElapsed >= stepStart;
                    const ready = loadElapsed > stepStart + 260;
                    const status = ready ? '[OK]' : '[..]';

                    if (!visible) return;

                    ctx.fillStyle = ready ? '#33ff00' : '#ffffff';
                    ctx.shadowColor = ready
                        ? 'rgba(51, 255, 0, 0.45)'
                        : 'rgba(255, 255, 255, 0.35)';
                    ctx.fillText(`${status} ${step}`, paddingLeft, 166 + index * 29);
                });

                const barWidth = maxWidth;
                const loadedWidth = Math.floor(barWidth * easedProgress);
                ctx.shadowBlur = 10;
                ctx.strokeStyle = 'rgba(141, 255, 115, 0.55)';
                ctx.strokeRect(paddingLeft, 305, barWidth, 18);
                ctx.fillStyle = '#33ff00';
                ctx.shadowColor = 'rgba(51, 255, 0, 0.55)';
                ctx.fillRect(paddingLeft + 2, 307, Math.max(0, loadedWidth - 4), 14);

                ctx.font = `13px "Courier New", monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
                ctx.fillText(`INITIALIZING ${displayProgress}%`, paddingLeft, 336);

                if (progress >= 1 && !didFinishBootRef.current) {
                    didFinishBootRef.current = true;
                    setIsBooting(false);
                    texture.needsUpdate = true;
                    animationFrameId = requestAnimationFrame(render);
                    return;
                }
            } else {
                drawHeader();
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

                    const prefix = line.type === 'output' ? '  ' : '';
                    const fullText = `${prefix}${line.content}`;
                    const isLink = Boolean(linkTargets[line.content]);

                    if (isLink) {
                        color = '#ffd166';
                        shadow = 'rgba(255, 209, 102, 0.45)';
                    }

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
                const prompt = 'marc@workspace:~$ ';
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
                    allRenderLines.push({ content: chunk, color: '#ffffff', shadow: 'rgba(255, 255, 255, 0.45)' });
                    tempInput = tempInput.slice(sliceIdx);
                    if (tempInput.length === 0) break;
                }

                // Scroll from the bottom: only show the last N lines
                const visibleLines = allRenderLines.slice(-maxLines);
                const nextLinks: TerminalLink[] = [];

                visibleLines.forEach((line) => {
                    ctx.fillStyle = line.color;
                    ctx.shadowColor = line.shadow;
                    ctx.fillText(line.content, paddingLeft, y);

                    const linkLabel = line.content.trim();
                    const url = linkTargets[linkLabel];

                    if (url) {
                        nextLinks.push({
                            label: linkLabel,
                            url,
                            x: paddingLeft,
                            y,
                            width: ctx.measureText(line.content).width,
                            height: lineHeight,
                        });

                        ctx.strokeStyle = 'rgba(255, 209, 102, 0.75)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(paddingLeft, y + lineHeight - 3);
                        ctx.lineTo(paddingLeft + ctx.measureText(line.content).width, y + lineHeight - 3);
                        ctx.stroke();
                    }

                    y += lineHeight;
                });

                const nextLinksKey = JSON.stringify(nextLinks);
                if (nextLinksKey !== lastLinksRef.current) {
                    lastLinksRef.current = nextLinksKey;
                    setTerminalLinks(nextLinks);
                }

                ctx.shadowBlur = 4;
                ctx.font = `12px "Courier New", monospace`;
                ctx.fillStyle = 'rgba(141, 255, 115, 0.72)';
                ctx.shadowColor = 'rgba(51, 255, 0, 0.3)';
                ctx.fillText('Enter run | Tab complete | Esc exit', paddingLeft, 804);
            }

            texture.needsUpdate = true;
            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [lines, currentInput, canvas, texture, phase, isBooting, setIsBooting, setTerminalLinks, bootSteps]);

    return texture;
}
