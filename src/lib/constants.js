export const FIELD_STATUSES = ['fallow', 'land_prep', 'planted', 'growing', 'harvested']

export const SOIL_TYPES = ['clay', 'loam', 'sandy']

export const IRRIGATION_TYPES = ['irrigated', 'rainfed', 'both']

export const CROP_VARIETIES = ['NSIC Rc222', 'NSIC Rc216', 'IR64', 'PSB Rc82', 'Other']

export const SEASONS = ['wet', 'dry']

export const CYCLE_STATUSES = ['ongoing', 'completed', 'failed']

export const GROWTH_STAGES = ['seedling', 'tillering', 'booting', 'heading', 'ripening']

export const HEALTH_STATUSES = ['healthy', 'pest_affected', 'diseased', 'drought_stressed']

// 360° multimedia condition categories, per the capstone proposal
// (Section 1.5): unplanted, planted, growth status, ready-to-harvest.
export const FIELD_CONDITIONS = [
  { value: 'unplanted', label: 'Unplanted' },
  { value: 'planted', label: 'Planted' },
  { value: 'growth_status', label: 'Growth Status' },
  { value: 'ready_to_harvest', label: 'Ready to Harvest' },
]

// AgriVista's scope is Barangay Caganganan, Banaybanay, Davao Oriental (per
// the capstone proposal). Barangay is fixed; Purok is the meaningful
// sub-location farmers actually pick.
export const BARANGAY_NAME = 'Caganganan'

export const PUROKS = [
  'Purok Malinawon',
  'Purok Malipayon',
  'Purok San Francisco',
  'Purok Anahaw',
  'Purok Rose Mabuhay',
  'Purok Liko Liko',
  'Purok Awa-aw',
]
