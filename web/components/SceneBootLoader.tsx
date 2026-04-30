'use client';

type SceneBootLoaderProps = {
    progress?: number;
    visible?: boolean;
    error?: boolean;
    compact?: boolean;
};

export default function SceneBootLoader({
    progress = 0,
    visible = true,
    error = false,
    compact = false,
}: SceneBootLoaderProps) {
    const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const status = error
        ? 'Scene asset check failed'
        : safeProgress > 0
            ? `Downloading scene assets ${safeProgress}%`
            : 'Preparing download';
    const bootLines = [
        '[OK] WebGL renderer handshake',
        '[OK] CRT terminal texture stream',
        '[OK] Camera controls locked',
        '[..] Loading room geometry',
        '[..] Mounting portfolio interface',
    ];

    return (
        <div
            className={[
                'z-20 overflow-hidden bg-[#020402] text-[#d9ffd1] transition-opacity duration-700',
                visible ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100dvw',
                height: '100dvh',
                minWidth: '100vw',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            aria-live="polite"
            aria-hidden={!visible}
        >
            <div className="portfolio-loader-grid" />
            <div className="portfolio-loader-scan" />
            <div className="portfolio-loader-glow" />

            <div className="portfolio-loader-shell">
                <div className="portfolio-loader-frame">
                    <div className="portfolio-loader-topline">
                        <span>Portfolio terminal</span>
                        <span>{error ? 'Recovering' : 'Boot sequence'}</span>
                    </div>

                    <div className="portfolio-loader-main">
                        <div className="portfolio-loader-orbit" aria-hidden="true">
                            <div className="portfolio-loader-ring portfolio-loader-ring-a" />
                            <div className="portfolio-loader-ring portfolio-loader-ring-b" />
                            <div className="portfolio-loader-ring portfolio-loader-ring-c" />
                            <div className="portfolio-loader-core" />
                            <div className="portfolio-loader-sweep" />
                        </div>

                        <div className="portfolio-loader-copy">
                            <p className="portfolio-loader-kicker">Marc Saad-Hadidi</p>
                            <h1 className="portfolio-loader-title">Workspace booting</h1>
                            <p className="portfolio-loader-text">
                                {compact
                                    ? 'Preparing interactive view.'
                                    : 'Syncing the 3D room, retro terminal and camera system before reveal.'}
                            </p>
                        </div>
                    </div>

                    <div className="portfolio-loader-bar-wrap">
                        <div className="portfolio-loader-bar">
                            <div
                                className="portfolio-loader-bar-fill"
                                style={{ width: `${error ? 100 : safeProgress}%` }}
                            />
                        </div>
                        <div className="portfolio-loader-status">
                            <span>{status}</span>
                            <span>{error ? 'Fallback ready' : 'Measured GLB transfer'}</span>
                        </div>
                    </div>

                    <div className="portfolio-loader-console">
                        {bootLines.map((line, index) => (
                            <span key={line} style={{ animationDelay: `${index * 160}ms` }}>
                                {line}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
