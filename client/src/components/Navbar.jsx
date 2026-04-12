import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ 
      padding: '15px 30px', 
      background: '#2c5f2d', 
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="https://placehold.co/40x40/ffffff/2c5f2d?text=FG" alt="FarmGuru Logo" style={{ borderRadius: '8px' }} />
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
          FarmGuru
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
  
        
        {isAuthenticated && (
          <>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/history" style={{ color: 'white', textDecoration: 'none' }}>History</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin</Link>
            )}
          </>
        )}

        {!isAuthenticated ? (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            
          </>
        ) : (
          <>
            <span style={{ color: '#ffd700' }}>Welcome, {user?.name}</span>
            <button onClick={handleLogout} style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '5px 15px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;