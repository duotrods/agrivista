import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mockSupabase.js'

test.describe('public pages', () => {
  test.beforeEach(async ({ page }) => { await mockSupabase(page) })

  test('landing page shows the hero, sections, counters and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Growing together')
    await expect(page.getByRole('link', { name: 'Explore the rice field map' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Tools for farmers and the LGU/ })).toBeVisible()
    await expect(page.getByText('Field registration').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /From the field to a shared record/ })).toBeVisible()
    // Counters animate up to the approved-field total (2 + 1 from the stats data).
    await expect(page.locator('.lp-stats strong').first()).toHaveText('3')
    await expect(page.getByText('Barangay Caganganan').last()).toBeVisible()
  })

  test('top navigation reaches every public page', async ({ page }) => {
    await page.goto('/')
    for (const [link, heading] of [['Rice field map', /Rice fields across Caganganan/], ['Statistics', /Rice farming at a glance/], ['Crop status', /Where our rice crops stand/], ['About', /A shared view of our rice fields/]]) {
      await page.getByRole('navigation').getByRole('link', { name: link }).click()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    }
  })

  test('statistics page shows totals and charts from the approved-field data', async ({ page }) => {
    await page.goto('/statistics')
    await expect(page.getByText('Approved rice fields').first()).toBeVisible()
    await expect(page.locator('.stat-value').first()).toHaveText('03')
    await expect(page.getByText('Approved fields by purok')).toBeVisible()
    await expect(page.locator('.apexcharts-canvas').first()).toBeVisible()
  })

  test('crop status page lists every stage and the purok table', async ({ page }) => {
    await page.goto('/crop-status')
    for (const stage of ['Fallow', 'Land preparation', 'Planted', 'Growing', 'Harvested']) {
      await expect(page.locator('.stat-title', { hasText: stage })).toBeVisible()
    }
    await expect(page.getByRole('cell', { name: 'Purok Malinawon' })).toBeVisible()
    await expect(page.locator('.stage-bar')).toBeVisible()
  })

  test('map page renders the map with only approved-field markers and no filters', async ({ page }) => {
    await page.goto('/map')
    await expect(page.locator('.leaflet-container')).toBeVisible()
    await expect(page.getByPlaceholder('Search purok, variety, status')).toHaveCount(0)
    await expect(page.locator('.stat-value').first()).toHaveText('03')
  })

  test('about page explains the audiences and privacy', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { name: 'For farmers', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'For LGU staff', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Your privacy comes first/ })).toBeVisible()
  })

  test('visitors always get the light theme, even with night mode saved', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('agrivista.appearance', JSON.stringify({ theme: 'dark' })))
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('login page requires an email and password', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /log in/i }).first()).toBeVisible()
    await page.getByRole('button', { name: /^log in$/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('signed-out visitors are sent to login from protected pages', async ({ page }) => {
    await page.goto('/fields')
    await expect(page).toHaveURL(/\/login/)
  })
})
