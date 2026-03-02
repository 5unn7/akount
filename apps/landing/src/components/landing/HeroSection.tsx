'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Suspense, useRef, useState, useEffect } from 'react';
import type * as THREE from 'three';

function AmberOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Breathing animation
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#F59E0B"
        emissive="#F59E0B"
        emissiveIntensity={0.4}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function ThreeScene() {
  const [Canvas, setCanvas] = useState<React.ComponentType<any> | null>(null);
  const [OrbitControls, setOrbitControls] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // Dynamically import Three.js libraries only on client side
    Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei'),
    ]).then(([fiber, drei]) => {
      setCanvas(() => fiber.Canvas);
      setOrbitControls(() => drei.OrbitControls);
    });
  }, []);

  if (!Canvas || !OrbitControls) {
    return null; // Don't render until libraries are loaded
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#F59E0B" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FBBF24" />
      <AmberOrb />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-ak-bg-4 via-[#09090F] to-[#09090F]">
      {/* 3D Orb Background */}
      <div className="absolute inset-0 opacity-30">
        <Suspense fallback={null}>
          <ThreeScene />
        </Suspense>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="font-heading text-5xl md:text-7xl font-normal text-foreground mb-6 leading-tight">
          Your global business finances.{' '}
          <span className="text-primary">One command center.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          Track every dollar across currencies, entities, and accounts. AI handles the complexity.
          You make the decisions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sign-up">
            <Button size="lg" className="text-base px-8 py-6 h-auto">
              Start tracking now
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap gap-8 justify-center items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ak-green"></div>
            <span>26 currencies supported</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ak-green"></div>
            <span>Double-entry compliance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ak-green"></div>
            <span>AI-powered categorization</span>
          </div>
        </div>
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090F] to-transparent pointer-events-none"></div>
    </section>
  );
}
