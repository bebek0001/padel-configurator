import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function applyColorToMaterialBlack(root, hex) {
  const col = new THREE.Color(hex)
  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const m of mats) {
      if (!m) continue
      if (m.name === 'Black') {
        if (m.color) m.color.copy(col)
        m.needsUpdate = true
      }
    }
  })
}

function Model({ url, onLoaded, onRoot }) {
  const gltf = useGLTF(url)
  useEffect(() => {
    onRoot?.(gltf.scene)
    onLoaded?.()
  }, [gltf, onLoaded, onRoot])
  return <primitive object={gltf.scene} />
}

function SceneContent({ courtUrl, lightsUrl, structureColor, scenePreset }) {
  const groupRef = useRef()
  const controlsRef = useRef()

  // считаем bbox только для target/камеры, без смещения моделей
  const fitTo = () => {
    if (!groupRef.current || !controlsRef.current) return
    const box = new THREE.Box3().setFromObject(groupRef.current)
    if (box.isEmpty()) return
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const radius = Math.max(size.x, size.y, size.z) * 0.9

    controlsRef.current.target.copy(center)
    controlsRef.current.update()

    // камера: лёгкий “как на сайте” угол
    const cam = controlsRef.current.object
    cam.position.set(center.x + radius * 1.2, center.y + radius * 0.65, center.z + radius * 1.25)
    cam.lookAt(center)
  }

  const onCourtRoot = (root) => {
    applyColorToMaterialBlack(root, structureColor)
  }

  const onCourtLoaded = () => {
    // после загрузки корта подгоняем камеру
    setTimeout(fitTo, 0)
  }

  const onLightsRoot = (root) => {
    // свет как модель — тоже НЕ трогаем позиционно
    // если хочешь, можно тут делать мелкие правки материала/интенсивности, но не надо двигать
  }

  const onLightsLoaded = () => {
    // если свет подгрузился позже корта — ещё раз fit
    setTimeout(fitTo, 0)
  }

  // обновление цвета структуры без перезагрузки
  useEffect(() => {
    if (!groupRef.current) return
    // красим весь groupRef (там и корт и свет), но меняется только material.name === "Black"
    applyColorToMaterialBlack(groupRef.current, structureColor)
  }, [structureColor])

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        panSpeed={0.8}
        zoomSpeed={0.9}
        makeDefault
      />

      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 12, 6]} intensity={0.9} />

      <Environment preset={scenePreset} />

      <group ref={groupRef}>
        <Suspense fallback={null}>
          <Model url={courtUrl} onLoaded={onCourtLoaded} onRoot={onCourtRoot} />
        </Suspense>

        {/* lightsUrl может быть none.glb — тогда будет пустая сцена/ничего страшного */}
        <Suspense fallback={null}>
          <Model url={lightsUrl} onLoaded={onLightsLoaded} onRoot={onLightsRoot} />
        </Suspense>
      </group>
    </>
  )
}

export default function SceneView({ courtUrl, lightsUrl, structureColor, scenePreset }) {
  // прелоад без “/models/..” — только то, что приходит (уже правильное)
  useMemo(() => {
    if (courtUrl) useGLTF.preload(courtUrl)
    if (lightsUrl) useGLTF.preload(lightsUrl)
  }, [courtUrl, lightsUrl])

  return (
    <Canvas
      camera={{ fov: 45, position: [10, 6, 10], near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#070a0f']} />
      <SceneContent
        courtUrl={courtUrl}
        lightsUrl={lightsUrl}
        structureColor={structureColor}
        scenePreset={scenePreset}
      />
    </Canvas>
  )
}
