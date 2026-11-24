// Seed data for the fake backend.
export const IDS = {
  farmer: '11111111-1111-4111-8111-111111111111',
  lgu: '33333333-3333-4333-8333-333333333333',
  admin: '55555555-5555-4555-8555-555555555555',
  pendingStaff: '77777777-7777-4777-8777-777777777777',
  approvedStaff: '88888888-8888-4888-8888-888888888888',
  fieldApproved: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  fieldPending: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  report: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
}

const now = '2026-11-10T08:00:00.000000+00:00'
const month = new Date().toISOString()

export const PROFILES = {
  farmer: { id: IDS.farmer, email: 'farmer@example.test', full_name: 'Fe Farmer', role: 'farmer', purok: 'Purok Malinawon', barangay: 'Caganganan', is_active: true, created_at: month },
  lgu: { id: IDS.lgu, email: 'lgu@example.test', full_name: 'Liza LGU', role: 'lgu_staff', purok: 'Purok Malipayon', barangay: 'Caganganan', is_active: true, created_at: month },
  admin: { id: IDS.admin, email: 'admin@example.test', full_name: 'Ana Admin', role: 'admin', purok: null, barangay: 'Caganganan', is_active: true, created_at: month },
}

const field = (over) => ({
  farmer_id: IDS.farmer, latitude: 7.07, longitude: 125.6, barangay: 'Caganganan', purok: 'Purok Malinawon',
  owner_name: 'Fe Farmer', maintainer_name: 'Pedro', area_hectares: 1.5, seed_type: 'inbred', crop_variety: 'IR64',
  soil_type: 'clay', irrigation_type: 'irrigated', planting_date: '2026-10-01', expected_harvest: '2027-01-30',
  polygon_coords: null, field_status: 'planted', is_verified: false, verified_by: null, verified_at: null,
  review_status: 'pending', review_note: null, created_at: month, updated_at: now,
  farmer: { full_name: 'Fe Farmer', purok: 'Purok Malinawon' }, ...over,
})

export function seed() {
  return {
    profiles: [
      { ...PROFILES.farmer }, { ...PROFILES.lgu }, { ...PROFILES.admin },
      { id: IDS.pendingStaff, email: 'pending@example.test', full_name: 'Pia Pending', role: 'lgu_staff', purok: 'Purok Anahaw', is_active: false, created_at: month },
      { id: IDS.approvedStaff, email: 'approved@example.test', full_name: 'Alex Approved', role: 'lgu_staff', purok: 'Purok Awa-aw', is_active: true, created_at: month },
    ],
    rice_fields: [
      field({ id: IDS.fieldApproved, field_name: 'Palayan sa Taas', is_verified: true, verified_by: IDS.lgu, verified_at: now }),
      field({ id: IDS.fieldPending, field_name: 'Test Field', field_status: 'fallow', area_hectares: 0.5, planting_date: null, expected_harvest: null }),
    ],
    field_reports: [{
      id: IDS.report, field_id: IDS.fieldApproved, submitted_by: IDS.farmer, summary: 'Growing well, no pests seen',
      status: 'submitted', report_date: month.slice(0, 10), crop_status: 'planted', field_condition: 'healthy',
      harvest_info: null, photo_url: null, reviewed_by: null, reviewed_at: null, created_at: month,
      field: { field_name: 'Palayan sa Taas', purok: 'Purok Malinawon' }, submitter: { full_name: 'Fe Farmer' },
    }],
    notifications: [
      { id: 'n1', user_id: IDS.lgu, title: 'New field registration', message: 'Field "Test Field" is waiting for verification.', type: 'info', is_read: false, link: `/lgu/fields/${IDS.fieldPending}`, created_at: month },
      { id: 'n2', user_id: IDS.farmer, title: 'Field approved', message: 'Your field was approved.', type: 'success', is_read: false, link: '/fields', created_at: month },
    ],
    announcements: [], activity_logs: [], crop_cycles: [], crop_observations: [], field_media: [], field_notes: [], field_status_logs: [],
    system_settings: [],
  }
}

export const RPC = {
  get_public_field_stats: [
    { purok: 'Purok Malinawon', field_status: 'planted', field_count: 2 },
    { purok: 'Purok Malipayon', field_status: 'growing', field_count: 1 },
  ],
  get_public_fields: [
    { purok: 'Purok Malinawon', field_status: 'planted', area_hectares: 1.5, crop_variety: 'IR64', seed_type: 'inbred', irrigation_type: 'irrigated', expected_harvest_month: '2027-01', latitude: 7.073, longitude: 125.598 },
    { purok: 'Purok Malinawon', field_status: 'planted', area_hectares: 2, crop_variety: 'NSIC Rc216', seed_type: 'hybrid', irrigation_type: 'rainfed', expected_harvest_month: '2027-02', latitude: 7.075, longitude: 125.601 },
    { purok: 'Purok Malipayon', field_status: 'growing', area_hectares: 1, crop_variety: 'IR64', seed_type: 'inbred', irrigation_type: 'irrigated', expected_harvest_month: '2027-01', latitude: 7.07, longitude: 125.6 },
  ],
  admin_list_lgu_accounts: [
    { id: IDS.pendingStaff, full_name: 'Pia Pending', email: 'pending@example.test', purok: 'Purok Anahaw', is_active: false, email_confirmed: true, created_at: month },
    { id: IDS.approvedStaff, full_name: 'Alex Approved', email: 'approved@example.test', purok: 'Purok Awa-aw', is_active: true, email_confirmed: true, created_at: month },
  ],
  admin_list_users: [],
  create_harvest_reminders: 0,
}
