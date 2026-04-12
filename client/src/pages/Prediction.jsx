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
  const [quickExplain, setQuickExplain] = useState({}); // Store quick explanations per result
  const [loadingExplain, setLoadingExplain] = useState({}); // Loading state per result
  const [explainLang, setExplainLang] = useState('en'); // Language for explanation
  
  // Disease Q&A states
  const [diseaseChat, setDiseaseChat] = useState({}); // Chat history per disease
  const [diseaseChatInput, setDiseaseChatInput] = useState({});
  const [loadingDiseaseChat, setLoadingDiseaseChat] = useState({});
  
  const { isAuthenticated, user } = useAuth();
  const synthRef = useRef(window.speechSynthesis);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Clean text by removing emojis and special characters that cause speech issues
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    // Remove emojis and other non-standard characters while keeping essential punctuation
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map symbols
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical symbols
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric shapes
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental arrows
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and pictographs extended
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italics
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\d+\.\s/g, ' ') // Remove numbered lists
      .replace(/-\s/g, ' ') // Remove bullet lists
      .replace(/\s+\(/g, '(') // Remove extra spaces before parenthesis
      .replace(/[^\w\s.,!?;:()\n]/g, ' ') // Keep only word chars, spaces, and basic punctuation
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Process images from files (browse or capture)
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
      if (file.size > 5 * 1024 * 1024) { // Strict 5MB checking
        toast.error(`Image exceeds the maximum 5MB size limit.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setImages(validFiles); // Override, do not push
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews); // Override, do not push
    setResults(null);
    setQuickExplain({});
  };

  const handleImageChange = (e) => {
    processImageFiles(e.target.files);
    // Reset file input value to allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraInputRef.current) {
        cameraInputRef.current.srcObject = stream;
        cameraInputRef.current.style.display = 'block';
        // Create a temporary video element for capture
        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();
        
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to file
        canvas.toBlob((blob) => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          processImageFiles([file]);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          if (cameraInputRef.current) cameraInputRef.current.style.display = 'none';
        }, 'image/jpeg', 0.9);
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
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

  // Professional speak function with text cleaning
  const speakText = (text, id, lang = 'en-US') => {
    if (!synthRef.current) {
      toast.error('Text-to-speech not supported');
      return;
    }
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    if (speakingText === id) {
      setSpeakingText(null);
      return;
    }
    
    // Clean the text before speaking
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText.trim()) {
      toast.error('No readable text to speak');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = lang === 'hi-IN' ? 0.8 : 0.85; // Slower for natural speech
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
    const key = `${result.className}_${language}`;
    if (quickExplain[key]) return;
    
    setLoadingExplain(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await API.post('/chatbot/quick-explain', {
        diseaseName: result.diseaseName,
        cropName: result.className, // Use crop name from detection
        symptoms: result.symptoms,
        treatment: result.treatment,
        prevention: result.prevention,
        organicRemedy: result.organicRemedy,
        location: 'Your farm location',
        language: language
      });
      
      if (response.data.success) {
        setQuickExplain(prev => ({ ...prev, [key]: response.data.reply }));
        // Initialize disease chat for Q&A
        initializeDiseaseChat(result.diseaseName, result.className);
        // Auto-play speech
        setTimeout(() => {
          speakQuickExplain(response.data.reply, `quick-${key}`, language);
        }, 100);
      } else {
        throw new Error('Failed to get explanation');
      }
    } catch (error) {
      console.error('Quick explain error:', error);
      const fallback = language === 'hi' 
        ? `भाई, आपकी फसल में ${result.diseaseName} हुआ है। यह आमतौर पर नमी के कारण होता है। सही इलाज से ठीक हो जाएगी। ${result.treatment.substring(0, 100) || ''}`
        : `Friend, your crop has ${result.diseaseName}. This usually happens in humid conditions. Proper treatment will fix it. ${result.treatment.substring(0, 100) || ''}`;
      setQuickExplain(prev => ({ ...prev, [key]: fallback }));
      initializeDiseaseChat(result.diseaseName, result.className);
    } finally {
      setLoadingExplain(prev => ({ ...prev, [key]: false }));
    }
  };

  // Initialize disease Q&A chat
  const initializeDiseaseChat = (diseaseName, cropName) => {
    const chatKey = `${diseaseName}_chat`;
    if (!diseaseChat[chatKey]) {
      setDiseaseChat(prev => ({
        ...prev,
        [chatKey]: [{ role: 'system', msg: `Asking about ${diseaseName} on ${cropName}? Ask away! हिंदी या English में सवाल पूछें।` }]
      }));
    }
  };

  // Ask disease question
  const askDiseaseQuestion = async (result, inputKey, language) => {
    const question = diseaseChatInput[inputKey]?.trim();
    if (!question) return;
    
    const chatKey = `${result.diseaseName}_chat`;
    setLoadingDiseaseChat(prev => ({ ...prev, [chatKey]: true }));
    setDiseaseChatInput(prev => ({ ...prev, [inputKey]: '' }));
    
    // Add user message to chat
    setDiseaseChat(prev => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), { role: 'user', msg: question }]
    }));
    
    try {
      const response = await API.post('/chatbot/disease-qa', {
        diseaseName: result.diseaseName,
        cropName: result.className,
        question: question,
        language: language
      });
      
      if (response.data.success) {
        setDiseaseChat(prev => ({
          ...prev,
          [chatKey]: [...prev[chatKey], { role: 'assistant', msg: response.data.reply }]
        }));
      }
    } catch (error) {
      console.error('Disease QA error:', error);
      setDiseaseChat(prev => ({
        ...prev,
        [chatKey]: [...prev[chatKey], { role: 'assistant', msg: language === 'hi' ? 'कृपया फिर से कोशिश करें।' : 'Please try again.' }]
      }));
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
    utterance.rate = language === 'hi' ? 0.8 : 0.85; // Slower, more natural speed
    utterance.pitch = language === 'hi' ? 1.1 : 1; // Slightly higher pitch for Hindi
    utterance.volume = 1;
    
    utterance.onstart = () => setSpeakingText(id);
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setSpeakingText(null);
    };
    
    synthRef.current.speak(utterance);
  };

  // Remove an image from the list
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
      {/* Hidden video element for camera capture */}
      <video ref={cameraInputRef} style={{ display: 'none', position: 'fixed', bottom: 0, right: 0, width: '200px' }} autoPlay playsInline />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
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

        {/* Auth Status */}

        
        {/* <div style={{
          background: isAuthenticated ? '#dcfce7' : '#fef3c7',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          {isAuthenticated ? (
            <span>✅ Logged in as <strong>{user?.name}</strong> - Your predictions will be saved!</span>
          ) : (
            <span>⚠️ Not logged in. <a href="/login" style={{ color: '#2c5f2d' }}>Login</a> to save history.</span>
          )}
        </div> */}

        {/* Upload Area with Browse and Capture options */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          border: '2px dashed #cbd5e1'
        }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Browse Files Button */}
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
            
            {/* Capture from Camera Button */}
            <button
              onClick={handleCameraCapture}
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
          
          {/* Image Previews with Remove Option */}
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


        {/* Results Section */}
        {results && results.results && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
              🔍 Diagnosis Results
            </h2>
            
            {results.results.map((result, idx) => {
              const isHealthy = result.isHealthy;
              const resultId = `result-${idx}`;
              const engKey = `${result.className}_en`;
              const hinKey = `${result.className}_hi`;
              
              return (
                <div key={idx} style={{
                  background: 'white',
                  borderRadius: '20px',
                  marginBottom: '25px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  {/* Header */}
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
                        Image {idx + 1}: {result.diseaseName}
                      </h3>
                      <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.9 }}>
                        Confidence: {result.confidence}%
                      </p>
                    </div>
                    {/* <button
                      onClick={() => speakText(result.aiExplanation || result.treatment, resultId)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      {speakingText === resultId ? '🔊' : '🔈'}
                    </button> */}
                  </div>

                  {/* AI Summary - From Gemini API */}
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

                  {/* Quick Explain Buttons */}
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
                      ⚡ Get Simple & Farmer-Friendly Explanation:
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

                  {/* Quick Explanation Display */}
                  {(quickExplain[engKey] || quickExplain[hinKey]) && (
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '14px' }}>
                          {quickExplain[engKey] ? '� Farmer-Friendly Guidance (English)' : '💚 किसान के लिए सहायक मार्गदर्शन (हिंदी)'}
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

                  {/* Loading indicator for quick explain */}
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

                  {/* Disease Q&A Chat */}
                  {(quickExplain[engKey] || quickExplain[hinKey]) && (
                    <div style={{
                      padding: '15px 20px',
                      background: 'linear-gradient(135deg, #f3f0ff, #ede9fe)',
                      borderBottom: '1px solid #e9d5ff',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#6b21a8', marginBottom: '12px', fontSize: '14px' }}>
                        ❓ Ask Questions About {result.diseaseName}
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', borderRadius: '8px', padding: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {diseaseChat[`${result.diseaseName}_chat`]?.map((msg, i) => (
                          <div key={i} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            background: msg.role === 'user' ? '#6b21a8' : '#f3f0ff',
                            color: msg.role === 'user' ? 'white' : '#4b0082',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            maxWidth: '80%',
                            fontSize: '13px',
                            lineHeight: '1.4'
                          }}>
                            {msg.msg}
                          </div>
                        ))}
                        {loadingDiseaseChat[`${result.diseaseName}_chat`] && (
                          <div style={{ alignSelf: 'flex-start', color: '#6b7280', fontSize: '12px' }}>
                            Thinking...
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder={explainLang === 'hi' ? 'सवाल पूछें या हिंदी में लिखें...' : 'Ask your question...'}
                          value={diseaseChatInput[`${result.diseaseName}_input`] || ''}
                          onChange={(e) => setDiseaseChatInput(prev => ({ ...prev, [`${result.diseaseName}_input`]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              askDiseaseQuestion(result, `${result.diseaseName}_input`, explainLang);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '20px',
                            border: '1px solid #d8b4fe',
                            outline: 'none',
                            fontSize: '13px'
                          }}
                        />
                        <button
                          onClick={() => askDiseaseQuestion(result, `${result.diseaseName}_input`, explainLang)}
                          disabled={loadingDiseaseChat[`${result.diseaseName}_chat`]}
                          style={{
                            padding: '8px 16px',
                            background: '#6b21a8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            opacity: loadingDiseaseChat[`${result.diseaseName}_chat`] ? 0.6 : 1
                          }}
                        >
                          {explainLang === 'hi' ? 'पूछें' : 'Ask'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detailed Information */}
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

                  {/* Action Buttons */}
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
                        const shareText = `🌾 *FarmGuru Diagnosis Report*\n\n*Crop Disease:* ${result.diseaseName}\n*AI Confidence:* ${result.confidence}%\n\n🛡️ *Treatment Advice:*\n${result.treatment}\n\n_Analyzed via FarmGuru AI_`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#25D366', // WhatsApp Brand Green
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
      `}</style>
    </div>
  );
}

export default Prediction;