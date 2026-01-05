import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Base-aware URL builder (works in dev and on GitHub Pages project paths)
const assetUrl = (p) => new URL(p, import.meta.env.BASE_URL).toString();

// ---------------------------
// DOM
// ---------------------------
const app = document.querySelector('#app')

app.innerHTML = `
  <div class="layout">
    <div class="viewer">
      <canvas id="c"></canvas>

      <div class="hint">
        <div class="hint__title">3D просмотр</div>
        <div class="hint__text">ЛКМ — вращение, ПКМ — сдвиг, колесо — зум</div>
        <div class="hint__status" id="status">Загрузка…</div>
      </div>
    </div>

    <aside class="sidebar">
      <div class="steps">
        <div class="step">
          <div class="step__head">
            <div class="step__num">1</div>
            <div class="step__title">Courts</div>
          </div>

          <div class="card">
            <div class="card__title">Court options</div>

            <label class="radio">
              <input type="radio" name="court" value="base" checked />
              <span>Base</span>
            </label>

            <label class="radio">
              <input type="radio" name="court" value="base_panoramic" />
              <span>Base Panoramic</span>
            </label>

            <label class="radio">
              <input type="radio" name="court" value="ultra_panoramic" />
              <span>Ultra Panoramic</span>
            </label>

            <button class="btn" id="btnCenter">Центрировать вид</button>

            <div class="muted">
              Модели: <b>public/models/courts</b> → <span class="mono">${import.meta.env.BASE_URL}models/courts/…</span>
            </div>
          </div>
        </div>

        <div class="step">
          <div class="step__head">
            <div class="step__num">2</div>
            <div class="step__title">Structure Color</div>
          </div>

          <div class="card">
            <div class="card__title">Colors</div>

            <div class="grid">
              <button class="pill" data-color="#1e63ff">Blue</button>
              <button class="pill" data-color="#111111">Black</button>
              <button class="pill" data-color="#20c45a">Green</button>
              <button class="pill" data-color="#ff2d2d">Red</button>
              <button class="pill" data-color="#ff4fd0">Pink</button>
              <button class="pill" data-color="#ffd400">Yellow</button>
              <button class="pill" data-color="#ff7a00">Orange</button>
              <button class="pill" data-color="#8b3dff">Purple</button>
            </div>

            <div class="row">
              <div class="row__label">Custom</div>
              <input type="color" id="customColor" value="#111111" />
              <button class="btn btn--small" id="btnApplyCustom">Apply</button>
              <button class="btn btn--small btn--ghost" id="btnReset">Reset</button>
            </div>

            <div class="muted">
              Красится только материал <b>Black</b>. Материалы типа <b>Black.001</b> не трогаются.
            </div>

            <button class="btn btn--wide btn--ghost" id="btnResetAll">Вернуть исходные цвета</button>
          </div>
        </div>

        <div class="step">
          <div class="step__head">
            <div class="step__num">3</div>
            <div class="step__title">Lighting</div>
          </div>

          <div class="card">
            <div class="card__title">Lighting as model</div>
            <select id="selLightModel" class="select">
              <option value="none">Без освещения</option>
              <option value="top" selected>Lights Top</option>
              <option value="4posts">Lights 4 Posts</option>
            </select>

            <div class="card__title card__title--mt">Scene lighting</div>
            <select id="selScenePreset" class="select">
              <option value="studio" selected>Studio</option>
              <option value="soft">Soft</option>
              <option value="hard">Hard</option>
            </select>

            <div class="muted">
              “Lighting as model” — GLB слой из <b>public/models/lights</b>.<br/>
              “Scene lighting” — свет рендера.
            </div>
          </div>
        </div>

      </div>
    </aside>
  </div>
`

const elStatus = document.querySelector('#status')

// ---------------------------
// THREE базовая сцена
// ---------------------------
const canvas = document.querySelector('#c')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.background = null

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000)
camera.position.set(8, 6, 10)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1.2, 0)
controls.update()

// “рендерный” свет (presets)
const hemi = new THREE.HemisphereLight(0xffffff, 0x111111, 0.6)
scene.add(hemi)

const dir = new THREE.DirectionalLight(0xffffff, 1.0)
dir.position.set(6, 10, 6)
dir.castShadow = false
scene.add(dir)

function applyScenePreset(preset) {
  if (preset === 'studio') {
    hemi.intensity = 0.65
    dir.intensity = 1.05
    dir.position.set(6, 10, 6)
  } else if (preset === 'soft') {
    hemi.intensity = 0.85
    dir.intensity = 0.7
    dir.position.set(4, 7, 3)
  } else if (preset === 'hard') {
    hemi.intensity = 0.4
    dir.intensity = 1.4
    dir.position.set(10, 14, 2)
  }
}

// ---------------------------
// Модели: корт + свет как модель
// ---------------------------
const loader = new GLTFLoader()

const courtRoot = new THREE.Group()
const lightsRoot = new THREE.Group()
scene.add(courtRoot)
scene.add(lightsRoot)

let currentCourt = null
let currentLights = null

const courtVariants = {
  base: assetUrl('models/courts/base.glb'),
  base_panoramic: assetUrl('models/courts/base_panoramic.glb'),
  ultra_panoramic: assetUrl('models/courts/ultra_panoramic.glb'),
}

const lightModels = {
  none: null,
  top: assetUrl('models/lights/lights-top.glb'),
  '4posts': assetUrl('models/lights/lights-4posts.glb'),
}

let originalBlackColor = null

function setStatus(t) {
  elStatus.textContent = t
}

function clearGroup(g) {
  while (g.children.length) {
    const obj = g.children.pop()
    obj.traverse?.((n) => {
      if (n.geometry) n.geometry.dispose?.()
      if (n.material) {
        if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose?.())
        else n.material.dispose?.()
      }
    })
  }
}

function findMaterialByExactName(root, nameExact) {
  let found = null
  root.traverse((n) => {
    if (found) return
    if (n.isMesh && n.material) {
      const mats = Array.isArray(n.material) ? n.material : [n.material]
      for (const m of mats) {
        if (m?.name === nameExact) {
          found = m
          break
        }
      }
    }
  })
  return found
}

function alignLightsToCourt() {
  if (!currentCourt || !currentLights) return

  const boxCourt = new THREE.Box3().setFromObject(currentCourt)
  const boxLights = new THREE.Box3().setFromObject(currentLights)

  const cCenter = new THREE.Vector3()
  const lCenter = new THREE.Vector3()
  boxCourt.getCenter(cCenter)
  boxLights.getCenter(lCenter)

  // XZ по центру корта, Y по нижней границе корта
  currentLights.position.x += (cCenter.x - lCenter.x)
  currentLights.position.z += (cCenter.z - lCenter.z)

  const cMinY = boxCourt.min.y
  const lMinY = boxLights.min.y
  currentLights.position.y += (cMinY - lMinY)
}

async function loadCourt(key) {
  const url = courtVariants[key]
  if (!url) return

  setStatus(`Загрузка корта: ${key}…`)
  clearGroup(courtRoot)
  currentCourt = null

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        currentCourt = gltf.scene
        courtRoot.add(currentCourt)

        // запоминаем исходный цвет Black один раз (с текущей загруженной моделью)
        const mBlack = findMaterialByExactName(currentCourt, 'Black')
        if (mBlack && !originalBlackColor) {
          originalBlackColor = mBlack.color.clone()
        }

        // если уже есть свет — привязываем к новому корту
        alignLightsToCourt()

        setStatus(`Ок: корт ${key}`)
        fitViewToCourt()
        resolve()
      },
      undefined,
      () => {
        setStatus(`Ошибка загрузки корта: ${url}`)
        resolve()
      }
    )
  })
}

async function loadLights(key) {
  clearGroup(lightsRoot)
  currentLights = null

  const url = lightModels[key]
  if (!url) {
    setStatus(`Ок: освещение выключено`)
    return
  }

  setStatus(`Загрузка освещения: ${key}…`)

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        currentLights = gltf.scene
        lightsRoot.add(currentLights)

        // критично: после загрузки света привязать к корту
        alignLightsToCourt()

        setStatus(`Ок: освещение ${key} (файл: ${url})`)
        resolve()
      },
      undefined,
      () => {
        setStatus(`Ошибка: не удалось загрузить освещение "${key}". Проверь public/models/lights`)
        resolve()
      }
    )
  })
}

function fitViewToCourt() {
  if (!currentCourt) return

  const box = new THREE.Box3().setFromObject(currentCourt)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = (camera.fov * Math.PI) / 180
  let dist = (maxDim / 2) / Math.tan(fov / 2)
  dist *= 1.3

  camera.position.set(center.x + dist, center.y + dist * 0.55, center.z + dist)
  controls.target.copy(center)
  controls.update()

  // если свет есть — после смены камеры и возможных плавающих трансформов еще раз выровнять
  alignLightsToCourt()
}

// ---------------------------
// UI events
// ---------------------------
document.querySelectorAll('input[name="court"]').forEach((el) => {
  el.addEventListener('change', async (e) => {
    const key = e.target.value
    await loadCourt(key)
  })
})

document.querySelector('#btnCenter').addEventListener('click', () => {
  fitViewToCourt()
})

document.querySelectorAll('.pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const hex = btn.getAttribute('data-color')
    applyStructureColor(hex)
  })
})

document.querySelector('#btnApplyCustom').addEventListener('click', () => {
  const hex = document.querySelector('#customColor').value
  applyStructureColor(hex)
})

document.querySelector('#btnReset').addEventListener('click', () => {
  if (!currentCourt || !originalBlackColor) return
  const mBlack = findMaterialByExactName(currentCourt, 'Black')
  if (mBlack) mBlack.color.copy(originalBlackColor)
})

document.querySelector('#btnResetAll').addEventListener('click', () => {
  if (!currentCourt || !originalBlackColor) return
  const mBlack = findMaterialByExactName(currentCourt, 'Black')
  if (mBlack) mBlack.color.copy(originalBlackColor)
})

document.querySelector('#selLightModel').addEventListener('change', async (e) => {
  await loadLights(e.target.value)
})

document.querySelector('#selScenePreset').addEventListener('change', (e) => {
  applyScenePreset(e.target.value)
})

// ---------------------------
// Color apply (only material named "Black")
// ---------------------------
function applyStructureColor(hex) {
  if (!currentCourt) return
  const mBlack = findMaterialByExactName(currentCourt, 'Black')
  if (!mBlack) return
  mBlack.color.set(hex)
}

// ---------------------------
// Resize / render loop
// ---------------------------
function resize() {
  const viewer = document.querySelector('.viewer')
  const w = viewer.clientWidth
  const h = viewer.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}
window.addEventListener('resize', resize)

function tick() {
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}

// ---------------------------
// Boot
// ---------------------------
applyScenePreset('studio')
resize()
tick()

await loadCourt('base')
await loadLights('top')
