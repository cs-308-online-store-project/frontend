import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user:', error);
        }
      }
    };

    loadUser();

    // Listen for auth updates
    const handleAuthUpdate = () => {
      loadUser();
    };

    window.addEventListener('authUpdated', handleAuthUpdate);

    return () => {
      window.removeEventListener('authUpdated', handleAuthUpdate);
    };
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          URBAN THREADS
        </Link>

        {/* Desktop Navigation */}
        <div style={styles.desktopMenu}>
          <Link to="/products" style={styles.navLink}>
            Products
          </Link>

          {user ? (
            <>
              {/* Cart Icon */}
              <Link to="/cart" style={styles.cartLink}>
                🛒 Cart
                <span style={styles.cartBadge}>0</span>
              </Link>

              {/* User Dropdown */}
              <div style={styles.dropdownContainer}>
                <button
                  style={styles.userButton}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  👤 {user.name}
                  <span style={styles.dropdownArrow}>▼</span>
                </button>

                {isDropdownOpen && (
                  <div style={styles.dropdown}>
                    <Link
                      to="/profile"
                      style={styles.dropdownItem}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      style={styles.dropdownItem}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <hr style={styles.divider} />
                    <button
                      style={{ ...styles.dropdownItem, ...styles.logoutButton }}
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.authButton}>
                Login
              </Link>
              <Link
                to="/register"
                style={{ ...styles.authButton, ...styles.registerButton }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          style={styles.hamburger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div style={styles.mobileMenu}>
          <Link
            to="/products"
            style={styles.mobileLink}
            onClick={() => setIsMenuOpen(false)}
          >
            Products
          </Link>

          {user ? (
            <>
              <Link
                to="/cart"
                style={styles.mobileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                🛒 Cart (0)
              </Link>
              <Link
                to="/profile"
                style={styles.mobileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/orders"
                style={styles.mobileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                My Orders
              </Link>
              <button
                style={{ ...styles.mobileLink, ...styles.logoutButton }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={styles.mobileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={styles.mobileLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: '1rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '0.1em',
    color: 'white',
    textDecoration: 'none',
    transition: 'color 0.3s',
  },
  desktopMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.3s',
  },
  cartLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cartBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '700',
    marginLeft: '0.25rem',
  },
  dropdownContainer: {
    position: 'relative',
  },
  userButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
  },
  dropdownArrow: {
    fontSize: '0.7rem',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    minWidth: '180px',
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    padding: '0.75rem 1rem',
    color: '#333',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'background-color 0.2s',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e0e0e0',
    margin: '0.25rem 0',
  },
  logoutButton: {
    color: '#dc3545',
    fontWeight: '600',
  },
  authButton: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    border: '2px solid white',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  registerButton: {
    backgroundColor: 'white',
    color: '#1a1a1a',
  },
  hamburger: {
    display: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  mobileMenu: {
    display: 'none',
    flexDirection: 'column',
    backgroundColor: '#2d2d2d',
    padding: '1rem',
    gap: '0.5rem',
  },
  mobileLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    transition: 'background-color 0.2s',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
  },
};

// Hover effects
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      a:hover, button:hover {
        opacity: 0.8;
      }
    `, styleSheet.cssRules.length);
    
    styleSheet.insertRule(`
      @media (max-width: 768px) {
        .hamburger { display: block !important; }
        .desktopMenu { display: none !important; }
        .mobileMenu { display: flex !important; }
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Ignore
  }
}

export default Navbar;