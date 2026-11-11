import { useEffect, useState } from 'react'
import { getPublicFieldStats, getPublicFields } from '../../services/publicService'

function usePublicData(load) {
  const [state, setState] = useState({ rows: [], loading: true, error: null })
  useEffect(() => {
    load()
      .then((rows) => setState({ rows, loading: false, error: null }))
      .catch((err) => setState({ rows: [], loading: false, error: err.message }))
  }, [load])
  return state
}

export const usePublicStats = () => usePublicData(getPublicFieldStats)
export const usePublicFields = () => usePublicData(getPublicFields)

// Shared copy for the landing and About pages: [icon, title, text].
export const FEATURES = [
  ['fields', 'Field registration', 'Farmers register rice fields with location, boundary, area and variety. The LGU reviews each field before it is counted.'],
  ['sprout', 'Crop monitoring', 'Farmers keep crop status, observations and monitoring reports up to date through the season.'],
  ['map', 'Maps, photos and 360° views', 'Fields can be explored on a map, with photos, 360° images and a simple AR view of field information.'],
  ['report', 'Agricultural reports', 'LGU staff get summaries of fields, crop status, distribution and harvest projections.'],
]

export const STEPS = [
  ['Farmers register', 'Add a field with its location, boundary, area and variety.'],
  ['The LGU reviews', 'LGU staff verify every field before it is counted.'],
  ['Everyone sees the picture', 'Approved fields appear on the public map and statistics, without personal details.'],
]

// Photos live in /public/images. Missing files are skipped, so swap in your own any time.
export const PHOTOS = {
  hero: '/images/hero.jpg',
  valley: '/images/field-1.jpg',
  paddy: '/images/field-2.jpg',
  harvest: '/images/field-3.jpg',
}

export const SERVICES = [
  { icon: 'fields', title: 'Field registration', text: 'Farmers register rice fields with location, boundary, area and variety. The LGU reviews each field before it is counted.', photo: PHOTOS.paddy, to: '/register', cta: 'Register a field' },
  { icon: 'sprout', title: 'Crop monitoring', text: 'Crop stages, conditions and monitoring reports are kept up to date through the whole season.', photo: PHOTOS.harvest, to: '/crop-status', cta: 'See crop status' },
  { icon: 'map', title: 'Maps, photos and 360° views', text: 'Explore fields on a map, with photos, 360° images and a simple AR view of field information.', photo: PHOTOS.valley, to: '/map', cta: 'Open the map' },
  { icon: 'report', title: 'Agricultural reports', text: 'LGU staff get summaries of fields, crop status, distribution and harvest projections.', photo: PHOTOS.hero, to: '/statistics', cta: 'View statistics' },
]
