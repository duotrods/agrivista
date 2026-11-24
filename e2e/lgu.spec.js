import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { IDS, seed } from './support/data.js'
import { pick } from './support/helpers.js'
import { mockSupabase } from './support/mockSupabase.js'

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

async function downloadFrom(page, menuItem) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: menuItem }).click()])
  return { name: download.suggestedFilename(), bytes: readFileSync(await download.path()) }
}

test.describe('LGU staff', () => {
  let backend
  test.beforeEach(async ({ page }) => {
    const data = seed()
    data.field_reports[0].photo_url = PIXEL
    backend = await mockSupabase(page, { as: 'lgu', overrides: data })
  })

  test('dashboard shows eight cards, this month by default, and a short reports list without photos', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.stat-card')).toHaveCount(8)
    await expect(page.locator('.stat-card', { hasText: 'Total rice fields' }).locator('.stat-value')).toHaveText('02')
    await expect(page.locator('.stat-card', { hasText: 'Pending verification' }).locator('.stat-value')).toHaveText('01')
    await expect(page.getByRole('combobox', { name: 'Filter by year' })).toContainText(String(new Date().getFullYear()))
    const reports = page.locator('section', { hasText: 'Recent monitoring reports' })
    await expect(reports.getByText('Palayan sa Taas')).toBeVisible()
    await expect(reports.locator('img')).toHaveCount(0)
    await expect(reports.locator('li')).toHaveCount(1)
    await expect(page.locator('.apexcharts-canvas').first()).toBeVisible()
  })

  test('dashboard filter can clear to all data', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByRole('combobox', { name: 'Filter by month' })).toContainText('All months')
    await expect(page.getByRole('button', { name: 'Clear' })).toHaveCount(0)
  })

  test('dashboard exports download a real PDF and a real Word file', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.stat-card')).toHaveCount(8)
    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByRole('menuitem')).toHaveCount(2)
    const pdf = await downloadFrom(page, /PDF/)
    expect(pdf.name).toMatch(/^agrivista-dashboard-\d{4}-\d{2}-\d{2}\.pdf$/)
    expect(pdf.bytes.subarray(0, 5).toString()).toBe('%PDF-')
    await page.getByRole('button', { name: 'Export' }).click()
    const word = await downloadFrom(page, /Word/)
    expect(word.name).toMatch(/\.docx$/)
    expect(word.bytes.subarray(0, 2).toString()).toBe('PK')
  })

  test('Verify Fields lists requests by status and opens a request for review', async ({ page }) => {
    await page.goto('/lgu/verify')
    await expect(page.getByRole('tab', { name: 'Pending (1)' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Approved (1)' })).toBeVisible()
    await expect(page.getByText('Test Field')).toBeVisible()
    await page.getByRole('link', { name: 'Review' }).click()
    await expect(page).toHaveURL(new RegExp(`/lgu/fields/${IDS.fieldPending}`))
    await expect(page.getByRole('button', { name: 'Approve for Community' })).toBeVisible()
  })

  test('approving a pending field verifies it and notifies the farmer', async ({ page }) => {
    await page.goto(`/lgu/fields/${IDS.fieldPending}`)
    await page.getByRole('button', { name: 'Approve for Community' }).click()
    await expect.poll(() => backend.writes.find((w) => w.method === 'PATCH' && w.table === 'rice_fields')?.body).toEqual({ is_verified: true })
    const note = await expect.poll(() => backend.writes.find((w) => w.method === 'POST' && w.table === 'notifications')?.body).toMatchObject({ user_id: IDS.farmer, title: 'Field approved', type: 'success' })
    expect(note).toBeUndefined()
    await expect(page.getByText(/approved and included in Community/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Approve for Community' })).toHaveCount(0)
  })

  test('rejecting or requesting correction needs a note, which is sent to the farmer', async ({ page }) => {
    await page.goto(`/lgu/fields/${IDS.fieldPending}`)
    const reject = page.getByRole('button', { name: 'Reject', exact: true })
    const correct = page.getByRole('button', { name: 'Request Correction' })
    await expect(reject).toBeDisabled()
    await expect(correct).toBeDisabled()
    await page.getByLabel('Note to farmer').fill('Area looks too large, please check')
    await expect(reject).toBeEnabled()
    await correct.click()
    await expect.poll(() => backend.writes.find((w) => w.method === 'PATCH' && w.table === 'rice_fields')?.body).toEqual({ review_status: 'needs_correction', review_note: 'Area looks too large, please check' })
    await expect.poll(() => backend.writes.find((w) => w.table === 'notifications' && w.body.title === 'Field needs correction')?.body.message).toContain('Area looks too large')
    await expect(page.getByText('Your note to the farmer: Area looks too large, please check')).toBeVisible()
  })

  test('rejecting a field records the rejection and tells the farmer why', async ({ page }) => {
    await page.goto(`/lgu/fields/${IDS.fieldPending}`)
    await page.getByLabel('Note to farmer').fill('Duplicate of another field')
    await page.getByRole('button', { name: 'Reject', exact: true }).click()
    await expect.poll(() => backend.writes.find((w) => w.method === 'PATCH' && w.table === 'rice_fields')?.body.review_status).toBe('rejected')
    await expect.poll(() => backend.writes.find((w) => w.table === 'notifications' && w.body.title === 'Field rejected')?.body.type).toBe('warning')
  })

  test('the LGU view of a field cannot upload photos or add notes', async ({ page }) => {
    await page.goto(`/lgu/fields/${IDS.fieldApproved}`)
    await expect(page.getByRole('heading', { name: 'Photos, 360° & Video' })).toBeVisible()
    await expect(page.getByText('Upload Photo')).toHaveCount(0)
    await expect(page.getByPlaceholder('Add a note or remark...')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add Note' })).toHaveCount(0)
    // Report photos are visible inline, not as a link.
    const reports = page.locator('section', { hasText: 'Monitoring Reports' })
    await expect(reports.getByAltText('Report photo')).toBeVisible()
    await expect(reports.getByText('View photo')).toHaveCount(0)
  })

  test('Back returns to the page the field was opened from', async ({ page }) => {
    await page.goto('/lgu/verify')
    await page.getByRole('link', { name: 'Review' }).click()
    await page.getByRole('link', { name: '← Back' }).click()
    await expect(page).toHaveURL(/\/lgu\/verify$/)
  })

  test('validating a monitoring report marks it reviewed and notifies the farmer', async ({ page }) => {
    await page.goto('/lgu/reports')
    await page.getByRole('button', { name: 'Validate' }).click()
    await expect.poll(() => backend.writes.find((w) => w.method === 'PATCH' && w.table === 'field_reports')?.body.status).toBe('reviewed')
    await expect.poll(() => backend.writes.find((w) => w.table === 'notifications' && w.body.title === 'Report validated')?.body.user_id).toBe(IDS.farmer)
    await expect(page.getByRole('button', { name: 'Validate' })).toHaveCount(0)
  })

  test('Rice Fields switches between list, grid and table and remembers the choice', async ({ page }) => {
    await page.goto('/lgu/fields')
    await expect(page.getByText('Test Field')).toBeVisible()
    await page.getByRole('button', { name: 'Table', exact: true }).click()
    await expect(page.locator('tbody tr')).toHaveCount(2)
    await page.getByRole('button', { name: 'Grid', exact: true }).click()
    await expect(page.locator('ul.grid > li')).toHaveCount(2)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Grid', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('Crop Monitoring shows the five stage cards', async ({ page }) => {
    await page.goto('/lgu/crop-monitoring')
    await expect(page.locator('.stat-card')).toHaveCount(5)
    await expect(page.locator('.stat-card', { hasText: 'Planted' }).locator('.stat-value')).toHaveText('01')
    await expect(page.locator('.stat-card', { hasText: 'Fallow' }).locator('.stat-value')).toHaveText('01')
  })

  test('Agricultural reports follow the filters and export PDF, Word and CSV', async ({ page }) => {
    await page.goto('/lgu/agricultural-reports')
    await expect(page.locator('.stat-card', { hasText: 'Rice fields' }).first().locator('.stat-value')).toHaveText('02')
    await pick(page, 'Filter by purok', 'Purok Anahaw')
    await expect(page.locator('.stat-card', { hasText: 'Rice fields' }).first().locator('.stat-value')).toHaveText('00')
    await pick(page, 'Filter by purok', 'Purok Malinawon')
    await expect(page.locator('.stat-card', { hasText: 'Rice fields' }).first().locator('.stat-value')).toHaveText('02')

    await page.getByRole('button', { name: 'Export' }).click()
    await expect(page.getByRole('menuitem')).toHaveCount(3)
    const pdf = await downloadFrom(page, /PDF/)
    expect(pdf.name).toMatch(/^agrivista-agricultural-report-.*\.pdf$/)
    expect(pdf.bytes.subarray(0, 5).toString()).toBe('%PDF-')
    await page.getByRole('button', { name: 'Export' }).click()
    const word = await downloadFrom(page, /Word/)
    expect(word.name).toMatch(/\.docx$/)
    expect(word.bytes.subarray(0, 2).toString()).toBe('PK')
    await page.getByRole('button', { name: 'Export' }).click()
    const csv = await downloadFrom(page, /CSV/)
    expect(csv.name).toMatch(/\.csv$/)
    expect(csv.bytes.toString()).toContain('Purok Malinawon')
  })

  test('sidebar groups the pages and includes Settings', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.sidebar')
    for (const heading of ['General', 'Management', 'Monitoring', 'System']) await expect(sidebar.getByText(heading, { exact: true })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Settings' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Announcements' })).toBeVisible()
  })
})
