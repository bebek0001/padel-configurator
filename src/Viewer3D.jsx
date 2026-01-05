import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function assetUrl(relPath) {
  // ВАЖНО для GitHub Pages: BASE_URL = "/padel-configurator/"
  // relPath должен быть без начального "/"
  return `${import.meta.env.BASE_URL}${relPath}`;
}

function Scene({ courtFile, lightFile, structureColor }) {
  const groupRef = useRef();

  const courtUrl = courtFile ? assetUrl(courtFile) : null;
  const lightsUrl = lightFile ? assetUrl(lightFile) : null;

  const court = useGLTF(courtUrl || assetUrl("models/courts/base.glb"));
  const lights = useGLTF(lightsUrl || assetUrl("models/empty.glb")); // пустышка, чтобы не падать

  // Покраска только материала с именем "Black"
  const originalColors = useRef(new Map());

  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.traverse((obj) => {
      if (!obj.isMesh) return;

      const mat = obj.material;
      if (!mat || !mat.name) return;

      if (mat.name === "Black") {
        // делаем материал уникальным для меша (чтобы не красить всё подряд)
        if (!originalColors.current.has(obj.uuid)) {
          const cloned = mat.clone();
          obj.material = cloned;
          originalColors.current.set(obj.uuid, cloned.color.clone());
        }

        obj.material.color = new THREE.Color(structureColor);
        obj.material.needsUpdate = true;
      }
    });
  }, [structureColor, courtUrl, lightsUrl]);

  // Нормализация ПО КОРТУ: сдвигаем общий group, чтобы:
  // - корт стоял на "земле" (y=0)
  // - был по центру
  // - и lights-модель ехала вместе с ним
  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;

    // обнулим позицию перед вычислением
    g.position.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(court.scene);
    if (!isFinite(box.min.x)) return;

    const center = new THREE.Vector3();
    box.getCenter(center);

    const minY = box.min.y;

    // X/Z в центр, Y на землю
    g.position.set(-center.x, -minY, -center.z);
  }, [courtUrl]);

  return (
    <group ref={groupRef}>
      <primitive object={court.scene} />
      {lightFile ? <primitive object={lights.scene} /> : null}
    </group>
  );
}

export default function Viewer3D({ courtFile, lightFile, structureColor }) {
  const controlsRef = useRef();

  useEffect(() => {
    const onCenter = () => {
      const c = controlsRef.current;
      if (!c) return;
      c.reset();
    };
    window.addEventListener("center-view", onCenter);
    return () => window.removeEventListener("center-view", onCenter);
  }, []);

  return (
    <Canvas
      camera={{ position: [6, 5, 8], fov: 45, near: 0.1, far: 500 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#050607"]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 12, 8]} intensity={1.2} />

      <Scene courtFile={courtFile} lightFile={lightFile} structureColor={structureColor} />

      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
