import { test } from '@playwright/test'
import { IDS, seed } from './support/data.js'
import { mockSupabase } from './support/mockSupabase.js'

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const USERS = [
  { id: IDS.farmer, full_name: 'Fe Farmer', email: 'farmer@example.test', role: 'farmer', purok: 'Purok Malinawon', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
]
const D = { w: 1440, h: 900 }
const M = { w: 390, h: 844 }

// [file, role, path, viewport, theme, before-screenshot action]
const SHOTS = [
  ['pub-home', null, '/', D, 'light', null, true],
  ['pub-about', null, '/about', D, 'light', null, true],
  ['pub-map', null, '/map', D, 'light'],
  ['pub-stats', null, '/statistics', D, 'light'],
  ['pub-crop', null, '/crop-status', D, 'light'],
  ['pub-login', null, '/login', D, 'light'],
  ['pub-register', null, '/register', D, 'light'],
  ['pub-forgot', null, '/forgot-password', D, 'light'],
  ['farmer-dash', 'farmer', '/', D, 'light'],
  ['farmer-fields', 'farmer', '/fields', D, 'light'],
  ['farmer-field-view', 'farmer', `/fields/${IDS.fieldApproved}`, D, 'light', null, true],
  ['farmer-field-edit', 'farmer', `/fields/${IDS.fieldApproved}?edit=1`, D, 'light', null, true],
  ['farmer-add-field', 'farmer', '/fields/new', D, 'light'],
  ['farmer-monitoring', 'farmer', '/monitoring', D, 'light'],
  ['farmer-report-drawer', 'farmer', '/monitoring', D, 'light', async (p) => { await p.getByRole('button', { name: 'New report' }).click(); await p.waitForTimeout(500) }],
  ['farmer-notifications', 'farmer', '/notifications', D, 'light'],
  ['farmer-profile', 'farmer', '/profile', D, 'light'],
  ['farmer-settings', 'farmer', '/settings', D, 'light'],
  ['farmer-map', 'farmer', '/my-map', D, 'light'],
  ['lgu-dash', 'lgu', '/', D, 'light', null, true],
  ['lgu-fields', 'lgu', '/lgu/fields', D, 'light'],
  ['lgu-fields-table', 'lgu', '/lgu/fields', D, 'light', async (p) => { await p.getByRole('button', { name: 'Table', exact: true }).click() }],
  ['lgu-map', 'lgu', '/lgu/map', D, 'light'],
  ['lgu-verify', 'lgu', '/lgu/verify', D, 'light'],
  ['lgu-field-review', 'lgu', `/lgu/fields/${IDS.fieldPending}`, D, 'light', null, true],
  ['lgu-users', 'lgu', '/lgu/users', D, 'light'],
  ['lgu-reports', 'lgu', '/lgu/reports', D, 'light'],
  ['lgu-crop', 'lgu', '/lgu/crop-monitoring', D, 'light'],
  ['lgu-agri', 'lgu', '/lgu/agricultural-reports', D, 'light', null, true],
  ['lgu-activity', 'lgu', '/lgu/activity', D, 'light'],
  ['lgu-announce', 'lgu', '/lgu/announcements', D, 'light'],
  ['dark-farmer-dash', 'farmer', '/', D, 'dark'],
  ['dark-lgu-dash', 'lgu', '/', D, 'dark'],
  ['dark-farmer-fields', 'farmer', '/fields', D, 'dark'],
  ['m-home', null, '/', M, 'light'],
  ['m-about', null, '/about', M, 'light'],
  ['m-farmer-dash', 'farmer', '/', M, 'light'],
  ['m-farmer-fields', 'farmer', '/fields', M, 'light'],
  ['m-farmer-monitoring', 'farmer', '/monitoring', M, 'light'],
  ['m-add-field', 'farmer', '/fields/new', M, 'light'],
  ['m-lgu-dash', 'lgu', '/', M, 'light'],
  ['m-lgu-verify', 'lgu', '/lgu/verify', M, 'light'],
  ['m-lgu-agri', 'lgu', '/lgu/agricultural-reports', M, 'light'],
]

for (const [file, role, path, vp, theme, action, full] of SHOTS) {
  test(`shot ${file}`, async ({ page }) => {
    const data = seed()
    data.field_reports[0].photo_url = PIXEL
    await mockSupabase(page, { as: role, overrides: data, rpc: { admin_list_users: USERS } })
    await page.setViewportSize({ width: vp.w, height: vp.h })
    await page.addInitScript((t) => localStorage.setItem('agrivista.appearance', JSON.stringify({ theme: t })), theme)
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    if (action) await action(page)
    await page.waitForTimeout(300)
    await page.screenshot({ path: `e2e/.results/sweep/${file}.png`, fullPage: Boolean(full) })
  })
}
