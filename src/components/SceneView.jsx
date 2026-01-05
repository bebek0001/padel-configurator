import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'

function SceneContent({
  courtUrl,
  lightsUrl,
  onLoaded,
}) {
  const court = useGLTF(courtUrl)
  const lights = lightsUrl ? useGLTF(lightsUrl) : null

  useEffect(() => {
    if (onLoaded) onLoaded()
  }, [court, lights])

  return (
    <>
      {/* Основное мягкое заполнение */}
      <ambientLight intensity={0.5} />

      {/* Основной направленный свет СВЕРХУ */}
      <directionalLight
        position={[0, 7, 0]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Дополнительный фронтальный свет */}
      <directionalLight
        position={[0, 3, 6]}
        intensity={0.9}
      />

      {/* Лёгкий контровой */}
      <directionalLight
        position={[0, 4, -6]}
        intensity={0.4}
      />

      {/* Корт */}
      <primitive object={court.scene} />

      {/* Освещение как модель */}
      {lights && <primitive object={lights.scene} />}
    </>
  )
}

export default function SceneView({
  courtUrl,
  lightsUrl,
  onLoaded,
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [6, 4, 6], fov: 45 }}
      gl={{
        physicallyCorrectLights: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.4,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{
        background: 'radial-gradient(circle at center, #14181d 0%, #07090c 70%)',
      }}
    >
      <Suspense fallback={null}>
        <SceneContent
          courtUrl={courtUrl}
          lightsUrl={lightsUrl}
          onLoaded={onLoaded}
        />
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.2, 0]}
      />
    </Canvas>
  )
}
