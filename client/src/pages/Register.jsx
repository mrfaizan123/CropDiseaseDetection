// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext.jsx';
// import { motion } from 'framer-motion';

// function Register() {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     phone: '',
//     farmSize: '',
//     location: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const { register } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.name.trim()) newErrors.name = 'Full name is required';
//     if (!formData.email.trim()) newErrors.email = 'Email is required';
//     if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
//     if (!formData.password) newErrors.password = 'Password is required';
//     if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
//     if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
//     if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number required';
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;
    
//     setLoading(true);
//     const result = await register(
//       formData.name,
//       formData.email,
//       formData.password,
//       formData.phone
//     );
//     setLoading(false);
//     if (result.success) {
//       navigate('/dashboard');
//     }
//   };

//   return (
//     <div style={{
//       minHeight: '100vh',
//       background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0e8 100%)',
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: '40px 20px'
//     }}>
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         style={{
//           maxWidth: '560px',
//           width: '100%',
//           background: 'white',
//           borderRadius: '32px',
//           boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)',
//           overflow: 'hidden'
//         }}
//       >
//         {/* Header */}
//         <div style={{
//           background: 'linear-gradient(135deg, #2c5f2d, #1a3a1a)',
//           padding: '35px 30px',
//           textAlign: 'center',
//           color: 'white'
//         }}>
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
//             style={{ fontSize: '3.5rem', marginBottom: '10px' }}
//           >
//             🌱
//           </motion.div>
//           <h1 style={{ fontSize: '1.8rem', marginBottom: '8px', fontWeight: '700' }}>
//             Join as a Farmer
//           </h1>
//           <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
//             Create your account to access AI crop disease detection
//           </p>
//         </div>

//         {/* Form Section */}
//         <div style={{ padding: '35px 30px' }}>
//           <form onSubmit={handleSubmit}>
//             {/* Full Name */}
//             <div style={{ marginBottom: '20px' }}>
//               <label style={{
//                 display: 'block',
//                 marginBottom: '8px',
//                 fontWeight: '500',
//                 color: '#1f2937',
//                 fontSize: '0.85rem'
//               }}>
//                 Full Name <span style={{ color: '#ef4444' }}>*</span>
//               </label>
//               <div style={{ position: 'relative' }}>
//                 <span style={{
//                   position: 'absolute',
//                   left: '12px',
//                   top: '50%',
//                   transform: 'translateY(-50%)',
//                   color: '#9ca3af'
//                 }}>👤</span>
//                 <input
//                   type="text"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="e.g., Rajesh Kumar"
//                   required
//                   style={{
//                     width: '100%',
//                     padding: '12px 14px 12px 40px',
//                     border: `1px solid ${errors.name ? '#ef4444' : '#e5e7eb'}`,
//                     borderRadius: '12px',
//                     fontSize: '0.95rem',
//                     transition: 'all 0.3s ease',
//                     outline: 'none',
//                     backgroundColor: '#f9fafb'
//                   }}
//                   onFocus={(e) => {
//                     e.target.style.borderColor = '#2c5f2d';
//                     e.target.style.backgroundColor = 'white';
//                   }}
//                   onBlur={(e) => {
//                     if (!errors.name) {
//                       e.target.style.borderColor = '#e5e7eb';
//                       e.target.style.backgroundColor = '#f9fafb';
//                     }
//                   }}
//                 />
//               </div>
//               {errors.name && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '5px' }}>{errors.name}</p>}
//             </div>

//             {/* Email */}
//             <div style={{ marginBottom: '20px' }}>
//               <label style={{
//                 display: 'block',
//                 marginBottom: '8px',
//                 fontWeight: '500',
//                 color: '#1f2937',
//                 fontSize: '0.85rem'
//               }}>
//                 Email Address <span style={{ color: '#ef4444' }}>*</span>
//               </label>
//               <div style={{ position: 'relative' }}>
//                 <span style={{
//                   position: 'absolute',
//                   left: '12px',
//                   top: '50%',
//                   transform: 'translateY(-50%)',
//                   color: '#9ca3af'
//                 }}>📧</span>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="farmer@example.com"
//                   required
//                   style={{
//                     width: '100%',
//                     padding: '12px 14px 12px 40px',
//                     border: `1px solid ${errors.email ? '#ef4444' : '#e5e7eb'}`,
//                     borderRadius: '12px',
//                     fontSize: '0.95rem',
//                     transition: 'all 0.3s ease',
//                     outline: 'none',
//                     backgroundColor: '#f9fafb'
//                   }}
//                 />
//               </div>
//               {errors.email && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '5px' }}>{errors.email}</p>}
//             </div>

//             {/* Phone */}
//             <div style={{ marginBottom: '20px' }}>
//               <label style={{
//                 display: 'block',
//                 marginBottom: '8px',
//                 fontWeight: '500',
//                 color: '#1f2937',
//                 fontSize: '0.85rem'
//               }}>
//                 Phone Number (Optional)
//               </label>
//               <div style={{ position: 'relative' }}>
//                 <span style={{
//                   position: 'absolute',
//                   left: '12px',
//                   top: '50%',
//                   transform: 'translateY(-50%)',
//                   color: '#9ca3af'
//                 }}>📞</span>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   placeholder="10-digit mobile number"
//                   style={{
//                     width: '100%',
//                     padding: '12px 14px 12px 40px',
//                     border: `1px solid ${errors.phone ? '#ef4444' : '#e5e7eb'}`,
//                     borderRadius: '12px',
//                     fontSize: '0.95rem',
//                     transition: 'all 0.3s ease',
//                     outline: 'none',
//                     backgroundColor: '#f9fafb'
//                   }}
//                 />
//               </div>
//               {errors.phone && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '5px' }}>{errors.phone}</p>}
//             </div>

//             {/* Password */}
//             <div style={{ marginBottom: '20px' }}>
//               <label style={{
//                 display: 'block',
//                 marginBottom: '8px',
//                 fontWeight: '500',
//                 color: '#1f2937',
//                 fontSize: '0.85rem'
//               }}>
//                 Password <span style={{ color: '#ef4444' }}>*</span>
//               </label>
//               <div style={{ position: 'relative' }}>
//                 <span style={{
//                   position: 'absolute',
//                   left: '12px',
//                   top: '50%',
//                   transform: 'translateY(-50%)',
//                   color: '#9ca3af'
//                 }}>🔒</span>
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="Minimum 6 characters"
//                   required
//                   style={{
//                     width: '100%',
//                     padding: '12px 14px 12px 40px',
//                     border: `1px solid ${errors.password ? '#ef4444' : '#e5e7eb'}`,
//                     borderRadius: '12px',
//                     fontSize: '0.95rem',
//                     transition: 'all 0.3s ease',
//                     outline: 'none',
//                     backgroundColor: '#f9fafb'
//                   }}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   style={{
//                     position: 'absolute',
//                     right: '12px',
//                     top: '50%',
//                     transform: 'translateY(-50%)',
//                     background: 'none',
//                     border: 'none',
//                     cursor: 'pointer',
//                     color: '#9ca3af'
//                   }}
//                 >
//                   {showPassword ? '🙈' : '👁️'}
//                 </button>
//               </div>
//               {errors.password && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '5px' }}>{errors.password}</p>}
//             </div>

//             {/* Confirm Password */}
//             <div style={{ marginBottom: '25px' }}>
//               <label style={{
//                 display: 'block',
//                 marginBottom: '8px',
//                 fontWeight: '500',
//                 color: '#1f2937',
//                 fontSize: '0.85rem'
//               }}>
//                 Confirm Password <span style={{ color: '#ef4444' }}>*</span>
//               </label>
//               <div style={{ position: 'relative' }}>
//                 <span style={{
//                   position: 'absolute',
//                   left: '12px',
//                   top: '50%',
//                   transform: 'translateY(-50%)',
//                   color: '#9ca3af'
//                 }}>✓</span>
//                 <input
//                   type={showConfirmPassword ? 'text' : 'password'}
//                   name="confirmPassword"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   placeholder="Re-enter your password"
//                   required
//                   style={{
//                     width: '100%',
//                     padding: '12px 14px 12px 40px',
//                     border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#e5e7eb'}`,
//                     borderRadius: '12px',
//                     fontSize: '0.95rem',
//                     transition: 'all 0.3s ease',
//                     outline: 'none',
//                     backgroundColor: '#f9fafb'
//                   }}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   style={{
//                     position: 'absolute',
//                     right: '12px',
//                     top: '50%',
//                     transform: 'translateY(-50%)',
//                     background: 'none',
//                     border: 'none',
//                     cursor: 'pointer',
//                     color: '#9ca3af'
//                   }}
//                 >
//                   {showConfirmPassword ? '🙈' : '👁️'}
//                 </button>
//               </div>
//               {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '5px' }}>{errors.confirmPassword}</p>}
//             </div>

//             {/* Register Button */}
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               type="submit"
//               disabled={loading}
//               style={{
//                 width: '100%',
//                 padding: '14px',
//                 background: 'linear-gradient(135deg, #2c5f2d, #1a3a1a)',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '12px',
//                 fontSize: '1rem',
//                 fontWeight: '600',
//                 cursor: loading ? 'not-allowed' : 'pointer',
//                 opacity: loading ? 0.7 : 1,
//                 transition: 'all 0.3s ease',
//                 marginBottom: '20px'
//               }}
//             >
//               {loading ? (
//                 <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
//                   <span className="spinner-small" />
//                   Creating Account...
//                 </span>
//               ) : (
//                 'Create Account →'
//               )}
//             </motion.button>

//             {/* Divider */}
//             <div style={{
//               display: 'flex',
//               alignItems: 'center',
//               gap: '15px',
//               marginBottom: '20px'
//             }}>
//               <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
//               <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Already have an account?</span>
//               <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
//             </div>

//             {/* Login Link */}
//             <p style={{ textAlign: 'center' }}>
//               <Link
//                 to="/login"
//                 style={{
//                   color: '#2c5f2d',
//                   textDecoration: 'none',
//                   fontWeight: '600',
//                   fontSize: '0.95rem'
//                 }}
//               >
//                 Sign in to your account →
//               </Link>
//             </p>
//           </form>
//         </div>

//         {/* Footer */}
//         <div style={{
//           background: '#f9fafb',
//           padding: '15px 30px',
//           textAlign: 'center',
//           borderTop: '1px solid #e5e7eb'
//         }}>
//           <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
//             By registering, you agree to our Terms of Service and Privacy Policy
//           </p>
//         </div>
//       </motion.div>

//       <style>{`
//         .spinner-small {
//           width: 18px;
//           height: 18px;
//           border: 2px solid white;
//           border-top-color: transparent;
//           border-radius: 50%;
//           animation: spin 0.6s linear infinite;
//           display: inline-block;
//         }
        
//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// }

// export default Register;


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // YOUR ORIGINAL STATE - completely unchanged
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    farmSize: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // YOUR ORIGINAL FUNCTIONS - completely unchanged
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.phone
    );
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  // Only the styling is from the beautiful code below
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;600&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes sgFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sgGlow{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
        @keyframes sgLeaf{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:0.4}100%{transform:translateY(-110vh) rotate(720deg);opacity:0}}
        @keyframes sgPulse{0%,100%{box-shadow:0 0 0 0 rgba(126,203,58,0.4)}50%{box-shadow:0 0 0 8px rgba(126,203,58,0)}}
        @keyframes sgSpin{to{transform:rotate(360deg)}}
        .sg-root{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;font-family:'DM Sans',sans-serif;overflow:hidden;}
        .sg-left{background:linear-gradient(160deg,#0a1e0a 0%,#122a12 40%,#0d2010 100%);display:flex;flex-direction:column;justify-content:center;padding:clamp(40px,6vw,80px) clamp(32px,5vw,64px);position:relative;overflow:hidden;}
        .sg-lgrid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(74,158,42,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(74,158,42,0.06) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 90% 90% at 30% 50%,black,transparent);-webkit-mask-image:radial-gradient(ellipse 90% 90% at 30% 50%,black,transparent);}
        .sg-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);}
        .sg-leaf{position:absolute;pointer-events:none;border-radius:50% 10% 50% 10%;background:rgba(74,158,42,0.08);animation:sgLeaf linear infinite;}
        .sg-brand{display:flex;align-items:center;gap:10px;margin-bottom:clamp(36px,6vw,56px);position:relative;z-index:2;animation:sgFadeUp 0.5s 0.1s both;}
        .sg-bicon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2d6a1f,#4a9e2a);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 16px rgba(74,158,42,0.4);}
        .sg-bname{font-family:'DM Serif Display',serif;font-size:22px;color:#7ecb3a;}
        .sg-lhead{font-family:'DM Serif Display',serif;font-size:clamp(28px,3.5vw,44px);color:#faf7f0;line-height:1.1;letter-spacing:-0.02em;margin-bottom:12px;position:relative;z-index:2;animation:sgFadeUp 0.5s 0.2s both;}
        .sg-lhead em{font-style:italic;color:#7ecb3a;}
        .sg-lsub{font-size:clamp(13px,1.6vw,15px);font-weight:300;color:rgba(250,247,240,0.55);line-height:1.7;margin-bottom:clamp(32px,4vw,48px);position:relative;z-index:2;animation:sgFadeUp 0.5s 0.3s both;}
        .sg-perks{display:flex;flex-direction:column;gap:14px;position:relative;z-index:2;animation:sgFadeUp 0.5s 0.4s both;}
        .sg-perk{display:flex;align-items:center;gap:12px;}
        .sg-picon{width:36px;height:36px;border-radius:9px;flex-shrink:0;background:rgba(74,158,42,0.15);border:1px solid rgba(126,203,58,0.2);display:flex;align-items:center;justify-content:center;font-size:16px;}
        .sg-ptext{font-size:clamp(12px,1.5vw,14px);color:rgba(250,247,240,0.7);}
        .sg-lfoot{margin-top:auto;padding-top:clamp(32px,4vw,48px);position:relative;z-index:2;font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(198,232,154,0.25);letter-spacing:0.08em;}
        .sg-right{background:#faf7f0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:clamp(40px,6vw,80px) clamp(28px,5vw,60px);overflow-y:auto;position:relative;}
        .sg-right::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#2d6a1f,#7ecb3a,#2d6a1f);}
        .sg-form-wrap{width:100%;max-width:520px;animation:sgFadeUp 0.5s 0.15s both;}
        .sg-heading{font-family:'DM Serif Display',serif;font-size:clamp(22px,3vw,30px);color:#0d2310;margin-bottom:4px;text-align:center;}
        .sg-subhead{font-size:clamp(12px,1.5vw,14px);font-weight:300;color:#6a7a5a;margin-bottom:clamp(18px,3vw,24px);text-align:center;}
        .sg-field{margin-bottom:20px;}
        .sg-label{display:block;font-size:11px;font-weight:600;color:#3a5a20;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;font-family:'JetBrains Mono',monospace;}
        .sg-iw{position:relative;}
        .sg-input{width:100%;padding:12px 14px;background:#f0ead8;border:1.5px solid #ddd5b8;border-radius:10px;font-size:14px;font-family:'DM Sans',sans-serif;color:#0d2310;outline:none;transition:all 0.2s;box-sizing:border-box;}
        .sg-input:focus{border-color:#4a9e2a;background:#f5f0e0;box-shadow:0 0 0 3px rgba(74,158,42,0.12);}
        .sg-input.err{border-color:#d94040;box-shadow:0 0 0 3px rgba(217,64,64,0.1);}
        .sg-input-pr{padding-right:44px;}
        .sg-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#8a9a6a;font-size:16px;transition:color 0.2s;}
        .sg-eye:hover{color:#4a9e2a;}
        .sg-bars{display:flex;gap:4px;margin-top:7px;}
        .sg-bar{flex:1;height:3px;border-radius:2px;background:rgba(74,158,42,0.1);transition:background 0.35s;}
        .sg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .sg-checks{background:rgba(74,158,42,0.06);border:1px solid rgba(74,158,42,0.15);border-radius:10px;padding:12px 14px;margin-bottom:14px;}
        .sg-check{display:flex;align-items:center;gap:8px;font-size:12px;font-family:'JetBrains Mono',monospace;margin-bottom:4px;transition:color 0.3s;}
        .sg-btn{width:100%;padding:14px;background:linear-gradient(135deg,#2d6a1f,#4a9e2a);color:#faf7f0;border:none;border-radius:12px;font-size:15px;font-weight:600;font-family:'DM Serif Display',serif;cursor:pointer;box-shadow:0 6px 20px rgba(74,158,42,0.38);transition:transform 0.15s,box-shadow 0.15s,opacity 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;}
        .sg-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(74,158,42,0.5);}
        .sg-btn:disabled{opacity:0.65;cursor:not-allowed;}
        .sg-divider{display:flex;align-items:center;gap:10px;margin:16px 0;}
        .sg-divider::before,.sg-divider::after{content:'';flex:1;height:1px;background:#e2d9c4;}
        .sg-divider span{font-size:12px;color:#a09070;font-family:'JetBrains Mono',monospace;}
        .sg-footer{text-align:center;margin-top:14px;font-size:13px;color:#7a8a6a;}
        .sg-footer a{color:#4a9e2a;font-weight:600;text-decoration:none;}
        .sg-terms{text-align:center;margin-top:10px;font-size:11px;color:#a09070;line-height:1.6;font-family:'JetBrains Mono',monospace;}
        .sg-terms a{color:#5a7a3a;text-decoration:underline;}
        .sg-spinner{width:18px;height:18px;border:2px solid rgba(250,247,240,0.3);border-top-color:#faf7f0;border-radius:50%;animation:sgSpin 0.7s linear infinite;}
        .error-text{font-size:10px;margin-top:4px;color:#d94040;font-family:'JetBrains Mono',monospace;}
        @media(max-width:768px){.sg-root{grid-template-columns:1fr;}.sg-left{display:none;}.sg-right{min-height:100vh;padding:32px 20px;}}
        @media(max-width:380px){.sg-row{grid-template-columns:1fr;}}
      `}</style>
      
      <div className="sg-root">
        <div className="sg-left">
          <div className="sg-lgrid"/>
          <div className="sg-glow" style={{width:400,height:400,background:"radial-gradient(circle,rgba(74,158,42,0.2) 0%,transparent 70%)",top:-100,right:-80,animation:"sgGlow 9s ease-in-out infinite"}}/>
          <div className="sg-glow" style={{width:250,height:250,background:"radial-gradient(circle,rgba(126,203,58,0.14) 0%,transparent 70%)",bottom:40,left:-40,animation:"sgGlow 12s ease-in-out infinite reverse"}}/>
          {[...Array(6)].map((_,i)=><div key={i} className="sg-leaf" style={{width:`${16+i*8}px`,height:`${16+i*8}px`,bottom:`-${10+i*8}%`,left:`${5+i*15}%`,animationDuration:`${12+i*4}s`,animationDelay:`${i*2.5}s`}}/>)}
          <div className="sg-brand"><div className="sg-bicon">🌿</div><span className="sg-bname">FarmGuru</span></div>
          <h2 className="sg-lhead">Grow smarter,<br/><em>harvest more</em></h2>
          
          <div className="sg-perks">
            <div className="sg-perk"><div className="sg-picon">🔬</div><span className="sg-ptext">AI disease detection</span></div>
            <div className="sg-perk"><div className="sg-picon">📊</div><span className="sg-ptext">Scan history & analytics</span></div>
            {/* <div className="sg-perk"><div className="sg-picon">💹</div><span className="sg-ptext">Live mandi rates</span></div> */}
            <div className="sg-perk"><div className="sg-picon">🌿</div><span className="sg-ptext">12+ crop types</span></div>
          </div>
    
        </div>
        
        <div className="sg-right">
          <div className="sg-form-wrap">
            <h1 className="sg-heading">Join as a Farmer</h1>
            <p className="sg-subhead">Create your account to access AI crop disease detection</p>
            
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="sg-field">
                <label className="sg-label">Full Name <span style={{color:"#d94040"}}>*</span></label>
                <div className="sg-iw">
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#8a9a6a",zIndex:1}}>👤</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Rajesh Kumar"
                    className={`sg-input ${errors.name ? "err" : ""}`}
                    style={{paddingLeft:"40px"}}
                  />
                </div>
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="sg-field">
                <label className="sg-label">Email Address <span style={{color:"#d94040"}}>*</span></label>
                <div className="sg-iw">
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#8a9a6a",zIndex:1}}>📧</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="farmer@example.com"
                    className={`sg-input ${errors.email ? "err" : ""}`}
                    style={{paddingLeft:"40px"}}
                  />
                </div>
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>

              {/* Phone */}
              <div className="sg-field">
                <label className="sg-label">Phone Number (Optional)</label>
                <div className="sg-iw">
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#8a9a6a",zIndex:1}}>📞</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`sg-input ${errors.phone ? "err" : ""}`}
                    style={{paddingLeft:"40px"}}
                  />
                </div>
                {errors.phone && <div className="error-text">{errors.phone}</div>}
              </div>

              {/* Password */}
              <div className="sg-field">
                <label className="sg-label">Password <span style={{color:"#d94040"}}>*</span></label>
                <div className="sg-iw">
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#8a9a6a",zIndex:1}}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className={`sg-input sg-input-pr ${errors.password ? "err" : ""}`}
                    style={{paddingLeft:"40px"}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="sg-eye"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <div className="error-text">{errors.password}</div>}
              </div>

              {/* Confirm Password */}
              <div className="sg-field">
                <label className="sg-label">Confirm Password <span style={{color:"#d94040"}}>*</span></label>
                <div className="sg-iw">
                  <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#8a9a6a",zIndex:1}}>✓</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`sg-input sg-input-pr ${errors.confirmPassword ? "err" : ""}`}
                    style={{paddingLeft:"40px"}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="sg-eye"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="sg-btn"
              >
                {loading ? (
                  <>
                    <div className="sg-spinner" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account →'
                )}
              </button>

              {/* Divider */}
              <div className="sg-divider">
                <span>Already have an account?</span>
              </div>

              {/* Login Link */}
              <div className="sg-footer">
                <Link to="/login">Sign in to your account →</Link>
              </div>
            </form>

            {/* Footer */}
            <div className="sg-terms">
              By registering, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </>
  );
}