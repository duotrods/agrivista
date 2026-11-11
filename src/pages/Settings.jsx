import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { DEFAULT_APPEARANCE, loadAppearance, saveAppearance } from '../lib/appearance'

const THEMES = [
  ['light', 'Light', 'M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  ['dark', 'Night', 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  ['system', 'System', 'M3 5h18v11H3zM8 21h8M12 16v5'],
]
const TEXT_SIZES = [['default', 'Default'], ['large', 'Large']]

function Row({ title, description, children }) {
  return (
    <div className="setting-row">
      <div>
        <p className="setting-title">{title}</p>
        <p className="setting-description">{description}</p>
      </div>
      <div className="setting-control">{children}</div>
    </div>
  )
}

export function Settings() {
  const [appearance, setAppearance] = useState(loadAppearance)

  function update(patch) {
    const next = { ...appearance, ...patch }
    setAppearance(next)
    saveAppearance(next)
  }

  return (
    <div className="page-container">
      <PageHeader title="Settings" description="Personalize how AgriVista looks on this device." />

      <section className="dash-card settings-card">
        <div className="dash-card-head"><h2>Appearance</h2><span>Saved on this device only</span></div>

        <Row title="Theme" description="Choose a light or night look, or follow your device.">
          <div className="seg" role="group" aria-label="Theme">
            {THEMES.map(([id, label, path]) => (
              <button key={id} type="button" aria-pressed={appearance.theme === id} onClick={() => update({ theme: id })}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path} /></svg>
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row title="Text size" description="Make text larger across the app.">
          <div className="seg" role="group" aria-label="Text size">
            {TEXT_SIZES.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={appearance.textSize === id} onClick={() => update({ textSize: id })}>{label}</button>
            ))}
          </div>
        </Row>

        <Row title="Bold text" description="Use heavier text for easier reading.">
          <button type="button" role="switch" aria-checked={appearance.bold} aria-label="Bold text" className="switch" onClick={() => update({ bold: !appearance.bold })}>
            <span />
          </button>
        </Row>

        <div className="setting-footer">
          <button type="button" onClick={() => update(DEFAULT_APPEARANCE)} className="dash-link">Reset to defaults</button>
        </div>
      </section>

      <section className="dash-card settings-card">
        <div className="dash-card-head"><h2>Account</h2></div>
        <Row title="Profile and password" description="Update your name, purok or password.">
          <Link to="/profile" className="seg-link">Open profile</Link>
        </Row>
      </section>

      <section className="dash-card settings-card">
        <div className="dash-card-head"><h2>About</h2></div>
        <p className="setting-description">AgriVista is a rice field identification and monitoring system for Banaybanay, Davao Oriental.</p>
      </section>
    </div>
  )
}
