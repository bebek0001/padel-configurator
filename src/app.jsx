import React, { useMemo, useState } from 'react'
import SceneView from './components/SceneView.jsx'

const COURTS = [
  { id: 'base', label: 'Base', file: '/models/courts/base.glb' },
  { id: 'base-panoramic', label: 'Base Panoramic', file: '/models/courts/base-panoramic.glb' },
  { id: 'ultra-panoramic', label: 'Ultra Panoramic', file: '/models/courts/ultra-panoramic.glb' },
]

const LIGHTS = [
  { id: 'none', label: 'Без освещения', file: null },
  { id: 'top', label: 'Lights Top', file: '/models/lights/lights-top.glb' },
  { id: '4posts', label: 'Lights 4 Posts', file: '/models/lights/lights-4posts.glb' },
]

const STRUCTURE_COLORS = [
  { id: 'blue', label: 'Синий', hex: '#1f6fff' },
  { id: 'black', label: 'Чёрный', hex: '#111111' },
  { id: 'green', label: 'Зелёный', hex: '#19c37d' },
  { id: 'red', label: 'Красный', hex: '#ff3b30' },
  { id: 'pink', label: 'Розовый', hex: '#ff4da6' },
  { id: 'yellow', label: 'Жёлтый', hex: '#ffd60a' },
  { id: 'orange', label: 'Оранжевый', hex: '#ff9500' },
  { id: 'purple', label: 'Фиолетовый', hex: '#8e44ff' },
]

export default function App() {
  const [courtId, setCourtId] = useState('base')
  const [lightsId, setLightsId] = useState('top')
  const [structureColor, setStructureColor] = useState('#111111')
  const [customColor, setCustomColor] = useState('#111111')

  const court = useMemo(() => COURTS.find(c => c.id === courtId) ?? COURTS[0], [courtId])
  const lights = useMemo(() => LIGHTS.find(l => l.id === lightsId) ?? LIGHTS[0], [lightsId])

  return (
    <div className="pg-root">
      <div className="pg-left">
        <SceneView
          courtUrl={court.file}
          lightsUrl={lights.file}
          structureColor={structureColor}
        />

        <div className="pg-hint">
          <div className="pg-hint-title">3D просмотр</div>
          <div className="pg-hint-text">ЛКМ — вращение, ПКМ — сдвиг, колесо — зум</div>
        </div>
      </div>

      <aside className="pg-right">
        {/* убрали цену */}
        <div className="pg-stepper">
          <StepBlock step={1} title="Courts">
            <div className="pg-subtitle">Court options</div>
            <div className="pg-radio-list">
              {COURTS.map(item => (
                <label key={item.id} className="pg-radio">
                  <input
                    type="radio"
                    name="court"
                    value={item.id}
                    checked={courtId === item.id}
                    onChange={() => setCourtId(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <button className="pg-btn" type="button" onClick={() => window.dispatchEvent(new CustomEvent('fit-view'))}>
              Центрировать вид
            </button>

            <div className="pg-muted">
              Модели: <b>public/models/courts</b> → <span>/models/courts/…</span>
            </div>

            <div className="pg-next">Next step <span className="pg-next-arrow">▾</span></div>
          </StepBlock>

          <StepBlock step={2} title="Structure Color">
            <div className="pg-subtitle">Colors</div>

            <div className="pg-color-grid">
              {STRUCTURE_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={'pg-chip ' + (structureColor.toLowerCase() === c.hex.toLowerCase() ? 'is-active' : '')}
                  onClick={() => setStructureColor(c.hex)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="pg-custom-row">
              <div className="pg-custom-label">Custom</div>
              <input
                className="pg-color-input"
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
              />
              <button className="pg-btn-inline" type="button" onClick={() => setStructureColor(customColor)}>
                Apply
              </button>
              <button className="pg-btn-inline ghost" type="button" onClick={() => setStructureColor('#111111')}>
                Reset
              </button>
            </div>

            <div className="pg-muted">
              Красится только материал <b>Black</b>. Материалы типа <b>Black.001</b> не трогаются.
            </div>

            <button className="pg-btn" type="button" onClick={() => setStructureColor('#111111')}>
              Вернуть исходные цвета
            </button>

            <div className="pg-next">Next step <span className="pg-next-arrow">▾</span></div>
          </StepBlock>

          <StepBlock step={3} title="Lighting">
            <div className="pg-subtitle">Lighting as model</div>
            <select className="pg-select" value={lightsId} onChange={(e) => setLightsId(e.target.value)}>
              {LIGHTS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>

            <div className="pg-subtitle mt">Scene lighting</div>
            <select className="pg-select" defaultValue="studio" onChange={() => {}}>
              <option value="studio">Studio</option>
            </select>

            <div className="pg-muted">
              “Lighting as model” — GLB слой из <b>public/models/lights</b>. “Scene lighting” — свет рендера.
            </div>
          </StepBlock>
        </div>
      </aside>
    </div>
  )
}

function StepBlock({ step, title, children }) {
  return (
    <section className="pg-step">
      <div className="pg-step-head">
        <div className="pg-step-dot">{step}</div>
        <div className="pg-step-title">{title}</div>
      </div>
      <div className="pg-step-body">
        {children}
      </div>
    </section>
  )
}
