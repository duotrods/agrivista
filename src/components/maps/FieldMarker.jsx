import L from 'leaflet'
import { Marker, Polygon, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { FIELD_STATUS_COLORS, FIELD_STATUS_LABELS } from '../../lib/constants'

const iconCache = new Map()

// A pin tinted by crop status, so the map reads at a glance.
function pinIcon(color) {
  if (!iconCache.has(color)) {
    iconCache.set(color, L.divIcon({
      className: 'field-pin',
      html: `<svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true"><path d="M15 37C15 37 2 23.5 2 14.5a13 13 0 0 1 26 0C28 23.5 15 37 15 37Z" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="15" cy="14.5" r="5" fill="#fff"/></svg>`,
      iconSize: [30, 38],
      iconAnchor: [15, 37],
      popupAnchor: [0, -32],
    }))
  }
  return iconCache.get(color)
}

export function FieldMarker({ field, linkBase = '/fields' }) {
  const color = FIELD_STATUS_COLORS[field.field_status] ?? '#6B7280'
  const outline = Array.isArray(field.polygon_coords) && field.polygon_coords.length >= 3
    ? field.polygon_coords.map((p) => [p.lat, p.lng])
    : null
  const popup = (
    <Popup>
      <div className="text-sm">
        <p className="font-semibold">{field.field_name}</p>
        {field.field_status && (
          <p className="text-gray-600"><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: color }} />{FIELD_STATUS_LABELS[field.field_status] ?? field.field_status}</p>
        )}
        {field.area_hectares != null && !field.popup_lines && <p className="text-gray-600">{field.area_hectares} ha</p>}
        {field.popup_lines?.map((line) => <p key={line} className="text-gray-600">{line}</p>)}
        {linkBase && <Link to={`${linkBase}/${field.id}`} className="text-green-700 underline">View field</Link>}
      </div>
    </Popup>
  )
  return (
    <>
      {outline && <Polygon positions={outline} pathOptions={{ color, weight: 2, fillColor: color, fillOpacity: 0.28 }}>{popup}</Polygon>}
      <Marker position={[field.latitude, field.longitude]} icon={pinIcon(color)}>{popup}</Marker>
    </>
  )
}
