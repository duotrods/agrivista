import { Link } from 'react-router-dom'

export function AuthShell({ title, description, children }) {
  return (
    <main className="auth-layout" id="main-content">
      <section className="auth-story">
        <p className="eyebrow">ROOTED IN COMMUNITY</p>
        <h2>Better insights.<br />Stronger harvests.</h2>
        <p>A clearer view of our fields, for the people who grow our future.</p>
        <div className="field-art" aria-hidden="true"><div /><div /><div /><span>Banaybanay · Davao Oriental</span></div>
        <Link to="/public" className="story-link">Explore our agricultural community <span>↗</span></Link>
      </section>
      <section className="auth-card"><p className="eyebrow">WELCOME TO AGRIVISTA</p><h1>{title}</h1><p className="page-description">{description}</p>{children}</section>
    </main>
  )
}
