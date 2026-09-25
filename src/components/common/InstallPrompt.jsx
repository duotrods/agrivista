import { useEffect, useState } from 'react'
import logo from '../../assets/logo.png'

const DISMISSED_KEY = 'agrivista_install_dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isMobileDevice() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if (isStandalone() || !isMobileDevice() || localStorage.getItem(DISMISSED_KEY)) return

    if (isIOSDevice()) {
      setPlatform('ios')
      setVisible(true)
      return
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setPlatform('android')
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-2000 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center gap-3">
          <img src={logo} alt="AgriVista" className="h-12 w-12" />
          <div>
            <p className="font-semibold text-gray-900">Install AgriVista</p>
            <p className="text-xs text-gray-500">Add it to your home screen for quick, app-like access.</p>
          </div>
        </div>

        {platform === 'ios' ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p>
              1. Tap the <strong>Share</strong> button{' '}
              <span aria-hidden="true" className="inline-block rounded border px-1.5 py-0.5 text-xs">
                ⬆︎
              </span>{' '}
              in Safari's toolbar.
            </p>
            <p className="mt-2">
              2. Scroll down and tap <strong>"Add to Home Screen."</strong>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-700">
            Install this app on your device for offline access and a full-screen experience.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Maybe later
          </button>
          {platform === 'android' && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Install
            </button>
          )}
          {platform === 'ios' && (
            <button
              type="button"
              onClick={dismiss}
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
