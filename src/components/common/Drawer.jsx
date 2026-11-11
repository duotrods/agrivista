import { useEffect } from 'react'

/** Right-hand slide-over panel: header, scrolling body, and an optional pinned footer. */
export function Drawer({ title, onClose, busy = false, footer, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, busy])

  return (
    <div className="drawer-root" onClick={busy ? undefined : onClose}>
      <aside role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <h2 id="drawer-title">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="drawer-close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-footer">{footer}</footer>}
      </aside>
    </div>
  )
}
