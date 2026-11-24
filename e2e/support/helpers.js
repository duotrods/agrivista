import { expect } from '@playwright/test'

/** Choose an option in the app's custom dropdown by its accessible name. */
export async function pick(page, label, option) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  // The selected option carries a check mark in its name, so allow for it.
  const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  await page.getByRole('option', { name: new RegExp(`^${escaped}( ✓)?$`) }).click()
}

export const rootFontSize = (page) => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))

export async function expectNoWrite(writes, table) {
  expect(writes.filter((w) => w.table === table)).toHaveLength(0)
}
