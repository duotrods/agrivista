import { Link } from 'react-router-dom'

// Solid (filled) 24x24 glyphs.
const ICON_PATHS = {
  fields: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  approved: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.500 14.500-4-4 1.400-1.400 2.600 2.600 5.600-5.600 1.400 1.400-7 7z',
  pending: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.200l3.600 2.100-.8 1.300L11 13V7h2z',
  users: 'M16 11c1.660 0 2.990-1.340 2.990-3S17.660 5 16 5c-1.660 0-3 1.340-3 3s1.340 3 3 3zm-8 0c1.660 0 2.990-1.340 2.990-3S9.660 5 8 5C6.340 5 5 6.340 5 8s1.340 3 3 3zm0 2c-2.330 0-7 1.170-7 3.500V19h14v-2.500c0-2.330-4.670-3.500-7-3.500zm8 0c-.29 0-.62.020-.97.050 1.160.840 1.970 1.970 1.970 3.450V19h6v-2.500c0-2.330-4.670-3.500-7-3.500z',
  area: 'M14 6l-3.750 5 2.850 3.800-1.600 1.200C9.810 13.750 7 10 7 10l-6 8h22L14 6z',
  sprout: 'M20 3c-9 0-14 4-14 10 0 1.300.3 2.400.8 3.400C4.700 18.200 4 20 4 21h2c0-1 .6-2.200 1.900-3.200C9 18.600 10 19 11.200 19 17 19 20 14 20 3z',
  harvest: 'M3 8h18v2H3zM5 11h14l-1.500 9h-11zM8.500 3.500 10 3l1.500 5h-1.600zM15.500 3.500 14 3l-1.500 5h1.600z',
  report: 'M19 3h-4.200A3 3 0 0 0 9.200 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-2 14-4-4 1.400-1.400L10 14.200l6.600-6.600L18 9l-8 8z',
  bell: 'M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.100-1.600-5.600-4.500-6.300V4a1.500 1.500 0 0 0-3 0v.7C7.600 5.400 6 7.900 6 11v5l-2 2v1h16v-1l-2-2z',
  calendar: 'M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2zM5 9v1h14V9z',
  map: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.500a2.500 2.500 0 1 1 0-5 2.500 2.500 0 0 1 0 5z',
  lock: 'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z',
  planted: 'M12 2C8 8 5 11.500 5 15a7 7 0 0 0 14 0c0-3.500-3-7-7-13z',
}

/** Solid glyph from the shared icon set. */
export function GlyphIcon({ name, size = 18 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d={ICON_PATHS[name] ?? ICON_PATHS.fields} /></svg>
}

const pad = (value) => (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 10 ? String(value).padStart(2, '0') : value)

/**
 * Dashboard summary card: header (icon chip + title), then the value and a short description.
 * `tone` colors the icon chip and pill ("green" | "amber" | "red" | "blue").
 */
export function StatCard({ label, value, description, loading, to, icon, tone = 'green', pill }) {
  const body = (
    <>
      <div className="stat-head">
        <span className={`stat-icon tone-${tone}`}>
          <GlyphIcon name={icon} />
        </span>
        <span className="stat-title">{label}</span>
        {pill && !loading && <span className={`stat-pill tone-${tone}`}>{pill}</span>}
      </div>
      <div className="stat-body">
        <p className="stat-value">{loading ? '—' : pad(value)}</p>
        {description && <p className="stat-desc">{description}</p>}
      </div>
    </>
  )
  return to
    ? <Link to={to} className="stat-card is-link">{body}</Link>
    : <div className="stat-card">{body}</div>
}
