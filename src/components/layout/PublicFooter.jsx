import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

// Multi-column footer for visitors who are not signed in.
export function PublicFooter() {
  return (
    <footer className="pf print:hidden">
      <div className="pf-inner">
        <div className="pf-brand">
          <Link to="/" className="brand"><img src={logo} alt="" /><span>AgriVista<span className="brand-caption">GROWING TOGETHER</span></span></Link>
          <p>One trusted record of the rice fields of Barangay Caganganan, shared by farmers and the local government.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/map">Rice field map</Link>
          <Link to="/statistics">Statistics</Link>
          <Link to="/crop-status">Crop status</Link>
          <Link to="/about">About</Link>
        </div>
        <div>
          <h3>Get started</h3>
          <Link to="/register">Register as a farmer</Link>
          <Link to="/login">Log in</Link>
          <Link to="/forgot-password">Forgot password</Link>
        </div>
        <div>
          <h3>Find us</h3>
          <p>Barangay Caganganan<br />Banaybanay, Davao Oriental<br />Philippines</p>
        </div>
      </div>
      <div className="pf-bottom">
        <span>© {new Date().getFullYear()} AgriVista. All rights reserved.</span>
        <span>Connecting fields. Supporting communities.</span>
      </div>
    </footer>
  )
}
