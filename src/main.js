import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// -----------------------------
// НАСТРОЙКИ
// -----------------------------

// Подъём модели света вверх (по типам)
const LIGHTS_Y_LIFT_DEFAULT = 2.2
const LIGHTS_Y_LIFT_BY_KEY = {
  top: 7.5,      // если надо выше/ниже — меняй только это
  posts4: 2.2,
  variant4: 2.2
}

// Базовые модели корта
const COURT_MODEL_URLS = {
  base: '/models/courts/base.glb',
  base_panoramic: '/models/courts/base_panoramic.glb',
  ultrapanoramic: '/models/courts/ultrapanoramic.glb'
}

// Модели освещения (с фоллбэками на разные названия)
const LIGHTS_MODEL_URLS = {
  none: ['/models/lights/none.glb'],

  top: [
    '/models/lights/lights-top.glb',
    '/models/lights/top.glb',
    '/models/lights/lights_top.glb',
    '/models/lights/LightsTop.glb'
  ],

  posts4: [
    '/models/lights/lights-4posts.glb',
    '/models/lights/4posts.glb',
    '/models/lights/lights_4posts.glb',
    '/models/lights/Lights4Posts.glb'
  ],

  variant4: [
    '/models/lights/4-variant.glb',
    '/models/lights/variant4.glb',
    '/models/lights/4variant.glb',
    '/models/lights/Variant4.glb'
  ]
}

// ВАЖНО: красим ТОЛЬКО этот материал
const PAINTABLE_STRUCTURE_MATERIAL_NAME = 'Black'

// -----------------------------
// DOM (только то, что реально есть в HTML)
// -----------------------------
const canvas = document.querySelector('#canvas')
const statusEl = document.querySelector('#status')
const lightingSelect = document.querySelector('#lighting')
const lightsModelSelect = document.querySelector('#lightsModel')
const reframeBtn = document.querySelector('#reframe')

const structureColorInput = document.querySelector('#structureColor')
const applyStructureColorBtn = document.querySelector('#applyStructureColor')
const resetStructureColorsBtn = document.querySelector('#resetStructureColors')

// -----------------------------
// THREE базовая сцена
// -----------------------------
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

// Свет сцены пресетами
const lightsGroup = new THREE.Group()
scene.add(lightsGroup)

// Группа под модели (корт + свет как отдельный слой)
const world = new THREE.Group()
scene.add(world)

let courtRoot = null
let lightsRoot = null
let currentLightsKey = 'none'

let mixerCourt = null
let mixerLights = null
let courtAnimations = []
let lightsAnimations = []

// Оригинальные цвета материалов (для сброса)
const originalMaterialColors = new Map()

function setStatus(text) {
  if (statusEl) statusEl.textContent = text || ''
}

// Пол (сетка) — можно убрать, если не нужен
const grid = new THREE.GridHelper(40, 40, 0x223044, 0x141c28)
grid.position.y = 0
grid.material.opacity = 0.35
grid.material.transparent = true
scene.add(grid)

// -----------------------------
// Resize
// -----------------------------
function resize() {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

// -----------------------------
// Dispose/clear
// -----------------------------
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

function disposeRoot(root) {
  if (!root) return
  root.traverse((obj) => {
    if (!obj.isMesh) return
    obj.geometry?.dispose?.()
    if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.())
    else obj.material?.dispose?.()
  })
}

function clearCourt() {
  if (!courtRoot) return
  forgetMaterialColors(courtRoot)
  world.remove(courtRoot)
  disposeRoot(courtRoot)
  courtRoot = null
  courtAnimations = []
  mixerCourt = null
}

function clearLightsModel() {
  if (!lightsRoot) return
  forgetMaterialColors(lightsRoot)
  world.remove(lightsRoot)
  disposeRoot(lightsRoot)
  lightsRoot = null
  lightsAnimations = []
  mixerLights = null
}

// -----------------------------
// Материалы / цвета
// -----------------------------
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

// 🔴 ВАЖНО: красим только материал с именем РОВНО "Black"
function setColorForStructure(root, colorHex) {
  if (!root) return
  const color = new THREE.Color(colorHex)

  root.traverse((obj) => {
    if (!obj.isMesh) return

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m || !m.name || !m.color) return
      if (m.name !== PAINTABLE_STRUCTURE_MATERIAL_NAME) return

      m.color.copy(color)
      m.needsUpdate = true
    })
  })
}

function setColorForStructureAll(colorHex) {
  if (courtRoot) setColorForStructure(courtRoot, colorHex)
  if (lightsRoot) setColorForStructure(lightsRoot, colorHex)
}

// -----------------------------
// Центровка корта (только корт)
// -----------------------------
function frameCourtToView(root) {
  if (!root) return

  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)

  // Центрируем корт по XZ и ставим на землю
  root.position.x += (0 - center.x)
  root.position.z += (0 - center.z)
  root.position.y += (0 - box.min.y)

  const maxDim = Math.max(size.x, size.y, size.z)
  const dist = maxDim * 1.5

  camera.position.set(dist, dist * 0.6, dist)
  controls.target.set(0, Math.min(maxDim * 0.4, 2.0), 0)
  controls.update()
}

// -----------------------------
// Выравнивание света по корту + подъём
// -----------------------------
function alignLightsToCourt() {
  if (!courtRoot || !lightsRoot) return

  const courtBox = new THREE.Box3().setFromObject(courtRoot)
  const lightsBox = new THREE.Box3().setFromObject(lightsRoot)

  const courtCenter = new THREE.Vector3()
  const lightsCenter = new THREE.Vector3()
  courtBox.getCenter(courtCenter)
  lightsBox.getCenter(lightsCenter)

  // по XZ ставим в центр корта
  const dx = courtCenter.x - lightsCenter.x
  const dz = courtCenter.z - lightsCenter.z

  // по Y: на землю + подъём
  let dy = courtBox.min.y - lightsBox.min.y
  const lift = (LIGHTS_Y_LIFT_BY_KEY[currentLightsKey] ?? LIGHTS_Y_LIFT_DEFAULT) || 0
  dy += lift

  lightsRoot.position.x += dx
  lightsRoot.position.y += dy
  lightsRoot.position.z += dz
}

// -----------------------------
// Пресеты света сцены
// -----------------------------
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

// -----------------------------
// Загрузка GLB с фоллбэками
// -----------------------------
async function loadGLTFWithFallback(urls) {
  let lastErr = null
  for (const url of urls) {
    try {
      const gltf = await loader.loadAsync(url)
      return { gltf, usedUrl: url }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

// -----------------------------
// Загрузка корта
// -----------------------------
async function loadCourt(key) {
  const url = COURT_MODEL_URLS[key]
  if (!url) {
    setStatus(`Нет URL для корта: ${key}`)
    return
  }

  setStatus(`Загрузка корта: ${url}`)
  clearCourt()

  try {
    const gltf = await loader.loadAsync(url)
    courtRoot = gltf.scene
    courtAnimations = gltf.animations || []
    world.add(courtRoot)

    if (courtAnimations.length) {
      mixerCourt = new THREE.AnimationMixer(courtRoot)
      courtAnimations.forEach((clip) => mixerCourt.clipAction(clip).play())
    }

    improveMaterials(courtRoot)

    frameCourtToView(courtRoot)
    alignLightsToCourt()

    setStatus(`Ок: корт ${key}`)
  } catch (e) {
    console.error(e)
    setStatus(`Ошибка загрузки корта: ${url}`)
  }
}

// -----------------------------
// Загрузка освещения (модель)
// -----------------------------
async function loadLightsModel(key) {
  const urls = LIGHTS_MODEL_URLS[key]
  if (!urls || !urls.length) {
    setStatus(`Нет URL для освещения: ${key}`)
    return
  }

  currentLightsKey = key

  if (key === 'none') {
    clearLightsModel()
    setStatus(`Ок: освещение выключено`)
    return
  }

  setStatus(`Загрузка освещения: ${key}`)
  clearLightsModel()

  try {
    const { gltf, usedUrl } = await loadGLTFWithFallback(urls)
    lightsRoot = gltf.scene
    lightsAnimations = gltf.animations || []
    world.add(lightsRoot)

    if (lightsAnimations.length) {
      mixerLights = new THREE.AnimationMixer(lightsRoot)
      lightsAnimations.forEach((clip) => mixerLights.clipAction(clip).play())
    }

    improveMaterials(lightsRoot)
    alignLightsToCourt()

    setStatus(`Ок: освещение ${key} (файл: ${usedUrl})`)
  } catch (e) {
    console.error(e)
    setStatus(`Ошибка: не удалось загрузить освещение "${key}". Проверь public/models/lights`)
  }
}

// -----------------------------
// Reframe
// -----------------------------
function reframeView() {
  if (courtRoot) frameCourtToView(courtRoot)
  alignLightsToCourt()
}

// -----------------------------
// UI bindings
// -----------------------------
document.querySelectorAll('input[name="court"]').forEach((el) => {
  el.addEventListener('change', (e) => {
    loadCourt(e.target.value)
  })
})

if (reframeBtn) {
  reframeBtn.addEventListener('click', () => {
    reframeView()
  })
}

if (lightingSelect) {
  lightingSelect.addEventListener('change', (e) => {
    applyLightingPreset(e.target.value)
  })
}

if (lightsModelSelect) {
  lightsModelSelect.addEventListener('change', (e) => {
    loadLightsModel(e.target.value)
  })
}

// Кнопки быстрых цветов структуры
document.querySelectorAll('[data-struct]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const hex = btn.getAttribute('data-struct')
    setColorForStructureAll(hex)
  })
})

if (applyStructureColorBtn) {
  applyStructureColorBtn.addEventListener('click', () => {
    const hex = structureColorInput?.value
    if (hex) setColorForStructureAll(hex)
  })
}

if (resetStructureColorsBtn) {
  resetStructureColorsBtn.addEventListener('click', () => {
    restoreOriginalColors()
  })
}

// -----------------------------
// Старт
// -----------------------------
applyLightingPreset('studio')
loadCourt('base')
loadLightsModel('none')

// -----------------------------
// Render loop
// -----------------------------
function tick() {
  const dt = clock.getDelta()
  if (mixerCourt) mixerCourt.update(dt)
  if (mixerLights) mixerLights.update(dt)

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}
tick()
