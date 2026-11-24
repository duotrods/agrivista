import { expect, test } from '@playwright/test'
import { IDS } from './support/data.js'
import { mockSupabase } from './support/mockSupabase.js'

test.describe('details found in the visual sweep', () => {
  test('Profile opened directly (page refresh) shows the real name and purok, and saving keeps them', async ({ page }) => {
    const backend = await mockSupabase(page, { as: 'farmer' })
    await page.goto('/profile')
    await expect(page.getByLabel('Full name')).toHaveValue('Fe Farmer')
    await expect(page.getByRole('combobox', { name: 'Purok', exact: true })).toContainText('Purok Malinawon')
    await page.getByLabel('Full name').fill('Fe Farmer Reyes')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect.poll(() => backend.writes.find((w) => w.table === 'profiles')?.body).toMatchObject({ full_name: 'Fe Farmer Reyes', purok: 'Purok Malinawon' })
    await expect(page.getByText(/Profile saved/)).toBeVisible()
  })

  test('Profile password change checks that both passwords match', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.goto('/profile')
    await page.getByLabel('New password', { exact: true }).fill('secret123')
    await page.getByLabel('Confirm new password').fill('different1')
    await page.getByRole('button', { name: 'Update password' }).click()
    await expect(page.getByText('Passwords do not match.')).toBeVisible()
  })

  test('an empty photo section says so', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.goto(`/fields/${IDS.fieldPending}`)
    await expect(page.getByText('No photos or videos yet.')).toBeVisible()
  })

  test('farmer dashboard lists upcoming harvests and notifications in cards', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.goto('/')
    const harvest = page.locator('section', { hasText: 'Upcoming harvest' })
    await expect(harvest.getByRole('link', { name: 'Palayan sa Taas' })).toBeVisible()
    const notes = page.locator('section', { hasText: 'Notifications' }).last()
    await expect(notes.getByText('Field approved')).toBeVisible()
    await expect(notes.getByRole('link', { name: 'View all' })).toBeVisible()
  })

  test('Notifications page filters unread and marks everything read', async ({ page }) => {
    const backend = await mockSupabase(page, { as: 'farmer' })
    await page.goto('/notifications')
    await expect(page.getByRole('button', { name: 'Unread (1)' })).toBeVisible()
    await page.getByRole('button', { name: 'Unread (1)' }).click()
    await expect(page.getByText('Field approved')).toBeVisible()
    await page.getByRole('button', { name: 'Mark all as read' }).click()
    await expect(page.getByRole('button', { name: 'Unread (0)' })).toBeVisible()
    await expect(page.getByText('No unread notifications.')).toBeVisible()
    expect(backend.writes.some((w) => w.table === 'notifications' && w.method === 'PATCH')).toBe(true)
  })

  test('Farmers page expands a farmer to show their fields', async ({ page }) => {
    await mockSupabase(page, { as: 'lgu' })
    await page.goto('/lgu/users')
    await page.getByRole('button', { name: '2 fields' }).click()
    await expect(page.getByRole('link', { name: 'Palayan sa Taas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Test Field' })).toBeVisible()
  })

  test('LGU map search and filters sit in chips and narrow the markers count', async ({ page }) => {
    await mockSupabase(page, { as: 'lgu' })
    await page.goto('/lgu/map')
    await expect(page.getByText('2 fields')).toBeVisible()
    await page.getByLabel('Search fields').fill('palayan')
    await expect(page.getByText('1 field', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByText('2 fields')).toBeVisible()
  })

  test('Verify Fields tabs switch lists', async ({ page }) => {
    await mockSupabase(page, { as: 'lgu' })
    await page.goto('/lgu/verify')
    await expect(page.getByText('Test Field')).toBeVisible()
    await page.getByRole('tab', { name: 'Approved (1)' }).click()
    await expect(page.getByText('Palayan sa Taas')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View' })).toBeVisible()
    await page.getByRole('tab', { name: 'Rejected (0)' }).click()
    await expect(page.getByText('No fields in this list.')).toBeVisible()
  })
})

test.describe('phones', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('public visitors reach Log in and Get started through the menu', async ({ page }) => {
    await mockSupabase(page)
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(nav.getByRole('link', { name: 'Log in' })).toBeHidden()
    await nav.getByRole('button', { name: 'Open menu' }).click()
    await expect(nav.getByRole('link', { name: 'Log in' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Get started' })).toBeVisible()
    await nav.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(nav.getByRole('link', { name: 'Log in' })).toBeHidden()
  })

  test('status tags on summary cards do not cover the card titles', async ({ page }) => {
    await mockSupabase(page, { as: 'farmer' })
    await page.goto('/')
    await expect(page.locator('.stat-card').first()).toBeVisible()
    await expect(page.locator('.stat-head .stat-pill')).toHaveCount(1)
    await expect(page.locator('.stat-head .stat-pill')).toBeHidden()
  })

  test('no page needs sideways scrolling on a phone', async ({ page }) => {
    await mockSupabase(page, { as: 'lgu' })
    for (const path of ['/', '/lgu/fields', '/lgu/verify', '/lgu/users', '/lgu/reports', '/lgu/agricultural-reports', '/lgu/crop-monitoring', '/notifications', '/profile']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1)
    }
  })
})
