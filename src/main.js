import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// -----------------------------
// BASE URL helper (GitHub Pages fix)
// -----------------------------
const BASE_URL = import.meta.env.BASE_URL || '/'
const assetUrl = (p) => `${BASE_URL}${String(p).replace(/^\/+/, '')}`

// -----------------------------
// LEADS ENDPOINT (Cloudflare Worker)
// -----------------------------
const LEADS_ENDPOINT = import.meta.env.VITE_LEADS_ENDPOINT || ''

// -----------------------------
// SETTINGS
// -----------------------------
const LIGHTS_Y_LIFT_DEFAULT = 0.0
const LIGHTS_Y_LIFT_BY_KEY = {}

// ВАЖНО: пути под модели — как у тебя в public/models/...
const COURT_MODEL_CANDIDATES = {
  base: [assetUrl('models/courts/base.glb')],
  base_panoramic: [assetUrl('models/courts/base_panoramic.glb')],
  ultra_panoramic: [assetUrl('models/courts/ultra_panoramic.glb')],
  single: [
    assetUrl('models/courts/Single_cort.glb'),
    assetUrl('models/courts/single_cort.glb'),
    assetUrl('models/courts/Single_court.glb'),
    assetUrl('models/courts/single_court.glb')
  ]
}

const COURT_LABELS = {
  base: 'Классический корт',
  base_panoramic: 'Панорамный корт',
  ultra_panoramic: 'Ультра-панорамный корт',
  single: 'Si — корт'
}

const LIGHT_LABELS_DEFAULT = {
  none: 'Без освещения',
  padel_1: 'Вариант 1',
  padel_2: 'Вариант 2',
  padel_3: 'Вариант 3',
  padel_4: 'Вариант 4',
  padel_5: 'Вариант 5',
  padel_6: 'Вариант 6',
  padel_7: 'Вариант 7',
  padel_8: 'Вариант 8'
}

const LIGHT_LABELS_SOLO = {
  none: 'Без освещения',
  solo_1: 'Вариант 1',
  solo_2: 'Вариант 2',
  solo_3: 'Вариант 3',
  solo_4: 'Вариант 4',
  solo_5: 'Вариант 5',
  solo_6: 'Вариант 6',
  solo_7: 'Вариант 7',
  solo_8: 'Вариант 8'
}

const buildPadelLightCandidates = (variant) => ([
  assetUrl(`models/lights/padel_${variant}.glb`),
  assetUrl(`models/lights/padel-${variant}.glb`),
  assetUrl(`models/lights/padel${variant}.glb`),
  assetUrl(`models/lights/Padel_${variant}.glb`),
  assetUrl(`models/lights/Padel-${variant}.glb`),
  assetUrl(`models/lights/Padel${variant}.glb`)
])

const LIGHTS_MODEL_URLS_DEFAULT = {
  none: [],
  padel_1: buildPadelLightCandidates(1),
  padel_2: buildPadelLightCandidates(2),
  padel_3: buildPadelLightCandidates(3),
  padel_4: buildPadelLightCandidates(4),
  padel_5: buildPadelLightCandidates(5),
  padel_6: buildPadelLightCandidates(6),
  padel_7: buildPadelLightCandidates(7),
  padel_8: buildPadelLightCandidates(8)
}

const buildSoloLightCandidates = (variant) => ([
  assetUrl(`models/lights/solo_${variant}.glb`),
  assetUrl(`models/lights/solo-${variant}.glb`),
  assetUrl(`models/lights/solo${variant}.glb`),
  assetUrl(`models/lights/Solo_${variant}.glb`),
  assetUrl(`models/lights/Solo-${variant}.glb`),
  assetUrl(`models/lights/Solo${variant}.glb`)
])

const LIGHTS_MODEL_URLS_SOLO = {
  none: [],
  solo_1: buildSoloLightCandidates(1),
  solo_2: buildSoloLightCandidates(2),
  solo_3: buildSoloLightCandidates(3),
  solo_4: buildSoloLightCandidates(4),
  solo_5: buildSoloLightCandidates(5),
  solo_6: buildSoloLightCandidates(6),
  solo_7: buildSoloLightCandidates(7),
  solo_8: buildSoloLightCandidates(8)
}

// -----------------------------
// EXTRAS 3D MODELS (public/models/extras)
// - Ворота: vorota_duo / vorota_solo
// - Инвентарь: inventar (универсальный)
// - Протекторы: protector_duo / protector_solo
// -----------------------------
const EXTRAS_Y_LIFT_DEFAULT = 0.0

const GOALS_MODEL_CANDIDATES = {
  duo: [
    assetUrl('models/extras/vorota_duo.glb'),
    assetUrl('models/vorota_duo.glb')
  ],
  solo: [
    assetUrl('models/extras/vorota_solo.glb'),
    assetUrl('models/vorota_solo.glb')
  ]
}

const INVENTAR_MODEL_CANDIDATES = [
  assetUrl('models/extras/inventar.glb'),
  assetUrl('models/inventar.glb')
]

const PROTECTORS_MODEL_CANDIDATES = {
  duo: [
    assetUrl('models/extras/protector_duo.glb'),
    assetUrl('models/protector_duo.glb')
  ],
  solo: [
    assetUrl('models/extras/protector_solo.glb'),
    assetUrl('models/protector_solo.glb')
  ]
}

// Красим строго этот материал (как у базы корта)
const PAINTABLE_STRUCTURE_MATERIAL_NAME = 'Black'

// -----------------------------
// Цвета (название + hex) для UI кнопок
// -----------------------------
const COLOR_NAME_BY_HEX = {
  '#000000': 'Чёрный',
  '#111111': 'Чёрный',
  '#000': 'Чёрный',

  '#1e5bff': 'Синий',
  '#0000ff': 'Синий',

  '#00a651': 'Зелёный',
  '#00ff00': 'Зелёный',

  '#ff3b30': 'Красный',
  '#ff0000': 'Красный',

  '#ff2d55': 'Розовый',
  '#ff69b4': 'Розовый',

  '#ffcc00': 'Жёлтый',
  '#ffff00': 'Жёлтый',

  '#ff9500': 'Оранжевый',
  '#ffa500': 'Оранжевый',

  '#af52de': 'Фиолетовый',
  '#8a4dff': 'Фиолетовый',
  '#8000ff': 'Фиолетовый'
}

function normalizeHex(hex) {
  if (!hex) return null
  const h = String(hex).trim()
  if (!h) return null
  if (h.startsWith('#') && (h.length === 7 || h.length === 4)) return h.toLowerCase()
  if (!h.startsWith('#') && (h.length === 6 || h.length === 3)) return `#${h.toLowerCase()}`
  return h.toLowerCase()
}

function colorNameFromHex(hex) {
  const n = normalizeHex(hex)
  if (!n) return null
  return COLOR_NAME_BY_HEX[n] || null
}

// -----------------------------
// DOM
// -----------------------------
const canvas = document.querySelector('#canvas')
const statusEl = document.querySelector('#status')
const lightingSelect = document.querySelector('#lighting')
const lightsModelSelect = document.querySelector('#lightsModel')
const reframeBtn = document.querySelector('#reframe')

const structureColorInput = document.querySelector('#structureColor')
const applyStructureColorBtn = document.querySelector('#applyStructureColor')
const resetStructureColorsBtn = document.querySelector('#resetStructureColors')
const restoreAllColorsBtn = document.querySelector('#restoreAllColors')

const modal = document.querySelector('[data-modal]')
const modalOpenBtn = document.querySelector('[data-modal-open]')
const modalCloseBtns = document.querySelectorAll('[data-modal-close]')
const modalSubmitBtn = document.querySelector('.modalSubmit')
const fullNameInput = document.querySelector('input[name="full_name"]')
const phoneInput = document.querySelector('input[name="phone"]')

const backToMainBtn = document.querySelector('#backToMain')

// extras checkboxes
const goalsCheckbox = document.querySelector('input[name="extra_options"][value="goals"]')
const accessoriesCheckbox = document.querySelector('input[name="extra_options"][value="accessories"]')
const protectorsCheckbox = document.querySelector('input[name="extra_options"][value="protectors"]')

// panel colors for protectors
const protectorsColorPanel = document.querySelector('#protectorsColorsPanel')

// turf (покрытие)
const PAINTABLE_TURF_MATERIAL_NAME = 'Carpet is blue'

const turfCheckbox = document.querySelector('input[name="extra_options"][value="turf"]')
const turfColorPanel = document.querySelector('#turfColorsPanel')

let currentTurfColor = null
let currentTurfColorName = null

// UI steps
document.querySelectorAll('.stepHead').forEach((head) => {
  head.addEventListener('click', () => {
    const step = head.closest('.step')
    if (!step) return

    const willOpen = !step.classList.contains('is-open')
    step.classList.toggle('is-open')

    // Фокусируемся только когда шаг ОТКРЫВАЮТ
    if (!willOpen) return

    const n = Number(step.getAttribute('data-step'))
    if (n === 1) focusOnCourtWide()
    if (n === 2) focusOnLights()
    if (n === 3) focusOnCourtWide()
    if (n === 4) focusOnCourtWide()
  })
})
function goToStep(stepNumber) {
  const target = document.querySelector(`.step[data-step="${stepNumber}"]`)
  if (!target) return
  document.querySelectorAll('.step').forEach((s) => s.classList.remove('is-open'))
  target.classList.add('is-open')
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // ✅ Фокус камеры при переходе по кнопке "Далее"
  const n = Number(stepNumber)
  if (n === 1) focusOnCourtWide()
  if (n === 2) focusOnLights()
  if (n === 3) focusOnCourtWide()
  if (n === 4) focusOnCourtWide()
}

backToMainBtn?.addEventListener('click', () => {
  goToStep(1)
})

document.querySelectorAll('[data-next]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('data-next')
    goToStep(next)
  })
})

// Радио корта
const courtRadios = document.querySelectorAll('input[name="court"]')

// -----------------------------
// THREE
// -----------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true, // <- критично для скриншота (иначе часто "чёрный скрин")
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.7

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
camera.position.set(6, 4, 10)

const controls = new OrbitControls(camera, renderer.domElement)
// -----------------------------
// CAMERA FLY (smooth) + user-interaction guard
// -----------------------------
let camFlyRaf = null
let camFlyLockUntil = 0

// если пользователь начал крутить — не перебиваем перелётом
let userInteracting = false
controls.addEventListener('start', () => {
  userInteracting = true
  camFlyLockUntil = Date.now() + 700 // 0.7s после старта не трогаем камеру
  if (camFlyRaf) cancelAnimationFrame(camFlyRaf)
  camFlyRaf = null
})
controls.addEventListener('end', () => {
  // даём немного времени после отпускания мыши
  camFlyLockUntil = Date.now() + 500
  userInteracting = false
})

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function animateCameraTo({ pos, target, duration = 650 }) {
  const now = Date.now()
  if (now < camFlyLockUntil) return // не вмешиваемся если юзер крутит/только что крутил

  if (!pos || !target) return

  if (camFlyRaf) cancelAnimationFrame(camFlyRaf)
  camFlyRaf = null

  const startTime = performance.now()

  const fromPos = camera.position.clone()
  const fromTarget = controls.target.clone()

  const toPos = pos.clone()
  const toTarget = target.clone()

  function tick(tNow) {
    const t = Math.min(1, (tNow - startTime) / duration)
    const k = easeInOutCubic(t)

    camera.position.lerpVectors(fromPos, toPos, k)
    controls.target.lerpVectors(fromTarget, toTarget, k)
    controls.update()

    if (t < 1) {
      camFlyRaf = requestAnimationFrame(tick)
    } else {
      camFlyRaf = null
    }
  }

  camFlyRaf = requestAnimationFrame(tick)
}
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.target.set(0, 1.2, 0)

const loader = new GLTFLoader()
const clock = new THREE.Clock()

const world = new THREE.Group()
scene.add(world)

const courtFocusTarget = new THREE.Object3D()
courtFocusTarget.position.set(0, 1, 0)
scene.add(courtFocusTarget)

let courtRoot = null
let lightsRoot = null
// -----------------------------
// CAMERA PRESETS (premium angles) Освещение ракурсы
// -----------------------------
function getCourtCenterTarget() {
  if (!courtRoot) return new THREE.Vector3(0, 1.2, 0)
  const box = new THREE.Box3().setFromObject(courtRoot)
  const c = box.getCenter(new THREE.Vector3())
  c.y = Math.max(1.0, c.y) // чуть выше центра
  return c
}

function focusOnCourtWide() {
  const target = getCourtCenterTarget()
  // красивый общий ракурс: диагональ + чуть сверху
  const pos = target.clone().add(new THREE.Vector3(9.5, 6.1, 20.5))
  animateCameraTo({ pos, target, duration: 750 })
}
/// Ракус на освещение
function focusOnLights() {
  const target = getCourtCenterTarget().add(new THREE.Vector3(0, 1.2, 0))
  const pos = target.clone().add(new THREE.Vector3(20.5, 2.2, 15.8)) // выше
  animateCameraTo({ pos, target, duration: 750 })
}

function focusOnTurf() {
  // чтобы читалось покрытие: чуть сверху, но не строго сверху
  const target = getCourtCenterTarget().add(new THREE.Vector3(0, 0.2, 0))
  const pos = target.clone().add(new THREE.Vector3(7.5, 8.5, 7.5))
  animateCameraTo({ pos, target, duration: 700 })
}

// Автофокус на конкретную модель (ворота/протекторы/инвентарь)
// Берём бокс объекта, ставим камеру так, чтобы "влезало"
function focusOnObject(root, offset = 1.25) {
  if (!root) return
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxSize = Math.max(size.x, size.y, size.z)
  const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance)

  const dir = new THREE.Vector3(1, 0.55, 1).normalize()
  const pos = center.clone().add(dir.multiplyScalar(distance))

  animateCameraTo({ pos, target: center, duration: 700 })
}

function focusOnProtectors() {
  // если протекторы уже загружены — автофокус на них
  if (protectorsRoot) {
    focusOnObject(protectorsRoot, 1.35)
  } else {
    focusOnCourtWide()
  }
}

function focusOnGoals() {
  if (goalsRoot) focusOnObject(goalsRoot, 1.35)
  else focusOnCourtWide()
}

function focusOnAccessories() {
  if (inventarRoot) focusOnObject(inventarRoot, 1.35)
  else focusOnCourtWide()
}
let goalsRoot = null
let inventarRoot = null
let protectorsRoot = null

let currentLightsKey = 'none'
let currentCourtKey = 'base'

// выбранные цвета
let currentLightsColor = null
let currentLightsColorName = null

let currentProtectorsColor = null
let currentProtectorsColorName = null

let mixerCourt = null
let mixerLights = null
let mixerGoals = null
let mixerInventar = null
let mixerProtectors = null

const originalMaterialColors = new Map()

function setStatus(text) {
  if (statusEl) statusEl.textContent = text || ''
}

// grid
const grid = new THREE.GridHelper(40, 40, 0x223044, 0x141c28)
grid.position.y = 0
grid.material.opacity = 0.35
grid.material.transparent = true
scene.add(grid)

function resize() {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

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

function clearGoalsModel() {
  if (!goalsRoot) return
  forgetMaterialColors(goalsRoot)
  world.remove(goalsRoot)
  disposeRoot(goalsRoot)
  goalsRoot = null
  mixerGoals = null
}

function clearInventarModel() {
  if (!inventarRoot) return
  forgetMaterialColors(inventarRoot)
  world.remove(inventarRoot)
  disposeRoot(inventarRoot)
  inventarRoot = null
  mixerInventar = null
}

function clearProtectorsModel() {
  if (!protectorsRoot) return
  forgetMaterialColors(protectorsRoot)
  world.remove(protectorsRoot)
  disposeRoot(protectorsRoot)
  protectorsRoot = null
  mixerProtectors = null
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
  restore(goalsRoot)
  restore(inventarRoot)
  restore(protectorsRoot)
}

function setSceneLightingPreset(preset) {
  const toRemove = []
  scene.traverse((o) => {
    if (o.isLight && o.userData?.isPresetLight) toRemove.push(o)
  })
  toRemove.forEach((l) => scene.remove(l))

  const add = (light) => {
    light.userData.isPresetLight = true
    scene.add(light)
  }

  add(new THREE.AmbientLight(0xf8fbff, preset === 'contrast' ? 0.38 : 0.55))

  const keyIntensity = preset === 'soft' ? 0.95 : 1.2
  const fillIntensity = preset === 'contrast' ? 0.45 : 0.35

  const key = new THREE.DirectionalLight(0xffffff, keyIntensity)
  key.position.set(7, 10, 5)
  add(key)

  const fill = new THREE.DirectionalLight(0xc8d8ff, fillIntensity)
  fill.position.set(-6, 5, -6)
  add(fill)

  const back = new THREE.DirectionalLight(0x88aaff, 0.25)
  back.position.set(0, 7, -4)
  add(back)

  const spot1 = new THREE.SpotLight(
    0xf6e3b4,
    preset === 'contrast' ? 2.1 : 1.8,
    60,
    Math.PI / 5,
    0.45
  )
  spot1.position.set(0, 8, 1)
  spot1.target = courtFocusTarget
  add(spot1)

  const spot2 = new THREE.SpotLight(0xf9dd9e, 1.35, 60, Math.PI / 6, 0.45)
  spot2.position.set(-6, 5.5, 5)
  spot2.target = courtFocusTarget
  add(spot2)

  const rim = new THREE.PointLight(0x78a9ff, 0.55, 20)
  rim.position.set(4, 3, -5)
  add(rim)
}

function fitCameraToObject(obj, offset = 1.2) {
  if (!obj) return
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  courtFocusTarget.position.copy(center)

  const maxSize = Math.max(size.x, size.y, size.z)
  const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance)

  const dir = new THREE.Vector3(1, 0.75, 1).normalize()
  camera.position.copy(center.clone().add(dir.multiplyScalar(distance)))
  controls.target.copy(center)
  controls.update()
}

function placeLightsOverCourt() {
  if (!courtRoot || !lightsRoot) return
  const courtBox = new THREE.Box3().setFromObject(courtRoot)
  const courtCenter = courtBox.getCenter(new THREE.Vector3())

  const lightsBox = new THREE.Box3().setFromObject(lightsRoot)
  const lightsCenter = lightsBox.getCenter(new THREE.Vector3())

  const lift = LIGHTS_Y_LIFT_BY_KEY[currentLightsKey] ?? LIGHTS_Y_LIFT_DEFAULT

  const dx = courtCenter.x - lightsCenter.x
  const dz = courtCenter.z - lightsCenter.z
  lightsRoot.position.x += dx
  lightsRoot.position.z += dz
  lightsRoot.position.y = lift
}

function placeExtraOnCourt(extraRoot) {
  if (!courtRoot || !extraRoot) return

  const courtBox = new THREE.Box3().setFromObject(courtRoot)
  const courtCenter = courtBox.getCenter(new THREE.Vector3())

  const extraBox = new THREE.Box3().setFromObject(extraRoot)
  const extraCenter = extraBox.getCenter(new THREE.Vector3())

  const dx = courtCenter.x - extraCenter.x
  const dz = courtCenter.z - extraCenter.z

  extraRoot.position.x += dx
  extraRoot.position.z += dz
  extraRoot.position.y = EXTRAS_Y_LIFT_DEFAULT
}

function loadGLB(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })
}

function isSoloCourt(key) {
  return key === 'single'
}

function getLightsModelMap(courtKey) {
  return isSoloCourt(courtKey) ? LIGHTS_MODEL_URLS_SOLO : LIGHTS_MODEL_URLS_DEFAULT
}

function getLightsLabelMap(courtKey) {
  return isSoloCourt(courtKey) ? LIGHT_LABELS_SOLO : LIGHT_LABELS_DEFAULT
}

function getGoalsCandidates(courtKey) {
  return isSoloCourt(courtKey) ? GOALS_MODEL_CANDIDATES.solo : GOALS_MODEL_CANDIDATES.duo
}

function getProtectorsCandidates(courtKey) {
  return isSoloCourt(courtKey) ? PROTECTORS_MODEL_CANDIDATES.solo : PROTECTORS_MODEL_CANDIDATES.duo
}

function buildLightOptions(labelMap) {
  return Object.entries(labelMap).map(([value, label]) => ({ value, label }))
}

function renderLightsModelOptions(courtKey) {
  if (!lightsModelSelect) return
  const labelMap = getLightsLabelMap(courtKey)
  const options = buildLightOptions(labelMap)
  lightsModelSelect.innerHTML = ''
  options.forEach(({ value, label }) => {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    lightsModelSelect.appendChild(opt)
  })

  if (!labelMap[lightsModelSelect.value]) {
    lightsModelSelect.value = 'none'
  }
}

async function loadCourt(key) {
  currentCourtKey = key
  const candidates = COURT_MODEL_CANDIDATES[key]
  if (!candidates || !candidates.length) return

  clearCourt()
  setStatus('Загрузка корта...')

  let lastErr = null
  for (const url of candidates) {
    try {
      const gltf = await loadGLB(url)
      courtRoot = gltf.scene
      improveMaterials(courtRoot)
      world.add(courtRoot)

      // ✅ если трава включена и цвет уже выбран — применим на новом корте
if (turfCheckbox?.checked && currentTurfColor) {
  paintTurf(currentTurfColor, currentTurfColorName)
}

      mixerCourt = null
      if (gltf.animations && gltf.animations.length) {
        mixerCourt = new THREE.AnimationMixer(courtRoot)
        gltf.animations.forEach((clip) => mixerCourt.clipAction(clip).play())
      }

      fitCameraToObject(courtRoot, 1.0)
      placeLightsOverCourt()
      placeExtraOnCourt(goalsRoot)
      placeExtraOnCourt(inventarRoot)
      placeExtraOnCourt(protectorsRoot)

      const label = COURT_LABELS[key] ?? key
      setStatus(`Корт загружен: ${label}`)
      return
    } catch (e) {
      lastErr = e
    }
  }

  console.error(lastErr)
  setStatus(`Ошибка загрузки корта: ${candidates[0]}`)
}

async function loadLightsModel(key) {
  currentLightsKey = key
  clearLightsModel()

  if (key === 'none') {
    setStatus('Освещение отключено')
    return
  }

  const candidates = getLightsModelMap(currentCourtKey)[key]
  if (!candidates || !candidates.length) {
    setStatus(`Нет путей для освещения "${key}"`)
    return
  }

  setStatus('Загрузка освещения...')

  let lastErr = null
  for (const url of candidates) {
    try {
      const gltf = await loadGLB(url)
      lightsRoot = gltf.scene
      improveMaterials(lightsRoot)
      world.add(lightsRoot)

      mixerLights = null
      if (gltf.animations && gltf.animations.length) {
        mixerLights = new THREE.AnimationMixer(lightsRoot)
        gltf.animations.forEach((clip) => mixerLights.clipAction(clip).play())
      }

      placeLightsOverCourt()

      if (currentLightsColor) paintLightsStructure(currentLightsColor, currentLightsColorName)

      const label = getLightsLabelMap(currentCourtKey)[key] ?? key
      setStatus(`Освещение загружено: ${label}`)
      return
    } catch (e) {
      lastErr = e
    }
  }

  console.error(lastErr)
  setStatus(`Ошибка: не удалось загрузить освещение "${key}". Проверь public/models/lights`)
}

async function loadGoalsModel(courtKey) {
  if (!goalsCheckbox?.checked) {
    clearGoalsModel()
    return
  }

  clearGoalsModel()
  const candidates = getGoalsCandidates(courtKey)

  setStatus('Загрузка ворот...')
  let lastErr = null
  for (const url of candidates) {
    try {
      const gltf = await loadGLB(url)
      goalsRoot = gltf.scene
      improveMaterials(goalsRoot)
      world.add(goalsRoot)

      mixerGoals = null
      if (gltf.animations && gltf.animations.length) {
        mixerGoals = new THREE.AnimationMixer(goalsRoot)
        gltf.animations.forEach((clip) => mixerGoals.clipAction(clip).play())
      }

      placeExtraOnCourt(goalsRoot)
      setStatus('Ворота загружены')
      return
    } catch (e) {
      lastErr = e
    }
  }

  console.error(lastErr)
  setStatus('Ошибка: не удалось загрузить ворота. Проверь public/models/extras')
}

async function loadInventarModel() {
  if (!accessoriesCheckbox?.checked) {
    clearInventarModel()
    return
  }

  clearInventarModel()
  setStatus('Загрузка инвентаря...')

  let lastErr = null
  for (const url of INVENTAR_MODEL_CANDIDATES) {
    try {
      const gltf = await loadGLB(url)
      inventarRoot = gltf.scene
      improveMaterials(inventarRoot)
      world.add(inventarRoot)

      mixerInventar = null
      if (gltf.animations && gltf.animations.length) {
        mixerInventar = new THREE.AnimationMixer(inventarRoot)
        gltf.animations.forEach((clip) => mixerInventar.clipAction(clip).play())
      }

      placeExtraOnCourt(inventarRoot)
      setStatus('Инвентарь загружен')
      return
    } catch (e) {
      lastErr = e
    }
  }

  console.error(lastErr)
  setStatus('Ошибка: не удалось загрузить инвентарь. Проверь public/models/extras')
}

async function loadProtectorsModel(courtKey) {
  if (!protectorsCheckbox?.checked) {
    clearProtectorsModel()
    return
  }

  clearProtectorsModel()
  const candidates = getProtectorsCandidates(courtKey)

  setStatus('Загрузка протекторов...')
  let lastErr = null
  for (const url of candidates) {
    try {
      const gltf = await loadGLB(url)
      protectorsRoot = gltf.scene
      improveMaterials(protectorsRoot)
      world.add(protectorsRoot)

      mixerProtectors = null
      if (gltf.animations && gltf.animations.length) {
        mixerProtectors = new THREE.AnimationMixer(protectorsRoot)
        gltf.animations.forEach((clip) => mixerProtectors.clipAction(clip).play())
      }

      placeExtraOnCourt(protectorsRoot)
      if (currentProtectorsColor) paintProtectors(currentProtectorsColor, currentProtectorsColorName)

      setStatus('Протекторы загружены')
      return
    } catch (e) {
      lastErr = e
    }
  }

  console.error(lastErr)
  setStatus('Ошибка: не удалось загрузить протекторы. Проверь public/models/extras')
}

function paintMaterialByName(root, materialName, hex) {
  if (!root) return false
  const target = String(materialName || '').toLowerCase()
  let painted = false

  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m || !m.color) return
      const n = String(m.name || '').toLowerCase()

      // ✅ совпадение exact ИЛИ с суффиксом .001/.002
      if (n === target || n.startsWith(target + '.')) {
        m.color.set(hex)
        m.needsUpdate = true
        painted = true
      }
    })
  })

  return painted
}

function paintStructure(hex) {
  paintMaterialByName(courtRoot, PAINTABLE_STRUCTURE_MATERIAL_NAME, hex)
}

function paintLightsStructure(hex, nameFromBtn = null) {
  const normalized = normalizeHex(hex)
  currentLightsColor = normalized || hex
  currentLightsColorName = nameFromBtn || colorNameFromHex(normalized) || null

  paintMaterialByName(lightsRoot, PAINTABLE_STRUCTURE_MATERIAL_NAME, currentLightsColor)
}

function paintProtectors(hex, nameFromBtn = null) {
  const normalized = normalizeHex(hex)
  currentProtectorsColor = normalized || hex
  currentProtectorsColorName = nameFromBtn || colorNameFromHex(normalized) || null

  paintMaterialByName(protectorsRoot, PAINTABLE_STRUCTURE_MATERIAL_NAME, currentProtectorsColor)
}

// ---- turf (покрытие) ----
function paintTurf(hex, nameFromBtn = null) {
  const normalized = normalizeHex(hex)
  currentTurfColor = normalized || hex
  currentTurfColorName = nameFromBtn || colorNameFromHex(normalized) || null

  // красим материал покрытия на корте
  paintMaterialByName(courtRoot, PAINTABLE_TURF_MATERIAL_NAME, currentTurfColor)
}

function toggleTurfPanel() {
  if (!turfColorPanel) return
  turfColorPanel.style.display = turfCheckbox?.checked ? 'block' : 'none'
}

// -----------------------------
// Скриншот 3D canvas -> dataURL jpeg
// -----------------------------
function takeScreenshotDataUrl(maxWidth = 1280, quality = 0.82) {
  // Чтобы картинка была актуальной — один раз отрендерим прямо сейчас
  renderer.render(scene, camera)

  const src = renderer.domElement
  const w = src.width
  const h = src.height

  const scale = Math.min(1, maxWidth / w)
  const outW = Math.round(w * scale)
  const outH = Math.round(h * scale)

  const c = document.createElement('canvas')
  c.width = outW
  c.height = outH
  const ctx = c.getContext('2d')

  ctx.drawImage(src, 0, 0, outW, outH)

  return c.toDataURL('image/jpeg', quality)
}

// -----------------------------
// UI wiring
// -----------------------------
lightingSelect?.addEventListener('change', (e) => {
  setSceneLightingPreset(e.target.value)
})

lightsModelSelect?.addEventListener('change', (e) => {
  loadLightsModel(e.target.value)
})

reframeBtn?.addEventListener('click', () => {
  fitCameraToObject(courtRoot, 1.2)
})

applyStructureColorBtn?.addEventListener('click', () => {
  paintStructure(structureColorInput.value)
})

resetStructureColorsBtn?.addEventListener('click', () => {
  paintStructure('#111111')
})

restoreAllColorsBtn?.addEventListener('click', () => {
  restoreOriginalColors()
})

document.querySelectorAll('.colorBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const c = btn.getAttribute('data-color')
    if (c) {
      structureColorInput.value = c
      paintStructure(c)
    }
  })
})

document.querySelectorAll('.lightsColorBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const c = btn.getAttribute('data-lcolor')
    const name = btn.textContent?.trim() || null
    if (c) paintLightsStructure(c, name)
  })
})

// protectors colors buttons
document.querySelectorAll('.protectorsColorBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const c = btn.getAttribute('data-pcolor')
    const name = btn.textContent?.trim() || null
    if (c) paintProtectors(c, name)
      focusOnProtectors()
  })
})

function toggleProtectorsPanel() {
  if (!protectorsColorPanel) return
  protectorsColorPanel.style.display = protectorsCheckbox?.checked ? 'block' : 'none'
}

// turf colors buttons
document.querySelectorAll('.turfColorBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const c = btn.getAttribute('data-tcolor')
    const name = btn.textContent?.trim() || null
    if (c) paintTurf(c, name)
  })
})

courtRadios.forEach((r) => {
  r.addEventListener('change', () => {
    if (!r.checked) return
    const nextCourt = r.value
    renderLightsModelOptions(nextCourt)
    loadCourt(nextCourt)
    loadLightsModel(lightsModelSelect?.value ?? 'none')

    // extras зависят от типа корта (solo/duo)
    loadGoalsModel(nextCourt)
    loadProtectorsModel(nextCourt)
  })
})

// extras toggles
goalsCheckbox?.addEventListener('change', () => {
  loadGoalsModel(currentCourtKey)
  if (goalsCheckbox.checked) focusOnGoals()
  else focusOnCourtWide()
})

accessoriesCheckbox?.addEventListener('change', () => {
  loadInventarModel()
  if (accessoriesCheckbox.checked) focusOnAccessories()
  else focusOnCourtWide()
})

protectorsCheckbox?.addEventListener('change', () => {
  toggleProtectorsPanel()
  loadProtectorsModel(currentCourtKey)
  focusOnProtectors()

  if (protectorsCheckbox.checked) focusOnProtectors()
  else focusOnCourtWide()
})

turfCheckbox?.addEventListener('change', () => {
  toggleTurfPanel()

  if (!turfCheckbox.checked) {
    focusOnCourtWide()
    return
  }

  focusOnTurf()
  if (currentTurfColor) paintTurf (currentTurfColor, currentTurfColorName)
    focusOnTurf()
})

toggleProtectorsPanel()
toggleTurfPanel()

// -----------------------------
// Modal
// -----------------------------
const openModal = () => modal?.classList.add('is-open')
const closeModal = () => modal?.classList.remove('is-open')

modalOpenBtn?.addEventListener('click', openModal)
modalCloseBtns.forEach((btn) => btn.addEventListener('click', closeModal))

modal?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal()
})

// -----------------------------
// Lead payload сбор
// -----------------------------
function getSelectedCourt() {
  const checked = document.querySelector('input[name="court"]:checked')
  const id = checked?.value || currentCourtKey || 'base'
  return { id, label: COURT_LABELS[id] || id }
}

function getSelectedLightsModel() {
  const id = lightsModelSelect?.value || currentLightsKey || 'none'
  const labelMap = getLightsLabelMap(currentCourtKey)
  return { id, label: labelMap[id] || id }
}

function getSceneLighting() {
  const id = lightingSelect?.value || 'studio'
  const label =
    id === 'studio' ? 'Студия' :
    id === 'soft' ? 'Мягкий' :
    id === 'contrast' ? 'Контрастный' : id
  return { id, label }
}

function getExtras() {
  const boxes = Array.from(document.querySelectorAll('input[name="extra_options"]:checked'))
  return boxes.map((b) => ({ id: b.value, label: b.closest('label')?.innerText?.trim() || b.value }))
}

function getStructureColorValue() {
  const v = structureColorInput?.value
  return v || null
}

function getStructureColorName() {
  const hex = normalizeHex(getStructureColorValue())
  return colorNameFromHex(hex) || (hex ? 'Свой цвет' : null)
}

async function sendLead() {
  if (!LEADS_ENDPOINT) throw new Error('VITE_LEADS_ENDPOINT не задан')

  const fullName = (fullNameInput?.value || '').trim()
  const phone = (phoneInput?.value || '').trim()
  if (!fullName || !phone) throw new Error('Заполни имя и телефон')

  const structureColorHex = normalizeHex(getStructureColorValue())
  const structureColorName = getStructureColorName()

  // ✅ Скриншот с 3D
  const screenshotDataUrl = takeScreenshotDataUrl(960, 0.75)

  const payload = {
    pageUrl: window.location.href,
    contact: { fullName, phone },
    config: {
      court: getSelectedCourt(),
      lightsModel: getSelectedLightsModel(),
      sceneLighting: getSceneLighting(),

      structureColor: structureColorHex,
      structureColorName,

      lightsColor: currentLightsColor,
      lightsColorName: currentLightsColorName,

      protectorsColor: currentProtectorsColor,
      protectorsColorName: currentProtectorsColorName,
      turfColor: currentTurfColor,
      turfColorName: currentTurfColorName,

      extras: getExtras()
    },
    screenshotDataUrl
  }

  const res = await fetch(LEADS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Ошибка сервера (${res.status}): ${t || 'нет текста'}`)
  }

  return res.json().catch(() => ({}))
}

modalSubmitBtn?.addEventListener('click', async () => {
  const btn = modalSubmitBtn
  if (!btn) return

  const prevText = btn.textContent
  try {
    btn.disabled = true
    btn.textContent = 'Отправка...'

    await sendLead()

    btn.textContent = 'Отправлено ✓'
    setTimeout(() => {
      closeModal()
      btn.textContent = prevText || 'Отправить заявку'
      btn.disabled = false
      if (fullNameInput) fullNameInput.value = ''
      if (phoneInput) phoneInput.value = ''
    }, 800)
  } catch (e) {
    console.error(e)
    alert('Ошибка отправки. Проверь VITE_LEADS_ENDPOINT и сервер.')
    btn.textContent = prevText || 'Отправить заявку'
    btn.disabled = false
  }
})

// -----------------------------
// Init
// -----------------------------
setSceneLightingPreset('studio')
renderLightsModelOptions(currentCourtKey)

loadCourt('base')
loadLightsModel('none')

// extras init based on checkboxes
loadGoalsModel('base')
loadInventarModel()
loadProtectorsModel('base')

// -----------------------------
// Render loop
// -----------------------------
function tick() {
  const dt = clock.getDelta()
  if (mixerCourt) mixerCourt.update(dt)
  if (mixerLights) mixerLights.update(dt)
  if (mixerGoals) mixerGoals.update(dt)
  if (mixerInventar) mixerInventar.update(dt)
  if (mixerProtectors) mixerProtectors.update(dt)

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}
tick()