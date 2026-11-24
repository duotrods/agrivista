import { expect, test } from '@playwright/test'
import { IDS } from './support/data.js'
import { pick, rootFontSize } from './support/helpers.js'
import { mockSupabase } from './support/mockSupabase.js'

test.use({ permissions: ['geolocation'], geolocation: { latitude: 7.0731, longitude: 125.5986 } })

test.describe('farmer', () => {
  let backend
  test.beforeEach(async ({ page }) => { backend = await mockSupabase(page, { as: 'farmer' }) })

  test('dashboard shows six summary cards and no notifications card', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.stat-card')).toHaveCount(6)
    await expect(page.getByText('Unread notifications')).toHaveCount(0)
    await expect(page.locator('.stat-card', { hasText: 'Total rice fields' }).locator('.stat-value')).toHaveText('02')
    await expect(page.getByRole('link', { name: 'Add Field' })).toBeVisible()
  })

  test('My Fields is a table with View and Edit on every row', async ({ page }) => {
    await page.goto('/fields')
    await expect(page.getByRole('columnheader', { name: 'Review' })).toBeVisible()
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(2)
    const first = rows.filter({ hasText: 'Palayan sa Taas' })
    await expect(first.getByText('Approved by LGU')).toBeVisible()
    await expect(first.getByRole('link', { name: 'View' })).toHaveAttribute('href', `/fields/${IDS.fieldApproved}`)
    await expect(first.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', `/fields/${IDS.fieldApproved}?edit=1`)
  })

  test('viewing a field is read-only: no upload, no notes, no edit forms', async ({ page }) => {
    await page.goto(`/fields/${IDS.fieldApproved}`)
    await expect(page.getByRole('heading', { name: 'Palayan sa Taas' })).toBeVisible()
    await expect(page.getByText('Owner name')).toBeVisible()
    for (const name of ['Add Note', 'Save Details', 'Delete Field', 'Start New Cycle', 'Log Observation']) {
      await expect(page.getByRole('button', { name })).toHaveCount(0)
    }
    await expect(page.getByText('Upload Photo')).toHaveCount(0)
    await expect(page.getByPlaceholder('Add a note or remark...')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible()
    // The report history is still visible, read-only.
    await expect(page.getByRole('heading', { name: 'Monitoring Reports' })).toBeVisible()
    await expect(page.getByText('Growing well, no pests seen')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit Report' })).toHaveCount(0)
  })

  test('edit mode unlocks the forms, with required details marked', async ({ page }) => {
    await page.goto(`/fields/${IDS.fieldApproved}?edit=1`)
    await expect(page.getByRole('button', { name: 'Save Details' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Note' })).toBeVisible()
    await expect(page.getByText('Upload Photo')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete Field' })).toBeVisible()
    for (const label of ['Owner name', 'Maintainer name', 'Area (hectares)']) {
      await expect(page.getByLabel(label)).toHaveAttribute('required', '')
    }
    await page.getByRole('link', { name: 'Done editing' }).click()
    await expect(page.getByRole('button', { name: 'Save Details' })).toHaveCount(0)
  })

  test('saving field details sends an update and resubmits for review', async ({ page }) => {
    await page.goto(`/fields/${IDS.fieldPending}?edit=1`)
    await page.getByLabel('Owner name').fill('New Owner')
    await page.getByRole('button', { name: 'Save Details' }).click()
    await expect.poll(() => backend.writes.find((w) => w.method === 'PATCH' && w.table === 'rice_fields')?.body.owner_name).toBe('New Owner')
  })

  test('Add Field opens as a right-hand panel and requires the key details', async ({ page }) => {
    await page.goto('/fields')
    await page.getByRole('link', { name: 'Add Field' }).click()
    await expect(page).toHaveURL(/\/fields\/new$/)
    const panel = page.getByRole('dialog', { name: 'Add a new field' })
    await expect(panel).toBeVisible()
    await panel.getByRole('button', { name: 'Submit for LGU Approval' }).click()
    expect(backend.writes.filter((w) => w.table === 'rice_fields')).toHaveLength(0)
    await expect(panel).toBeVisible()
    // Closing returns to the list.
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(/\/fields$/)
    await expect(panel).toHaveCount(0)
  })

  test('submitting a complete new field saves it as pending and opens it', async ({ page }) => {
    await page.goto('/fields/new')
    const panel = page.getByRole('dialog', { name: 'Add a new field' })
    await panel.getByLabel('Field name').fill('Palayan ni Rod')
    await pick(page, 'Purok', 'Purok Malinawon')
    await panel.getByLabel('Owner name').fill('Rod Owner')
    await panel.getByLabel('Maintainer name').fill('Rod Helper')
    await panel.getByLabel('Area (hectares)').fill('0.75')
    await pick(page, 'Inbred / Hybrid', 'Inbred')
    await pick(page, 'Crop variety', 'IR64')
    await pick(page, 'Soil type', 'clay')
    await pick(page, 'Irrigation type', 'irrigated')
    await panel.getByRole('button', { name: 'Use My Location' }).click()
    await expect(panel.getByText(/GPS: 7\.0731/)).toBeVisible()
    await panel.getByRole('button', { name: 'Submit for LGU Approval' }).click()
    await expect(page).toHaveURL(/\/fields\/[0-9a-f-]{36}$/)
    const created = backend.writes.find((w) => w.method === 'POST' && w.table === 'rice_fields')
    expect(created.body).toMatchObject({ field_name: 'Palayan ni Rod', purok: 'Purok Malinawon', area_hectares: 0.75, is_verified: false, farmer_id: IDS.farmer })
    await expect(page.getByRole('heading', { name: 'Palayan ni Rod' })).toBeVisible()
  })

  test('a field cannot be submitted without a GPS location', async ({ page }) => {
    await page.goto('/fields/new')
    const panel = page.getByRole('dialog', { name: 'Add a new field' })
    await panel.getByLabel('Field name').fill('No GPS Field')
    await pick(page, 'Purok', 'Purok Malinawon')
    await panel.getByLabel('Owner name').fill('A')
    await panel.getByLabel('Maintainer name').fill('B')
    await panel.getByLabel('Area (hectares)').fill('1')
    await pick(page, 'Inbred / Hybrid', 'Hybrid')
    await pick(page, 'Crop variety', 'IR64')
    await pick(page, 'Soil type', 'loam')
    await pick(page, 'Irrigation type', 'rainfed')
    await panel.getByRole('button', { name: 'Submit for LGU Approval' }).click()
    await expect(panel.getByText('Use "Use My Location" to set the field GPS position first.')).toBeVisible()
    expect(backend.writes.filter((w) => w.table === 'rice_fields')).toHaveLength(0)
  })

  test('Monitoring lists fields and opens the report panel with the current stage filled in', async ({ page }) => {
    await page.goto('/monitoring')
    const row = page.locator('tbody tr', { hasText: 'Test Field' })
    await expect(row.getByText('Fallow')).toBeVisible()
    await row.getByRole('button', { name: 'Report' }).click()
    const panel = page.getByRole('dialog', { name: 'New monitoring report' })
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('combobox', { name: 'Field', exact: true })).toContainText('Test Field')
    await expect(panel.getByRole('combobox', { name: 'Crop status' })).toContainText('Fallow')
    await panel.getByRole('button', { name: 'Submit Report' }).click()
    expect(backend.writes.filter((w) => w.table === 'field_reports')).toHaveLength(0)
  })

  test('a report with a new crop stage and a photo updates the field and notifies nothing it should not', async ({ page }) => {
    await page.goto('/monitoring')
    await page.getByRole('button', { name: 'New report' }).click()
    const panel = page.getByRole('dialog', { name: 'New monitoring report' })
    await pick(page, 'Field', 'Test Field')
    await pick(page, 'Crop status', 'Planted')
    await expect(panel.getByText(/This also updates the field to Planted/)).toBeVisible()
    await pick(page, 'Field condition', 'Pest affected')
    await panel.getByLabel('Observation').fill('Some pests on the leaves')
    await panel.locator('#report-photo').setInputFiles({ name: 'leaf.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') })
    await expect(panel.getByAltText('Selected photo preview')).toBeVisible()
    await panel.getByRole('button', { name: 'Submit Report' }).click()
    await expect(panel).toHaveCount(0)
    const report = backend.writes.find((w) => w.method === 'POST' && w.table === 'field_reports')
    expect(report.body).toMatchObject({ field_id: IDS.fieldPending, crop_status: 'planted', field_condition: 'pest_affected', summary: 'Some pests on the leaves' })
    expect(report.body.photo_url).toContain('/reports/')
    const statusUpdate = backend.writes.find((w) => w.method === 'PATCH' && w.table === 'rice_fields')
    expect(statusUpdate.body).toEqual({ field_status: 'planted' })
    await expect(page.locator('tbody tr', { hasText: 'Test Field' }).getByText('Planted')).toBeVisible()
    await expect(page.getByText('Report submitted. LGU staff will review it.')).toBeVisible()
    await expect(page.getByText('Some pests on the leaves')).toBeVisible()
  })

  test('the old Reports page redirects to Monitoring', async ({ page }) => {
    await page.goto('/reports')
    await expect(page).toHaveURL(/\/monitoring$/)
  })

  test('notification bell shows the unread count and marks all as read', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Notifications' }).locator('span')).toHaveText('1')
    await page.getByRole('button', { name: 'Notifications' }).click()
    await expect(page.getByText('Field approved').first()).toBeVisible()
    await page.getByRole('button', { name: 'Mark all as read' }).click()
    await expect.poll(() => backend.writes.some((w) => w.method === 'PATCH' && w.table === 'notifications')).toBe(true)
  })

  test('settings: night theme, text sizes and bold text apply immediately', async ({ page }) => {
    await page.goto('/settings')
    const base = await rootFontSize(page)
    await page.getByRole('button', { name: 'Night' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Large' }).click()
    expect(await rootFontSize(page)).toBeGreaterThan(base)
    await page.getByRole('button', { name: 'Small' }).click()
    expect(await rootFontSize(page)).toBeLessThan(base)
    await page.getByRole('switch', { name: 'Bold text' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-bold', 'on')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByText('Reset to defaults').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('sidebar can be minimized and the choice is remembered', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect(page.locator('.sidebar')).toHaveClass(/is-collapsed/)
    await page.reload()
    await expect(page.locator('.sidebar')).toHaveClass(/is-collapsed/)
    await page.getByRole('button', { name: 'Expand sidebar' }).click()
    await expect(page.locator('.sidebar')).not.toHaveClass(/is-collapsed/)
  })

  test('log out asks for confirmation, and cancelling keeps you signed in', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Fe Farmer/ }).click()
    await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    const dialog = page.getByRole('dialog', { name: 'Log out?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page).toHaveURL(/localhost:5199\/$/)
    await page.getByRole('button', { name: /Fe Farmer/ }).click()
    await page.getByRole('menuitem', { name: 'Log out' }).click()
    await page.getByRole('dialog', { name: 'Log out?' }).getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('profile page log out also asks first', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page.getByRole('dialog', { name: 'Log out?' })).toBeVisible()
  })
})

test.describe('farmer on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the menu opens as a drawer with a close button and log out', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const drawer = page.locator('.sidebar')
    await expect(drawer).toHaveClass(/is-open/)
    await expect(drawer.getByRole('button', { name: 'Log out' })).toBeVisible()
    await drawer.getByRole('link', { name: 'My Fields' }).click()
    await expect(page).toHaveURL(/\/fields$/)
    await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/)
  })

  test('tables turn into labelled cards', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.goto('/fields')
    await expect(page.locator('thead')).toBeHidden()
    await expect(page.locator('tbody tr').first().locator('td[data-label="Crop status"]')).toBeVisible()
  })
})
