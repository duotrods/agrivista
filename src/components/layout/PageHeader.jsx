import { useAuth } from '../../hooks/useAuth'

// Signed-in pages use a compact title (same size as the top bar's page name).
// Public pages (they pass an eyebrow) and logged-out visitors keep the full hero heading.
export function PageHeader({ eyebrow, title, description, children }) {
  const { user } = useAuth()
  if (user && !eyebrow) {
    return (
      <header className="page-header page-header-slim">
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {children && <div className="page-actions">{children}</div>}
      </header>
    )
  }
  return (
    <header className="page-header">
      <div><p className="eyebrow">{eyebrow ?? 'AgriVista workspace'}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  )
}
