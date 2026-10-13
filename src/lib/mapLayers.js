// Base maps for the Leaflet views. Free layers are always available; the
// MapTiler and Mapbox layers appear only when their key is configured, so the
// providers can be compared side by side without code changes.

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const imagery = { url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, attribution: ESRI_ATTRIBUTION, maxNativeZoom: 18 }

export const BASE_LAYERS = [
  { id: 'satellite', label: 'Satellite', tiles: [imagery] },
  {
    id: 'hybrid',
    label: 'Hybrid',
    tiles: [
      imagery,
      { url: `${ESRI}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`, maxNativeZoom: 18 },
      { url: `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, maxNativeZoom: 18 },
    ],
  },
  { id: 'street', label: 'Street', tiles: [{ url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: OSM_ATTRIBUTION, maxNativeZoom: 19 }] },
  { id: 'terrain', label: 'Terrain', tiles: [{ url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`, attribution: ESRI_ATTRIBUTION, maxNativeZoom: 18 }] },
]

const maptilerKey = import.meta.env.VITE_MAPTILER_KEY
if (maptilerKey) {
  const attribution = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors'
  BASE_LAYERS.push(
    { id: 'maptiler-hybrid', label: 'MapTiler Hybrid', tiles: [{ url: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${maptilerKey}`, attribution, maxNativeZoom: 20 }] },
    { id: 'maptiler-streets', label: 'MapTiler Streets', tiles: [{ url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`, attribution, maxNativeZoom: 22 }] },
  )
}

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN
if (mapboxToken) {
  const attribution = '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; OpenStreetMap contributors'
  const style = (name) => ({ url: `https://api.mapbox.com/styles/v1/mapbox/${name}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, attribution, tileSize: 512, zoomOffset: -1, maxNativeZoom: 21 })
  BASE_LAYERS.push(
    { id: 'mapbox-hybrid', label: 'Mapbox Hybrid', tiles: [style('satellite-streets-v12')] },
    { id: 'mapbox-streets', label: 'Mapbox Streets', tiles: [style('streets-v12')] },
  )
}

export const DEFAULT_LAYER_ID = 'satellite'
export const MAP_MAX_ZOOM = 20
