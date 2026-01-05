import React, { useMemo, useState } from 'react'
import SceneView from './components/SceneView.jsx'

const assetUrl = (rel) => `${import.meta.env.BASE_URL}${rel}` // rel без лидирующего /

const COURTS = [
  { id: 'base', label: 'Base', file: assetUrl('models/courts/base.glb') },
  { id: 'base_panoramic', label: 'Base Panoramic', file: assetUrl('models/courts/base_panoramic.glb') },
  { id: 'ultra_panoramic', label: 'Ultra Panoramic', file: assetUrl('models/courts/ultra_panoramic.glb') },
]

const LIGHTS = [
  { id: 'none', label: 'Without lighting', file: assetUrl('models/lights/none.glb') },
  { id: 'top', label: 'Lights Top', file: assetUrl('models/lights/lights-top.glb') },
  { id: '4posts', label: 'Lights 4 Posts', file: assetUrl('models/lights/lights-4posts.glb') },
  { id: '4variant', label: '4 Variant', file: assetUrl('models/lights/4-variant.glb') },
]

const COLORS = [
  { id: 'blue', label: 'Blue', value: '#1f5fff' },
  { id: 'black', label: 'Black', value: '#111111' },
  { id: 'green', label: 'Green', value: '#18a957' },
  { id: 'red', label: 'Red', value: '#e11d2e' },
  { id: 'pink', label: 'Pink', value: '#ff4da6' },
  { id: 'yellow', label: 'Yellow', value: '#ffd400' },
  { id: 'orange', label: 'Orange', value: '#ff7a00' },
  { id: 'purple', label: 'Purple', value: '#7c3aed' },
]

export default function App() {
  const [courtId, setCourtId] = useState('base')
  const [lightsId, setLightsId] = useState('top')
  const [scenePreset, setScenePreset] = useState('studio')
  const [structureColor, setStructureColor] = useState(COLORS[0].value)
  const [customColor, setCustomColor] = useState('#111111')

  const court = useMemo(() => COURTS.find(x => x.id === courtId) ?? COURTS[0], [courtId])
  const lights = useMemo(() => LIGHTS.find(x => x.id === lightsId) ?? LIGHTS[0], [lightsId])

  return (
    <div className="page">
      <div className="viewport">
        <div className="hint">
          <div className="hintTitle">3D просмотр</div>
          <div className="hintText">ЛКМ — вращение, ПКМ — сдвиг, колесо — зум</div>
          <div className="hintText mono">
            Base URL: {import.meta.env.BASE_URL}
          </div>
        </div>

        <SceneView
          courtUrl={court.file}
          lightsUrl={lights.file}
          scenePreset={scenePreset}
          structureColor={structureColor}
        />
      </div>

      <aside className="panel">
        <div className="panelInner">
          {/* Цена убрана намеренно */}

          <div className="step">
            <div className="stepHeader">
              <div className="stepNum">1</div>
              <div className="stepTitle">Courts</div>
            </div>

            <div className="card">
              <div className="cardTitle">Court options</div>

              <label className="radioRow">
                <input
                  type="radio"
                  name="court"
                  checked={courtId === 'base'}
                  onChange={() => setCourtId('base')}
                />
                <span>Base</span>
              </label>

              <label className="radioRow">
                <input
                  type="radio"
                  name="court"
                  checked={courtId === 'base_panoramic'}
                  onChange={() => setCourtId('base_panoramic')}
                />
                <span>Base Panoramic</span>
              </label>

              <label className="radioRow">
                <input
                  type="radio"
                  name="court"
                  checked={courtId === 'ultra_panoramic'}
                  onChange={() => setCourtId('ultra_panoramic')}
                />
                <span>Ultra Panoramic</span>
              </label>

              <div className="smallNote">
                Модели: <b>public/models/courts</b> → <span className="mono">{import.meta.env.BASE_URL}models/courts/…</span>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepHeader">
              <div className="stepNum">2</div>
              <div className="stepTitle">Structure Color</div>
            </div>

            <div className="card">
              <div className="cardTitle">Colors</div>

              <div className="grid2">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    className="btn"
                    onClick={() => setStructureColor(c.value)}
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
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                />
                <button className="btn" onClick={() => setStructureColor(customColor)}>Apply</button>
                <button className="btn ghost" onClick={() => setStructureColor('#111111')}>Reset</button>
              </div>

              <div className="smallNote">
                Красится только материал <b>Black</b>. Материалы типа <b>Black.001</b> не трогаются.
              </div>
            </div>
          </div>

          <div className="step">
            <div className="stepHeader">
              <div className="stepNum">3</div>
              <div className="stepTitle">Lighting</div>
            </div>

            <div className="card">
              <div className="field">
                <div className="fieldLabel">Lighting as model</div>
                <select className="select" value={lightsId} onChange={(e) => setLightsId(e.target.value)}>
                  {LIGHTS.map(l => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <div className="fieldLabel">Scene lighting</div>
                <select className="select" value={scenePreset} onChange={(e) => setScenePreset(e.target.value)}>
                  <option value="studio">Studio</option>
                  <option value="sunset">Sunset</option>
                  <option value="dawn">Dawn</option>
                  <option value="night">Night</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="forest">Forest</option>
                  <option value="apartment">Apartment</option>
                  <option value="city">City</option>
                  <option value="park">Park</option>
                  <option value="lobby">Lobby</option>
                </select>
              </div>

              <div className="smallNote">
                “Lighting as model” — GLB слой из <b>public/models/lights</b>. “Scene lighting” — свет рендера.
              </div>
            </div>
          </div>

        </div>
      </aside>
    </div>
  )
}
