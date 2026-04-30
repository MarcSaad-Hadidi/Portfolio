'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { EffectComposer, Vignette, Bloom } from '@react-three/postprocessing';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useTerminalTexture } from './TerminalCanvas';
import * as THREE from 'three';

const roomCameraPosition = new THREE.Vector3(-0.78, 0.98, 1.15);
const roomCameraTarget = new THREE.Vector3(-0.93, 0.92, 2.64);
const roomCameraBoundary = new THREE.Box3(
    new THREE.Vector3(-2.05, 0.35, -0.55),
    new THREE.Vector3(2.05, 1.8, 6.12)
);
const terminalCameraDistance = 0.52;
const terminalScreenMeshName = 'CRT_Monitor_Screen1_CRT_Screen_0';
const terminalScreenLocalNormal = new THREE.Vector3(1, 0, 0);
const roomCameraBounds = {
    minX: -1.3,
    maxX: 1.55,
    minZ: 1,
    maxZ: 4.9,
};
const retroSetupPosition: [number, number, number] = [-1.25, -0.03, 6.04];
const retroSetupRotationY = Math.PI * 0.5;
const terminalGlowPosition: [number, number, number] = [-1.25, 0.8, 5.95];
const movingKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);
const modelAssets = {
    room: {
        url: '/models/modern_living_room.glb',
        bytes: 346192032,
    },
    setup: {
        url: '/models/retro_98xp_gaming_desktop_setup.glb',
        bytes: 46620140,
    },
} as const;

type ModelKey = keyof typeof modelAssets;
type ModelProgress = Record<ModelKey, { loaded: number; total: number }>;
type ModelSnapshot = { gltf: GLTF | null; loaded: number; total: number; error: unknown | null };
type ModelState = {
    snapshot: ModelSnapshot;
    listeners: Set<() => void>;
    started: boolean;
};

const modelStates: Record<ModelKey, ModelState> = {
    room: {
        snapshot: { gltf: null, loaded: 0, total: modelAssets.room.bytes, error: null },
        listeners: new Set(),
        started: false,
    },
    setup: {
        snapshot: { gltf: null, loaded: 0, total: modelAssets.setup.bytes, error: null },
        listeners: new Set(),
        started: false,
    },
};

function notifyModelState(key: ModelKey) {
    modelStates[key].listeners.forEach((listener) => listener());
}

function startModelLoad(key: ModelKey) {
    const state = modelStates[key];
    if (state.started) return;

    state.started = true;
    const asset = modelAssets[key];
    const loader = new GLTFLoader();

    loader.load(
        asset.url,
        (gltf) => {
            state.snapshot = {
                gltf,
                loaded: asset.bytes,
                total: asset.bytes,
                error: null,
            };
            notifyModelState(key);
        },
        (event) => {
            const total = event.total > 0 ? event.total : asset.bytes;
            state.snapshot = {
                ...state.snapshot,
                loaded: Math.min(event.loaded, total),
                total,
            };
            notifyModelState(key);
        },
        (error) => {
            state.snapshot = {
                ...state.snapshot,
                error,
            };
            notifyModelState(key);
        }
    );
}

function isTerminalScreen(object: THREE.Object3D) {
    return object.name === terminalScreenMeshName;
}

function getSceneQuality() {
    const highQuality = {
        dpr: [1, 1.5] as [number, number],
        shadows: true,
        effects: true,
        antialias: true,
    };

    if (typeof window === 'undefined') return highQuality;

    const connection = (navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrowScreen = window.matchMedia('(max-width: 760px)').matches;
    const constrainedNetwork = Boolean(
        connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '')
    );
    const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowMemory = deviceMemory ? deviceMemory <= 4 : false;

    if (!reducedMotion && !narrowScreen && !constrainedNetwork && !lowCpu && !lowMemory) return highQuality;

    return {
        dpr: [0.75, 1] as [number, number],
        shadows: false,
        effects: false,
        antialias: false,
    };
}

function useSceneQuality() {
    const [quality] = useState(getSceneQuality);
    return quality;
}

function useMeasuredGLTF(
    key: ModelKey,
    onProgress: (key: ModelKey, loaded: number, total: number) => void,
    onError: (error: unknown) => void
) {
    const [snapshot, setSnapshot] = useState<ModelSnapshot>(() => modelStates[key].snapshot);

    useEffect(() => {
        const updateSnapshot = () => setSnapshot({ ...modelStates[key].snapshot });

        modelStates[key].listeners.add(updateSnapshot);
        startModelLoad(key);
        updateSnapshot();
        return () => {
            modelStates[key].listeners.delete(updateSnapshot);
        };
    }, [key]);

    useEffect(() => {
        onProgress(key, snapshot.loaded, snapshot.total);
        if (snapshot.error) onError(snapshot.error);
    }, [key, onError, onProgress, snapshot.error, snapshot.loaded, snapshot.total]);

    return snapshot.gltf;
}

// Camera Manager
function CameraManager() {
    const controlsRef = useRef<CameraControls>(null);
    const phase = useStore((state) => state.phase);
    const targetPosition = useStore((state) => state.targetPosition);
    const cameraPosition = useStore((state) => state.cameraPosition);
    const pressedKeysRef = useRef(new Set<string>());
    const positionRef = useRef(new THREE.Vector3());
    const targetRef = useRef(new THREE.Vector3());
    const forwardRef = useRef(new THREE.Vector3());
    const rightRef = useRef(new THREE.Vector3());
    const moveRef = useRef(new THREE.Vector3());
    const nextPositionRef = useRef(new THREE.Vector3());
    const clampedPositionRef = useRef(new THREE.Vector3());
    const appliedMoveRef = useRef(new THREE.Vector3());
    const nextTargetRef = useRef(new THREE.Vector3());

    useEffect(() => {
        if (!controlsRef.current) return;

        const controls = controlsRef.current;

        if (phase === 'TERMINAL' && targetPosition && cameraPosition) {
            controls.setBoundary(undefined);
            controls.boundaryEnclosesCamera = false;
            controls.mouseButtons.left = 0;
            controls.mouseButtons.middle = 0;
            controls.mouseButtons.right = 0;
            controls.touches.one = 0;
            controls.touches.two = 0;
            controls.dollySpeed = 0;
            controls.truckSpeed = 0;
            controls.azimuthRotateSpeed = 0;
            controls.polarRotateSpeed = 0;
            controls.minDistance = terminalCameraDistance;
            controls.maxDistance = terminalCameraDistance;
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            controls.minAzimuthAngle = -Infinity;
            controls.maxAzimuthAngle = Infinity;

            // Perfect centering: Use precalculated camera and target positions
            controls.setLookAt(
                cameraPosition.x, cameraPosition.y, cameraPosition.z, // Eye: Calculated position
                targetPosition.x, targetPosition.y, targetPosition.z, // Target: Screen center
                true // Smooth transition
            );
        } else {
            controls.mouseButtons.left = 1;
            controls.mouseButtons.middle = 0;
            controls.mouseButtons.right = 0;
            controls.touches.one = 32;
            controls.touches.two = 0;
            controls.dollySpeed = 0;
            controls.truckSpeed = 0;
            controls.azimuthRotateSpeed = 1;
            controls.polarRotateSpeed = 1;
            controls.minDistance = 1.35;
            controls.maxDistance = 1.55;
            controls.minPolarAngle = Math.PI * 0.26;
            controls.maxPolarAngle = Math.PI * 0.48;
            controls.minAzimuthAngle = -Infinity;
            controls.maxAzimuthAngle = Infinity;
            controls.boundaryEnclosesCamera = true;
            controls.boundaryFriction = 0.65;
            controls.setBoundary(roomCameraBoundary);

            // Reset to room view
            controls.setLookAt(
                roomCameraPosition.x,
                roomCameraPosition.y,
                roomCameraPosition.z,
                roomCameraTarget.x,
                roomCameraTarget.y,
                roomCameraTarget.z,
                true
            );
        }
    }, [phase, targetPosition, cameraPosition]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (phase !== 'ROOM') return;
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

            const key = event.key.toLowerCase();
            if (!movingKeys.has(key)) return;

            event.preventDefault();
            pressedKeysRef.current.add(key);
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            pressedKeysRef.current.delete(event.key.toLowerCase());
        };

        const handleWindowBlur = () => pressedKeysRef.current.clear();

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [phase]);

    useFrame((_, delta) => {
        if (phase !== 'ROOM' || !controlsRef.current || pressedKeysRef.current.size === 0) return;

        const controls = controlsRef.current;
        const position = controls.getPosition(positionRef.current);
        const target = controls.getTarget(targetRef.current);
        const forward = forwardRef.current.copy(target).sub(position);
        forward.y = 0;
        forward.normalize();

        const right = rightRef.current.set(-forward.z, 0, forward.x).normalize();
        const move = moveRef.current.set(0, 0, 0);
        const keys = pressedKeysRef.current;

        if (keys.has('w') || keys.has('arrowup')) move.add(forward);
        if (keys.has('s') || keys.has('arrowdown')) move.sub(forward);
        if (keys.has('d') || keys.has('arrowright')) move.add(right);
        if (keys.has('a') || keys.has('arrowleft')) move.sub(right);
        if (move.lengthSq() === 0) return;

        move.normalize().multiplyScalar(2.25 * delta);

        const nextPosition = nextPositionRef.current.copy(position).add(move);
        const clampedPosition = clampedPositionRef.current.set(
            THREE.MathUtils.clamp(nextPosition.x, roomCameraBounds.minX, roomCameraBounds.maxX),
            roomCameraPosition.y,
            THREE.MathUtils.clamp(nextPosition.z, roomCameraBounds.minZ, roomCameraBounds.maxZ)
        );
        const appliedMove = appliedMoveRef.current.copy(clampedPosition).sub(position);
        const nextTarget = nextTargetRef.current.copy(target).add(appliedMove);

        controls.setLookAt(
            clampedPosition.x,
            clampedPosition.y,
            clampedPosition.z,
            nextTarget.x,
            nextTarget.y,
            nextTarget.z,
            false
        );
    });

    return <CameraControls ref={controlsRef} makeDefault />;
}

function LivingRoom({
    onReady,
    onProgress,
    onError,
}: {
    onReady: () => void;
    onProgress: (key: ModelKey, loaded: number, total: number) => void;
    onError: (error: unknown) => void;
}) {
    const gltf = useMeasuredGLTF('room', onProgress, onError);

    React.useLayoutEffect(() => {
        if (!gltf) return;

        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        onReady();
    }, [gltf, onReady]);

    if (!gltf) return null;

    return (
        <primitive
            object={gltf.scene}
            scale={0.75}
            position={[0, 0, -0.15]}
            rotation={[0, 0, 0]}
        />
    );
}

// THE RETRO SETUP (Focusing on this single file)
function RetroSetup({
    onReady,
    onProgress,
    onError,
}: {
    onReady: () => void;
    onProgress: (key: ModelKey, loaded: number, total: number) => void;
    onError: (error: unknown) => void;
}) {
    const gltf = useMeasuredGLTF('setup', onProgress, onError);
    const setPhase = useStore((state) => state.setPhase);
    const phase = useStore((state) => state.phase);
    const setTargetPosition = useStore((state) => state.setTargetPosition);
    const setCameraPosition = useStore((state) => state.setCameraPosition);
    const terminalLinks = useStore((state) => state.terminalLinks);
    const texture = useTerminalTexture();
    const screenCenterRef = useRef<THREE.Vector3 | null>(null);
    const screenCameraDirectionRef = useRef<THREE.Vector3 | null>(null);

    // SCREENS MATERIAL FIX & TEXTURE APPLICATION
    React.useLayoutEffect(() => {
        if (!gltf) return;

        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Apply terminal texture to the CRT screen
                if (child.name === 'CRT_Monitor_Screen1_CRT_Screen_0') {
                    const mesh = child as THREE.Mesh;
                    mesh.material = new THREE.MeshBasicMaterial({
                        map: texture,
                        toneMapped: false, // Make it bright
                    });

                    mesh.geometry.computeBoundingBox();
                    const box = mesh.geometry.boundingBox?.clone();
                    if (box) {
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        mesh.localToWorld(center);
                        screenCenterRef.current = center;
                        screenCameraDirectionRef.current = terminalScreenLocalNormal
                            .clone()
                            .transformDirection(mesh.matrixWorld)
                            .normalize();
                    }
                }
            }
        });
        onReady();
    }, [gltf, onReady, texture]);

    React.useEffect(() => {
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, []);

    // Handle click on the specific node
    // Since we are using <primitive>, we can just wrap it or add onClick to the group roughly, 
    // OR closer: use the event.object.name in the handler.

    if (!gltf) return null;

    return (
        <group
            position={retroSetupPosition}
            onClick={(e) => {
                // Only the CRT screen should steal clicks from camera controls.
                if (!isTerminalScreen(e.object)) return;

                e.stopPropagation();

                if (phase === 'TERMINAL' && e.uv) {
                    const canvasX = e.uv.x * 1024;
                    const canvasY = (1 - e.uv.y) * 1024;
                    const clickedLink = terminalLinks.find((link) =>
                        canvasX >= link.x &&
                        canvasX <= link.x + link.width &&
                        canvasY >= link.y &&
                        canvasY <= link.y + link.height
                    );

                    if (clickedLink) {
                        window.open(clickedLink.url, '_blank', 'noopener,noreferrer');
                    }

                    return;
                }

                if (phase === 'ROOM') {
                    const mesh = e.object as THREE.Mesh;
                    const worldPos = screenCenterRef.current?.clone() ?? new THREE.Vector3();
                    const cameraDirection = screenCameraDirectionRef.current?.clone() ?? terminalScreenLocalNormal
                        .clone()
                        .transformDirection(mesh.matrixWorld)
                        .normalize();
                    const cameraPos = worldPos.clone().add(cameraDirection.multiplyScalar(terminalCameraDistance));

                    // Store both positions
                    setTargetPosition(worldPos);
                    setCameraPosition(cameraPos);
                    document.body.style.cursor = 'auto';
                    setPhase('TERMINAL');
                }
            }}
            onPointerOver={(e) => {
                if (!isTerminalScreen(e.object)) return;
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                if (!isTerminalScreen(e.object)) return;
                e.stopPropagation();
                document.body.style.cursor = 'auto';
            }}
        >
            <primitive
                object={gltf.scene}
                scale={0.85}
                position={[0, 0, 0]}
                rotation={[0, retroSetupRotationY, 0]}
            />
        </group>
    );
}

// CLEAN SCENE
export default function Workspace3D() {
    const quality = useSceneQuality();
    const [roomReady, setRoomReady] = useState(false);
    const [setupReady, setSetupReady] = useState(false);
    const [modelProgress, setModelProgress] = useState<ModelProgress>({
        room: { loaded: 0, total: modelAssets.room.bytes },
        setup: { loaded: 0, total: modelAssets.setup.bytes },
    });
    const [modelError, setModelError] = useState(false);
    const setSceneReady = useStore((state) => state.setSceneReady);
    const setSceneLoadingProgress = useStore((state) => state.setSceneLoadingProgress);
    const setSceneLoadingError = useStore((state) => state.setSceneLoadingError);
    const handleRoomReady = useCallback(() => setRoomReady(true), []);
    const handleSetupReady = useCallback(() => setSetupReady(true), []);
    const handleModelProgress = useCallback((key: ModelKey, loaded: number, total: number) => {
        setModelProgress((current) => {
            const previous = current[key];
            const nextLoaded = Math.max(0, Math.round(loaded));
            const nextTotal = Math.max(1, Math.round(total));

            if (previous.loaded === nextLoaded && previous.total === nextTotal) return current;

            return {
                ...current,
                [key]: {
                    loaded: nextLoaded,
                    total: nextTotal,
                },
            };
        });
    }, []);
    const handleModelError = useCallback((error: unknown) => {
        console.error('Failed to load portfolio model', error);
        setModelError(true);
    }, []);
    const sceneReady = roomReady && setupReady;
    const realDownloadProgress = useMemo(() => {
        const loaded = modelProgress.room.loaded + modelProgress.setup.loaded;
        const total = modelProgress.room.total + modelProgress.setup.total;
        return total > 0 ? (loaded / total) * 100 : 0;
    }, [modelProgress]);
    const glOptions = useMemo(() => ({
        antialias: quality.antialias,
        powerPreference: 'high-performance' as const,
    }), [quality.antialias]);

    useEffect(() => {
        setSceneReady(sceneReady);

        return () => {
            setSceneReady(false);
        };
    }, [sceneReady, setSceneReady]);

    useEffect(() => {
        setSceneLoadingProgress(realDownloadProgress);
    }, [realDownloadProgress, setSceneLoadingProgress]);

    useEffect(() => {
        setSceneLoadingError(modelError);
    }, [modelError, setSceneLoadingError]);

    return (
        <div className="portfolio-scene-root" onContextMenu={(event) => event.preventDefault()}>
            <div
                className={[
                    'portfolio-canvas-stage transition-opacity duration-700',
                    sceneReady ? 'opacity-100' : 'pointer-events-none opacity-0',
                ].join(' ')}
                aria-hidden={!sceneReady}
            >
                <Canvas
                    dpr={quality.dpr}
                    shadows={quality.shadows}
                    camera={{ fov: 39, position: roomCameraPosition.toArray() }}
                    gl={glOptions}
                    performance={{ min: 0.55 }}
                >
                    <color attach="background" args={['#050403']} />
                    <fog attach="fog" args={['#050403', 7.5, 14]} />

                    <CameraManager />
                    <Suspense fallback={null}>
                        <LivingRoom
                            onReady={handleRoomReady}
                            onProgress={handleModelProgress}
                            onError={handleModelError}
                        />
                    </Suspense>

                    <ambientLight intensity={0.42} />
                    <hemisphereLight args={['#fff0d2', '#2a1d12', 0.62]} />
                    <directionalLight position={[-2.8, 4.5, 2.5]} intensity={1.2} castShadow={quality.shadows} />
                    <spotLight position={[2.7, 3.2, 3.2]} angle={0.5} penumbra={0.85} intensity={1.1} castShadow={quality.shadows} />
                    <pointLight position={terminalGlowPosition} color="#d8ffd0" intensity={0.08} distance={1.25} />

                    <Suspense fallback={null}>
                        <RetroSetup
                            onReady={handleSetupReady}
                            onProgress={handleModelProgress}
                            onError={handleModelError}
                        />
                    </Suspense>

                    {quality.effects && (
                        <EffectComposer>
                            <Bloom luminanceThreshold={0.82} intensity={0.12} mipmapBlur />
                            <Vignette darkness={0.34} />
                        </EffectComposer>
                    )}
                </Canvas>
            </div>
        </div>
    );
}
