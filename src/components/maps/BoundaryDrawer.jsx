import { useState } from 'react'
import { calculatePolygonAreaHectares } from '../../lib/helpers'
import { updateFieldBoundary } from '../../services/fieldService'
import { MapView } from './MapView'

export function BoundaryDrawer({ fieldId, initialPoints = [], onSaved }) {
  const [points, setPoints] = useState(initialPoints)
  const [capturing, setCapturing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function addPoint() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }
    setCapturing(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoints((prev) => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude }])
        setCapturing(false)
      },
      (err) => {
        setError(err.message)
        setCapturing(false)
      },
    )
  }

  function addPointAt(latlng) {
    setPoints((prev) => [...prev, { lat: latlng.lat, lng: latlng.lng }])
  }

  function undoLastPoint() {
    setPoints((prev) => prev.slice(0, -1))
  }

  function reset() {
    setPoints([])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const areaHectares = calculatePolygonAreaHectares(points)
      const updated = await updateFieldBoundary(fieldId, { polygonCoords: points, areaHectares })
      onSaved?.(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const area = points.length >= 3 ? calculatePolygonAreaHectares(points) : null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        In the field: walk to each corner and tap "Add Point (GPS)" there. At a desk: click
        directly on the map to place each corner instead. You need at least 3 points.
      </p>

      <MapView boundaryPoints={points} onMapClick={addPointAt} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addPoint}
          disabled={capturing}
          className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {capturing ? 'Getting location...' : `Add Point (GPS) — ${points.length} so far`}
        </button>
        <button
          type="button"
          onClick={undoLastPoint}
          disabled={points.length === 0}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Undo Last Point
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={points.length === 0}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {area !== null && <p className="text-sm text-gray-700">Estimated area: {area} hectares</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={points.length < 3 || saving}
        className="w-fit rounded bg-green-800 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Boundary'}
      </button>
    </div>
  )
}
