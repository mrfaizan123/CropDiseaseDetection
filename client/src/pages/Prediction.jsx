import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader.jsx';
import API from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

function Prediction() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const [results, setResults] = useState(null);
  const [speakingText, setSpeakingText] = useState(null);
  const [quickExplain, setQuickExplain] = useState({});
  const [loadingExplain, setLoadingExplain] = useState({});
  const [explainLang, setExplainLang] = useState('en');
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' = back, 'user' = front
  
  // Disease Q&A states - Improved for natural conversation
  const [diseaseChat, setDiseaseChat] = useState({});
  const [diseaseChatInput, setDiseaseChatInput] = useState({});
  const [loadingDiseaseChat, setLoadingDiseaseChat] = useState({});
  
  const { isAuthenticated, user } = useAuth();
  const synthRef = useRef(window.speechSynthesis);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Helper function to extract clean crop and disease names
  const extractCropAndDisease = (className, diseaseName) => {
    let cleanCrop = '';
    let cleanDisease = '';
    
    // Handle different formats: "Tomato___Bacterial_spot" or "Tomato_Bacterial_spot"
    if (className.includes('___')) {
      const parts = className.split('___');
      cleanCrop = parts[0];
      cleanDisease = parts[1];
    } else if (className.includes('_')) {
      const parts = className.split('_');
      cleanCrop = parts[0];
      cleanDisease = parts.slice(1).join('_');
    } else {
      cleanCrop = className;
      cleanDisease = diseaseName.replace(/\s+/g, '_');
    }
    
    // Remove "healthy" if present
    if (cleanDisease.toLowerCase().includes('healthy')) {
      cleanDisease = 'healthy';
    }
    
    return {
      crop: cleanCrop,
      disease: cleanDisease,
      displayCrop: cleanCrop,
      displayDisease: cleanDisease.replace(/_/g, ' ')
    };
  };

  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/_/g, ' ')
      .replace(/\.(?=[A-Z])/g, ' ')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\d+\.\s/g, ' ')
      .replace(/-\s/g, ' ')
      .replace(/\s+\(/g, '(')
      .replace(/[^\w\s.,!?;:()\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      // Stop camera stream when component unmounts
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const processImageFiles = (files) => {
    const filesArray = Array.from(files);
    
    if (filesArray.length > 1 || images.length >= 1) {
      toast.error('Only 1 image allowed at a time. Clear the current image first.');
      return;
    }
    
    const validFiles = filesArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image exceeds the maximum 5MB size limit.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setImages(validFiles);
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setResults(null);
    setQuickExplain({});
    setShowCamera(false); // Close camera if open
  };

  const handleImageChange = (e) => {
    processImageFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start back camera
  const startBackCamera = async () => {
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      // Request back camera (environment facing)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } }
      });
      
      setCameraStream(stream);
      setCameraFacing('environment');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setShowCamera(true);
    } catch (error) {
      console.error('Back camera error:', error);
      // Fallback: try default camera if back camera fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        setCameraFacing('default');
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        
        setShowCamera(true);
        toast.success('Using default camera');
      } catch (fallbackError) {
        console.error('Fallback camera error:', fallbackError);
        toast.error('Unable to access camera. Please check permissions.');
      }
    }
  };

  // Switch camera between front and back
  const switchCamera = async () => {
    const newFacingMode = cameraFacing === 'environment' ? 'user' : 'environment';
    
    try {
      // Stop current stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      // Request new camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacingMode } }
      });
      
      setCameraStream(stream);
      setCameraFacing(newFacingMode);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      toast.success(newFacingMode === 'environment' ? 'Back camera activated' : 'Front camera activated');
    } catch (error) {
      console.error('Camera switch error:', error);
      toast.error('Cannot switch camera');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        processImageFiles([file]);
        
        // Stop camera and close modal
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        setShowCamera(false);
        toast.success('Photo captured successfully!');
      }, 'image/jpeg', 0.9);
    }
  };

  // Close camera
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const handlePredict = async () => {
    if (images.length === 0) {
      toast.error('Please select at least one image');
      return;
    }
    
    setPredicting(true);
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });
    
    try {
      const response = await API.post('/detection/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(response.data);
      toast.success('Prediction completed!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.response?.data?.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const clearImages = () => {
    setImages([]);
    previews.forEach(preview => URL.revokeObjectURL(preview));
    setPreviews([]);
    setResults(null);
    setQuickExplain({});
    if (synthRef.current) {
      synthRef.current.cancel();
      setSpeakingText(null);
    }
  };

  const speakText = (text, id, lang = 'en-US') => {
    if (!synthRef.current) {
      toast.error('Text-to-speech not supported');
      return;
    }
    
    synthRef.current.cancel();
    
    if (speakingText === id) {
      setSpeakingText(null);
      return;
    }
    
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText.trim()) {
      toast.error('No readable text to speak');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = lang === 'hi-IN' ? 0.8 : 0.85;
    utterance.pitch = lang === 'hi-IN' ? 1.1 : 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setSpeakingText(id);
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setSpeakingText(null);
      toast.error('Speech failed');
    };
    
    synthRef.current.speak(utterance);
  };

  const getQuickExplanation = async (result, language) => {
    const { crop, disease } = extractCropAndDisease(result.className, result.diseaseName);
    const key = `${crop}_${disease}_${language}`;
    
    if (quickExplain[key]) return;
    
    setLoadingExplain(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await API.post('/chatbot/quick-explain', {
        diseaseName: disease,
        cropName: crop,
        symptoms: result.symptoms,
        treatment: result.treatment,
        prevention: result.prevention,
        organicRemedy: result.organicRemedy,
        location: 'Your farm location',
        language: language
      });
      
      if (response.data.success) {
        setQuickExplain(prev => ({ ...prev, [key]: response.data.reply }));
        // Initialize chat with proper context
        const chatKey = `${crop}_${disease}_chat`;
        if (!diseaseChat[chatKey]) {
          setDiseaseChat(prev => ({
            ...prev,
            [chatKey]: []
          }));
        }
        setTimeout(() => {
          speakQuickExplain(response.data.reply, `quick-${key}`, language);
        }, 100);
      } else {
        throw new Error('Failed to get explanation');
      }
    } catch (error) {
      console.error('Quick explain error:', error);
      const { displayDisease } = extractCropAndDisease(result.className, result.diseaseName);
      const fallback = language === 'hi' 
        ? `आपकी ${crop} फसल में ${displayDisease} की समस्या आ गई है। नमी और गर्मी इसका कारण हो सकते हैं। घबराइए मत, सही इलाज से 1-2 हफ्ते में ठीक हो जाएगी। बाजार में मिलने वाली दवा का इस्तेमाल करें और नियमित निगरानी रखें।`
        : `Your ${crop} crop has ${displayDisease}. Humidity and warmth usually cause this problem. Don't worry - proper treatment will fix it in 1-2 weeks. Use available market treatments and monitor your plants regularly.`;
      setQuickExplain(prev => ({ ...prev, [key]: fallback }));
    } finally {
      setLoadingExplain(prev => ({ ...prev, [key]: false }));
    }
  };

  // NEW: Natural conversation handler for any disease question
  const askNaturalQuestion = async (result, question, language) => {
    const { crop, disease, displayDisease } = extractCropAndDisease(result.className, result.diseaseName);
    const chatKey = `${crop}_${disease}_chat`;
    
    if (!question.trim()) return;
    
    setLoadingDiseaseChat(prev => ({ ...prev, [chatKey]: true }));
    
    // Add user message to chat
    setDiseaseChat(prev => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), { 
        role: 'user', 
        msg: question,
        timestamp: Date.now()
      }]
    }));
    
    try {
      // Send to backend for natural AI response
      const response = await API.post('/chatbot/disease-qa', {
        diseaseName: disease,
        cropName: crop,
        question: question,
        language: language,
        context: diseaseChat[chatKey] || [] // Send chat history for context
      });
      
      if (response.data.success) {
        setDiseaseChat(prev => ({
          ...prev,
          [chatKey]: [...prev[chatKey], { 
            role: 'assistant', 
            msg: response.data.reply,
            timestamp: Date.now()
          }]
        }));
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Disease QA error:', error);
      // Show error but don't add dummy response
      toast.error(language === 'hi' ? 'जवाब लाने में समस्या हुई। कृपया फिर से कोशिश करें।' : 'Failed to get answer. Please try again.');
    } finally {
      setLoadingDiseaseChat(prev => ({ ...prev, [chatKey]: false }));
    }
  };

  const speakQuickExplain = (text, id, language) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    if (speakingText === id) {
      setSpeakingText(null);
      return;
    }
    
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = language === 'hi' ? 0.8 : 0.85;
    utterance.pitch = language === 'hi' ? 1.1 : 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setSpeakingText(id);
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setSpeakingText(null);
    };
    
    synthRef.current.speak(utterance);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setResults(null);
    setQuickExplain({});
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0e8 100%)',
      padding: '40px 20px'
    }}>
      {/* Hidden canvas for capturing photo */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            color: '#1a3a1a',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span>🔬</span> AI Crop Disease Detection
            <span>🌾</span>
          </h1>
          <p style={{ color: '#4a5568', fontSize: '1rem' }}>
            Upload or capture crop images for instant AI-powered disease diagnosis
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          border: '2px dashed #cbd5e1'
        }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-upload"
                ref={fileInputRef}
              />
              <label htmlFor="image-upload" style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: '#2c5f2d',
                color: 'white',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
              }}>
                📁 Browse Images
              </label>
            </div>
            
            <button
              onClick={startBackCamera}
              style={{
                padding: '14px 32px',
                background: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
              }}
            >
              📸 Capture Image
            </button>
          </div>
          
          <p style={{ marginTop: '15px', color: '#6b7280', fontSize: '14px' }}>
            Supported: JPEG, PNG, GIF | Max 5MB | Only 1 image allowed
          </p>
          
          {previews.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {previews.map((preview, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={preview} alt={`Preview ${idx + 1}`} style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '3px solid #2c5f2d'
                    }} />
                    <button
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={handlePredict} disabled={predicting} style={{
                  padding: '12px 32px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {predicting ? 'Analyzing...' : '🔬 Detect Disease'}
                </button>
                <button onClick={clearImages} style={{
                  padding: '12px 32px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer'
                }}>
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {predicting && <Loader />}

        {/* Camera Modal - Back Camera View */}
        {showCamera && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'black',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'cover',
                  transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none'
                }}
              />
              
              {/* Camera Controls */}
              <div style={{
                position: 'absolute',
                bottom: 30,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                padding: 20,
                background: 'rgba(0,0,0,0.7)'
              }}>
                <button
                  onClick={switchCamera}
                  style={{
                    padding: '15px 25px',
                    background: '#4a90e2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  🔄 Switch Camera
                </button>
                
                <button
                  onClick={capturePhoto}
                  style={{
                    padding: '15px 35px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  📸 Capture
                </button>
                
                <button
                  onClick={closeCamera}
                  style={{
                    padding: '15px 25px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ❌ Close
                </button>
              </div>
              
              <div style={{
                position: 'absolute',
                top: 20,
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'white',
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                fontSize: '14px'
              }}>
                {cameraFacing === 'environment' ? '📷 Back Camera Active' : '🤳 Front Camera Active'}
              </div>
            </div>
          </div>
        )}

        {/* Results Section with Natural Q&A */}
        {results && results.results && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
              🔍 Diagnosis Results
            </h2>
            
            {results.results.map((result, idx) => {
              const isHealthy = result.isHealthy;
              const { crop, disease, displayCrop, displayDisease } = extractCropAndDisease(result.className, result.diseaseName);
              const chatKey = `${crop}_${disease}_chat`;
              const engKey = `${crop}_${disease}_en`;
              const hinKey = `${crop}_${disease}_hi`;
              
              return (
                <div key={idx} style={{
                  background: 'white',
                  borderRadius: '20px',
                  marginBottom: '25px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    background: isHealthy ? '#10b981' : '#ef4444',
                    padding: '15px 20px',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>
                        Image {idx + 1}: {displayDisease}
                      </h3>
                      <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.9 }}>
                        Crop: {displayCrop} | Confidence: {result.confidence}%
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: '#f0fdf4',
                    padding: '20px',
                    borderBottom: '1px solid #e5e7eb',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '15px'
                  }}>
                    {result.aiExplanation || (isHealthy 
                      ? 'Your crop is healthy. Continue good care.'
                      : 'Disease detected. Please follow the treatment below.')}
                  </div>

                  <div style={{
                    padding: '15px 20px',
                    background: '#fef3c7',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#92400e' }}>
                      ⚡ Get Simple Explanation:
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => getQuickExplanation(result, 'en')}
                        disabled={loadingExplain[engKey]}
                        style={{
                          padding: '8px 20px',
                          background: loadingExplain[engKey] ? '#d1d5db' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          opacity: loadingExplain[engKey] ? 0.6 : 1,
                          fontWeight: '600'
                        }}
                      >
                        {loadingExplain[engKey] ? '⏳' : '🇬🇧'} English
                      </button>
                      <button
                        onClick={() => getQuickExplanation(result, 'hi')}
                        disabled={loadingExplain[hinKey]}
                        style={{
                          padding: '8px 20px',
                          background: loadingExplain[hinKey] ? '#d1d5db' : '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          opacity: loadingExplain[hinKey] ? 0.6 : 1,
                          fontWeight: '600'
                        }}
                      >
                        {loadingExplain[hinKey] ? '⏳' : '🇮🇳'} हिंदी
                      </button>
                    </div>
                  </div>

                  {(quickExplain[engKey] || quickExplain[hinKey]) && (
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '14px' }}>
                          {quickExplain[engKey] ? '💚 Farmer Guidance (English)' : '💚 किसान के लिए सहायक मार्गदर्शन (हिंदी)'}
                        </span>
                        {(quickExplain[engKey] || quickExplain[hinKey]) && (
                          <button
                            onClick={() => speakQuickExplain(
                              quickExplain[engKey] || quickExplain[hinKey], 
                              `quick-${idx}`,
                              quickExplain[engKey] ? 'en' : 'hi'
                            )}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '18px',
                              color: '#3b82f6',
                              padding: '5px'
                            }}
                          >
                            {speakingText === `quick-${idx}` ? '🔊' : '🔈'}
                          </button>
                        )}
                      </div>
                      <div style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        lineHeight: '1.8', 
                        color: '#1f2937',
                        whiteSpace: 'pre-wrap',
                        fontFamily: '"Segoe UI", system-ui, sans-serif'
                      }}>
                        {quickExplain[engKey] || quickExplain[hinKey]}
                      </div>
                    </div>
                  )}

                  {(loadingExplain[engKey] || loadingExplain[hinKey]) && (
                    <div style={{
                      padding: '20px',
                      background: '#eff6ff',
                      borderBottom: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #e5e7eb',
                          borderTopColor: '#2c5f2d',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span style={{ fontSize: '13px', color: '#4b5563' }}>
                          Getting simple explanation for you...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* NATURAL Q&A SECTION */}
                  {(quickExplain[engKey] || quickExplain[hinKey]) && (
                    <div style={{
                      padding: '15px 20px',
                      background: 'linear-gradient(135deg, #f3f0ff, #ede9fe)',
                      borderBottom: '1px solid #e9d5ff',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💬</span> Ask Anything About {displayDisease}
                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#9333ea' }}>
                          (Natural conversation)
                        </span>
                      </div>
                      
                      {/* Chat Messages */}
                      <div style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        background: 'white', 
                        borderRadius: '12px', 
                        padding: '12px', 
                        marginBottom: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        {(!diseaseChat[chatKey] || diseaseChat[chatKey].length === 0) && (
                          <div style={{ 
                            textAlign: 'center', 
                            color: '#9ca3af', 
                            fontSize: '12px',
                            padding: '20px'
                          }}>
                            💡 Ask me anything about {displayDisease} - causes, symptoms, treatment, prevention, organic remedies, or any specific question!
                          </div>
                        )}
                        
                        {diseaseChat[chatKey]?.map((msg, i) => (
                          <div key={i} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            background: msg.role === 'user' ? '#6b21a8' : '#f3f0ff',
                            color: msg.role === 'user' ? 'white' : '#4b0082',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            maxWidth: '85%',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            wordWrap: 'break-word'
                          }}>
                            {msg.msg}
                          </div>
                        ))}
                        
                        {loadingDiseaseChat[chatKey] && (
                          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', padding: '10px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              background: '#6b21a8',
                              borderRadius: '50%',
                              animation: 'bounce 0.5s infinite'
                            }} />
                            <div style={{
                              width: '8px',
                              height: '8px',
                              background: '#6b21a8',
                              borderRadius: '50%',
                              animation: 'bounce 0.5s infinite 0.1s'
                            }} />
                            <div style={{
                              width: '8px',
                              height: '8px',
                              background: '#6b21a8',
                              borderRadius: '50%',
                              animation: 'bounce 0.5s infinite 0.2s'
                            }} />
                          </div>
                        )}
                      </div>
                      
                      {/* Input Area */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          placeholder={`Ask anything about ${displayDisease}... (e.g., "What causes this?", "Best organic treatment?", "How to prevent?")`}
                          value={diseaseChatInput[chatKey] || ''}
                          onChange={(e) => setDiseaseChatInput(prev => ({ ...prev, [chatKey]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !loadingDiseaseChat[chatKey]) {
                              const question = diseaseChatInput[chatKey]?.trim();
                              if (question) {
                                askNaturalQuestion(result, question, explainLang);
                                setDiseaseChatInput(prev => ({ ...prev, [chatKey]: '' }));
                              }
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 15px',
                            borderRadius: '25px',
                            border: '1px solid #d8b4fe',
                            outline: 'none',
                            fontSize: '13px',
                            fontFamily: 'inherit'
                          }}
                          disabled={loadingDiseaseChat[chatKey]}
                        />
                        <button
                          onClick={() => {
                            const question = diseaseChatInput[chatKey]?.trim();
                            if (question && !loadingDiseaseChat[chatKey]) {
                              askNaturalQuestion(result, question, explainLang);
                              setDiseaseChatInput(prev => ({ ...prev, [chatKey]: '' }));
                            }
                          }}
                          disabled={loadingDiseaseChat[chatKey] || !diseaseChatInput[chatKey]?.trim()}
                          style={{
                            padding: '10px 20px',
                            background: loadingDiseaseChat[chatKey] || !diseaseChatInput[chatKey]?.trim() ? '#d1d5db' : '#6b21a8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: loadingDiseaseChat[chatKey] || !diseaseChatInput[chatKey]?.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>✏️</span> Ask
                        </button>
                      </div>
                      
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#7e22ce', textAlign: 'center' }}>
                        💡 You can ask in English or Hindi - Get natural, detailed answers!
                      </div>
                    </div>
                  )}

                  <details style={{ padding: '20px', cursor: 'pointer' }}>
                    <summary style={{ fontWeight: 'bold', color: '#2c5f2d', marginBottom: '15px' }}>
                      📋 Detailed Information
                    </summary>
                    <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                      <p><strong>Cause:</strong> {result.cause}</p>
                      <p><strong>Symptoms:</strong> {result.symptoms}</p>
                      <p><strong>Treatment:</strong> {result.treatment}</p>
                      <p><strong>Prevention:</strong> {result.prevention}</p>
                      <p><strong>Organic Remedy:</strong> {result.organicRemedy}</p>
                      <p><strong>Chemical Control:</strong> {result.chemicalControl}</p>
                      <p><strong>Yield Loss:</strong> {result.yieldLoss}</p>
                    </div>
                  </details>

                  <div style={{
                    padding: '15px 20px',
                    background: '#f8fafc',
                    display: 'flex',
                    gap: '15px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => speakText(result.treatment, `treatment-${idx}`)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🔊 Listen to Treatment
                    </button>
                    <button
                      onClick={() => {
                        const shareText = `🌾 *FarmGuru Diagnosis Report*\n\n*Crop Disease:* ${displayDisease}\n*Crop:* ${displayCrop}\n*AI Confidence:* ${result.confidence}%\n\n🛡️ *Treatment Advice:*\n${result.treatment}\n\n_Analyzed via FarmGuru AI_`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      💬 WhatsApp Share
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

export default Prediction;
