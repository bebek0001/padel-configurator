import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * ВАЖНО:
 * Модели лежат в public/models
 * Имена файлов тут должны совпадать 1-в-1 с тем, что у тебя на диске.
 * На скрине у тебя: ppa.glb.glb и ppa-ultra.glb.glb
 */
const MODEL_URLS = {
  'ppa': '/models/ppa.glb.glb',
  'ppa-ultra': '/models/ppa-ultra.glb.glb',
  'mundial': '/models/mundial.glb' // если пока нет — будет ошибка, поменяешь когда добавишь
}

// Список "структурных" материалов (по твоему скрину из Blender)
const STRUCTURE_MATERIAL_NAMES = new Set([
  'Black',
  'Black_grid',
  'Black_plastic',
  'Stainless_steel'
])

const canvas = document.querySelector('#canvas')
const statusEl = document.querySelector('#status')
const lightingSelect = document.querySelector('#lighting')
const materialTargetSelect = document.querySelector('#materialTarget')

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

let currentRoot = null
let currentAnimations = []
let mixer = null

const clock = new THREE.Clock()

// Группа света, чтобы просто чистить/переключать пресеты
const lightsGroup = new THREE.Group()
scene.add(lightsGroup)

// Пол (сетка) — чтобы было что-то если модель не загрузилась
const grid = new THREE.GridHelper(40, 40, 0x223044, 0x141c28)
grid.position.y = 0
grid.material.opacity = 0.35
grid.material.transparent = true
scene.add(grid)

function setStatus(text) {
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

function clearCurrentModel() {
  if (!currentRoot) return

  scene.remove(currentRoot)

  currentRoot.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry?.dispose?.()
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m?.dispose?.())
      } else {
        obj.material?.dispose?.()
      }
    }
  })

  currentRoot = null
  currentAnimations = []
  mixer = null
}

function populateMaterialList(root) {
  const names = new Set()

  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (m && m.name) names.add(m.name)
    })
  })

  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  materialTargetSelect.innerHTML = ''

  const emptyOpt = document.createElement('option')
  emptyOpt.value = ''
  emptyOpt.textContent = 'Выбери материал…'
  materialTargetSelect.appendChild(emptyOpt)

  sorted.forEach((n) => {
    const opt = document.createElement('option')
    opt.value = n
    opt.textContent = n
    materialTargetSelect.appendChild(opt)
  })

  // Для удобства: сразу покажем в консоли
  console.log('Материалы в модели:', sorted)
}

function frameModelToView(root) {
  const box = new THREE.Box3().setFromObject(root)
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)

  // Сдвигаем модель так, чтобы центр был около (0, something, 0)
  root.position.x += (0 - center.x)
  root.position.z += (0 - center.z)
  root.position.y += (0 - box.min.y)

  const maxDim = Math.max(size.x, size.y, size.z)
  const dist = maxDim * 1.5

  camera.position.set(dist, dist * 0.6, dist)
  controls.target.set(0, Math.min(maxDim * 0.4, 2.0), 0)
  controls.update()
}

function applyLightingPreset(preset) {
  // чистим старые источники
  while (lightsGroup.children.length) lightsGroup.remove(lightsGroup.children[0])

  // чуть “туман” для глубины
  scene.fog = new THREE.Fog(0x070a0f, 18, 80)

  if (preset === 'studio') {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.7)
    lightsGroup.add(hemi)

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
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    lightsGroup.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff1d6, 3.0)
    sun.position.set(10, 14, 6)
    lightsGroup.add(sun)

    const bounce = new THREE.HemisphereLight(0xddeeff, 0x223344, 0.35)
    lightsGroup.add(bounce)
  }

  if (preset === 'arena') {
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    lightsGroup.add(ambient)

    const spot1 = new THREE.SpotLight(0xffffff, 6.0, 80, Math.PI * 0.18, 0.35, 1.2)
    spot1.position.set(0, 16, 0)
    spot1.target.position.set(0, 0, 0)
    lightsGroup.add(spot1)
    lightsGroup.add(spot1.target)

    const side = new THREE.DirectionalLight(0xbad7ff, 1.2)
    side.position.set(-10, 8, -6)
    lightsGroup.add(side)
  }

  if (preset === 'night') {
    const ambient = new THREE.AmbientLight(0x88aaff, 0.15)
    lightsGroup.add(ambient)

    const moon = new THREE.DirectionalLight(0x9fb6ff, 1.2)
    moon.position.set(-8, 12, -6)
    lightsGroup.add(moon)

    const rim = new THREE.DirectionalLight(0xffffff, 0.35)
    rim.position.set(10, 6, 8)
    lightsGroup.add(rim)

    scene.fog = new THREE.Fog(0x04060a, 12, 70)
  }
}

async function loadModel(key) {
  const url = MODEL_URLS[key]
  if (!url) {
    setStatus(`Нет URL для модели: ${key}`)
    return
  }

  setStatus(`Загрузка: ${url}`)
  clearCurrentModel()

  try {
    const gltf = await loader.loadAsync(url)

    currentRoot = gltf.scene
    currentAnimations = gltf.animations || []
    scene.add(currentRoot)

    // если есть анимации — заведём миксер
    if (currentAnimations.length) {
      mixer = new THREE.AnimationMixer(currentRoot)
      currentAnimations.forEach((clip) => mixer.clipAction(clip).play())
    }

    // улучшения материалов (чтобы не было "серо и плоско")
    currentRoot.traverse((obj) => {
      if (!obj.isMesh) return
      obj.castShadow = false
      obj.receiveShadow = false

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => {
        if (!m) return
        // чуть больше читабельности
        if ('metalness' in m) m.metalness = Math.min(m.metalness ?? 0, 1)
        if ('roughness' in m) m.roughness = m.roughness ?? 0.8
        m.needsUpdate = true
      })
    })

    frameModelToView(currentRoot)
    populateMaterialList(currentRoot)

    setStatus(`Ок: ${key}`)
  } catch (e) {
    console.error(e)
    setStatus(`Ошибка загрузки: ${url}. Проверь путь и имя файла.`)
  }
}

function setColorForMaterialName(root, materialName, colorHex) {
  if (!root || !materialName) return
  const color = new THREE.Color(colorHex)

  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m) return
      if (m.name === materialName) {
        if (m.color) m.color.copy(color)
        m.needsUpdate = true
      }
    })
  })
}

function setColorForStructure(root, colorHex) {
  if (!root) return
  const color = new THREE.Color(colorHex)

  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    mats.forEach((m) => {
      if (!m || !m.name) return
      if (STRUCTURE_MATERIAL_NAMES.has(m.name)) {
        if (m.color) m.color.copy(color)
        m.needsUpdate = true
      }
    })
  })
}

// UI: переключение модели
document.querySelectorAll('input[name="court"]').forEach((el) => {
  el.addEventListener('change', (e) => {
    loadModel(e.target.value)
  })
})

// UI: освещение
lightingSelect.addEventListener('change', (e) => {
  applyLightingPreset(e.target.value)
})

// UI: быстрые цвета структуры
document.querySelectorAll('[data-struct]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const hex = btn.getAttribute('data-struct')
    setColorForStructure(currentRoot, hex)
  })
})

// UI: перекраска выбранного материала
document.querySelectorAll('[data-mat]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const hex = btn.getAttribute('data-mat')
    const matName = materialTargetSelect.value
    setColorForMaterialName(currentRoot, matName, hex)
  })
})

// Старт
applyLightingPreset('studio')
loadModel('ppa')

// Рендер-цикл
function tick() {
  const dt = clock.getDelta()
  if (mixer) mixer.update(dt)

  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(tick)
}
tick()
