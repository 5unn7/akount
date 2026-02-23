'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';

const features = [
  { title: 'Banking', desc: 'Real-time account balances', color: '#60A5FA' },
  { title: 'Invoicing', desc: 'Multi-currency AR/AP', color: '#34D399' },
  { title: 'Accounting', desc: 'Automated journal entries', color: '#F59E0B' },
  { title: 'Insights', desc: 'AI cash flow forecasting', color: '#A78BFA' },
  { title: 'Reports', desc: 'Balance sheet, P&L, GL', color: '#F87171' },
  { title: 'Multi-entity', desc: 'Separate books per business', color: '#2DD4BF' },
];

function FeatureCard({ feature, position }: { feature: typeof features[0]; position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Card background */}
      <mesh>
        <boxGeometry args={[2, 1.5, 0.1]} />
        <meshStandardMaterial
          color={feature.color}
          opacity={0.2}
          transparent
          roughness={0.5}
          metalness={0.8}
        />
      </mesh>

      {/* Title text */}
      <Text
        position={[0, 0.3, 0.06]}
        fontSize={0.2}
        color="#F0F0F5"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Manrope-SemiBold.ttf"
      >
        {feature.title}
      </Text>

      {/* Description text */}
      <Text
        position={[0, 0, 0.06]}
        fontSize={0.12}
        color="#9494A8"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        textAlign="center"
        font="/fonts/Manrope-Regular.ttf"
      >
        {feature.desc}
      </Text>
    </group>
  );
}

function Feature3DGrid() {
  const positions: [number, number, number][] = [
    [-2.5, 1, 0],
    [0, 1, 0],
    [2.5, 1, 0],
    [-2.5, -1, 0],
    [0, -1, 0],
    [2.5, -1, 0],
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {features.map((feature, i) => (
        <FeatureCard key={i} feature={feature} position={positions[i]} />
      ))}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

// 2D Fallback Grid
function Feature2DGrid() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {features.map((feature, i) => (
        <div
          key={i}
          className="glass rounded-xl p-6 border border-ak-border hover:border-ak-border-2 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${feature.color}10, transparent)`,
          }}
        >
          <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function FeaturesShowcase() {
  const [isMobile, setIsMobile] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    // Detect mobile
    setIsMobile(window.innerWidth < 768);

    // Detect WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLAvailable(!!gl);
    } catch (e) {
      setWebGLAvailable(false);
    }
  }, []);

  const use3D = !isMobile && webGLAvailable;

  return (
    <section className="relative py-24 px-6 bg-[#09090F]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-normal text-foreground mb-4">
            Everything you need to <span className="text-primary">command your finances</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Six core domains that work together seamlessly. {use3D && 'Drag to explore.'}
          </p>
        </div>

        {use3D ? (
          <div className="h-[500px] w-full">
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">Loading 3D view...</div>
                </div>
              }
            >
              <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
                <Feature3DGrid />
              </Canvas>
            </Suspense>
          </div>
        ) : (
          <Feature2DGrid />
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All features work across multiple entities and currencies simultaneously.</p>
        </div>
      </div>
    </section>
  );
}
