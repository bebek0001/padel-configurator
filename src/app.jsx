import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * ВАЖНО ДЛЯ GH PAGES:
 * все публичные ассеты (models/...) нужно строить через BASE_URL
 * чтобы не было 404 вида /assets/... или /models/...
 */
function assetUrl(path) {
  // path: "models/courts/base.glb"
  return `${import.meta.env.BASE_URL}${path}`;
}

const COURTS = [
  { id: "base", label: "Base", file: "base.glb" },
  { id: "base-panoramic", label: "Base Panoramic", file: "base-panoramic.glb" },
  { id: "ultra-panoramic", label: "Ultra Panoramic", file: "ultra-panoramic.glb" },
];

const LIGHT_MODELS = [
  { id: "none", label: "Without lighting", file: null },
  { id: "lights-top", label: "Lights Top", file: "lights-top.glb" },
  // если есть другие — добавляй:
  // { id: "variant-4", label: "4 Variant", file: "4-variant.glb" },
];

const SCENE_LIGHTING = [
  { id: "studio", label: "Studio" },
  { id: "warehouse", label: "Warehouse" },
  { id: "sunset", label: "Sunset" },
  { id: "dawn", label: "Dawn" },
  { id: "night", label: "Night" },
];

const STRUCTURE_COLORS = [
  { id: "blue", label: "Blue", hex: "#1e66ff" },
  { id: "black", label: "Black", hex: "#111111" },
  { id: "green", label: "Green", hex: "#20c15a" },
  { id: "red", label: "Red", hex: "#ff2d2d" },
  { id: "pink", label: "Pink", hex: "#ff4fd8" },
  { id: "yellow", label: "Yellow", hex: "#ffd400" },
  { id: "orange", label: "Orange", hex: "#ff8a00" },
  { id: "purple", label: "Purple", hex: "#7a3cff" },
];

// ===== 3D helpers =====

function computeBBox(object3d) {
  const box = new THREE.Box3();
  box.setFromObject(object3d);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function applyMaterialColorByName(root, targetMaterialName, hexColor) {
  const target = targetMaterialName?.trim();
  if (!target) return;

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const mat = obj.material;
    if (!mat) return;

    // multi-material
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        if (m?.name === target) {
          m.color = new THREE.Color(hexColor);
          m.needsUpdate = true;
        }
      });
      return;
    }

    if (mat.name === target) {
      mat.color = new THREE.Color(hexColor);
      mat.needsUpdate = true;
    }
  });
}

function cloneGltfScene(gltf) {
  // чтобы цветовые изменения не “протекали” между моделями и переключениями
  const cloned = gltf.scene.clone(true);
  const skinnedMeshes = {};
  gltf.scene.traverse((node) => {
    if (node.isSkinnedMesh) skinnedMeshes[node.name] = node;
  });
  const cloneBones = {};
  const cloneSkinnedMeshes = {};
  cloned.traverse((node) => {
    if (node.isBone) cloneBones[node.name] = node;
    if (node.isSkinnedMesh) cloneSkinnedMeshes[node.name] = node;
  });
  Object.keys(skinnedMeshes).forEach((name) => {
    const skinnedMesh = skinnedMeshes[name];
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];
    if (cloneSkinnedMesh) {
      cloneSkinnedMesh.skeleton = skinnedMesh.skeleton.clone();
      cloneSkinnedMesh.skeleton.bones = cloneSkinnedMesh.skeleton.bones.map(
        (b) => cloneBones[b.name] || b
      );
      cloneSkinnedMesh.bindMatrix.copy(skinnedMesh.bindMatrix);
      cloneSkinnedMesh.bindMatrixInverse.copy(skinnedMesh.bindMatrixInverse);
    }
  });
  return cloned;
}

// ===== 3D Scene =====

function CourtAndLights({
  courtFile,
  lightsFile,
  structureHex,
  sceneEnv,
  onStatus,
  requestRecenterKey,
}) {
  const courtUrl = useMemo(() => assetUrl(`models/courts/${courtFile}`), [courtFile]);
  const lightsUrl = useMemo(
    () => (lightsFile ? assetUrl(`models/lights/${lightsFile}`) : null),
    [lightsFile]
  );

  const courtGltf = useGLTF(courtUrl);
  const lightsGltf = useGLTF(lightsUrl || courtUrl); // заглушка, чтобы хук не падал

  const courtRef = useRef();
  const lightsRef = useRef();
  const controlsRef = useRef();

  const [courtScene, setCourtScene] = useState(null);
  const [lightsScene, setLightsScene] = useState(null);

  // клонируем сцену корта, чтобы перекраска была безопасной
  useEffect(() => {
    if (!courtGltf?.scene) return;
    const cloned = cloneGltfScene(courtGltf);
    setCourtScene(cloned);
  }, [courtGltf, courtUrl]);

  // lights
  useEffect(() => {
    if (!lightsFile) {
      setLightsScene(null);
      return;
    }
    if (!lightsGltf?.scene) return;
    const cloned = cloneGltfScene(lightsGltf);
    setLightsScene(cloned);
  }, [lightsGltf, lightsUrl, lightsFile]);

  // статус загрузки
  useEffect(() => {
    if (!onStatus) return;
    onStatus(`Ок: корт ${courtFile} (URL: ${courtUrl})`);
  }, [courtFile, courtUrl, onStatus]);

  useEffect(() => {
    if (!onStatus) return;
    if (!lightsFile) {
      onStatus(`Ок: освещение — без модели`);
      return;
    }
    onStatus(`Ок: освещение top (файл: /models/lights/${lightsFile})`);
  }, [lightsFile, onStatus]);

  // перекраска только материала "Black" (а Black.001 и т.п. не трогаем)
  useEffect(() => {
    if (!courtScene) return;
    applyMaterialColorByName(courtScene, "Black", structureHex);
  }, [courtScene, structureHex]);

  /**
   * ВАЖНО: выравниваем lights относительно корта:
   * - центр по XZ = центр bbox корта
   * - высота Y = верх bbox + запас
   *
   * Это убирает “кривое” положение, когда lights улетают/не совпадают с кортом.
   */
  useEffect(() => {
    if (!courtRef.current) return;

    const { size, center, box } = computeBBox(courtRef.current);

    // если есть lights — ставим их в центр корта по XZ
    if (lightsRef.current) {
      const yTop = box.max.y;

      // запас по высоте: зависит от масштаба модели корта
      // если нужно выше/ниже — меняй коэффициенты
      const extra = Math.max(4, size.y * 0.65);

      lightsRef.current.position.set(center.x, yTop + extra, center.z);

      // Если lights в модели уже “разложены” по сторонам — им нужен только якорь.
      // На всякий случай — сбрасываем вращение, чтобы не было перекоса:
      lightsRef.current.rotation.set(0, 0, 0);
    }

    // также можно “центрировать вид”
    if (controlsRef.current) {
      controlsRef.current.target.set(center.x, center.y, center.z);
      controlsRef.current.update();
    }
  }, [courtScene, lightsScene, requestRecenterKey]);

  return (
    <>
      <Environment preset={sceneEnv} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.1} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        panSpeed={0.7}
        zoomSpeed={0.9}
        maxDistance={220}
        minDistance={6}
      />

      {courtScene && <primitive ref={courtRef} object={courtScene} />}

      {lightsScene && <primitive ref={lightsRef} object={lightsScene} />}
    </>
  );
}

// ===== UI =====

function StepHeader({ n, title, active }) {
  return (
    <div className={`stepHeader ${active ? "active" : ""}`}>
      <div className="stepDot">{n}</div>
      <div className="stepTitle">{title}</div>
    </div>
  );
}

function ListOption({ checked, label, onClick }) {
  return (
    <button className={`listOption ${checked ? "checked" : ""}`} onClick={onClick} type="button">
      <span className="listLabel">{label}</span>
      <span className="listMark">{checked ? "✓" : ""}</span>
    </button>
  );
}

export default function App() {
  const [courtId, setCourtId] = useState("base");
  const [lightsId, setLightsId] = useState("lights-top");
  const [sceneLightingId, setSceneLightingId] = useState("studio");

  const [structureHex, setStructureHex] = useState(STRUCTURE_COLORS[0].hex);
  const [customHex, setCustomHex] = useState("#111111");

  const [statusText, setStatusText] = useState("Загрузка…");
  const [recenterKey, setRecenterKey] = useState(0);

  const court = useMemo(() => COURTS.find((c) => c.id === courtId) ?? COURTS[0], [courtId]);
  const lights = useMemo(
    () => LIGHT_MODELS.find((l) => l.id === lightsId) ?? LIGHT_MODELS[0],
    [lightsId]
  );
  const env = useMemo(
    () => (SCENE_LIGHTING.find((e) => e.id === sceneLightingId)?.id ?? "studio"),
    [sceneLightingId]
  );

  const sidebarRef = useRef(null);

  function goToStep(step) {
    const el = sidebarRef.current?.querySelector(`[data-step="${step}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page">
      <div className="viewport">
        <div className="hud">
          <div className="hudTitle">3D просмотр</div>
          <div className="hudHint">ЛКМ — вращение, ПКМ — сдвиг, колесо — зум</div>
          <div className="hudStatus">{statusText}</div>
        </div>

        <Canvas
          camera={{ position: [22, 16, 22], fov: 45, near: 0.1, far: 1200 }}
          dpr={[1, 2]}
        >
          <CourtAndLights
            courtFile={court.file}
            lightsFile={lights.file}
            structureHex={structureHex}
            sceneEnv={env}
            onStatus={setStatusText}
            requestRecenterKey={recenterKey}
          />
        </Canvas>
      </div>

      <aside className="sidebar" ref={sidebarRef}>
        {/* ВАЖНО: без цены в евро — убрали */}
        <div className="steps">
          {/* STEP 1 */}
          <section className="step" data-step="1">
            <StepHeader n="1" title="Courts" active />
            <div className="card">
              <div className="cardTitle">Court options</div>

              <div className="list">
                {COURTS.map((c) => (
                  <ListOption
                    key={c.id}
                    label={c.label}
                    checked={c.id === courtId}
                    onClick={() => setCourtId(c.id)}
                  />
                ))}
              </div>

              <button className="primaryBtn" onClick={() => setRecenterKey((x) => x + 1)} type="button">
                Центрировать вид
              </button>

              <div className="note">
                Модели: <b>public/models/courts</b> → <b>/models/courts/…</b>
              </div>
            </div>

            <div className="stepActions">
              <button className="linkBtn" onClick={() => goToStep(2)} type="button">
                Next step ▾
              </button>
            </div>
          </section>

          {/* STEP 2 */}
          <section className="step" data-step="2">
            <StepHeader n="2" title="Structure Color" />
            <div className="card">
              <div className="cardTitle">Colors</div>

              <div className="colorGrid">
                {STRUCTURE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    className={`pill ${structureHex.toLowerCase() === c.hex.toLowerCase() ? "active" : ""}`}
                    onClick={() => setStructureHex(c.hex)}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="customRow">
                <div className="customLabel">Custom</div>
                <input
                  className="colorInput"
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                />
                <button className="smallBtn" onClick={() => setStructureHex(customHex)} type="button">
                  Apply
                </button>
                <button className="smallBtn ghost" onClick={() => setStructureHex("#1e66ff")} type="button">
                  Reset
                </button>
              </div>

              <div className="note">
                Красится только материал <b>Black</b>. Материалы типа <b>Black.001</b> не трогаются.
              </div>

              <button className="secondaryBtn" onClick={() => setStructureHex("#1e66ff")} type="button">
                Вернуть исходные цвета
              </button>
            </div>

            <div className="stepActions">
              <button className="linkBtn" onClick={() => goToStep(3)} type="button">
                Next step ▾
              </button>
            </div>
          </section>

          {/* STEP 3 */}
          <section className="step" data-step="3">
            <StepHeader n="3" title="Lighting" />
            <div className="card">
              <div className="field">
                <div className="fieldLabel">Lighting as model</div>
                <select
                  className="select"
                  value={lightsId}
                  onChange={(e) => setLightsId(e.target.value)}
                >
                  {LIGHT_MODELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <div className="note">
                  Это отдельная GLB-модель, которая добавляется поверх корта (папка{" "}
                  <b>public/models/lights</b>).
                </div>
              </div>

              <div className="field">
                <div className="fieldLabel">Scene lighting</div>
                <select
                  className="select"
                  value={sceneLightingId}
                  onChange={(e) => setSceneLightingId(e.target.value)}
                >
                  {SCENE_LIGHTING.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="note">
                  Это пресеты света рендера (интенсивность/цвет/направление).
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

// prefetch
COURTS.forEach((c) => useGLTF.preload(assetUrl(`models/courts/${c.file}`)));
LIGHT_MODELS.filter((l) => l.file).forEach((l) =>
  useGLTF.preload(assetUrl(`models/lights/${l.file}`))
);
