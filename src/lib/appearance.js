import { useSyncExternalStore } from 'react'

// Per-device display preferences (theme, text size, bold text), kept in localStorage.
const STORAGE_KEY = 'agrivista.appearance'
const CHANGE_EVENT = 'agrivista:appearance'
const DEFAULTS = { theme: 'system', textSize: 'default', bold: false }

export function loadAppearance() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

function resolveTheme(theme) {
  if (theme !== 'system') return theme
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyAppearance(appearance) {
  const root = document.documentElement
  root.dataset.theme = resolveTheme(appearance.theme)
  root.dataset.text = appearance.textSize
  root.dataset.bold = appearance.bold ? 'on' : 'off'
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function saveAppearance(appearance) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance)) } catch { /* storage unavailable */ }
  applyAppearance(appearance)
}

export const DEFAULT_APPEARANCE = DEFAULTS

/** Applies the saved preferences and follows the OS theme while set to "system". */
export function initAppearance() {
  applyAppearance(loadAppearance())
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = loadAppearance()
    if (current.theme === 'system') applyAppearance(current)
  })
}

/** The theme in effect right now: 'light' or 'dark'. */
export function useResolvedTheme() {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener(CHANGE_EVENT, notify)
      return () => window.removeEventListener(CHANGE_EVENT, notify)
    },
    () => document.documentElement.dataset.theme ?? 'light',
  )
}
