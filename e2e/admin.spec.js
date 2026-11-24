import { expect, test } from '@playwright/test'
import { IDS } from './support/data.js'
import { mockSupabase } from './support/mockSupabase.js'

test.describe('admin: LGU staff registration requests', () => {
  let backend
  test.beforeEach(async ({ page }) => { backend = await mockSupabase(page, { as: 'admin' }) })

  test('pending requests and approved staff are listed separately', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Pending approval \(1\)/ })).toBeVisible()
    await expect(page.locator('tbody tr', { hasText: 'Pia Pending' })).toBeVisible()
    await expect(page.locator('tbody tr', { hasText: 'Alex Approved' }).getByRole('button', { name: 'Revoke' })).toBeVisible()
  })

  test('approving a request activates the account and logs it', async ({ page }) => {
    await page.goto('/')
    await page.locator('tbody tr', { hasText: 'Pia Pending' }).getByRole('button', { name: 'Approve' }).click()
    await expect.poll(() => backend.writes.find((w) => w.method === 'PATCH' && w.table === 'profiles')?.body).toEqual({ is_active: true })
    await expect.poll(() => backend.writes.find((w) => w.table === 'activity_logs')?.body.action).toBe('approved_lgu_staff')
    await expect(page.getByText('LGU staff account approved')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Approved LGU staff/ })).toBeVisible()
  })

  test('rejecting a request asks first, then removes it', async ({ page }) => {
    await page.goto('/')
    await page.locator('tbody tr', { hasText: 'Pia Pending' }).getByRole('button', { name: 'Reject' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reject this registration?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    expect(backend.rpcCalls.filter((c) => c.name === 'admin_delete_user')).toHaveLength(0)

    await page.locator('tbody tr', { hasText: 'Pia Pending' }).getByRole('button', { name: 'Reject' }).click()
    await page.getByRole('dialog', { name: 'Reject this registration?' }).getByRole('button', { name: 'Reject' }).click()
    await expect.poll(() => backend.rpcCalls.find((c) => c.name === 'admin_delete_user')?.body).toEqual({ p_user_id: IDS.pendingStaff })
    await expect(page.getByText('LGU staff registration rejected and removed.')).toBeVisible()
    await expect(page.locator('tbody tr', { hasText: 'Pia Pending' })).toHaveCount(0)
  })

  test('the admin sidebar only offers admin pages', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.sidebar')
    await expect(sidebar.getByRole('link', { name: 'LGU Approvals' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Users' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Rice Fields' })).toHaveCount(0)
  })
})
