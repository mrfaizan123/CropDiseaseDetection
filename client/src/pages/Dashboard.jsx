import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../services/helpers.js';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

// Professional Synthesis Audio Engine (Zero dependency, highly scalable)
const playAlarmBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Clean bell sound
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1); // Fade out naturally
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) { console.log('Audio disabled by browser policy'); }
};

const playWeatherWarningSpeech = (weatherDesc) => {
    try {
        if (!window.speechSynthesis) return;
        const msg = new SpeechSynthesisUtterance();
        msg.text = `Attention Farmer! Severe weather warning detected in your area. Expect ${weatherDesc}. Please take immediate preventative measures.`;
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
    } catch(e) {}
};

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherWarning, setWeatherWarning] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [userLocation, setUserLocation] = useState(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' or 'schemes'

  // Farming Calendar States
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('farmguru_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  // Govt Schemes State
  const [govLang, setGovLang] = useState('hi'); // 'hi' or 'en'
  const [govSchemes, setGovSchemes] = useState('');
  const [govPesticides, setGovPesticides] = useState('');
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [schemeTab, setSchemeTab] = useState('schemes'); // 'schemes' or 'pesticides'

  // Smart Crop Planning State
  const [planLang, setPlanLang] = useState('hi'); // 'hi' or 'en'
  const [cropInput, setCropInput] = useState('');
  const [smartPlan, setSmartPlan] = useState('');
  const [smartPlanSummary, setSmartPlanSummary] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planChatHistory, setPlanChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
    getUserLocation();
    fetchGovtSchemes(govLang);
    fetchGovtPesticides(govLang);
  }, [isAuthenticated]);

  // Calendar Alarm System (Strict 12 hours / 5 times => Every 2.4 hrs check)
  useEffect(() => {
    const checkCalendar = () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const dueTasks = tasks.filter(t => t.date === todayStr);
      
      if (dueTasks.length > 0) {
        dueTasks.forEach((t, i) => {
          setTimeout(() => {
            playAlarmBeep(); // Trigger Sound
            toast.custom((t_obj) => (
              <div style={{
                background: '#4CAF50',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(76,175,80,0.6)',
                border: '2px solid white',
                fontSize: '18px', fontWeight: 'bold', minWidth: '320px', textAlign: 'center'
              }}>
                🔔 FARM CALENDAR REMINDER 🔔<br/>
                <span style={{fontSize: '24px', display: 'block', margin: '10px 0'}}>{t.text}</span>
              </div>
            ), { duration: 6000, position: 'top-center' });
          }, i * 2000); 
        });
      }
    };

    // Run immediately
    checkCalendar();
    
    // 2.4 Hours Interval = 8640000 ms
    const interval = setInterval(checkCalendar, 8640000);
    return () => clearInterval(interval);
  }, [tasks]);

  const addTask = () => {
    if (!newTaskText || !newTaskDate) return toast.error('Enter task and date!');
    const newTask = { id: Date.now(), text: newTaskText, date: newTaskDate };
    const updatedTasks = [...tasks, newTask].sort((a,b) => new Date(a.date) - new Date(b.date));
    setTasks(updatedTasks);
    localStorage.setItem('farmguru_tasks', JSON.stringify(updatedTasks));
    setNewTaskText(''); setNewTaskDate('');
    toast.success('Task saved on your FarmGuru Calendar!');
  };
  const removeTask = (id) => {
    const filtered = tasks.filter(t => t.id !== id);
    setTasks(filtered);
    localStorage.setItem('farmguru_tasks', JSON.stringify(filtered));
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        API.get('/detection/dashboard'),
        API.get('/detection/history')
      ]);
      setStats(statsRes.data.stats);
      setRecentScans(historyRes.data.history.slice(0, 5));
    } catch (error) {} finally { setLoading(false); }
  };

  const fetchGovtSchemes = async (lang) => {
    setLoadingSchemes(true);
    try {
      const res = await API.post('/chatbot/schemes', { category: 'general', state: 'India', language: lang });
      if (res.data.success) setGovSchemes(res.data.schemes);
    } catch (e) {} finally { setLoadingSchemes(false); }
  };

  const fetchGovtPesticides = async (lang) => {
    setLoadingSchemes(true);
    try {
      const res = await API.post('/chatbot/pesticides', { state: 'India', language: lang });
      if (res.data.success) setGovPesticides(res.data.pesticides);
    } catch (e) {} finally { setLoadingSchemes(false); }
  };

  const handleGovLangSwitch = (lang) => {
    setGovLang(lang);
    fetchGovtSchemes(lang);
    fetchGovtPesticides(lang);
  };

  const getUserLocation = () => {
    setLocationStatus('loading');
    const cachedLat = localStorage.getItem('farmguru_lat');
    const cachedLon = localStorage.getItem('farmguru_lon');
    if (cachedLat && cachedLon) {
      setUserLocation({ lat: parseFloat(cachedLat), lon: parseFloat(cachedLon) });
      setLocationStatus('granted');
      fetchWeather(cachedLat, cachedLon);
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus('denied'); setWeatherLoading(false); fetchMandiPrices(); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        localStorage.setItem('farmguru_lat', latitude); localStorage.setItem('farmguru_lon', longitude);
        setUserLocation({ lat: latitude, lon: longitude });
        setLocationStatus('granted');
        await fetchWeather(latitude, longitude);
      },
      (error) => { setLocationStatus('denied'); setWeatherLoading(false); fetchMandiPrices(); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchWeather = async (lat, lon) => {
    setWeatherLoading(true);
    try {
      const res = await API.get(`/weather/current/${lat}/${lon}`);
      if (res.data.success) {
        setWeather(res.data.weather);
        fetchMandiPrices(res.data.weather.city); 
        fetchForecast(lat, lon); 
      } else { setWeather(null); fetchMandiPrices(); }
    } catch (error) { setWeather(null); fetchMandiPrices(); } finally { setWeatherLoading(false); }
  };

  const fetchForecast = async (lat, lon) => {
    try {
      const res = await API.get(`/weather/forecast/${lat}/${lon}`);
      if (res.data.success) {
        setForecast(res.data.forecast);
        // Find bad weather in the next 1-2 days
        const badWeather = res.data.forecast.find((d, idx) => 
          idx < 2 && ((d.description && (d.description.toLowerCase().includes('rain') || d.description.toLowerCase().includes('storm'))) || d.temp > 40 || d.temp < 5)
        );
        if (badWeather) {
          setWeatherWarning(badWeather);
          setTimeout(() => playWeatherWarningSpeech(badWeather.description), 1500);
        }
      }
    } catch(e) {}
  };

  const fetchMandiPrices = async (cityName) => {
    try {
      const url = cityName ? `/mandi/prices?location=${encodeURIComponent(cityName)}` : '/mandi/prices';
      const res = await API.get(url);
      setMandiPrices(res.data.prices.slice(0, 6)); 
    } catch (error) {}
  };

  // Smart Crop Plan Handlers
  const generateSmartPlan = async () => {
    if (!cropInput) return toast.error('Please enter a crop name');
    setPlanLoading(true);
    try {
      const res = await API.post('/chatbot/smart-plan', {
        crop: cropInput, location: weather?.city || 'India', language: planLang
      });
      if (res.data.success) {
        setSmartPlanSummary(res.data.summary || '');
        setSmartPlan(res.data.plan || res.data.fullPlan); // Use fullPlan for backward compatibility
        setPlanChatHistory([{ role: 'system', msg: `Questions about ${cropInput}? Ask anything in ${planLang === 'hi' ? 'Hindi or English!' : 'English!'}` }]);
        toast.success('Plan generated successfully!');
      }
    } catch (error) { toast.error('Failed to generate plan'); } finally { setPlanLoading(false); }
  };

  const handlePlanChat = async () => {
    if (!chatInput) return;
    setChatLoading(true);
    const userMsg = chatInput;
    setChatInput('');
    setPlanChatHistory(prev => [...prev, { role: 'user', msg: userMsg }]);
    try {
      const res = await API.post('/chatbot/smart-plan-chat', {
        question: userMsg, crop: cropInput, location: weather?.city || 'India', language: planLang
      });
      if (res.data.success) {
        setPlanChatHistory(prev => [...prev, { role: 'agent', msg: res.data.reply }]);
      }
    } catch (err) { toast.error('Chat failed'); } finally { setChatLoading(false); }
  };

  if (loading) return <Loader />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        {/* Massive Pulsing Weather Warning */}
        {weatherWarning && (
          <div style={{
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            color: 'white', padding: '20px 30px', borderRadius: '15px', marginBottom: '25px',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'pulse 2s infinite', border: '1px solid #fca5a5'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '40px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>⛈️</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>SEVERE WEATHER ALERT!</h2>
                <p style={{ margin: '5px 0 0', fontSize: '1rem', opacity: 0.9 }}>
                  Expected "{weatherWarning.description.toUpperCase()}" around {weatherWarning.date}. Please cover crops and secure farming equipment immediately.
                </p>
              </div>
            </div>
            <button onClick={() => setWeatherWarning(null)} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold' }}>
              Acknowledge & Dismiss
            </button>
          </div>
        )}

        <div className="dashboard-header">
          <div className="dashboard-title-group">
            <h1><span>🌾</span> Master Dashboard</h1>
            <p className="dashboard-subtitle">FarmGuru Intelligence Suite | {weather?.city || 'India'}</p>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-action" onClick={() => navigate('/predict')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              📸 Scan Crop
            </button>
            <div className="date-badge">
              <span className="date-icon">📅</span> 
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats Cards Grid - RESTORED */}
        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">Total Scans</div>
              <p className="stat-value total">{stats?.totalScans || 0}</p>
            </div>
            <div className="stat-icon">📸</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Healthy Crops</div>
              <p className="stat-value healthy">{stats?.healthyScans || 0}</p>
            </div>
            <div className="stat-icon">✅</div>
          </div>
          <div className="stat-card">
            <div>
              <div className="stat-label">Diseases Found</div>
              <p className="stat-value diseased">{stats?.diseasedScans || 0}</p>
            </div>
            <div className="stat-icon">⚠️</div>
          </div>
        </div>

        {/* 3 Core Widgets */}
        <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '30px' }}>
          
          {/* Real-time Weather Monitor (Glassmorphic & Gradient UI) */}
          <div className="info-card" style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', color: 'white', border: 'none' }}>
            <div className="info-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <h3 style={{color:'white'}}><span>📡</span> Climate Monitor</h3>
            </div>
            <div className="info-card-body">
              {weatherLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Scanning Atmosphere...</div>
              ) : weather ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{weather.temperature}°C</div>
                      <div style={{ fontSize: '1.1rem', opacity: 0.9, marginTop: '5px' }}>{weather.description.toUpperCase()}</div>
                    </div>
                    {weather.icon && <img src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} alt="weather" style={{ width: '100px', filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))' }}/>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize: '1.2rem'}}>💧</div><div style={{fontWeight: 'bold'}}>{weather.humidity}%</div><div style={{fontSize: '0.8rem', opacity: 0.7}}>Humidity</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize: '1.2rem'}}>💨</div><div style={{fontWeight: 'bold'}}>{weather.windSpeed} km/h</div><div style={{fontSize: '0.8rem', opacity: 0.7}}>Wind</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize: '1.2rem'}}>🌡️</div><div style={{fontWeight: 'bold'}}>{weather.feelsLike}°C</div><div style={{fontSize: '0.8rem', opacity: 0.7}}>Feels</div>
                    </div>
                  </div>

                  {/* Weather Forecast Area Chart - 7 Days */}
                  {forecast && forecast.length > 0 && (
                    <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '12px' }}>
                      <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>
                         7-Day Extended Forecast (🌡️ Temp / 💧 Humidity)
                      </p>
                      <div style={{ height: '140px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecast}>
                            <defs>
                              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fca5a5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#fca5a5" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{fill: 'white', fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white'}} />
                            <Area type="monotone" name="Temperature (°C)" dataKey="temp" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" />
                            <Area type="monotone" name="Humidity (%)" dataKey="humidity" stroke="#3b82f6" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Weather Alerts and Suggestions Grid */}
                      {forecast.some(f => f.alert) && (
                        <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                          {forecast.map((day, idx) => (
                            day.alert && (
                              <div key={idx} style={{ 
                                background: day.alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(240, 167, 25, 0.2)',
                                border: `1px solid ${day.alert.severity === 'critical' ? '#fca5a5' : '#fed7aa'}`,
                                padding: '10px', borderRadius: '8px', fontSize: '0.85rem'
                              }}>
                                <strong>{day.date}:</strong> {day.alert.type.toUpperCase()}
                                {day.suggestions && (
                                  <div style={{ marginTop: '5px', fontSize: '0.8rem', opacity: 0.9 }}>
                                    {day.suggestions.slice(0, 1).map((s, i) => <div key={i}>• {s}</div>)}
                                  </div>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state" style={{color:'white'}}>
                  <button onClick={getUserLocation} style={{background: 'white', color: '#1e3a8a', padding: '10px 20px', borderRadius: '25px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>Enable Radar</button>
                </div>
              )}
            </div>
          </div>

          {/* Farm Calendar */}
          <div className="info-card">
            <div className="info-card-header">
              <h3><span>🗓️</span> Active Reminders</h3>
            </div>
            <div className="info-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="date" value={newTaskDate} onChange={(e)=>setNewTaskDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '40%' }} />
                <input type="text" placeholder="E.g. Spread Fertilizer" value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1 }} />
              </div>
              <button onClick={addTask} style={{ padding: '10px', background: '#2c5f2d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Set Alarm</button>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {tasks.length > 0 ? tasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', marginBottom: '5px', borderRadius: '6px' }}>
                    <div><strong style={{ color: '#2c5f2d' }}>{new Date(t.date).toLocaleDateString('en-IN', {month:'short', day:'numeric'})}:</strong> {t.text}</div>
                    <button onClick={()=>removeTask(t.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px', fontWeight:'bold' }}>×</button>
                  </div>
                )) : <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>No alarms set.</p>}
              </div>
            </div>
          </div>

          {/* Local Mandi Prices */}
          <div className="info-card">
            <div className="info-card-header">
              <h3><span>📈</span> Live Local Prices</h3>
            </div>
            <div className="info-card-body">
              <p style={{ margin: '0 0 15px', fontSize: '13px', color: '#2c5f2d', fontWeight: 'bold', background: '#dcfce7', padding: '5px 10px', borderRadius: '20px', display: 'inline-block' }}>📍 Fetching for: {weather?.city || 'India'}</p>
              {mandiPrices.length > 0 ? (
                <>
                  {/* Mandi Prices Bar Chart */}
                  <div style={{ height: '160px', marginBottom: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mandiPrices} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="crop" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="price" name="Price (₹/Q)" fill="#2c5f2d" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mandi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {mandiPrices.map((item, idx) => (
                      <div key={idx} className="mandi-item" style={{ padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div className="mandi-crop-name" style={{fontWeight: 'bold', color: '#1e293b'}}>{item.crop}</div>
                        <div className="mandi-price" style={{ fontSize: '1.2rem', marginTop: '5px' }}>
                          ₹{item.price}
                          <span style={{ fontSize: '1rem', marginLeft: '5px', color: item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : '#f59e0b' }}>
                            {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <Loader />}
            </div>
          </div>
        </div>

        {/* ===================== TABBED SECTIONS ===================== */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {/* Tab Headers */}
          <div style={{ display: 'flex', gap: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '25px' }}>
            <button 
              onClick={() => setActiveTab('planner')}
              style={{
                flex: 1, padding: '12px', background: activeTab === 'planner' ? '#2c5f2d' : '#f1f5f9',
                color: activeTab === 'planner' ? 'white' : '#64748b', border: 'none', borderRadius: '10px',
                fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
              }}>
              🌱 Smart Crop Planner Engine
            </button>
            <button 
              onClick={() => setActiveTab('schemes')}
              style={{
                flex: 1, padding: '12px', background: activeTab === 'schemes' ? '#2c5f2d' : '#f1f5f9',
                color: activeTab === 'schemes' ? 'white' : '#64748b', border: 'none', borderRadius: '10px',
                fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
              }}>
              🏛️ Government Schemes Feed
            </button>
          </div>

          {/* TAB 1: SMART PLANNER */}
          {activeTab === 'planner' && (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              {/* Language Switcher for Planner */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '30px', padding: '5px' }}>
                  <button onClick={() => setPlanLang('hi')} style={{ padding: '8px 20px', background: planLang === 'hi' ? 'white' : 'transparent', color: planLang === 'hi' ? '#2c5f2d' : '#64748b', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: planLang === 'hi' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
                    हिंदी (Hindi)
                  </button>
                  <button onClick={() => setPlanLang('en')} style={{ padding: '8px 20px', background: planLang === 'en' ? 'white' : 'transparent', color: planLang === 'en' ? '#2c5f2d' : '#64748b', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: planLang === 'en' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
                    English
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Enter Crop Name (e.g. Tomato)..." 
                  value={cropInput} 
                  onChange={(e) => setCropInput(e.target.value)}
                  style={{ flex: '1 1 250px', padding: '15px', fontSize: '1.1rem', borderRadius: '10px', border: '2px solid #cbd5e1' }}
                />
                <button 
                  onClick={generateSmartPlan} 
                  disabled={planLoading}
                  style={{ flex: '0 0 auto', background: '#10b981', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  {planLoading ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>

              {smartPlan && (
                <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ marginTop: 0, color: '#1e293b' }}>⚙️ Generated Plan for: <span style={{color: '#2c5f2d'}}>{cropInput}</span></h3>
                  
                  {/* Crop Summary - Important First */}
                  {smartPlanSummary && (
                    <div style={{ background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: 'left 4px solid #3b82f6' }}>
                      <p style={{ margin: '0', fontWeight: '600', color: '#1e40af', fontSize: '1.1rem', marginBottom: '8px' }}>
                        📋 About Growing {cropInput} in {weather?.city || 'Your Location'}:
                      </p>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1rem', color: '#334155', fontFamily: 'system-ui' }}>
                        {smartPlanSummary}
                      </div>
                    </div>
                  )}
                  
                  {/* Crop Lifecycle Timeline/Diagram */}
                  <div style={{ background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #bbf7d0' }}>
                    <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#166534' }}>📅 Crop Lifecycle Stages:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                      {['🌱 Germination', '🌿 Seedling', '🌾 Vegetative', '🌸 Flowering', '🍎 Fruiting', '🏆 Maturity'].map((stage, idx) => (
                        <div key={idx} style={{
                          padding: '12px', borderRadius: '8px', background: 'white', textAlign: 'center',
                          fontSize: '0.95rem', fontWeight: '600', color: '#166534', border: '1px solid #bbf7d0'
                        }}>
                          {stage}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#166534', fontStyle: 'italic' }}>
                      💡 This visual represents the typical progression of the crop through its lifecycle. Timing varies based on climate and location.
                    </div>
                  </div>

                  {/* Detailed Plan Text */}
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>📖 Detailed Month-by-Month Plan:</p>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1rem', color: '#334155', fontFamily: 'system-ui' }}>
                      {smartPlan}
                    </div>
                  </div>

                  {/* Planner Chat System */}
                  <div style={{ marginTop: '30px', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <div style={{ background: '#f1f5f9', padding: '12px 20px', fontWeight: 'bold', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>💬 Ask follow-up questions about this crop</span>
                      <div style={{ display: 'flex', gap: '8px', background: 'white', borderRadius: '20px', padding: '3px' }}>
                        <button onClick={() => setPlanLang('en')} style={{ padding: '5px 15px', background: planLang === 'en' ? '#2c5f2d' : 'transparent', color: planLang === 'en' ? 'white' : '#64748b', border: 'none', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                          English
                        </button>
                        <button onClick={() => setPlanLang('hi')} style={{ padding: '5px 15px', background: planLang === 'hi' ? '#2c5f2d' : 'transparent', color: planLang === 'hi' ? 'white' : '#64748b', border: 'none', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                          हिंदी
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '20px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {planChatHistory.map((msg, idx) => (
                        <div key={idx} style={{
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          background: msg.role === 'user' ? '#2c5f2d' : '#f1f5f9',
                          color: msg.role === 'user' ? 'white' : '#1e293b',
                          padding: '12px 18px', borderRadius: '15px', maxWidth: '80%'
                        }}>
                          {msg.msg}
                        </div>
                      ))}
                      {chatLoading && <div style={{ alignSelf: 'flex-start', color: '#64748b' }}>Writing...</div>}
                    </div>
                    <div style={{ display: 'flex', padding: '15px', borderTop: '1px solid #cbd5e1', background: '#f8fafc' }}>
                      <input 
                        type="text" 
                        placeholder={planLang === 'hi' ? "जैसे - मिट्टी बहुत बलुई है तो?" : "E.g. What if soil is very sandy?"} 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handlePlanChat()}
                        style={{ flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none' }}
                      />
                      <button onClick={handlePlanChat} style={{ background: '#3b82f6', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', marginLeft: '10px', cursor: 'pointer', fontSize: '1.2rem' }}>
                        ➤
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOVT SCHEMES */}
          {activeTab === 'schemes' && (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                {/* Language Toggle */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '30px', padding: '5px' }}>
                  <button onClick={() => handleGovLangSwitch('hi')} style={{ padding: '8px 20px', background: govLang === 'hi' ? 'white' : 'transparent', color: govLang === 'hi' ? '#2c5f2d' : '#64748b', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: govLang === 'hi' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
                    हिंदी (Hindi)
                  </button>
                  <button onClick={() => handleGovLangSwitch('en')} style={{ padding: '8px 20px', background: govLang === 'en' ? 'white' : 'transparent', color: govLang === 'en' ? '#2c5f2d' : '#64748b', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: govLang === 'en' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
                    English
                  </button>
                </div>

                {/* Schemes vs Pesticides Sub-Tabs */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '30px', padding: '5px' }}>
                  <button onClick={() => setSchemeTab('schemes')} style={{ padding: '8px 20px', background: schemeTab === 'schemes' ? '#2c5f2d' : 'transparent', color: schemeTab === 'schemes' ? 'white' : '#64748b', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: schemeTab === 'schemes' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
                    💰 Schemes
                  </button>
                  <button onClick={() => setSchemeTab('pesticides')} style={{ padding: '8px 20px', background: schemeTab === 'pesticides' ? '#2c5f2d' : 'transparent', color: schemeTab === 'pesticides' ? 'white' : '#64748b', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: schemeTab === 'pesticides' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}>
                    🧪 Pesticides
                  </button>
                </div>
              </div>

              {/* Schemes Content */}
              {schemeTab === 'schemes' && (
                <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                  {loadingSchemes ? (
                    <Loader />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem', color: '#334155' }}>
                      {govSchemes}
                    </div>
                  )}
                </div>
              )}

              {/* Pesticides Content */}
              {schemeTab === 'pesticides' && (
                <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                  {loadingSchemes ? (
                    <Loader />
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem', color: '#334155' }}>
                      {govPesticides || '🧪 Loading government-approved pesticides...'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;