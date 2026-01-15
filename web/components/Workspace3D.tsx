'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, Float, Environment, useGLTF } from '@react-three/drei';
import { EffectComposer, Vignette, Bloom } from '@react-three/postprocessing';
import React, { Suspense, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import TerminalLogic from './TerminalLogic';
import { useTerminalTexture } from './TerminalCanvas';

import { useControls } from 'leva';
import * as THREE from 'three';

// Camera Manager
function CameraManager() {
    const controlsRef = useRef<CameraControls>(null);
    const { phase, targetPosition, cameraPosition } = useStore();

    useEffect(() => {
        if (!controlsRef.current) return;

        if (phase === 'TERMINAL' && targetPosition && cameraPosition) {
            // Perfect centering: Use precalculated camera and target positions
            controlsRef.current.setLookAt(
                cameraPosition.x, cameraPosition.y, cameraPosition.z, // Eye: Calculated position
                targetPosition.x, targetPosition.y, targetPosition.z, // Target: Screen center
                true // Smooth transition
            );
        } else {
            // Reset to room view
            controlsRef.current.setLookAt(
                0, 0, 5, // Default eye
                0, 0, 0, // Default target
                true
            );
        }
    }, [phase, targetPosition]);

    return <CameraControls ref={controlsRef} makeDefault />;
}

// THE RETRO SETUP (Focusing on this single file)
function RetroSetup() {
    // Load the model
    const gltf = useGLTF('/models/retro_98xp_gaming_desktop_setup.glb');
    const { setPhase, phase, setTargetPosition, setCameraPosition } = useStore();
    const texture = useTerminalTexture();

    // SCREENS MATERIAL FIX & TEXTURE APPLICATION
    React.useLayoutEffect(() => {
        gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                // Apply terminal texture to the CRT screen
                if (child.name === 'CRT_Monitor_Screen1_CRT_Screen_0') {
                    const mesh = child as THREE.Mesh;
                    mesh.material = new THREE.MeshBasicMaterial({
                        map: texture,
                        toneMapped: false, // Make it bright
                    });
                }
            }
        });
    }, [gltf, texture]);

    // Handle click on the specific node
    // Since we are using <primitive>, we can just wrap it or add onClick to the group roughly, 
    // OR closer: use the event.object.name in the handler.

    return (
        <group
            position={[0, -0.5, 0]}
            onClick={(e) => {
                e.stopPropagation();
                // Check if we clicked the screen or the monitor area
                if (e.object.name === 'CRT_Monitor_Screen1_CRT_Screen_0' || e.object.name.includes('Monitor')) {
                    if (phase === 'ROOM') {
                        // Robust Centering v3: Use Bounding Box Center
                        const mesh = e.object as THREE.Mesh;
                        // Mesh origin might be at the bottom, causing "under desk" view.
                        // We calculate the exact visual center of the screen geometry.
                        mesh.geometry.computeBoundingBox();
                        const box = mesh.geometry.boundingBox!.clone();
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        mesh.localToWorld(center); // Convert local center to world center

                        const worldPos = center;

                        // Strictly force the camera to be in front of the screen on World Z.
                        // Y offset not needed if we rely on precise center, but kept small 0.05 just in case.
                        const cameraPos = worldPos.clone().add(new THREE.Vector3(0, 0, 0.55));

                        // Store both positions
                        setTargetPosition(worldPos);
                        setCameraPosition(cameraPos);
                        setPhase('TERMINAL');
                    }
                }
            }}
            onPointerOver={() => { document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
            <primitive
                object={gltf.scene}
                scale={0.5}
                position={[0, 0, 0]}
                rotation={[0, -Math.PI / 2, 0]}
            />
        </group>
    );
}

// CLEAN SCENE
export default function Workspace3D() {
    return (
        <div className="absolute inset-0 w-full h-full bg-black">
            <Canvas shadows camera={{ fov: 45, position: [0, 0, 5] }}>
                <Suspense fallback={null}>
                    <color attach="background" args={['#050505']} />

                    <CameraManager />

                    {/* Simple Studio Light */}
                    <ambientLight intensity={0.5} />
                    <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={1} castShadow />

                    <Environment preset="city" blur={1} />

                    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
                        <RetroSetup />
                    </Float>

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.5} intensity={0.5} mipmapBlur />
                        <Vignette darkness={0.5} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    );
}
