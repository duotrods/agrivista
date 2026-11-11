import { Link } from 'react-router-dom'
import { GlyphIcon } from '../../components/dashboard/StatCard'
import { PageHeader } from '../../components/layout/PageHeader'
import { FEATURES, STEPS } from './publicData'

export function AboutPage() {
  return (
    <div className="page-container public-page">
      <PageHeader eyebrow="ABOUT AGRIVISTA" title="A shared view of our rice fields." description="AgriVista is a web app for Barangay Caganganan, Banaybanay, Davao Oriental. It connects rice farmers and the local government unit around one trusted record of the community's fields." />

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(([icon, title, text]) => (
          <section key={title} className="dash-card feature-card">
            <span className="stat-icon tone-green"><GlyphIcon name={icon} /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </section>
        ))}
      </div>

      <h2 className="section-title">How it works</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map(([title, text], i) => (
          <section key={title} className="dash-card feature-card">
            <span className="step-num">{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </section>
        ))}
      </div>

      <section className="dash-card feature-card privacy-card">
        <span className="stat-icon tone-blue"><GlyphIcon name="lock" /></span>
        <div>
          <h3>Privacy</h3>
          <p>Public pages only show LGU-approved fields, without names, owners or exact locations.</p>
        </div>
      </section>

      <div className="landing-actions about-actions">
        <Link to="/register" className="btn-primary">Get started</Link>
        <Link to="/map" className="btn-secondary">Explore the map</Link>
      </div>
    </div>
  )
}
