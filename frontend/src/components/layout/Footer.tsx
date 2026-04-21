import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import s from './Footer.module.scss'

export function Footer() {
  const { user } = useAuth()

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.top}>
          <div>
            <img src="/images/logo-banner.png" alt="The Distillist" className={s.logo} />
            <p className={s.tagline}>Where Every Sip Has a Story</p>
          </div>

          <div>
            <h4 className={s.linksHeading}>Explore</h4>
            <ul className={s.linksList}>
              <li><Link to="/#features" className={s.link}>Features</Link></li>
              {user ? (
                <>
                  <li><Link to="/recipes" className={s.link}>Recipe Vault</Link></li>
                  <li><Link to="/favorites" className={s.link}>Favorites</Link></li>
                  <li><Link to="/wishlist" className={s.link}>Wishlist</Link></li>
                  <li><Link to="/my-recipes" className={s.link}>My Recipes</Link></li>
                  <li><Link to="/cabinet" className={s.link}>My Cabinet</Link></li>
                  <li><Link to="/profile" className={s.link}>My Profile</Link></li>
                  <li><Link to="/origin-stories" className={s.link}>Origin Stories</Link></li>
                </>
              ) : null}
              {!user ? (
                <li>
                  <Link to="/signup" className={s.link}>
                    Sign up
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h4 className={s.linksHeading}>Company</h4>
            <ul className={s.linksList}>
              <li><a href="#" className={s.link}>About Us</a></li>
              <li><a href="#" className={s.link}>Press</a></li>
              <li><a href="#" className={s.link}>Careers</a></li>
              <li><a href="#" className={s.link}>Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className={s.linksHeading}>Legal</h4>
            <ul className={s.linksList}>
              <li><a href="#" className={s.link}>Privacy Policy</a></li>
              <li><a href="#" className={s.link}>Terms of Service</a></li>
              <li><a href="#" className={s.link}>Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className={s.bottom}>
          <p className={s.copy}>
            © 2025 The Distillist. Crafted with <span className={s.heart}>♥</span> for those who appreciate the finer pour.<br />
            Drink responsibly. Must be of legal drinking age in your country.
          </p>
          <div className={s.socials}>
            <a href="#" title="Instagram" className={s.socialLink}>📸</a>
            <a href="#" title="Twitter / X" className={s.socialLink}>✖</a>
            <a href="#" title="Pinterest" className={s.socialLink}>📌</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
