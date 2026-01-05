import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Базовые модели корта
const COURT_MODEL_URLS = {
  base: '/models/courts/base.glb',
  base_panoramic: '/models/courts/base_panoramic.glb',
  ultrapanoramic: '/models/courts/ultrapanoramic.glb'
}

// Модели освещения отдельным слоем
const LIGHTS_MODEL_URLS = {
  none: '/models/lights/none.glb',
  top: '/models/lights/lights-top.glb',
  posts4: '/models/lights/lights-4posts.glb',
  variant4: '/models/lights/4-variant.glb'
}

// Красим ТОЛЬКО материал Black (Black.001 не трогаем)
const PAINTABLE_STRUCTURE_NAMES = new Set(['Black'])

const canvas = document.querySelector('#canvas')
const statusEl = document.querySelector('#status')

// UI элементы (могут отсутствовать — не ломаем 3D)
const lightingSelect = document.querySelector('#lighting')
const lightsModelSelect = document.querySelector('#lightsModel')
const reframeBtn = document.querySelector('#reframe')

const structureColorInput = document.querySelector('#structureColor')
const applyStructureColorBtn = document.querySelector('#applyStructureColor')
const resetStructureColorsBtn = document.querySelector('#resetStructureColors')
const resetAllColorsBtn = document.querySelector('#resetAllColors')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x070a0f)

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
camera.position.set(6, 4, 10)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.target.set(0, 1.2, 0)

const loader = new GLTFLoader()
const clock = new THREE.Clock()

// Свет сцены
const lightsGroup = new THREE.Group()
scene.add(lightsGroup)

// Мир (корт + отдельная модель освещения)
const world = new THREE.Group()
scene.add(world)

let courtRoot = null
let lightsRoot = null

let mixerCourt = null
let mixerLights = null

// оригинальные цвета для reset
const originalMaterialColors = new Map()

function setStatus(text) {
  if (!statusEl) return
  statusEl.textContent = text || ''
}

function resize() {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

function disposeRoot(root) {
  if (!root) return
  root.traverse((obj) => {
    if (!obj.isMesh) return
    obj.geometry?.dispose?.()
    if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.())
    else obj.material?.dispose?.()
  })
}

function forgetMaterialColors(root) {
  if (!root) return
  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m) return
      originalMaterialColors.delete(m.uuid)
    })
  })
}

function clearCourt() {
  if (!courtRoot) return
  forgetMaterialColors(courtRoot)
  world.remove(courtRoot)
  disposeRoot(courtRoot)
  courtRoot = null
  mixerCourt = null
}

function clearLightsModel() {
  if (!lightsRoot) return
  forgetMaterialColors(lightsRoot)
  world.remove(lightsRoot)
  disposeRoot(lightsRoot)
  lightsRoot = null
  mixerLights = null
}

function improveMaterials(root) {
  if (!root) return
  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m) return
      if (!originalMaterialColors.has(m.uuid) && m.color) {
        originalMaterialColors.set(m.uuid, m.color.clone())
      }
      if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0, 1)
      if ('roughness' in m) m.roughness = m.roughness ?? 0.8
      m.needsUpdate = true
    })
  })
}

function restoreOriginalColors() {
  const restore = (root) => {
    if (!root) return
    root.traverse((obj) => {
      if (!obj.isMesh) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => {
        if (!m || !m.color) return
        const orig = originalMaterialColors.get(m.uuid)
        if (orig) {
          m.color.copy(orig)
          m.needsUpdate = true
        }
      })
    })
  }
  restore(courtRoot)
  restore(lightsRoot)
}

function frameCourtToView(root) {
  if (!root) return

  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)

  // центрируем по XZ, ставим на землю
  root.position.x += (0 - center.x)
  root.position.z += (0 - center.z)
  root.position.y += (0 - box.min.y)

  // вместе с кортом двигаем слой освещения
  if (lightsRoot) {
    lightsRoot.position.x += (0 - center.x)
    lightsRoot.position.z += (0 - center.z)
    lightsRoot.position.y += (0 - box.min.y)
  }

  const maxDim = Math.max(size.x, size.y, size.z)
  const dist = maxDim * 1.5

  camera.position.set(dist, dist * 0.6, dist)
  controls.target.set(0, Math.min(maxDim * 0.4, 2.0), 0)
  controls.update()
}

function applyLightingPreset(preset) {
  while (lightsGroup.children.length) lightsGroup.remove(lightsGroup.children[0])

  scene.fog = new THREE.Fog(0x070a0f, 18, 80)

  if (preset === 'studio') {
    lightsGroup.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.7))

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(6, 10, 6)
    lightsGroup.add(key)

    const fill = new THREE.DirectionalLight(0x99bbff, 1.2)
    fill.position.set(-8, 6, 2)
    lightsGroup.add(fill)

    const rim = new THREE.DirectionalLight(0xffffff, 0.9)
    rim.position.set(-2, 8, -10)
    lightsGroup.add(rim)
  }

  if (preset === 'sunny') {
    lightsGroup.add(new THREE.AmbientLight(0xffffff, 0.6))

    const sun = new THREE.DirectionalLight(0xfff1d6, 3.0)
    sun.position.set(10, 14, 6)
    lightsGroup.add(sun)

    lightsGroup.add(new THREE.HemisphereLight(0xddeeff, 0x223344, 0.35))
  }

  if (preset === 'arena') {
    lightsGroup.add(new THREE.AmbientLight(0xffffff, 0.35))

    const spot1 = new THREE.SpotLight(0xffffff, 6.0, 80, Math.PI * 0.18, 0.35, 1.2)
    spot1.position.set(0, 16, 0)
    spot1.target.position.set(0, 0, 0)
    lightsGroup.add(spot1, spot1.target)

    const side = new THREE.DirectionalLight(0xbad7ff, 1.2)
    side.position.set(-10, 8, -6)
    lightsGroup.add(side)
  }

  if (preset === 'night') {
    lightsGroup.add(new THREE.AmbientLight(0x88aaff, 0.15))

    const moon = new THREE.DirectionalLight(0x9fb6ff, 1.2)
    moon.position.set(-8, 12, -6)
    lightsGroup.add(moon)

    const rim = new THREE.DirectionalLight(0xffffff, 0.35)
    rim.position.set(10, 6, 8)
    lightsGroup.add(rim)

    scene.fog = new THREE.Fog(0x04060a, 12, 70)
  }
}

async function loadCourt(key) {
  const url = COURT_MODEL_URLS[key]
  if (!url) return setStatus(`Нет URL для корта: ${key}`)

  setStatus(`Загрузка корта: ${url}`)
  clearCourt()

  try {
    const gltf = await loader.loadAsync(url)
    courtRoot = gltf.scene
    world.add(courtRoot)

    if (gltf.animations?.length) {
      mixerCourt = new THREE.AnimationMixer(courtRoot)
      gltf.animations.forEach((clip) => mixerCourt.clipAction(clip).play())
    }

    improveMaterials(courtRoot)
    frameCourtToView(courtRoot)

    setStatus(`Ок: корт ${key}`)
  } catch (e) {
    console.error(e)
    setStatus(`Ошибка загрузки корта: ${url}`)
  }
}

async function loadLightsModel(key) {
  const url = LIGHTS_MODEL_URLS[key]
  if (!url) return setStatus(`Нет URL для освещения: ${key}`)

  if (key === 'none') {
    clearLightsModel()
    setStatus(`Ок: освещение выключено`)
    return
  }

  setStatus(`Загрузка освещения: ${url}`)
  clearLightsModel()

  try {
    const gltf = await loader.loadAsync(url)
    lightsRoot = gltf.scene
    world.add(lightsRoot)

    if (gltf.animations?.length) {
      mixerLights = new THREE.AnimationMixer(lightsRoot)
      gltf.animations.forEach((clip) => mixerLights.clipAction(clip).play())
    }

    improveMaterials(lightsRoot)

    // чтобы совпало с позицией корта
    if (courtRoot) frameCourtToView(courtRoot)

    setStatus(`Ок: освещение ${key} (файл: ${url})`)
  } catch (e) {
    console.error(e)
    setStatus(`Ошибка загрузки освещения: ${url}`)
  }
}

function setColorForStructure(root, colorHex) {
  if (!root) return
  const color = new THREE.Color(colorHex)

  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m || !m.name || !m.color) return
      // Красим ТОЛЬКО "Black"
      if (PAINTABLE_STRUCTURE_NAMES.has(m.name)) {
        m.color.copy(color)
        m.needsUpdate = true
      }
    })
  })
}

function setColorForStructureAll(colorHex) {
  if (courtRoot) setColorForStructure(courtRoot, colorHex)
  if (lightsRoot) setColorForStructure(lightsRoot, colorHex)
}

function reframeView() {
  frameCourtToView(courtRoot || lightsRoot)
}

// grid пол
const grid = new THREE.GridHelper(40, 40, 0x223044, 0x141c28)
grid.position.y = 0
grid.material.opacity = 0.35
grid.material.transparent = true
scene.add(grid)

// UI: переключение корта
document.querySelectorAll('input[name="court"]').forEach((el) => {
  el.addEventListener('change', (e) => loadCourt(e.target.value))
})

// UI: центрировать
if (reframeBtn) reframeBtn.addEventListener('click', () => reframeView())

// UI: пресет света сцены
if (lightingSelect) lightingSelect.addEventListener('change', (e) => applyLightingPreset(e.target.value))

// UI: модель освещения
if (lightsModelSelect) lightsModelSelect.addEventListener('change', (e) => loadLightsModel(e.target.value))

// UI: быстрые цвета структуры
document.querySelectorAll('[data-struct]').forEach((btn) => {
  btn.addEventListener('click', () => setColorForStructureAll(btn.getAttribute('data-struct')))
})

if (applyStructureColorBtn && structureColorInput) {
  applyStructureColorBtn.addEventListener('click', () => setColorForStructureAll(structureColorInput.value))
}

if (resetStructureColorsBtn) resetStructureColorsBtn.addEventListener('click', () => restoreOriginalColors())
if (resetAllColorsBtn) resetAllColorsBtn.addEventListener('click', () => restoreOriginalColors())

// Старт
applyLightingPreset('studio')
loadCourt('base')
loadLightsModel('none')

// Рендер
function tick() {
  const dt = clock.getDelta()
  if (mixerCourt) mixerCourt.update(dt)
  if (mixerLights) mixerLights.update(dt)

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}
tick()
