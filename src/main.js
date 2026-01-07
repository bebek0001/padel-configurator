import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// -----------------------------
// BASE URL helper (GitHub Pages fix)
// -----------------------------
// На локалке BASE_URL = "/"
// На GitHub Pages BASE_URL = "/padel-configurator/"
const BASE_URL = import.meta.env.BASE_URL || '/'
const assetUrl = (p) => `${BASE_URL}${String(p).replace(/^\/+/, '')}`

// -----------------------------
// SETTINGS
// -----------------------------
const LIGHTS_Y_LIFT_DEFAULT = 0.0
const LIGHTS_Y_LIFT_BY_KEY = {
  top: 3.5,
  posts4: 1.0,
  variant4: 0.3
}

// ВАЖНО: имена файлов должны совпадать с public/models/courts
// У тебя сейчас: base.glb, base_panoramic.glb, ultra_panoramic.glb
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
  single: 'Single — корт'
}

const LIGHT_LABELS_DEFAULT = {
  none: 'Без освещения',
  top: 'Свет сверху',
  posts4: 'Освещение на 4 стойках',
  variant4: '4-й вариант'
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

// lights — оставляем как у тебя в папке, кроме "none": он теперь без GLB
const LIGHTS_MODEL_URLS_DEFAULT = {
  none: [],

  top: [
    assetUrl('models/lights/lights-top.glb'),
    assetUrl('models/lights/top.glb'),
    assetUrl('models/lights/lights_top.glb'),
    assetUrl('models/lights/LightsTop.glb')
  ],

  posts4: [
    assetUrl('models/lights/lights-4posts.glb'),
    assetUrl('models/lights/4posts.glb'),
    assetUrl('models/lights/lights_4posts.glb'),
    assetUrl('models/lights/Lights4Posts.glb')
  ],

  variant4: [
    assetUrl('models/lights/4-variant.glb'),
    assetUrl('models/lights/variant4.glb'),
    assetUrl('models/lights/4variant.glb'),
    assetUrl('models/lights/Variant4.glb')
  ]
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

// красим строго только этот материал
const PAINTABLE_STRUCTURE_MATERIAL_NAME = 'Black'

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

// UI steps
document.querySelectorAll('.stepHead').forEach((head) => {
  head.addEventListener('click', () => {
    const step = head.closest('.step')
    if (!step) return
    step.classList.toggle('is-open')
  })
})

document.querySelectorAll('[data-next]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = btn.getAttribute('data-next')
    const target = document.querySelector(`.step[data-step="${next}"]`)
    if (!target) return

    document.querySelectorAll('.step').forEach((s) => s.classList.remove('is-open'))
    target.classList.add('is-open')
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
})

// Радио корта
const courtRadios = document.querySelectorAll('input[name="court"]')

// -----------------------------
// THREE
// -----------------------------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.7

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
camera.position.set(6, 4, 10)

const controls = new OrbitControls(camera, renderer.domElement)
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
let currentLightsKey = 'none'
let currentCourtKey = 'base'

let mixerCourt = null
let mixerLights = null

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

function setSceneLightingPreset(preset) {
  // удаляем старый свет
  const toRemove = []
  scene.traverse((o) => {
    if (o.isLight && o.userData?.isPresetLight) toRemove.push(o)
  })
  toRemove.forEach((l) => {
    scene.remove(l)
    if (l.dispose) l.dispose()
  })

  const add = (light) => {
    light.userData.isPresetLight = true
    scene.add(light)
  }

  const createSpot = (position, intensity, angle = Math.PI / 5, color = 0xf6e3b4) => {
    const spot = new THREE.SpotLight(color, intensity, 60, angle, 0.45)
    spot.position.set(...position)
    spot.target = courtFocusTarget
    spot.castShadow = true
    spot.shadow.mapSize.set(2048, 2048)
    return spot
  }

  const ambientIntensity = preset === 'contrast' ? 0.38 : 0.55
  const keyIntensity = preset === 'soft' ? 0.95 : 1.2
  const fillIntensity = preset === 'contrast' ? 0.45 : 0.35

  add(new THREE.AmbientLight(0xf8fbff, ambientIntensity))

  const key = new THREE.DirectionalLight(0xffffff, keyIntensity)
  key.position.set(7, 10, 5)
  key.castShadow = true
  add(key)

  const fill = new THREE.DirectionalLight(0xc8d8ff, fillIntensity)
  fill.position.set(-6, 5, -6)
  add(fill)

  const back = new THREE.DirectionalLight(0x88aaff, 0.25)
  back.position.set(0, 7, -4)
  add(back)

  add(createSpot([0, 8, 1], preset === 'contrast' ? 2.1 : 1.8))
  add(createSpot([-6, 5.5, 5], 1.35, Math.PI / 6, 0xf9dd9e))

  const rim = new THREE.PointLight(0x78a9ff, 0.55, 20)
  rim.position.set(4, 3, -5)
  add(rim)
}

function fitCameraToObject(obj, offset = 1.35) {
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

  // lights должны стоять относительно корта, не относительно мира
  // Поэтому привязываем позицию к центру корта
  const courtBox = new THREE.Box3().setFromObject(courtRoot)
  const courtCenter = courtBox.getCenter(new THREE.Vector3())

  const lightsBox = new THREE.Box3().setFromObject(lightsRoot)
  const lightsCenter = lightsBox.getCenter(new THREE.Vector3())

  const lift = LIGHTS_Y_LIFT_BY_KEY[currentLightsKey] ?? LIGHTS_Y_LIFT_DEFAULT

  // смещаем так, чтобы центры совпали по XZ, и добавляем высоту по Y
  const dx = courtCenter.x - lightsCenter.x
  const dz = courtCenter.z - lightsCenter.z
  lightsRoot.position.x += dx
  lightsRoot.position.z += dz
  lightsRoot.position.y = lift
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

      mixerCourt = null
      if (gltf.animations && gltf.animations.length) {
        mixerCourt = new THREE.AnimationMixer(courtRoot)
        gltf.animations.forEach((clip) => mixerCourt.clipAction(clip).play())
      }

      // после загрузки корта подгоняем камеру и переставляем свет
      fitCameraToObject(courtRoot, 1.35)
      placeLightsOverCourt()

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

      // важно: после загрузки света ставим его НАД КОРТОМ
      placeLightsOverCourt()
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

function paintStructure(hex) {
  const applyTo = (root) => {
    if (!root) return
    root.traverse((obj) => {
      if (!obj.isMesh) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => {
        if (!m || !m.name || !m.color) return
        if (m.name === PAINTABLE_STRUCTURE_MATERIAL_NAME) {
          m.color.set(hex)
          m.needsUpdate = true
        }
      })
    })
  }
  applyTo(courtRoot)
  applyTo(lightsRoot)
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
  fitCameraToObject(courtRoot, 1.35)
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
    if (c) paintStructure(c)
  })
})

courtRadios.forEach((r) => {
  r.addEventListener('change', () => {
    if (!r.checked) return
    const nextCourt = r.value
    renderLightsModelOptions(nextCourt)
    loadCourt(nextCourt)
    loadLightsModel(lightsModelSelect?.value ?? 'none')
  })
})

// -----------------------------
// Init
// -----------------------------
setSceneLightingPreset('studio')

renderLightsModelOptions(currentCourtKey)

// старт: корт base + без света
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
