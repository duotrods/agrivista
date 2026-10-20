import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Polygon, ScaleControl, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { FIELD_STATUSES, FIELD_STATUS_COLORS, FIELD_STATUS_LABELS } from '../../lib/constants'
import { BASE_LAYERS, DEFAULT_LAYER_ID, MAP_MAX_ZOOM } from '../../lib/mapLayers'
import { FieldMarker } from './FieldMarker'

// Barangay Caganganan, Banaybanay, Davao Oriental
const DEFAULT_CENTER = [6.944854, 126.017437]
const STORAGE_KEY = 'agrivista.mapLayer'

function loadLayerId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (BASE_LAYERS.some((l) => l.id === saved)) return saved
  } catch { /* storage unavailable: use the default */ }
  return DEFAULT_LAYER_ID
}

// Recenters only when going from "no points" to "first point", so it doesn't
// fight the user's pan/zoom while they're clicking additional points.
function RecenterOnFirstPoint({ center, hasPoints }) {
  const map = useMap()
  const hadPoints = useRef(hasPoints)
  const [lat, lng] = center
  useEffect(() => {
    if (hasPoints && !hadPoints.current) map.setView([lat, lng])
    hadPoints.current = hasPoints
  }, [map, lat, lng, hasPoints])
  return null
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) })
  return null
}

// Frames every field whenever the set of fields changes (including filtering).
function FitToFields({ points, version }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17, animate: false })
    // `version` stands in for `points`, which is a new array every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, version])
  return null
}

// Leaflet must re-measure its container after the fullscreen toggle.
function ResizeOnChange({ trigger }) {
  const map = useMap()
  useEffect(() => { map.invalidateSize() }, [map, trigger])
  return null
}

function MapTools({ points, fullscreen, onFullscreen }) {
  const map = useMap()
  const [locating, setLocating] = useState(false)
  const [located, setLocated] = useState(null)
  const [message, setMessage] = useState(null)

  const fitAll = useCallback(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 17 })
    else map.setView(DEFAULT_CENTER, 14)
  }, [map, points])

  function locate() {
    if (!navigator.geolocation) { setMessage('Location is not supported by this browser.'); return }
    setLocating(true)
    setMessage(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = [pos.coords.latitude, pos.coords.longitude]
        setLocated({ here, accuracy: pos.coords.accuracy })
        map.flyTo(here, Math.max(map.getZoom(), 17))
        setLocating(false)
      },
      (err) => { setMessage(err.message); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const button = 'flex h-8 w-8 items-center justify-center text-sm hover:bg-gray-100'
  return (
    <>
      <div className="absolute left-2.5 top-24 z-1000 flex flex-col divide-y overflow-hidden rounded border bg-white shadow" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={fitAll} className={button} aria-label="Show all fields" title="Show all fields">⤢</button>
        <button type="button" onClick={locate} disabled={locating} className={button} aria-label="Show my location" title="My location">{locating ? '…' : '◎'}</button>
        <button type="button" onClick={onFullscreen} className={button} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} title={fullscreen ? 'Exit full screen' : 'Full screen'}>{fullscreen ? '✕' : '⛶'}</button>
      </div>
      {message && <p className="absolute left-14 top-24 z-1000 rounded bg-white px-2 py-1 text-xs text-red-600 shadow">{message}</p>}
      {located && (
        <>
          <CircleMarker center={located.here} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2563EB', fillOpacity: 1 }} />
          <Circle center={located.here} radius={located.accuracy} pathOptions={{ color: '#2563EB', weight: 1, fillOpacity: 0.1 }} />
        </>
      )}
    </>
  )
}

function Legend({ statuses }) {
  if (statuses.length === 0) return null
  return (
    <div className="absolute bottom-6 left-2.5 z-1000 rounded border bg-white/95 px-2.5 py-2 text-xs shadow" aria-label="Crop status legend">
      <ul className="flex flex-col gap-1">
        {statuses.map((s) => (
          <li key={s} className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: FIELD_STATUS_COLORS[s] }} />{FIELD_STATUS_LABELS[s]}</li>
        ))}
      </ul>
    </div>
  )
}

const vertexIcon = L.divIcon({ className: 'boundary-vertex', iconSize: [16, 16], iconAnchor: [8, 8] })

function polygonCenter(points) {
  return [points.reduce((sum, p) => sum + p.lat, 0) / points.length, points.reduce((sum, p) => sum + p.lng, 0) / points.length]
}

export function MapView({ fields = [], boundaryPoints = [], onMapClick, onPointMove, fieldLinkBase = '/fields', size = 'default' }) {
  const [layerId, setLayerId] = useState(loadLayerId)
  const [fullscreen, setFullscreen] = useState(false)
  const layer = BASE_LAYERS.find((l) => l.id === layerId) ?? BASE_LAYERS[0]
  const center = boundaryPoints.length > 0 ? polygonCenter(boundaryPoints) : DEFAULT_CENTER

  const framePoints = useMemo(() => {
    const pts = fields.map((f) => [f.latitude, f.longitude])
    for (const f of fields) if (Array.isArray(f.polygon_coords)) for (const p of f.polygon_coords) pts.push([p.lat, p.lng])
    return pts
  }, [fields])
  const version = framePoints.map((p) => p.join(',')).join(';')
  const legendStatuses = FIELD_STATUSES.filter((s) => fields.some((f) => f.field_status === s))

  function chooseLayer(id) {
    setLayerId(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e) => e.key === 'Escape' && setFullscreen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [fullscreen])

  return (
    <div className={fullscreen ? 'fixed inset-0 z-2000 bg-white' : size === 'large' ? 'relative h-[72vh] min-h-115 w-full' : 'relative h-112 w-full'}>
      <div className="absolute right-2 top-2 z-1000 flex max-w-[calc(100%-1rem)] flex-wrap justify-end overflow-hidden rounded border bg-white text-xs shadow" role="group" aria-label="Map layer">
        {BASE_LAYERS.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={layerId === id} onClick={() => chooseLayer(id)} className={`px-2 py-1 ${layerId === id ? 'bg-green-700 text-white' : 'hover:bg-gray-50'}`}>{label}</button>
        ))}
      </div>

      <MapContainer center={center} zoom={14} maxZoom={MAP_MAX_ZOOM} scrollWheelZoom className="h-full w-full rounded">
        <RecenterOnFirstPoint center={center} hasPoints={boundaryPoints.length > 0} />
        <ResizeOnChange trigger={fullscreen} />
        {onMapClick && <ClickHandler onClick={onMapClick} />}
        {!onMapClick && <FitToFields points={framePoints} version={version} />}
        {layer.tiles.map(({ url, ...options }, i) => (
          <TileLayer key={`${layer.id}-${i}`} url={url} maxZoom={MAP_MAX_ZOOM} {...options} />
        ))}
        <ScaleControl position="bottomright" imperial={false} />
        <MapTools points={framePoints} fullscreen={fullscreen} onFullscreen={() => setFullscreen((f) => !f)} />
        {fields.map((field) => <FieldMarker key={field.id} field={field} linkBase={fieldLinkBase} />)}
        {boundaryPoints.length >= 3 && <Polygon positions={boundaryPoints.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#1B5E20', fillOpacity: 0.3 }} />}
        {boundaryPoints.map((point, i) =>
          onPointMove ? (
            <Marker key={i} position={[point.lat, point.lng]} icon={vertexIcon} draggable eventHandlers={{ dragend: (e) => onPointMove(i, e.target.getLatLng()) }} />
          ) : (
            <CircleMarker key={i} center={[point.lat, point.lng]} radius={6} pathOptions={{ color: '#1B5E20', fillColor: '#F9A825', fillOpacity: 1 }} />
          ),
        )}
        <Legend statuses={legendStatuses} />
      </MapContainer>
    </div>
  )
}
