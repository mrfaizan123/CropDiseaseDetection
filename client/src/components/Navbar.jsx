import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useState, useEffect, useRef } from 'react';
import logo from '../components/Farmguru.png';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on window resize (if screen becomes large)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const navStyles = {
    navbar: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: isScrolled ? '#1a3f1a' : '#2c5f2d',
      color: 'white',
      transition: 'all 0.3s ease',
      boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    logoContainer: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer'
    },
    logo: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease'
    },
    brandText: {
      color: 'white',
      textDecoration: 'none',
      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)'
    },
    desktopNav: {
      display: 'flex',
      gap: '25px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    mobileMenuButton: {
      display: 'none',
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '5px',
      transition: 'background 0.3s ease'
    },
    mobileNav: {
      display: 'none',
      flexDirection: 'column',
      width: '100%',
      paddingTop: '15px',
      gap: '15px'
    },
    link: {
      color: 'white',
      textDecoration: 'none',
      padding: '8px 12px',
      borderRadius: '5px',
      transition: 'all 0.3s ease',
      display: 'inline-block'
    },
    welcomeText: {
      color: '#ffd700',
      padding: '8px 12px'
    },
    logoutButton: {
      background: '#dc2626',
      color: 'white',
      border: 'none',
      padding: '8px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500'
    },
    activeLink: {
      background: 'rgba(255,255,255,0.1)'
    }
  };

  // Responsive styles
  const mediaQueries = `
    @media (max-width: 768px) {
      .desktop-nav {
        display: none !important;
      }
      .mobile-menu-button {
        display: block !important;
      }
      .mobile-nav.open {
        display: flex !important;
      }
    }
  `;

  // Add hover effects dynamically
  const handleMouseEnter = (e) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  const handleLogoHover = (e) => {
    e.currentTarget.style.transform = 'scale(1.05)';
  };

  const handleLogoLeave = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  const handleLogoutHover = (e) => {
    e.currentTarget.style.background = '#b91c1c';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const handleLogoutLeave = (e) => {
    e.currentTarget.style.background = '#dc2626';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <>
      <style>{mediaQueries}</style>
      <nav style={navStyles.navbar}>
        <div style={navStyles.container}>
          {/* Logo and Brand */}
          <div 
            style={navStyles.logoContainer}
            onClick={() => navigate('/')}
          >
            <img 
              src={logo} 
              alt="FarmGuru Logo"
              style={navStyles.logo}
              onMouseEnter={handleLogoHover}
              onMouseLeave={handleLogoLeave}
            />
            <Link to="/" style={navStyles.brandText}>
              FarmGuru
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={navStyles.desktopNav}>
            <Link 
              to="/" 
              style={navStyles.link}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link 
                  to="/dashboard" 
                  style={navStyles.link}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/history" 
                  style={navStyles.link}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  History
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    style={navStyles.link}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}

            {!isAuthenticated ? (
              <Link 
                to="/login" 
                style={navStyles.link}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                Login
              </Link>
            ) : (
              <>
                <span style={navStyles.welcomeText}>
                  Welcome, {user?.name || user?.email}
                </span>
                <button 
                  onClick={handleLogout}
                  style={navStyles.logoutButton}
                  onMouseEnter={handleLogoutHover}
                  onMouseLeave={handleLogoutLeave}
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            style={navStyles.mobileMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          {/* Mobile Navigation */}
          <div 
            ref={menuRef}
            className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}
            style={navStyles.mobileNav}
          >
            <Link 
              to="/" 
              style={navStyles.link}
              onClick={handleLinkClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link 
                  to="/dashboard" 
                  style={navStyles.link}
                  onClick={handleLinkClick}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/history" 
                  style={navStyles.link}
                  onClick={handleLinkClick}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  History
                </Link>
                {user?.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    style={navStyles.link}
                    onClick={handleLinkClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}

            {!isAuthenticated ? (
              <Link 
                to="/login" 
                style={navStyles.link}
                onClick={handleLinkClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                Login
              </Link>
            ) : (
              <>
                <span style={navStyles.welcomeText}>
                  Welcome, {user?.name || user?.email}
                </span>
                <button 
                  onClick={handleLogout}
                  style={navStyles.logoutButton}
                  onMouseEnter={handleLogoutHover}
                  onMouseLeave={handleLogoutLeave}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
