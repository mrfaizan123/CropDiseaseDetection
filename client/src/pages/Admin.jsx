import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import Loader from '../components/Loader.jsx';

function Admin() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAdminData();
  }, [isAuthenticated, user]);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, farmersRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/farmers')
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setFarmers(farmersRes.data.farmers);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#2c5f2d' }}>Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button onClick={() => setActiveTab('overview')} style={{
          padding: '10px 20px',
          background: activeTab === 'overview' ? '#2c5f2d' : 'transparent',
          color: activeTab === 'overview' ? 'white' : '#4a5568',
          border: 'none',
          borderRadius: '5px 5px 0 0',
          cursor: 'pointer'
        }}>Overview</button>
        <button onClick={() => setActiveTab('farmers')} style={{
          padding: '10px 20px',
          background: activeTab === 'farmers' ? '#2c5f2d' : 'transparent',
          color: activeTab === 'farmers' ? 'white' : '#4a5568',
          border: 'none',
          borderRadius: '5px 5px 0 0',
          cursor: 'pointer'
        }}>Farmers Management</button>
      </div>

      {activeTab === 'overview' && analytics && (
        <div style={{ marginTop: '30px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ background: '#e0f2fe', padding: '20px', borderRadius: '10px' }}>
              <h3>Total Farmers</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.totalFarmers}</p>
            </div>
            <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '10px' }}>
              <h3>Total Detections</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.totalDetections}</p>
            </div>
            <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '10px' }}>
              <h3>Today's Detections</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics.todayDetections}</p>
            </div>
          </div>

          <div style={{ marginTop: '30px', background: '#f3f4f6', padding: '20px', borderRadius: '10px' }}>
            <h3>Top Diseases</h3>
            {analytics.topDiseases?.map((disease, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ddd' }}>
                <span>{disease._id}</span>
                <span style={{ fontWeight: 'bold' }}>{disease.count} detections</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'farmers' && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#2c5f2d', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map((farmer) => (
                  <tr key={farmer._id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>{farmer.name}</td>
                    <td style={{ padding: '12px' }}>{farmer.email}</td>
                    <td style={{ padding: '12px' }}>{farmer.phone || '-'}</td>
                    <td style={{ padding: '12px' }}>{new Date(farmer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;