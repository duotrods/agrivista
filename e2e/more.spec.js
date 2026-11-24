import { expect, test } from '@playwright/test'
import { IDS, PROFILES, seed } from './support/data.js'
import { pick } from './support/helpers.js'
import { mockSupabase } from './support/mockSupabase.js'

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
const PNG = Buffer.from(PIXEL.split(',')[1], 'base64')

test.describe('sign in and registration', () => {
  async function fillLogin(page, email, password) {
    await page.goto('/login')
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()
  }

  test('a farmer can log in and lands on the dashboard', async ({ page }) => {
    await mockSupabase(page)
    await fillLogin(page, PROFILES.farmer.email, 'secret123')
    await expect(page).toHaveURL(/localhost:5199\/$/)
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.getByRole('button', { name: /Fe Farmer/ })).toBeVisible()
  })

  test('a wrong password shows an error and stays on the login page', async ({ page }) => {
    await mockSupabase(page)
    await fillLogin(page, PROFILES.farmer.email, 'not-the-password')
    await expect(page.getByText('Invalid login credentials')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('LGU staff waiting for approval cannot get in', async ({ page }) => {
    await mockSupabase(page)
    await fillLogin(page, 'pending@example.test', 'secret123')
    await expect(page.getByText(/waiting for Admin approval/)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('.sidebar')).toHaveCount(0)
    // The message stays put instead of flashing by.
    await page.waitForTimeout(800)
    await expect(page.getByText(/waiting for Admin approval/)).toBeVisible()
  })

  test('a disabled farmer is told the account is disabled', async ({ page }) => {
    const data = seed()
    data.profiles.find((p) => p.id === IDS.farmer).is_active = false
    await mockSupabase(page, { overrides: data })
    await fillLogin(page, PROFILES.farmer.email, 'secret123')
    await expect(page.getByText(/account has been disabled/)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('registering checks that the passwords match', async ({ page }) => {
    const backend = await mockSupabase(page)
    await page.goto('/register')
    await page.getByLabel('Full name').fill('New Farmer')
    await pick(page, 'Purok', 'Purok Anahaw')
    await page.getByLabel('Email address').fill('new@example.test')
    await page.getByLabel('Password', { exact: true }).fill('secret123')
    await page.getByLabel('Confirm password').fill('different')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('Passwords do not match.')).toBeVisible()
    expect(backend.authCalls.filter((c) => c.path.endsWith('/signup'))).toHaveLength(0)
  })

  test('registering as LGU staff sends a request that waits for admin approval', async ({ page }) => {
    const backend = await mockSupabase(page)
    await page.goto('/register')
    await page.getByLabel('LGU Staff').check()
    await expect(page.getByText(/require approval from an AgriVista Admin/)).toBeVisible()
    await page.getByLabel('Full name').fill('Lia Staff')
    await pick(page, 'Purok', 'Purok Anahaw')
    await page.getByLabel('Email address').fill('lia@example.test')
    await page.getByLabel('Password', { exact: true }).fill('secret123')
    await page.getByLabel('Confirm password').fill('secret123')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('Registration received.')).toBeVisible()
    const signup = backend.authCalls.find((c) => c.path.endsWith('/signup'))
    expect(signup.body.data).toMatchObject({ role: 'lgu_staff', full_name: 'Lia Staff', purok: 'Purok Anahaw' })
  })

  test('forgot password sends a reset link', async ({ page }) => {
    const backend = await mockSupabase(page)
    await page.goto('/forgot-password')
    await page.getByRole('textbox').fill('farmer@example.test')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByRole('status')).toBeVisible()
    expect(backend.authCalls.some((c) => c.path.endsWith('/recover'))).toBe(true)
  })
})

test.describe('farmer edit-mode actions', () => {
  test('adding a note, uploading a photo and starting a crop cycle', async ({ page }) => {
    const backend = await mockSupabase(page, { as: 'farmer' })
    await page.goto(`/fields/${IDS.fieldApproved}?edit=1`)

    await page.getByPlaceholder('Add a note or remark...').fill('Checked the irrigation canal')
    await page.getByRole('button', { name: 'Add Note' }).click()
    await expect(page.getByText('Checked the irrigation canal')).toBeVisible()
    expect(backend.writes.find((w) => w.table === 'field_notes').body).toMatchObject({ field_id: IDS.fieldApproved, author_id: IDS.farmer, content: 'Checked the irrigation canal', is_private: false })

    await page.locator('label', { hasText: 'Upload Photo' }).locator('input[type=file]').setInputFiles({ name: 'field.png', mimeType: 'image/png', buffer: PNG })
    await expect.poll(() => backend.writes.find((w) => w.table === 'field_media')?.body).toMatchObject({ field_id: IDS.fieldApproved, media_type: 'photo' })
    // The upload went into the field's own folder, which the storage policy allows.
    expect(backend.writes.find((w) => w.table === 'field_media').body.file_url).toContain(`/${IDS.fieldApproved}/`)

    await page.getByLabel('Planting date').fill('2026-11-01')
    await page.getByRole('button', { name: 'Start New Cycle' }).click()
    await expect.poll(() => backend.writes.find((w) => w.table === 'crop_cycles')?.body).toMatchObject({ field_id: IDS.fieldApproved, planting_date: '2026-11-01' })
  })

  test('a 360 photo opens in a full-screen viewer and closes with Escape', async ({ page }) => {
    const data = seed()
    data.field_media = [{ id: 'm1', field_id: IDS.fieldApproved, file_url: PIXEL, media_type: 'panorama_360', caption: null, field_condition: null, created_at: new Date().toISOString() }]
    await mockSupabase(page, { as: 'farmer', overrides: data })
    await page.goto(`/fields/${IDS.fieldApproved}`)
    const thumb = page.getByRole('button', { name: /360°/ })
    // iPhone fix: the thumbnail must load with cross-origin access, like the viewer does.
    await expect(thumb.locator('img')).toHaveAttribute('crossorigin', 'anonymous')
    await thumb.click()
    const viewer = page.getByRole('dialog', { name: '360° viewer' })
    await expect(viewer).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(viewer).toHaveCount(0)
  })
})

test.describe('LGU staff management pages', () => {
  test('announcements are sent to farmers as notifications', async ({ page }) => {
    const backend = await mockSupabase(page, { as: 'lgu' })
    await page.goto('/lgu/announcements')
    await page.getByPlaceholder('Title').fill('Fertilizer distribution')
    await page.getByPlaceholder('Message').fill('Bring your farmer ID on Friday.')
    await pick(page, 'Target purok', 'Purok Malinawon')
    await page.getByRole('button', { name: 'Send Announcement' }).click()
    await expect(page.getByText('Sent to 1 farmer.')).toBeVisible()
    expect(backend.writes.find((w) => w.table === 'announcements').body).toMatchObject({ title: 'Fertilizer distribution', target_purok: 'Purok Malinawon' })
    const sent = backend.writes.find((w) => w.table === 'notifications')
    expect(sent.body[0]).toMatchObject({ user_id: IDS.farmer })
  })

  test('Farmers page can disable and re-enable an account', async ({ page }) => {
    const backend = await mockSupabase(page, { as: 'lgu' })
    await page.goto('/lgu/users')
    const row = page.locator('tbody tr', { hasText: 'Fe Farmer' })
    await expect(row.getByText('Active')).toBeVisible()
    await row.getByRole('button', { name: 'Disable' }).click()
    await expect(row.getByText('Disabled')).toBeVisible()
    expect(backend.writes.find((w) => w.table === 'profiles').body).toEqual({ is_active: false })
    await row.getByRole('button', { name: 'Enable' }).click()
    await expect(row.getByText('Active')).toBeVisible()
  })

  test('Activity logs page loads', async ({ page }) => {
    await mockSupabase(page, { as: 'lgu' })
    await page.goto('/lgu/activity')
    await expect(page.getByRole('heading', { name: 'Activity log' })).toBeVisible()
  })
})

test.describe('admin user management', () => {
  const users = [
    { id: IDS.farmer, full_name: 'Fe Farmer', email: 'farmer@example.test', role: 'farmer', purok: 'Purok Malinawon', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
    { id: IDS.lgu, full_name: 'Liza LGU', email: 'lgu@example.test', role: 'lgu_staff', purok: 'Purok Malipayon', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
    { id: IDS.admin, full_name: 'Ana Admin', email: 'admin@example.test', role: 'admin', purok: null, is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
  ]

  test('lists every account, can search, and deleting asks first', async ({ page }) => {
    const backend = await mockSupabase(page, { as: 'admin', rpc: { admin_list_users: users } })
    await page.goto('/admin/users')
    await expect(page.locator('tbody tr')).toHaveCount(3)
    await page.getByLabel('Search users').fill('liza')
    await expect(page.locator('tbody tr')).toHaveCount(1)
    await page.getByLabel('Search users').fill('')
    const row = page.locator('tbody tr', { hasText: 'Fe Farmer' })
    await row.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(/Permanently delete Fe Farmer/)).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    expect(backend.rpcCalls.filter((c) => c.name === 'admin_delete_user')).toHaveLength(0)
    await row.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Yes, delete' }).click()
    await expect.poll(() => backend.rpcCalls.find((c) => c.name === 'admin_delete_user')?.body).toEqual({ p_user_id: IDS.farmer })
  })

  test('an admin cannot delete their own account from the list', async ({ page }) => {
    await mockSupabase(page, { as: 'admin', rpc: { admin_list_users: users } })
    await page.goto('/admin/users')
    await expect(page.locator('tbody tr', { hasText: 'Ana Admin' }).getByRole('button', { name: 'Delete' })).toHaveCount(0)
  })
})

test.describe('night theme', () => {
  test('dashboard cards switch to dark colours', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.addInitScript(() => localStorage.setItem('agrivista.appearance', JSON.stringify({ theme: 'dark' })))
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const background = await page.locator('.stat-card').first().evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(background).not.toBe('rgb(255, 255, 255)')
  })
})
