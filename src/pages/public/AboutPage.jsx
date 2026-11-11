import { Link } from 'react-router-dom'
import { PublicPhoto } from '../../components/common/PublicPhoto'
import { GlyphIcon } from '../../components/dashboard/StatCard'
import { ServiceCards } from './ServiceCards'
import { PHOTOS, STEPS } from './publicData'

const AUDIENCES = [
  { icon: 'users', tone: 'green', title: 'For farmers', points: ['Register your rice fields with location, boundary and area.', 'Keep your crop stage up to date and send monitoring reports.', 'See where each field stands with the LGU.'] },
  { icon: 'approved', tone: 'blue', title: 'For LGU staff', points: ['Review and approve newly registered and updated fields.', 'Validate monitoring reports from farmers.', 'Get summaries of fields, crops and harvests.'] },
  { icon: 'map', tone: 'amber', title: 'For the community', points: ['Explore approved fields on a public map.', 'See statistics and crop status across the barangay.', 'No personal details are ever shown.'] },
]

export function AboutPage() {
  return (
    <div className="lp">
      <section className="lp-hero is-compact">
        <PublicPhoto src={PHOTOS.valley} alt="" className="lp-hero-img" />
        <div className="lp-hero-shade" />
        <div className="lp-hero-content">
          <span className="lp-chip is-light">ABOUT AGRIVISTA</span>
          <h1>A shared view of our rice fields.</h1>
          <p>AgriVista is a web app for Barangay Caganganan, Banaybanay, Davao Oriental. It connects rice farmers and the local government unit around one trusted record of the community's fields.</p>
        </div>
      </section>

      <section className="lp-section lp-intro">
        <div className="lp-collage" aria-hidden="true">
          <PublicPhoto src={PHOTOS.paddy} alt="" className="lp-collage-main" />
          <PublicPhoto src={PHOTOS.harvest} alt="" className="lp-collage-small" />
        </div>
        <div>
          <span className="lp-chip">OUR PURPOSE</span>
          <h2>Everyone working from the same picture.</h2>
          <p>Rice farming involves many people: the farmers who plant and harvest, and the local government that plans and supports them. AgriVista gives them one place to record fields, follow each crop from planting to harvest, and see how the barangay is doing as a whole.</p>
          <Link to="/register" className="btn-primary">Get started</Link>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-head">
          <span className="lp-chip">WHO IT'S FOR</span>
          <h2>Built for the people who grow and support our rice.</h2>
        </div>
        <div className="lp-audience">
          {AUDIENCES.map((a) => (
            <article key={a.title} className="lp-step">
              <span className={`stat-icon tone-${a.tone}`}><GlyphIcon name={a.icon} /></span>
              <h3>{a.title}</h3>
              <ul>
                {a.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-head">
          <span className="lp-chip">WHAT AGRIVISTA DOES</span>
          <h2>Tools for farmers and the LGU, in one place.</h2>
        </div>
        <ServiceCards />
      </section>

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

      <section className="lp-section lp-privacy">
        <span className="lp-privacy-icon"><GlyphIcon name="lock" size={24} /></span>
        <div>
          <h2>Your privacy comes first.</h2>
          <p>The public pages only show LGU-approved fields. They never show names, owners or field ids, and locations are rounded to about 100 meters, so no one can be identified from the map or the statistics.</p>
        </div>
        <Link to="/map" className="btn-lime">See the public map</Link>
      </section>

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
