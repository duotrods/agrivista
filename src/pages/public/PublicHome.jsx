import { Link } from 'react-router-dom'
import { GlyphIcon, StatCard } from '../../components/dashboard/StatCard'
import { FEATURES, STEPS, usePublicFields, usePublicStats } from './publicData'

export function PublicHome() {
  const { rows, loading } = usePublicStats()
  const { rows: fields } = usePublicFields()
  const total = rows.reduce((sum, r) => sum + Number(r.field_count), 0)
  const puroks = new Set(rows.map((r) => r.purok)).size
  const hectares = fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0).toFixed(1)

  return (
    <div className="page-container public-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">BARANGAY CAGANGANAN · BANAYBANAY</span>
          <h1>Growing together, one rice field at a time.</h1>
          <p className="page-description">AgriVista helps farmers register their rice fields and helps the LGU follow crop progress across the barangay.</p>
          <div className="landing-actions">
            <Link to="/map" className="btn-primary">Explore the rice field map</Link>
            <Link to="/register" className="btn-secondary">Register as a farmer</Link>
          </div>
        </div>
        <div className="hero-panel" aria-hidden="true">
          <div className="field-art"><div /><div /><div /></div>
          <div className="hero-chip"><GlyphIcon name="map" size={16} /><span>Caganganan, Banaybanay<small>Davao Oriental</small></span></div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
        <StatCard icon="approved" label="Approved rice fields" description="Verified by the LGU." value={total} loading={loading} />
        <StatCard icon="map" tone="blue" label="Puroks covered" description="With at least one approved field." value={puroks} loading={loading} />
        <StatCard icon="area" label="Hectares of rice land" description="Across approved fields." value={hectares} loading={loading} />
      </div>

      <h2 className="section-title">What AgriVista does</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="cta-band">
        <div>
          <h2>Be part of our community's record.</h2>
          <p>Register your rice fields, or follow the barangay's crops on the public map and statistics.</p>
        </div>
        <div className="landing-actions">
          <Link to="/register" className="btn-light">Get started</Link>
          <Link to="/login" className="btn-outline-light">Log in</Link>
        </div>
      </section>
    </div>
  )
}
