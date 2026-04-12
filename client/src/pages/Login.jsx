import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  // YOUR ORIGINAL STATE - completely unchanged
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // YOUR ORIGINAL FUNCTION - completely unchanged
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      navigate('/dashboard');
    }
  };

  // Only the styling is from the beautiful code below
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;600&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes lgFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lgGlow{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
        @keyframes lgLeaf{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:0.4}100%{transform:translateY(-110vh) rotate(720deg);opacity:0}}
        @keyframes lgSpin{to{transform:rotate(360deg)}}
        @keyframes lgBlink{0%,100%{opacity:1}50%{opacity:0.3}}
        .lg-root{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;font-family:'DM Sans',sans-serif;overflow:hidden;}
        .lg-left{background:linear-gradient(160deg,#0a1e0a 0%,#122a12 40%,#0d2010 100%);display:flex;flex-direction:column;justify-content:center;padding:clamp(40px,6vw,80px) clamp(32px,5vw,64px);position:relative;overflow:hidden;}
        .lg-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(74,158,42,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(74,158,42,0.06) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 90% 90% at 30% 50%,black,transparent);-webkit-mask-image:radial-gradient(ellipse 90% 90% at 30% 50%,black,transparent);}
        .lg-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);}
        .lg-leaf{position:absolute;pointer-events:none;border-radius:50% 10% 50% 10%;background:rgba(74,158,42,0.08);animation:lgLeaf linear infinite;}
        .lg-brand{display:flex;align-items:center;gap:10px;margin-bottom:clamp(40px,6vw,60px);position:relative;z-index:2;animation:lgFadeUp 0.5s 0.1s both;}
        .lg-brand-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2d6a1f,#4a9e2a);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(74,158,42,0.4);}
        .lg-brand-name{font-family:'DM Serif Display',serif;font-size:22px;color:#7ecb3a;}
        .lg-heading{font-family:'DM Serif Display',serif;font-size:clamp(30px,4vw,48px);color:#faf7f0;line-height:1.1;letter-spacing:-0.02em;margin-bottom:14px;position:relative;z-index:2;animation:lgFadeUp 0.5s 0.2s both;}
        .lg-heading em{font-style:italic;color:#7ecb3a;}
        .lg-sub{font-size:clamp(13px,1.6vw,15px);font-weight:300;color:rgba(250,247,240,0.55);line-height:1.7;margin-bottom:clamp(36px,5vw,52px);position:relative;z-index:2;animation:lgFadeUp 0.5s 0.3s both;}
        .lg-features{display:flex;flex-direction:column;gap:14px;position:relative;z-index:2;animation:lgFadeUp 0.5s 0.4s both;}
        .lg-feature{display:flex;align-items:center;gap:12px;}
        .lg-fdot{width:8px;height:8px;border-radius:50%;background:#7ecb3a;animation:lgBlink 2.5s ease-in-out infinite;}
        .lg-ftext{font-size:clamp(12px,1.6vw,14px);color:rgba(250,247,240,0.65);}
        .lg-lfoot{margin-top:auto;padding-top:clamp(36px,5vw,52px);position:relative;z-index:2;font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(198,232,154,0.22);letter-spacing:0.08em;}
        .lg-right{background:#faf7f0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:clamp(40px,6vw,80px) clamp(28px,5vw,60px);overflow-y:auto;position:relative;}
        .lg-right::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#2d6a1f,#7ecb3a,#2d6a1f);}
        .lg-form-wrap{width:100%;max-width:400px;animation:lgFadeUp 0.5s 0.15s both;}
        .lg-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(74,158,42,0.1);border:1px solid rgba(74,158,42,0.2);border-radius:100px;padding:5px 14px 5px 8px;font-size:12px;font-family:'JetBrains Mono',monospace;color:#3a6a20;letter-spacing:0.04em;margin-bottom:20px;}
        .lg-bdot{width:7px;height:7px;border-radius:50%;background:#4a9e2a;animation:lgBlink 2s ease-in-out infinite;}
        .lg-fheading{font-family:'DM Serif Display',serif;font-size:clamp(24px,3vw,32px);color:#0d2310;margin-bottom:4px;}
        .lg-fsub{font-size:14px;font-weight:300;color:#6a7a5a;margin-bottom:clamp(22px,3.5vw,30px);}
        .lg-error{display:flex;align-items:flex-start;gap:8px;background:rgba(217,64,64,0.08);border:1px solid rgba(217,64,64,0.25);border-radius:10px;padding:10px 14px;font-size:13px;color:#c0392b;margin-bottom:14px;animation:lgFadeUp 0.3s both;}
        .lg-field{margin-bottom:16px;}
        .lg-label{display:block;font-size:11px;font-weight:600;color:#3a5a20;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;font-family:'JetBrains Mono',monospace;}
        .lg-input-wrap{position:relative;}
        .lg-input{width:100%;padding:13px 16px;background:#f0ead8;border:1.5px solid #ddd5b8;border-radius:11px;font-size:14px;font-family:'DM Sans',sans-serif;color:#0d2310;outline:none;transition:all 0.2s;box-sizing:border-box;}
        .lg-input:focus{border-color:#4a9e2a;background:#f5f0e0;box-shadow:0 0 0 3px rgba(74,158,42,0.12);}
        .lg-input-pr{padding-right:46px;}
        .lg-eye{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#8a9a6a;font-size:16px;transition:color 0.2s;}
        .lg-eye:hover{color:#4a9e2a;}
        .lg-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
        .lg-check{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:#6a7a5a;font-family:'JetBrains Mono',monospace;}
        .lg-checkbox{width:14px;height:14px;cursor:pointer;accent-color:#4a9e2a;}
        .lg-forgot{font-size:12px;color:#4a9e2a;text-decoration:none;font-family:'JetBrains Mono',monospace;}
        .lg-forgot:hover{text-decoration:underline;}
        .lg-btn{width:100%;padding:14px;background:linear-gradient(135deg,#2d6a1f,#4a9e2a);color:#faf7f0;border:none;border-radius:12px;font-size:15px;font-weight:600;font-family:'DM Serif Display',serif;cursor:pointer;box-shadow:0 6px 20px rgba(74,158,42,0.38);transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .lg-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(74,158,42,0.5);}
        .lg-btn:disabled{opacity:0.65;cursor:not-allowed;}
        .lg-divider{display:flex;align-items:center;gap:10px;margin:20px 0;}
        .lg-divider::before,.lg-divider::after{content:'';flex:1;height:1px;background:#e2d9c4;}
        .lg-divider span{font-size:12px;color:#a09070;font-family:'JetBrains Mono',monospace;}
        .lg-signup-box{background:rgba(74,158,42,0.06);border:1px solid rgba(74,158,42,0.18);border-radius:12px;padding:16px 18px;text-align:center;}
        .lg-signup-box p{font-size:13px;color:#6a7a5a;margin-bottom:10px;}
        .lg-signup-link{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border:1.5px solid rgba(74,158,42,0.4);border-radius:9px;font-size:13px;font-weight:600;color:#3a6a20;text-decoration:none;transition:all 0.2s;}
        .lg-signup-link:hover{background:rgba(74,158,42,0.1);border-color:#4a9e2a;}
        .lg-spinner{width:18px;height:18px;border:2px solid rgba(250,247,240,0.3);border-top-color:#faf7f0;border-radius:50%;animation:lgSpin 0.7s linear infinite;}
        .lg-demo{background:rgba(74,158,42,0.08);border:1px solid rgba(74,158,42,0.15);border-radius:10px;padding:12px;margin-bottom:16px;text-align:center;}
        .lg-demo p{font-size:11px;color:#5a7a3a;font-family:'JetBrains Mono',monospace;margin:0;}
        @media(max-width:768px){.lg-root{grid-template-columns:1fr;}.lg-left{display:none;}.lg-right{min-height:100vh;padding:32px 20px;}}
      `}</style>
      
      <div className="lg-root">
        <div className="lg-left">
          <div className="lg-grid"/>
          <div className="lg-glow" style={{width:420,height:420,background:"radial-gradient(circle,rgba(74,158,42,0.18) 0%,transparent 70%)",top:-120,right:-100,animation:"lgGlow 9s ease-in-out infinite"}}/>
          <div className="lg-glow" style={{width:260,height:260,background:"radial-gradient(circle,rgba(126,203,58,0.12) 0%,transparent 70%)",bottom:20,left:-60,animation:"lgGlow 13s ease-in-out infinite reverse"}}/>
          {[...Array(5)].map((_,i)=><div key={i} className="lg-leaf" style={{width:`${14+i*9}px`,height:`${14+i*9}px`,bottom:`-${8+i*9}%`,left:`${8+i*17}%`,animationDuration:`${11+i*4}s`,animationDelay:`${i*3}s`}}/>)}
          <div className="lg-brand"><div className="lg-brand-icon">🌿</div><span className="lg-brand-name">FarmGuru</span></div>
          <h2 className="lg-heading">Welcome<br/><em>back, farmer</em></h2>
          <p className="lg-sub">Your crops are waiting. Sign in to check the latest scans, mandi rates, and disease alerts.</p>
          <div className="lg-features">
            {["AI disease detection ready","Your scan history saved","Live mandi rates updated","Crop health dashboard"].map(t=>(
              <div key={t} className="lg-feature"><div className="lg-fdot"/><span className="lg-ftext">{t}</span></div>
            ))}
          </div>
          <div className="lg-lfoot">FARMGURU · CROP INTELLIGENCE PLATFORM</div>
        </div>
        
        <div className="lg-right">
          <div className="lg-form-wrap">
            <div className="lg-badge"><span className="lg-bdot"/> Secure Login</div>
            <h1 className="lg-fheading">Sign in</h1>
            <p className="lg-fsub">Enter your credentials to continue</p>
            
            {/* Demo Credentials Info */}
            
            
            <form onSubmit={handleSubmit}>
              <div className="lg-field">
                <label className="lg-label">Email Address</label>
                <input 
                  className="lg-input" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="farmer@example.com" 
                  autoComplete="email"
                />
              </div>
              
              <div className="lg-field">
                <label className="lg-label">Password</label>
                <div className="lg-input-wrap">
                  <input 
                    className="lg-input lg-input-pr" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••" 
                    autoComplete="current-password"
                  />
                  <button 
                    className="lg-eye" 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              
              <div className="lg-row">
                <label className="lg-check">
                  <input 
                    type="checkbox" 
                    className="lg-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="lg-forgot">
                  Forgot password?
                </Link>
              </div>
              
              <button className="lg-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="lg-spinner"/>
                    Signing in…
                  </>
                ) : (
                  <>Sign In <span style={{fontSize:18}}>→</span></>
                )}
              </button>
            </form>
            
            <div className="lg-divider"><span>new to farmGuru?</span></div>
            
            <div className="lg-signup-box">
              <p>Don't have an account yet?</p>
              <Link to="/register" className="lg-signup-link">
                🌱 Create free account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;