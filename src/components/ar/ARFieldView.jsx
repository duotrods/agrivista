import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  angleDifference,
  calculateBearing,
  calculateDistanceMeters,
  getFieldARCategory,
} from '../../lib/helpers'
import { useDeviceHeading } from '../../hooks/useDeviceHeading'

const HALF_FOV_DEG = 35
const MAX_DISTANCE_M = 3000

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

export function ARFieldView({ fields, linkBase = '/fields', onClose }) {
  const videoRef = useRef(null)
  const navigate = useNavigate()
  const { heading, error: headingError, needsPermission, requestPermission } = useDeviceHeading()

  const [position, setPosition] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [geoError, setGeoError] = useState(null)

  useEffect(() => {
    let stream
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch((err) => setCameraError(err.message))

    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const visibleFields =
    position && heading !== null
      ? fields
          .map((field) => {
            const target = { lat: field.latitude, lng: field.longitude }
            const bearing = calculateBearing(position, target)
            const distance = calculateDistanceMeters(position, target)
            const diff = angleDifference(heading, bearing)
            return { field, distance, diff }
          })
          .filter((f) => Math.abs(f.diff) <= HALF_FOV_DEG && f.distance <= MAX_DISTANCE_M)
          .sort((a, b) => b.distance - a.distance)
      : []

  return (
    <div className="fixed inset-0 z-[2000] bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-black/60 px-4 py-2 text-white"
      >
        ✕ Close
      </button>

      {needsPermission && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <button
            type="button"
            onClick={requestPermission}
            className="rounded bg-green-700 px-4 py-3 text-white"
          >
            Enable Compass
          </button>
        </div>
      )}

      {(cameraError || geoError || headingError) && (
        <div className="absolute inset-x-4 top-16 rounded bg-red-600/90 p-3 text-sm text-white">
          {cameraError && <p>Camera: {cameraError}</p>}
          {geoError && <p>Location: {geoError}</p>}
          {headingError && <p>Compass: {headingError}</p>}
        </div>
      )}

      {!needsPermission && position && heading !== null && visibleFields.length === 0 && (
        <p className="absolute inset-x-0 top-1/2 text-center text-sm text-white/80">
          No fields nearby in this direction — turn around.
        </p>
      )}

      {visibleFields.map(({ field, distance, diff }) => {
        const category = getFieldARCategory(field)
        return (
          <button
            key={field.id}
            type="button"
            onClick={() => {
              onClose()
              navigate(`${linkBase}/${field.id}`)
            }}
            className="absolute top-[35%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-lg bg-black/70 px-3 py-2 text-white"
            style={{ left: `${50 + (diff / HALF_FOV_DEG) * 50}%` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="text-sm font-medium">{field.field_name}</span>
            <span className="text-xs text-white/70">{formatDistance(distance)}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
