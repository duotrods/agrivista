// Base maps for the Leaflet views, all from free tile providers (Esri, OpenStreetMap).

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

export const DEFAULT_LAYER_ID = 'satellite'
export const MAP_MAX_ZOOM = 20
