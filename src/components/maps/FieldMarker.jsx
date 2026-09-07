import { Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'

export function FieldMarker({ field, linkBase = '/fields' }) {
  return (
    <Marker position={[field.latitude, field.longitude]}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">{field.field_name}</p>
          <Link to={`${linkBase}/${field.id}`} className="text-green-700 underline">
            View field
          </Link>
        </div>
      </Popup>
    </Marker>
  )
}
