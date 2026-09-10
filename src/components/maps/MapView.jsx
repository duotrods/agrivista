import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useEffect, useRef, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { FieldMarker } from './FieldMarker'

// Vite bundles Leaflet's default marker image paths incorrectly; point them at the bundled assets.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Barangay Caganganan, Banaybanay, Davao Oriental
const DEFAULT_CENTER = [6.944854, 126.017437]

const TILE_LAYERS = {
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
  street: {
    label: 'Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
}

// Recenters only when going from "no points" to "first point", so it doesn't
// fight the user's pan/zoom while they're clicking additional points.
function RecenterOnFirstPoint({ center, hasPoints }) {
  const map = useMap()
  const hadPoints = useRef(hasPoints)
  const [lat, lng] = center
  useEffect(() => {
    if (hasPoints && !hadPoints.current) {
      map.setView([lat, lng])
    }
    hadPoints.current = hasPoints
  }, [map, lat, lng, hasPoints])
  return null
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}

function polygonCenter(points) {
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length
  return [lat, lng]
}

export function MapView({ fields = [], boundaryPoints = [], onMapClick, fieldLinkBase = '/fields' }) {
  const [layer, setLayer] = useState('satellite')
  const center = boundaryPoints.length > 0 ? polygonCenter(boundaryPoints) : DEFAULT_CENTER
  const tile = TILE_LAYERS[layer]

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-1000 flex overflow-hidden rounded border bg-white text-xs shadow">
        {Object.entries(TILE_LAYERS).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setLayer(key)}
            className={`px-2 py-1 ${layer === key ? 'bg-green-700 text-white' : 'hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <MapContainer center={center} zoom={14} scrollWheelZoom className="h-96 w-full rounded">
        <RecenterOnFirstPoint center={center} hasPoints={boundaryPoints.length > 0} />
        {onMapClick && <ClickHandler onClick={onMapClick} />}
        <TileLayer key={layer} attribution={tile.attribution} url={tile.url} />
        {fields.map((field) => (
          <FieldMarker key={field.id} field={field} linkBase={fieldLinkBase} />
        ))}
        {boundaryPoints.map((point, i) => (
          <CircleMarker
            key={i}
            center={[point.lat, point.lng]}
            radius={6}
            pathOptions={{ color: '#1B5E20', fillColor: '#F9A825', fillOpacity: 1 }}
          />
        ))}
        {boundaryPoints.length >= 3 && (
          <Polygon
            positions={boundaryPoints.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#1B5E20', fillOpacity: 0.3 }}
          />
        )}
      </MapContainer>
    </div>
  )
}
