
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ── Weather Widget (copied from first code) ──────────────────────────────────
function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inputCity, setInputCity] = useState("");
  const [searching, setSearching] = useState(false);
  const KEY = import.meta.env.OPENWEATHER_API_KEY;
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const fetchWeather = async (c) => {
    if (!KEY || KEY === "undefined") { setError("API key missing! .env mein VITE_OPENWEATHER_API_KEY daalo."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [r1,r2] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${c},IN&appid=${KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${c},IN&appid=${KEY}&units=metric&cnt=5`),
      ]);
      if (!r1.ok) throw new Error("City not found");
      const [cur,fore] = await Promise.all([r1.json(),r2.json()]);
      setWeather(cur); setForecast(fore.list||[]);
    } catch(e) { setError(e.message==="City not found"?`"${c}" nahi mila.`:"Network error."); }
    finally { setLoading(false); setSearching(false); }
  };

  useEffect(()=>{ fetchWeather("Lucknow"); },[]);

  const wIcon = id => id>=200&&id<300?"⛈":id>=300&&id<400?"🌦":id>=500&&id<600?"🌧":id>=600&&id<700?"❄️":id>=700&&id<800?"🌫":id===800?"☀️":"⛅";
  const tip = weather ? (()=>{
    const id=weather.weather[0].id,t=weather.main.temp,h=weather.main.humidity,w=weather.wind.speed;
    if(id>=200&&id<600) return {text:"Aaj khet mein kaam mat karo — baarish.",color:"#f08080",icon:"⚠️"};
    if(t>40) return {text:"Bahut garmi — subah ya shaam kaam karo.",color:"#e8a020",icon:"🌡️"};
    if(t<10) return {text:"Pala girne ka darr — fasal cover karo.", color:"#80c0f0",icon:"🥶"};
    if(h>85) return {text:"Nami zyada — fungal disease ka khatra.", color:"#e8c020",icon:"🍄"};
    if(w>10) return {text:"Tez hawa — aaj spray mat karo.", color:"#e8a020",icon:"💨"};
    return {text:"Mausam theek hai — accha din!", color:"#7ecb3a",icon:"✅"};
  })() : null;

  const doSearch = () => { const t=inputCity.trim(); if(!t)return; setSearching(true); fetchWeather(t); setInputCity(""); };

  return (
    <>
      <style>{`
        @keyframes wFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wBlink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes wShimmer{0%{opacity:0.4}50%{opacity:0.7}100%{opacity:0.4}}
        @keyframes wSpin{to{transform:rotate(360deg)}}
        .ww-root{margin:0 clamp(24px,6vw,80px) clamp(48px,8vw,80px);animation:wFadeUp 0.6s 0.5s both;}
        .ww-eyebrow{font-family:'JetBrains Mono',monospace;font-size:clamp(10px,1.4vw,12px);color:#7ecb3a;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:8px;}
        .ww-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:clamp(18px,3vw,24px);}
        .ww-heading{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(22px,3.5vw,36px);color:#faf7f0;line-height:1.15;}
        .ww-heading em{font-style:italic;color:#7ecb3a;}
        .ww-srow{display:flex;gap:8px;}
        .ww-input{padding:9px 14px;background:rgba(255,255,255,0.07);border:1px solid rgba(74,158,42,0.25);border-radius:9px;color:#faf7f0;font-size:13px;outline:none;font-family:'DM Sans',sans-serif;width:clamp(120px,18vw,180px);transition:border-color 0.2s;box-sizing:border-box;}
        .ww-input::placeholder{color:rgba(250,247,240,0.3);}
        .ww-input:focus{border-color:rgba(126,203,58,0.5);}
        .ww-sbtn{padding:9px 18px;background:linear-gradient(135deg,#2d6a1f,#4a9e2a);border:none;border-radius:9px;color:#faf7f0;font-size:13px;cursor:pointer;font-weight:600;font-family:'DM Sans',sans-serif;transition:opacity 0.2s;}
        .ww-sbtn:hover{opacity:0.88;}
        .ww-spin{animation:wSpin 0.8s linear infinite;display:inline-block;}
        .ww-error{padding:12px 16px;background:rgba(217,64,64,0.1);border:1px solid rgba(217,64,64,0.25);border-radius:12px;color:#f08080;font-size:13px;font-family:'JetBrains Mono',monospace;margin-bottom:16px;}
        .ww-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:clamp(10px,2vw,16px);align-items:start;}
        .ww-skel{border-radius:18px;background:rgba(255,255,255,0.05);animation:wShimmer 1.8s ease-in-out infinite;}
        .ww-main{background:linear-gradient(135deg,rgba(45,106,31,0.28),rgba(74,158,42,0.1));border:1px solid rgba(126,203,58,0.22);border-radius:20px;padding:clamp(18px,3vw,26px);position:relative;overflow:hidden;}
        .ww-mg{position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(126,203,58,0.1),transparent 70%);pointer-events:none;}
        .ww-city{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
        .ww-cname{font-size:11px;font-family:'JetBrains Mono',monospace;color:rgba(198,232,154,0.55);text-transform:uppercase;letter-spacing:0.1em;}
        .ww-ldot{width:6px;height:6px;border-radius:50%;background:#7ecb3a;animation:wBlink 2s ease-in-out infinite;}
        .ww-trow{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:16px;}
        .ww-temp{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(52px,9vw,76px);color:#faf7f0;line-height:1;}
        .ww-unit{font-size:clamp(20px,3vw,28px);color:rgba(250,247,240,0.5);padding-bottom:8px;}
        .ww-wicon{font-size:clamp(48px,8vw,68px);line-height:1;}
        .ww-desc{font-size:14px;color:rgba(250,247,240,0.7);text-transform:capitalize;margin-bottom:2px;}
        .ww-feels{font-size:12px;color:rgba(250,247,240,0.4);font-family:'JetBrains Mono',monospace;margin-bottom:14px;}
        .ww-details{display:flex;flex-wrap:wrap;gap:clamp(10px,2vw,18px);padding-top:14px;border-top:1px solid rgba(74,158,42,0.15);}
        .ww-di{display:flex;flex-direction:column;gap:3px;}
        .ww-dl{font-size:10px;color:rgba(250,247,240,0.4);font-family:'JetBrains Mono',monospace;}
        .ww-dv{font-size:13px;font-weight:600;color:#d4f0a0;}
        .ww-tip{border-radius:18px;padding:clamp(16px,2.5vw,22px);display:flex;flex-direction:column;justify-content:center;border:1px solid;}
        .ww-ticon{font-size:28px;margin-bottom:10px;}
        .ww-tlabel{font-size:10px;font-family:'JetBrains Mono',monospace;color:rgba(198,232,154,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
        .ww-ttext{font-size:clamp(12px,1.6vw,14px);font-weight:500;line-height:1.6;}
        .ww-fore{background:rgba(255,255,255,0.03);border:1px solid rgba(74,158,42,0.15);border-radius:18px;padding:clamp(14px,2.5vw,20px);}
        .ww-flabel{font-size:10px;font-family:'JetBrains Mono',monospace;color:rgba(198,232,154,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;}
        .ww-fitem{display:flex;align-items:center;justify-content:space-between;padding:9px 0;}
        .ww-fitem:not(:last-child){border-bottom:1px solid rgba(255,255,255,0.05);}
        .ww-ftime{font-size:11px;color:rgba(250,247,240,0.45);font-family:'JetBrains Mono',monospace;min-width:55px;}
        .ww-ftemp{font-size:13px;font-weight:600;color:#d4f0a0;min-width:38px;text-align:right;}
        .ww-fhum{font-size:11px;color:rgba(250,247,240,0.35);min-width:42px;text-align:right;}
        @media(max-width:900px){.ww-grid{grid-template-columns:1fr 1fr;}}
        @media(max-width:580px){.ww-grid{grid-template-columns:1fr;}}
      `}</style>
      <div className="ww-root">
        
        
              
           
           
      </div>
    </>
  );
}

// ── Home Page (redesigned) ──────────────────────────────────────
export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stats, setStats] = useState({
    farmers: 0,
    scans: 0,
    accuracy: 0
  });
  const [count, setCount] = useState({ farmers: 0, accuracy: 0, crops: 0 });
  const [scanLine, setScanLine] = useState(0);

  const heroImages = [
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200',
    'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7b1c?w=1200',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200'
  ];

  const crops = [
    { name: 'Tomato', icon: '🍅', diseases: ['Early Blight', 'Late Blight', 'Bacterial Spot'], health: 78, image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400' },
    { name: 'Potato', icon: '🥔', diseases: ['Early Blight', 'Late Blight'], health: 91, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400' },
    { name: 'Pepper', icon: '🫑', diseases: ['Bacterial Spot'], health: 85, image: 'https://images.unsplash.com/photo-1563565375004-7cb5b9b2b2d6?w=400' },
    { name: 'Wheat', icon: '🌾', diseases: ['Rust', 'Smut', 'Blight'], health: 94, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400' },
    { name: 'Rice', icon: '🍚', diseases: ['Blast', 'Blight', 'Smut'], health: 85, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400' },
    { name: 'Maize', icon: '🌽', diseases: ['Rust', 'Smut', 'Leaf Spot'], health: 88, image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400' }
  ];

  

  const diseases = ["Early Blight","Leaf Rust","Powdery Mildew","Fusarium Wilt","Bacterial Spot","Downy Mildew","Anthracnose"];
  const steps = [
    { num: "01", title: "Capture Photo", desc: "Take a clear photo of the affected crop leaves using your phone", icon: "📸" },
    { num: "02", title: "AI Analysis", desc: "Our deep learning model analyzes the image in seconds", icon: "🤖" },
    { num: "03", title: "Get Solutions", desc: "Receive disease name, treatment, and prevention tips instantly", icon: "💊" }
  ];

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/analytics');
        const data = await response.json();
        if (data.success) {
          setStats({
            farmers: data.analytics.totalFarmers,
            scans: data.analytics.totalDetections,
            accuracy: 94.5
          });
        }
      } catch (error) {
        setStats({ farmers: 1250, scans: 8750, accuracy: 94.5 });
      }
    };
    fetchStats();
  }, []);

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animated counter for stats
  useEffect(() => {
    const targets = { farmers: stats.farmers || 12400, accuracy: stats.accuracy || 92, crops: 50 };
    const duration = 1800, steps = 60;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setCount({
        farmers: Math.floor(ease * targets.farmers),
        accuracy: Math.floor(ease * targets.accuracy),
        crops: Math.floor(ease * targets.crops)
      });
      if (step >= steps) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [stats]);

  // Scan line animation for hero scanner
  useEffect(() => {
    const t = setInterval(() => setScanLine(p => p >= 100 ? 0 : p + 0.8), 16);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
        
        @keyframes hFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes hTicker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes hBarGrow {
          from { width: 0 !important; }
        }
        
        .hw-step:hover { transform: translateY(-5px) !important; border-color: rgba(126,203,58,0.4) !important; }
        .hw-crop:hover { transform: translateY(-4px) !important; border-color: rgba(126,203,58,0.35) !important; }
        .hw-cta:hover { transform: translateY(-3px) !important; box-shadow: 0 16px 40px rgba(74,158,42,0.55), inset 0 1px 0 rgba(255,255,255,0.1) !important; }
        .hw-ghost:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.3) !important; }
        .hw-bar { animation: hBarGrow 1.4s cubic-bezier(.22,1,.36,1) both; }
        
        @media (max-width: 768px) {
          .hw-hero-right { display: none !important; }
          .hw-cta-wrap { flex-direction: column !important; text-align: center !important; }
          .hw-cta-acts { justify-content: center !important; }
          .hw-footer { flex-direction: column !important; text-align: center !important; }
        }
        @media (max-width: 480px) {
          .hw-actions { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>
      
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0d2310", color: "#faf7f0", overflowX: "hidden", minHeight: "100vh" }}>
        
        {/* HERO SECTION with Background Slider */}
        <section style={{
          minHeight: "100vh",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          alignItems: "center",
          gap: "clamp(24px,4vw,60px)",
          padding: "clamp(90px,10vw,130px) clamp(24px,6vw,80px) clamp(60px,8vw,100px)",
          overflow: "hidden"
        }}>
          {/* Background Image Slider */}
          {heroImages.map((img, idx) => (
            <div key={idx} style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: currentImageIndex === idx ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              zIndex: 0
            }} />
          ))}
          
          {/* Dark Overlay */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 100%)",
            zIndex: 1
          }} />
          
          {/* Grid Pattern Overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(74,158,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,42,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)",
            zIndex: 1
          }} />
          
          {/* Glow Effects */}
          <div style={{
            position: "absolute",
            borderRadius: "50%",
            pointerEvents: "none",
            width: 520,
            height: 520,
            background: "radial-gradient(circle, rgba(74,158,42,0.18) 0%, transparent 70%)",
            top: -120,
            right: -120,
            filter: "blur(90px)",
            animation: "hGlow 8s ease-in-out infinite",
            zIndex: 1
          }} />
          
          {/* Left Content */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(74,158,42,0.14)",
              border: "1px solid rgba(126,203,58,0.28)",
              borderRadius: 100,
              padding: "6px 16px 6px 8px",
              fontSize: "clamp(11px,1.5vw,13px)",
              fontFamily: "'JetBrains Mono',monospace",
              color: "#c6e89a",
              letterSpacing: "0.04em",
              marginBottom: "clamp(20px,3vw,28px)",
              animation: "hFadeUp 0.6s 0.1s both"
            }}>
              
            
            </div>
            <h1 style={{
              fontFamily: "'DM Serif Display',Georgia,serif",
              fontSize: "clamp(36px,5.5vw,68px)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              color: "#faf7f0",
              marginBottom: "clamp(16px,2.5vw,24px)",
              animation: "hFadeUp 0.6s 0.2s both"
            }}>
              Smart Crop Disease <em style={{ fontStyle: "italic", color: "#7ecb3a", display: "block" }}>Detection</em>
            </h1>
            <p style={{
              fontSize: "clamp(14px,1.8vw,17px)",
              fontWeight: 300,
              color: "rgba(250,247,240,0.65)",
              lineHeight: 1.75,
              maxWidth: 460,
              marginBottom: "clamp(28px,4vw,40px)",
              animation: "hFadeUp 0.6s 0.3s both"
            }}>
              Upload a photo of your crop — our AI instantly identifies diseases.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: "clamp(36px,5vw,52px)", animation: "hFadeUp 0.6s 0.4s both" }} className="hw-actions">
              <Link to="/predict" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "clamp(13px,2vw,16px) clamp(24px,3.5vw,32px)",
                background: "linear-gradient(135deg,#2d6a1f,#4a9e2a)",
                color: "#faf7f0",
                border: "none",
                borderRadius: 100,
                fontSize: "clamp(13px,1.6vw,15px)",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: "0 8px 28px rgba(74,158,42,0.4)",
                transition: "transform 0.2s,box-shadow 0.2s"
              }} className="hw-cta">
                Start Detection <span style={{ fontSize: 18 }}>→</span>
              </Link>
              <Link to="/register" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "clamp(13px,2vw,16px) clamp(24px,3.5vw,32px)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 100,
                color: "rgba(250,247,240,0.8)",
                fontSize: "clamp(13px,1.6vw,15px)",
                textDecoration: "none",
                cursor: "pointer",
                transition: "background 0.2s"
              }} className="hw-ghost">
                Register as Farmer →
              </Link>
            </div>
            
          </div>
          
          {/* Scanner Mockup */}
          <div style={{ position: "relative", zIndex: 2, animation: "hFadeUp 0.7s 0.35s both" }} className="hw-hero-right">
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(126,203,58,0.2)",
              borderRadius: 20,
              overflow: "hidden",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{
                background: "rgba(74,158,42,0.12)",
                borderBottom: "1px solid rgba(126,203,58,0.15)",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#d94040", "#e8a020", "#4a9e2a"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(198,232,154,0.6)", letterSpacing: "0.06em", marginLeft: 4 }}>FARMGURU · AI SCANNER v1.0</span>
                <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#7ecb3a", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ecb3a", animation: "hBlink 2s ease-in-out infinite" }} /> LIVE
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "linear-gradient(135deg,#0a1f0a,#122a12)",
                  borderRadius: 12,
                  border: "1px solid rgba(74,158,42,0.2)",
                  position: "relative",
                  overflow: "hidden",
                  marginBottom: 14
                }}>
                  <div style={{
  width: "100%",
  aspectRatio: "4/3",
  background: "linear-gradient(135deg,#0a1f0a,#122a12)",
  borderRadius: 12,
  border: "1px solid rgba(74,158,42,0.2)",
  position: "relative",
  overflow: "hidden",
  marginBottom: 14
}}>
  {/* Tomato Leaf Image */}
 <img 
  src="https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&h=450&fit=crop" 
  alt="Potato leaf with disease"
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover"
  }}
/>
  
  {/* Detection Box 1 - Early Blight */}
  <div style={{
    position: "absolute",
    top: "28%",
    left: "15%",
    border: "2px solid #d94040",
    borderRadius: "8px",
    background: "rgba(217,64,64,0.15)",
    backdropFilter: "blur(2px)"
  }}>
    <div style={{
      background: "#d94040",
      padding: "3px 8px",
      borderRadius: "6px",
      fontSize: "10px",
      fontFamily: "'JetBrains Mono',monospace",
      color: "white",
      fontWeight: "bold",
      whiteSpace: "nowrap"
    }}>
      🔴 EARLY BLIGHT · 94%
    </div>
  </div>
  
  {/* Detection Box 2 - Leaf Rust */}
  <div style={{
    position: "absolute",
    bottom: "30%",
    right: "10%",
    border: "2px solid #e8a020",
    borderRadius: "8px",
    background: "rgba(232,160,32,0.15)",
    backdropFilter: "blur(2px)"
  }}>
    <div style={{
      background: "#e8a020",
      padding: "3px 8px",
      borderRadius: "6px",
      fontSize: "10px",
      fontFamily: "'JetBrains Mono',monospace",
      color: "white",
      fontWeight: "bold",
      whiteSpace: "nowrap"
    }}>
      🟠Late Blight· 81%
    </div>
  </div>
  
  {/* Scanner Line */}
  <div style={{
    position: "absolute",
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg,transparent,#7ecb3a,transparent)",
    boxShadow: "0 0 12px #7ecb3a",
    pointerEvents: "none",
    top: `${scanLine}%`
  }} />
  
  {/* Corner Borders */}
  {[
    { top: 8, left: 8, borderTop: "2px solid #7ecb3a", borderLeft: "2px solid #7ecb3a" },
    { top: 8, right: 8, borderTop: "2px solid #7ecb3a", borderRight: "2px solid #7ecb3a" },
    { bottom: 8, left: 8, borderBottom: "2px solid #7ecb3a", borderLeft: "2px solid #7ecb3a" },
    { bottom: 8, right: 8, borderBottom: "2px solid #7ecb3a", borderRight: "2px solid #7ecb3a" }
  ].map((cs, i) => (
    <div key={i} style={{ position: "absolute", width: 16, height: 16, ...cs }} />
  ))}
</div>
                  <div style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "linear-gradient(90deg,transparent,#7ecb3a,transparent)",
                    boxShadow: "0 0 12px #7ecb3a",
                    pointerEvents: "none",
                    top: `${scanLine}%`
                  }} />
                  {[
                    { top: 8, left: 8, borderTop: "2px solid #7ecb3a", borderLeft: "2px solid #7ecb3a" },
                    { top: 8, right: 8, borderTop: "2px solid #7ecb3a", borderRight: "2px solid #7ecb3a" },
                    { bottom: 8, left: 8, borderBottom: "2px solid #7ecb3a", borderLeft: "2px solid #7ecb3a" },
                    { bottom: 8, right: 8, borderBottom: "2px solid #7ecb3a", borderRight: "2px solid #7ecb3a" }
                  ].map((cs, i) => <div key={i} style={{ position: "absolute", width: 16, height: 16, ...cs }} />)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {[
                    { s: "⚠ Early Blight · 94%", f: true },
                    { s: "⚠ Leaf Rust · 81%", f: true },
                    { s: "✓ No Blight", f: false }
                  ].map(({ s, f }) => (
                    <div key={s} style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11,
                      background: f ? "rgba(217,64,64,0.15)" : "rgba(74,158,42,0.15)",
                      border: f ? "1px solid rgba(217,64,64,0.35)" : "1px solid rgba(74,158,42,0.3)",
                      color: f ? "#f0a0a0" : "#c6e89a"
                    }}>{s}</div>
                  ))}
                </div>
                {[
                  ["Early Blight", 94, "#d94040"],
                  ["Leaf Rust", 81, "#e8a020"],
                  ["Powdery Mildew", 12, "#4a9e2a"]
                ].map(([l, p, c]) => (
                  <div key={l} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(198,232,154,0.55)", marginBottom: 4 }}>
                      <span>{l}</span><span>{p}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                      <div className="hw-bar" style={{ height: "100%", borderRadius: 2, width: `${p}%`, background: `linear-gradient(90deg,${c}88,${c})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            animation: "bounce 2s infinite"
          }}>
            <div style={{ width: "30px", height: "50px", border: "2px solid white", borderRadius: "15px", position: "relative" }}>
              <div style={{ width: "4px", height: "10px", background: "white", borderRadius: "2px", position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", animation: "scrollDown 1.5s infinite" }} />
            </div>
          </div>
        </section>

        {/* DISEASE TICKER */}
        <div style={{
          background: "rgba(74,158,42,0.08)",
          borderTop: "1px solid rgba(74,158,42,0.14)",
          borderBottom: "1px solid rgba(74,158,42,0.14)",
          padding: "12px 0",
          overflow: "hidden",
          whiteSpace: "nowrap"
        }}>
          <div style={{ display: "inline-flex", gap: 48, animation: "hTicker 22s linear infinite" }}>
            {[...diseases, ...diseases].map((d, i) => (
              <span key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(198,232,154,0.5)", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#4a9e2a" }}>◆</span>{d}
              </span>
            ))}
          </div>
        </div>

        {/* WEATHER WIDGET */}
        <WeatherWidget />

        {/* HOW IT WORKS */}
        <section style={{ padding: "clamp(60px,8vw,100px) clamp(24px,6vw,80px)" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(10px,1.4vw,12px)", color: "#7ecb3a", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>// How it works</div>
          <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "clamp(28px,4vw,48px)", color: "#faf7f0", lineHeight: 1.15, marginBottom: "clamp(36px,5vw,56px)", maxWidth: 540 }}>
            Three steps to <em style={{ fontStyle: "italic", color: "#7ecb3a" }}>save your harvest</em>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "clamp(16px,3vw,28px)" }}>
            {steps.map(s => (
              <div key={s.num} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(74,158,42,0.15)",
                borderRadius: 18,
                padding: "clamp(20px,3vw,28px)",
                transition: "transform 0.25s,border-color 0.25s",
                cursor: "default"
              }} className="hw-step">
                <div style={{ fontSize: "clamp(48px,6vw,72px)", marginBottom: 16, lineHeight: 1 }}>{s.icon}</div>
                <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "clamp(48px,6vw,72px)", color: "rgba(74,158,42,0.18)", lineHeight: 1, marginBottom: 16, letterSpacing: "-0.03em" }}>{s.num}</div>
                <div style={{ fontSize: "clamp(15px,2vw,18px)", fontWeight: 600, color: "#faf7f0", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: "clamp(13px,1.6vw,15px)", fontWeight: 300, color: "rgba(250,247,240,0.55)", lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SUPPORTED CROPS */}
        

        {/* FEATURES SECTION */}
        <section style={{ padding: "0 clamp(24px,6vw,80px) clamp(60px,8vw,100px)" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(10px,1.4vw,12px)", color: "#7ecb3a", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>// Features</div>
          <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "clamp(28px,4vw,48px)", color: "#faf7f0", lineHeight: 1.15, marginBottom: "clamp(36px,5vw,56px)", maxWidth: 540 }}>
            Why Choose <em style={{ fontStyle: "italic", color: "#7ecb3a" }}>Our Platform?</em>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "clamp(16px,2vw,24px)" }}>
            {[
              { icon: "🚀", title: "Free & Instant", desc: "No registration required for disease detection. Get results in seconds." },
              { icon: "🎯", title: "94.5% Accuracy", desc: "Our AI model is trained on thousands of images for precise detection." },
              { icon: "📱", title: "Mobile Friendly", desc: "Works perfectly on any device - smartphone, tablet, or computer." },
              { icon: "🌾", title: "Farmer Dashboard", desc: "Track your crop health history and get personalized insights." },
              { icon: "📊", title: "Market Prices", desc: "Real-time mandi prices to help you sell at the best rates." },
              { icon: "🌡️", title: "Weather Updates", desc: "Location-based weather forecasts for better farm planning." }
            ].map(f => (
              <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 15, padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(74,158,42,0.12)", borderRadius: 16, transition: "transform 0.2s" }} className="hw-crop">
                <div style={{ fontSize: "2rem" }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: "clamp(14px,1.8vw,16px)", fontWeight: 600, color: "#faf7f0", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: "clamp(12px,1.5vw,13px)", color: "rgba(250,247,240,0.55)", lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        
        

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(74,158,42,0.12)", padding: "clamp(20px,3vw,28px) clamp(24px,6vw,80px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }} className="hw-footer">
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 18, color: "#7ecb3a" }}>🌿 FarmGuru</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(198,232,154,0.3)", letterSpacing: "0.05em" }}>© 2025 FARMGURU · CROP INTELLIGENCE PLATFORM</div>
        </footer>
      </div>
    </>
  );
}