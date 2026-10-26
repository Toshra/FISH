import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { Brand } from './Brand'

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          </button>
          <nav id="primary-navigation" className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Primary navigation">
            <a href="/#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="/#features" onClick={closeMenu}>Features</a>
            <NavLink to="/sign-in" onClick={closeMenu}>Teacher sign in</NavLink>
            <Link className="button button-small" to="/register" onClick={closeMenu}>Get started</Link>
          </nav>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <Brand />
            <p>A teacher-led space for celebrating participation and teamwork.</p>
          </div>
          <div>
            <h2>About this preview</h2>
            <p>All names and classroom examples shown here are fictional. No student records are public.</p>
          </div>
          <div>
            <h2>Project</h2>
            <Link to="/sign-in">Teacher sign in</Link>
            <a href="mailto:" aria-disabled="true" onClick={(event) => event.preventDefault()}>Support contact coming soon</a>
          </div>
        </div>
        <p className="footer-note">Independent classroom tool concept. Not affiliated with or endorsed by DepEd.</p>
      </footer>
    </div>
  )
}
