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
