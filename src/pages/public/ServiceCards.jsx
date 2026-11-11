import { Link } from 'react-router-dom'
import { PublicPhoto } from '../../components/common/PublicPhoto'
import { GlyphIcon } from '../../components/dashboard/StatCard'
import { SERVICES } from './publicData'

export function ServiceCards() {
  return (
    <div className="lp-cards">
      {SERVICES.map((s) => (
        <article key={s.title} className="lp-card">
          <div className="lp-card-photo"><PublicPhoto src={s.photo} alt="" /></div>
          <div className="lp-card-body">
            <span className="stat-icon tone-green"><GlyphIcon name={s.icon} /></span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <Link to={s.to} className="lp-link">{s.cta} →</Link>
          </div>
        </article>
      ))}
    </div>
  )
}
