import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'

function useCenteredGLTF(url) {
  const gltf = useGLTF(url, true)
  const center = useMemo(() => new THREE.Vector3(), [])
  const size = useMemo(() => new THREE.Vector3(), [])
  const box = useMemo(() => new THREE.Box3(), [])

  useLayoutEffect(() => {
    if (!gltf?.scene) return
    box.setFromObject(gltf.scene)
    box.getCenter(center)
    box.getSize(size)
  }, [gltf, box, center, size])

  return { gltf, center, size }
}

function SceneContent({ courtUrl, lightsUrl, structureColor }) {
  const courtGroup = useRef()
  const lightsGroup = useRef()
  const [shift, setShift] = useState(() => new THREE.Vector3(0, 0, 0))

  const court = useCenteredGLTF(courtUrl)
  const lights = lightsUrl ? useCenteredGLTF(lightsUrl) : null

  // 1) Сдвиг берём ТОЛЬКО по корту (его центр)
  useLayoutEffect(() => {
    if (!court?.gltf?.scene) return
    setShift(court.center.clone().multiplyScalar(-1))
  }, [court?.gltf, court?.center])

  // 2) Применяем одинаковый сдвиг корту и свету -> больше не разъезжаются
  useLayoutEffect(() => {
    if (courtGroup.current) {
      courtGroup.current.position.copy(shift)
    }
    if (lightsGroup.current) {
      lightsGroup.current.position.copy(shift)
    }
  }, [shift])

  // 3) Перекраска только материала "Black" (и НЕ трогаем Black.001 и т.п.)
  useEffect(() => {
    const scene = court?.gltf?.scene
    if (!scene) return

    const targetName = 'Black'
    scene.traverse((obj) => {
      if (!obj.isMesh) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => {
        if (!m) return
        if (m.name === targetName) {
          if (m.color) m.color.set(structureColor)
          m.needsUpdate = true
        }
      })
    })
  }, [court?.gltf, structureColor])

  // 4) Fit view по событию кнопки
  const controlsRef = useRef()
  const cameraRef = useRef()

  useEffect(() => {
    const onFit = () => {
      if (!cameraRef.current || !controlsRef.current || !court?.gltf?.scene) return

      const box = new THREE.Box3().setFromObject(court.gltf.scene)
      const size = new THREE.Vector3()
      const center = new THREE.Vector3()
      box.getSize(size)
      box.getCenter(center)

      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = cameraRef.current.fov * (Math.PI / 180)
      let camZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
      camZ *= 1.6

      cameraRef.current.position.set(center.x + camZ, center.y + camZ * 0.35, center.z + camZ)
      cameraRef.current.near = camZ / 100
      cameraRef.current.far = camZ * 100
      cameraRef.current.updateProjectionMatrix()

      controlsRef.current.target.copy(center)
      controlsRef.current.update()
    }

    window.addEventListener('fit-view', onFit)
    return () => window.removeEventListener('fit-view', onFit)
  }, [court?.gltf])

  return (
    <>
      <perspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={45}
        position={[6, 4, 6]}
      />

      {/* базовый свет сцены */}
      <ambientLight intensity={0.6} />
      <directionalLight intensity={1.0} position={[6, 10, 6]} />

      {/* корт */}
      <group ref={courtGroup}>
        <primitive object={court.gltf.scene} />
      </group>

      {/* освещение как модель */}
      {lights?.gltf?.scene && (
        <group ref={lightsGroup}>
          <primitive object={lights.gltf.scene} />
        </group>
      )}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        panSpeed={0.8}
        zoomSpeed={0.8}
      />
    </>
  )
}

export default function SceneView({ courtUrl, lightsUrl, structureColor }) {
  return (
    <div className="pg-canvas-wrap">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#070b10']} />
        <SceneContent courtUrl={courtUrl} lightsUrl={lightsUrl} structureColor={structureColor} />
      </Canvas>
    </div>
  )
}

useGLTF.preload('/models/courts/base.glb')
