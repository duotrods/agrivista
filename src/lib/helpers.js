const EARTH_RADIUS_M = 6371000

/**
 * Approximates the area of a lat/lng polygon in hectares using an
 * equirectangular projection centered on the polygon's first point.
 * Accurate enough for single-field scale (a few hectares).
 */
export function calculatePolygonAreaHectares(points) {
  if (points.length < 3) return 0

  const toRad = (deg) => (deg * Math.PI) / 180
  const lat0 = toRad(points[0].lat)

  const projected = points.map((p) => ({
    x: toRad(p.lng) * Math.cos(lat0) * EARTH_RADIUS_M,
    y: toRad(p.lat) * EARTH_RADIUS_M,
  }))

  let area = 0
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length
    area += projected[i].x * projected[j].y - projected[j].x * projected[i].y
  }

  const squareMeters = Math.abs(area) / 2
  return Math.round((squareMeters / 10000) * 100) / 100
}

const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

/** Great-circle distance between two {lat,lng} points, in meters. */
export function calculateDistanceMeters(from, to) {
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/** Compass bearing from one {lat,lng} point to another, in degrees [0, 360). */
export function calculateBearing(from, to) {
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLng = toRad(to.lng - from.lng)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Signed angular difference (-180, 180], how far to turn from `from` to reach `to` (degrees). */
export function angleDifference(from, to) {
  return ((((to - from) % 360) + 540) % 360) - 180
}

const DAYS_MS = 24 * 60 * 60 * 1000
const NEAR_HARVEST_DAYS = 14

/**
 * Classifies a field into the AR overlay categories from the capstone
 * proposal: land condition, newly planted, growth status, to be harvested.
 */
export function getFieldARCategory(field) {
  if (field.field_status === 'fallow' || field.field_status === 'land_prep') {
    return { key: 'land_condition', label: 'Land Condition', color: '#6B7280' }
  }
  if (field.field_status === 'planted') {
    return { key: 'newly_planted', label: 'Newly Planted', color: '#65A30D' }
  }
  if (field.field_status === 'growing') {
    if (field.expected_harvest) {
      const daysLeft = (new Date(field.expected_harvest) - new Date()) / DAYS_MS
      if (daysLeft <= NEAR_HARVEST_DAYS) {
        return { key: 'to_be_harvested', label: 'To Be Harvested', color: '#D97706' }
      }
    }
    return { key: 'growth_status', label: 'Growth Status', color: '#16A34A' }
  }
  if (field.field_status === 'harvested') {
    return { key: 'harvested', label: 'Harvested', color: '#1B5E20' }
  }
  return { key: 'unknown', label: 'Unspecified', color: '#9CA3AF' }
}
