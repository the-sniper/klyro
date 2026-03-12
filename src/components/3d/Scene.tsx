"use client";

/**
 * Scroll-driven 3D storytelling scene.
 *
 * Architecture (per the Bible §5, §12):
 *   - Fixed canvas covers the entire viewport, z-0
 *   - A MutableRefObject<number> called `scrollProgress` (0→1) is updated by
 *     GSAP ScrollTrigger in the page component and passed down as a prop.
 *   - useFrame reads scrollProgress every tick — zero React state, zero re-renders.
 *   - Five story chapters (0–0.2 / 0.2–0.4 / …) each transform the scene.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Stars,
  Float,
  MeshTransmissionMaterial,
  Environment,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useRef, useMemo, Suspense, MutableRefObject } from "react";
import * as THREE from "three";

/* ── helpers ──────────────────────────────────────────────────────────────── */
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;

/** Map scrollProgress from one range to 0→1 */
function remap(v: number, inMin: number, inMax: number) {
  return clamp((v - inMin) / (inMax - inMin), 0, 1);
}

/* ── Types ────────────────────────────────────────────────────────────────── */
interface SceneProps {
  scrollProgress: MutableRefObject<number>;
}

/* ══════════════════════════════════════════════════════════════════════════
   PARTICLE FIELD — slow drift, speed-linked to scroll velocity
══════════════════════════════════════════════════════════════════════════ */
function ParticleField({
  count = 3000,
  scrollProgress,
}: {
  count?: number;
  scrollProgress: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Points>(null!);
  const prevScroll = useRef(0);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const sp = scrollProgress.current;
    const t  = clock.elapsedTime;

    const velocity = Math.abs(sp - prevScroll.current) * 40;
    prevScroll.current = sp;

    meshRef.current.rotation.y = t * 0.012 + sp * 1.4;
    meshRef.current.rotation.x = t * 0.006 + sp * 0.6;

    // Story arc: sparse (world-that-is) → rich (world-that-could-be)
    // Chapter 0: dim, sparse — "something is missing"
    // Chapter 4: bright, full — "success and celebration"
    const mat = meshRef.current.material as THREE.PointsMaterial;
    const deploy = remap(sp, 0.75, 1.0);
    meshRef.current.scale.setScalar(lerp(1, 1.4, deploy));
    mat.size    = lerp(0.011, 0.018 + velocity * 0.002, sp);
    mat.opacity = lerp(0.25, 0.65, sp);
    // cool-white → pale lavender → bright violet only in final chapter
    if (sp < 0.4)      mat.color.setStyle("#a8a4c8");
    else if (sp < 0.7) mat.color.setStyle("#8b7fc4");
    else               mat.color.setStyle("#9f7aea");
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.011}
        color="#a8a4c8"
        transparent
        opacity={0.25}
        sizeAttenuation
      />
    </points>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO TORUS-KNOT — glass material, scroll-driven rotation & scale
══════════════════════════════════════════════════════════════════════════ */
function HeroGeometry({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  const groupRef  = useRef<THREE.Group>(null!);
  const meshRef   = useRef<THREE.Mesh>(null!);
  const dotRef    = useRef<THREE.Sprite>(null!);

  // Soft radial gradient texture for the blur-dot sprite
  const dotTexture = useMemo(() => {
    const size   = 128;
    const canvas = document.createElement("canvas");
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0,    "rgba(180,130,255,1)");
    grad.addColorStop(0.35, "rgba(124,58,237,0.6)");
    grad.addColorStop(1,    "rgba(60,20,120,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useFrame(({ clock, mouse }) => {
    const sp = scrollProgress.current;
    const t  = clock.elapsedTime;

    // Mouse parallax on group rotation only (not position — position is scroll-driven)
    const mouseStrength = 1 - remap(sp, 0, 0.25);
    groupRef.current.rotation.x = lerp(groupRef.current.rotation.x, mouse.y * 0.1 * mouseStrength, 0.04);
    groupRef.current.rotation.y = lerp(groupRef.current.rotation.y, mouse.x * 0.14 * mouseStrength, 0.04);

    // Chapter 0 (problem): enters from below-right, settles right-of-center
    const ch0 = remap(sp, 0, 0.12);
    groupRef.current.position.y = lerp(-3, -0.1, ch0);
    groupRef.current.position.x = lerp(4, 2.0, ch0);

    // Chapter 1 (persona): icosahedron is the star — torus-knot steps LEFT
    const ch1 = remap(sp, 0.18, 0.38);
    groupRef.current.position.x = lerp(2.0, -1.8, ch1);

    // Chapter 2 (knowledge): torus-knot flies to far left
    const ch2 = remap(sp, 0.38, 0.56);
    groupRef.current.position.x = lerp(-1.8, -2.8, ch2);

    // Chapter 3 (test): both converge center — proof
    const ch3 = remap(sp, 0.58, 0.76);
    groupRef.current.position.x = lerp(-2.8, 0, ch3);

    // Chapter 4: knot implodes → blur dot takes over
    const ch4       = remap(sp, 0.78, 1.0);
    const meshScale = lerp(1, 0.0, ch4);  // knot shrinks fully to zero
    meshRef.current.scale.setScalar(meshScale);

    // Blur dot: fades in as knot shrinks, then pulses gently
    const dotOpacity = remap(sp, 0.82, 0.95) * (1 - remap(sp, 0.97, 1.0));
    const dotPulse   = 1 + Math.sin(t * 2.4) * 0.12;
    const dotScale   = lerp(0, 1.4 * dotPulse, remap(sp, 0.82, 0.96));
    dotRef.current.scale.setScalar(dotScale);
    (dotRef.current.material as THREE.SpriteMaterial).opacity = dotOpacity;

    // Continuous slow rotation
    meshRef.current.rotation.y = t * 0.22 + sp * Math.PI * 3;
    meshRef.current.rotation.z = t * 0.08 + sp * 0.6;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={meshRef}>
          <torusKnotGeometry args={[1, 0.28, 256, 32]} />
          <MeshTransmissionMaterial
            backside
            samples={10}
            resolution={512}
            transmission={1}
            roughness={0.02}
            thickness={2.8}
            ior={1.5}
            chromaticAberration={0.06}
            distortion={0.1}
            distortionScale={0.25}
            temporalDistortion={0.08}
            color="#ffffff"
            attenuationDistance={0.5}
            attenuationColor="#7c3aed"
          />
        </mesh>
      </Float>
      {/* Blur dot — appears as the knot implodes */}
      <sprite ref={dotRef} scale={0}>
        <spriteMaterial
          map={dotTexture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   KNOWLEDGE NODES — appear in chapter 3, connect like a graph
══════════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
   ICOSAHEDRON — visible throughout the story, right side companion.
   
   Chapter 0 (hero):     small, right-side, softly glowing — atmospheric
   Chapter 1 (persona):  scales UP to become the hero — center-right stage
   Chapters 2-3:         shrinks back to companion, drifts with camera
   Chapter 4 (deploy):   fades as the burst takes over
══════════════════════════════════════════════════════════════════════════ */
function IcosahedronObject({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef  = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const sp = scrollProgress.current;
    const t  = clock.elapsedTime;

    // Appears when the knot starts shrinking (sp = 0.78), from the same spot
    const appear   = remap(sp, 0.78, 0.92);
    // Once text is visible, quietly dim so it becomes pure backdrop
    const dimDown  = remap(sp, 0.88, 1.0);

    // ── Position: spawn at center, drift back in Z as it expands ─────────
    groupRef.current.position.x = 0;
    groupRef.current.position.y = Math.sin(t * 0.4) * 0.1;
    groupRef.current.position.z = lerp(0, -3.5, appear); // recedes into bg as it grows

    // ── Scale: grows large so wireframe frames the scene, not dominates ───
    groupRef.current.scale.setScalar(lerp(0, 4.5, appear));

    // ── Rotation ──────────────────────────────────────────────────────────
    meshRef.current.rotation.x = t * 0.08;
    meshRef.current.rotation.y = t * 0.05 + sp * 1.5;

    // ── Opacity: peaks low (0.18) so lines read as atmosphere, not shape ──
    const opacity = lerp(0, 0.18, appear) * lerp(1, 0.5, dimDown);
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = opacity;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#7c3aed"
          emissiveIntensity={0.6}
          wireframe
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DEPLOY BURST — chapter 5: many small spheres explode outward
══════════════════════════════════════════════════════════════════════════ */
const BURST_COUNT = 32;
const burstOrigins = Array.from({ length: BURST_COUNT }, () => ({
  dir: new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  ).normalize(),
  speed: 0.5 + Math.random() * 1.6,
}));

function DeployBurst({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    const sp     = scrollProgress.current;
    // Strictly invisible until chapter 5 begins
    if (sp < 0.78) {
      groupRef.current.children.forEach((child) => {
        (child as THREE.Mesh).visible = false;
      });
      return;
    }
    const t      = remap(sp, 0.80, 1.0);
    const appear = remap(sp, 0.80, 0.90);
    const vanish = remap(sp, 0.94, 1.0);

    groupRef.current.children.forEach((child, i) => {
      (child as THREE.Mesh).visible = true;
      const { dir, speed } = burstOrigins[i];
      const dist = t * speed * 6;
      child.position.set(dir.x * dist, dir.y * dist, dir.z * dist);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.opacity = appear * (1 - vanish);
    });
  });

  return (
    <group ref={groupRef}>
      {burstOrigins.map((_, i) => (
        <mesh key={i} position={[0, 0, 0]} visible={false}>
          {/* Tiny — reads as light fragments, not blobs */}
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#7c3aed"
            emissiveIntensity={3}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

// AccentRing removed — replaced by IcosahedronObject's orbital rings

/* ══════════════════════════════════════════════════════════════════════════
   CAMERA CONTROLLER — the soul of the scroll story
══════════════════════════════════════════════════════════════════════════ */
function CameraController({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const sp = scrollProgress.current;

    // Chapter 0 (hero): camera at z=5.5, looking straight
    // Chapter 1 (persona): tilt right and pull back slightly
    // Chapter 2 (knowledge): drift left and closer
    // Chapter 3 (test): return center, zoom in
    // Chapter 4 (deploy): fly forward through field

    const ch0 = remap(sp, 0, 0.2);
    const ch1 = remap(sp, 0.2, 0.4);
    const ch2 = remap(sp, 0.4, 0.6);
    const ch3 = remap(sp, 0.6, 0.8);
    const ch4 = remap(sp, 0.8, 1.0);

    // Z depth — fly through particle field on last chapter
    let z = 5.5;
    z = lerp(z, 6.2, ch1);
    z = lerp(z, 5.0, ch2);
    z = lerp(z, 4.2, ch3);
    z = lerp(z, 1.8, ch4);

    // X drift
    let x = 0;
    x = lerp(x, 1.2, ch1);
    x = lerp(x, -0.8, ch2);
    x = lerp(x, 0, ch3);
    x = lerp(x, 0, ch4);

    // Y drift
    let y = 0;
    y = lerp(y, 0.3, ch1);
    y = lerp(y, -0.2, ch2);
    y = lerp(y, 0.1, ch3);
    y = lerp(y, 0, ch4);

    camera.position.x = lerp(camera.position.x, x, 0.06);
    camera.position.y = lerp(camera.position.y, y, 0.06);
    camera.position.z = lerp(camera.position.z, z, 0.06);

    // Look target shifts with camera
    camera.lookAt(
      lerp(0, x * 0.3, sp),
      lerp(0, y * 0.2, sp),
      0
    );
  });

  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   GRADIENT MESH BACKGROUND — animated shader-like gradient
══════════════════════════════════════════════════════════════════════════ */
function GradientBackground({
  scrollProgress,
}: {
  scrollProgress: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const sp = scrollProgress.current;
    const t  = clock.elapsedTime;

    // Slow undulation
    meshRef.current.rotation.z = Math.sin(t * 0.1) * 0.05;

    // Grows from invisible (problem/act 1) to warm glow (resolution/act 5)
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const storyGlow = remap(sp, 0.0, 0.9);
    mat.opacity = lerp(0.01, 0.06, storyGlow) * (Math.sin(t * 0.3) * 0.15 + 0.85);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -8]} scale={[16, 10, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshBasicMaterial
        color="#7c3aed"
        transparent
        opacity={0.03}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE CONTENT
══════════════════════════════════════════════════════════════════════════ */
function SceneContent({ scrollProgress }: SceneProps) {
  return (
    <>
      {/* Lighting rig — Bible §7 — keep rim very subtle so bg stays dark */}
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 8, 3]} intensity={1.6} color="#ffffff" castShadow />
      <directionalLight position={[-5, 2, -3]} intensity={0.25} color="#7c3aed" />
      <pointLight position={[-3, -2, 2]} intensity={0.3} color="#2a2040" />

      <Environment preset="night" background={false} />

      <GradientBackground scrollProgress={scrollProgress} />

      {/* Deep star field — two layers for depth */}
      <Stars radius={120} depth={60} count={5000} factor={3} saturation={0} fade speed={0.3} />
      <Stars radius={60}  depth={30} count={2000} factor={2} saturation={0} fade speed={0.1} />

      <ParticleField scrollProgress={scrollProgress} />
      <CameraController scrollProgress={scrollProgress} />

      <HeroGeometry scrollProgress={scrollProgress} />
      <IcosahedronObject scrollProgress={scrollProgress} />
      <DeployBurst scrollProgress={scrollProgress} />

      <EffectComposer multisampling={0}>
        <SMAA />
        <Bloom
          luminanceThreshold={0.88}
          luminanceSmoothing={0.025}
          intensity={1.4}
          radius={0.7}
          mipmapBlur
        />
        <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.032} />
        <Vignette eskil={false} offset={0.15} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CANVAS EXPORT
══════════════════════════════════════════════════════════════════════════ */
export default function Scene({ scrollProgress }: SceneProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#060609",
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.5], fov: 42 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <SceneContent scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
