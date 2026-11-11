import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicPhoto } from '../../components/common/PublicPhoto'
import { ServiceCards } from './ServiceCards'
import { PHOTOS, STEPS, usePublicFields, usePublicStats } from './publicData'

/** Counts up to `value` when it arrives. */
function CountUp({ value, decimals = 0, loading }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (loading) return
    const start = performance.now()
    let frame
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1200)
      setShown(value * (1 - (1 - t) ** 3))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, loading])
  return <>{loading ? '—' : shown.toFixed(decimals)}</>
}

function InlinePhoto({ src }) {
  return <span className="lp-inline-photo" aria-hidden="true"><PublicPhoto src={src} alt="" /></span>
}

export function PublicHome() {
  const { rows, loading } = usePublicStats()
  const { rows: fields } = usePublicFields()
  const total = rows.reduce((sum, r) => sum + Number(r.field_count), 0)
  const puroks = new Set(rows.map((r) => r.purok)).size
  const hectares = fields.reduce((sum, f) => sum + Number(f.area_hectares ?? 0), 0)

  return (
    <div className="lp">
      {/* Hero */}
      <section className="lp-hero">
        <PublicPhoto src={PHOTOS.hero} alt="" className="lp-hero-img" />
        <div className="lp-hero-shade" />
        <div className="lp-hero-content">
          <span className="lp-chip is-light">BARANGAY CAGANGANAN · BANAYBANAY</span>
          <h1>Growing together, one rice field at a time.</h1>
          <p>AgriVista helps farmers register their rice fields and helps the LGU follow crop progress across the barangay.</p>
          <div className="landing-actions">
            <Link to="/map" className="btn-lime">Explore the rice field map</Link>
            <Link to="/register" className="btn-outline-light">Register as a farmer</Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="lp-section lp-intro">
        <div>
          <span className="lp-chip">ABOUT AGRIVISTA</span>
          <h2>One trusted record of our community's rice fields.</h2>
          <p>AgriVista is a web app for Barangay Caganganan, Banaybanay, Davao Oriental. It connects rice farmers and the local government unit, so everyone works from the same picture of the fields, the crops and the harvest.</p>
          <Link to="/about" className="btn-primary">About us</Link>
        </div>
        <div className="lp-collage" aria-hidden="true">
          <PublicPhoto src={PHOTOS.valley} alt="" className="lp-collage-main" />
          <PublicPhoto src={PHOTOS.paddy} alt="" className="lp-collage-small" />
        </div>
      </section>

      {/* Services */}
      <section className="lp-section">
        <div className="lp-head">
          <span className="lp-chip">WHAT AGRIVISTA DOES</span>
          <h2>Tools for farmers and the LGU, in one place.</h2>
        </div>
        <ServiceCards />
      </section>

      {/* Counters */}
      <section className="lp-stats" aria-label="AgriVista in numbers">
        <div><strong><CountUp value={total} loading={loading} /></strong><span>Approved rice fields</span></div>
        <div><strong><CountUp value={puroks} loading={loading} /></strong><span>Puroks covered</span></div>
        <div><strong><CountUp value={hectares} decimals={1} loading={loading} /></strong><span>Hectares of rice land</span></div>
        <div><strong>5</strong><span>Crop stages tracked</span></div>
      </section>

      {/* How it works */}
      <section className="lp-section">
        <div className="lp-head">
          <span className="lp-chip">HOW IT WORKS</span>
          <h2>From the field to a shared record.</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map(([title, text], i) => (
            <div key={title} className="lp-step">
              <span className="lp-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="lp-section lp-mission">
        <p>
          Every field counted <InlinePhoto src={PHOTOS.paddy} /> every crop followed <InlinePhoto src={PHOTOS.harvest} /> every harvest supported <InlinePhoto src={PHOTOS.valley} /> across Caganganan.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn-primary">Get started</Link>
          <Link to="/statistics" className="btn-secondary">See the numbers</Link>
        </div>
      </section>

      {/* Call to action */}
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
