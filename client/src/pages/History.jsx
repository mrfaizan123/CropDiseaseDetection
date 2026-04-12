import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../services/helpers.js';

function History() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/detection/history');
      setHistory(res.data.history);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#2c5f2d' }}>Detection History</h1>
      
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <p>No detection history found.</p>
          <button onClick={() => navigate('/predict')} style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#2c5f2d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>Start First Detection</button>
        </div>
      ) : (
        <div>
          {history.map((scan) => (
            <div key={scan._id} style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <p><strong>Date:</strong> {formatDate(scan.createdAt)}</p>
                  <p><strong>Status:</strong> 
                    <span style={{
                      marginLeft: '10px',
                      padding: '4px 8px',
                      borderRadius: '20px',
                      background: scan.overallResult === 'Healthy' ? '#dcfce7' : '#fee2e2',
                      color: scan.overallResult === 'Healthy' ? '#16a34a' : '#dc2626'
                    }}>
                      {scan.overallResult}
                    </span>
                  </p>
                  <p><strong>Images:</strong> {scan.images.length}</p>
                </div>
                <button onClick={() => setSelectedScan(selectedScan === scan._id ? null : scan._id)} style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                  {selectedScan === scan._id ? 'Hide Details' : 'View Details'}
                </button>
              </div>
              
              {selectedScan === scan._id && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  {scan.results.map((result, idx) => (
                    <div key={idx} style={{
                      marginTop: idx > 0 ? '15px' : 0,
                      padding: '15px',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <h4>Result {idx + 1}: {result.diseaseName}</h4>
                      <p><strong>Confidence:</strong> {result.confidence}%</p>
                      <p><strong>Treatment:</strong> {result.treatment}</p>
                      <p><strong>Prevention:</strong> {result.prevention}</p>
                      {result.organicRemedy && (
                        <p><strong>Organic Remedy:</strong> {result.organicRemedy}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;