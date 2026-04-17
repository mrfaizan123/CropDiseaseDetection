import { useState, useRef, useEffect } from 'react';
import API from '../../services/api.js';
import { motion, AnimatePresence } from 'framer-motion';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('hi');
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: '🌾 **FarmGuru** - आपका किसान मित्र!\n\nमैं आपकी मदद कर सकता हूँ:\n• 🌿 फसल रोग और उपचार\n• 💰 मंडी भाव और बिक्री सलाह\n• 🌱 फसल योजना\n• 🌤️ मौसम आधारित सलाह\n• 🏛️ सरकारी योजनाएं\n\nकृपया अपना प्रश्न पूछें।',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          console.log("📍 Location obtained:", position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("📍 Location permission denied:", error.message);
        }
      );
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setTimeout(() => sendMessage(transcript), 100);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      alert('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
    }
  };

  const speakText = (text, messageId) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      
      if (speakingMessageId === messageId) {
        setSpeakingMessageId(null);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setSpeakingMessageId(null);
      };
      
      synthRef.current.speak(utterance);
      setSpeakingMessageId(messageId);
    }
  };

  const sendMessage = async (customMessage = null) => {
    const messageToSend = customMessage !== null ? customMessage : input;
    if (!messageToSend.trim()) return;
    
    const userMessage = messageToSend.trim();
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await API.post('/chatbot/chat', { 
        message: userMessage,
        language: language,
        userId: localStorage.getItem('userId'),
        location: userLocation
      });
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: response.data.reply || response.data.message,
        timestamp: new Date(),
        id: Date.now()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: language === 'hi' 
          ? '🌾 FarmGuru क्षमा चाहता है। सेवा उपलब्ध नहीं है। कृपया बाद में प्रयास करें। 🙏'
          : '🌾 FarmGuru apologizes. Service unavailable. Please try again later. 🙏',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      role: 'bot', 
      content: language === 'hi' 
        ? '🌾 चैट साफ़ कर दी गई है। FarmGuru आपकी सहायता के लिए तैयार है।'
        : '🌾 Chat cleared. FarmGuru is ready to help you.',
      timestamp: new Date()
    }]);
  };

  const switchLanguage = (lang) => {
    setLanguage(lang);
    setMessages(prev => [...prev, {
      role: 'bot',
      content: lang === 'hi' 
        ? '🌾 भाषा हिंदी में बदल दी गई है। FarmGuru अब हिंदी में जवाब देगा।'
        : '🌾 Language changed to English. FarmGuru will now respond in English.',
      timestamp: new Date()
    }]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessage = (content) => {
    // Convert markdown-style formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  const quickQuestions = language === 'hi' ? [
    { icon: '🌾', text: 'टमाटर रोग', query: 'मेरे टमाटर के पत्ते पीले हो रहे हैं, क्या करूं?' },
    { icon: '💰', text: 'मंडी भाव', query: 'आज गेहूं का मंडी भाव क्या है?' },
    { icon: '🌱', text: 'फसल योजना', query: 'इस मौसम में कौन सी फसल लगाऊं?' },
    { icon: '💊', text: 'जैविक उपचार', query: 'नीम तेल का फसल में कैसे उपयोग करें?' },
    { icon: '📅', text: 'बुवाई समय', query: 'गेहूं की बुवाई का सही समय क्या है?' },
    { icon: '🏪', text: 'भंडारण', query: 'गेहूं भंडारण के सही तरीके बताएं' },
    { icon: '🌤️', text: 'मौसम', query: 'आज के मौसम के अनुसार क्या करें?' },
    { icon: '💰', text: 'बिक्री', query: 'फसल बेचने का सही समय कब है?' },
    { icon: '🏛️', text: 'सरकारी योजना', query: 'किसानों के लिए सरकारी योजनाएं बताएं' },
    { icon: '💡', text: 'जैविक खेती', query: 'जैविक खेती कैसे शुरू करें?' }
  ] : [
    { icon: '🌾', text: 'Tomato Disease', query: 'My tomato leaves are turning yellow, what should I do?' },
    { icon: '💰', text: 'Market Price', query: 'What is today\'s wheat market price?' },
    { icon: '🌱', text: 'Crop Planning', query: 'Which crop should I plant this season?' },
    { icon: '💊', text: 'Organic Remedy', query: 'How to use neem oil on crops?' },
    { icon: '📅', text: 'Sowing Time', query: 'When is the right time to sow wheat?' },
    { icon: '🏪', text: 'Storage', query: 'Best methods for wheat storage' },
    { icon: '🌤️', text: 'Weather', query: 'What should I do based on today\'s weather?' },
    { icon: '💰', text: 'Selling', query: 'When is the best time to sell my crop?' },
    { icon: '🏛️', text: 'Govt Schemes', query: 'Tell me about government schemes for farmers' },
    { icon: '💡', text: 'Organic Farming', query: 'How to start organic farming?' }
  ];

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2c5f2d, #1a3a1a)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '32px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          zIndex: 9999,
          transition: 'all 0.3s ease'
        }}
      >
        {isOpen ? '✕' : '🌾'}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '110px',
              right: '30px',
              width: '450px',
              height: '700px',
              maxWidth: 'calc(100vw - 60px)',
              maxHeight: 'calc(100vh - 140px)',
              background: 'white',
              borderRadius: '25px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 9998,
              fontFamily: "'Segoe UI', 'Roboto', sans-serif"
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #2c5f2d, #1a3a1a)',
              color: 'white',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src="https://placehold.co/45x45/ffffff/2c5f2d?text=FG" 
                  alt="FarmGuru Icon"
                  style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>FarmGuru</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '10px', opacity: 0.85 }}>
                    {language === 'hi' ? 'AI किसान सहायक • 24x7' : 'AI Farmer Assistant • 24x7'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={clearChat} style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px'
                }} title={language === 'hi' ? 'चैट साफ़ करें' : 'Clear chat'}>
                  🗑️
                </button>
                <button onClick={() => setIsOpen(false)} style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div style={{
              padding: '10px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                onClick={() => switchLanguage('hi')}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  background: language === 'hi' ? '#2c5f2d' : '#e2e8f0',
                  color: language === 'hi' ? 'white' : '#475569',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
              >
                🇮🇳 हिंदी
              </button>
              <button
                onClick={() => switchLanguage('en')}
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  background: language === 'en' ? '#2c5f2d' : '#e2e8f0',
                  color: language === 'en' ? 'white' : '#475569',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                🇬🇧 English
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              background: '#f9fafb'
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    background: msg.role === 'user' ? '#2c5f2d' : '#e5e7eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}>
                    {msg.role === 'user' ? '👤' : '🌾'}
                  </div>
                  <div style={{ maxWidth: '75%' }}>
                    <div style={{
                      background: msg.role === 'user' ? '#2c5f2d' : 'white',
                      color: msg.role === 'user' ? 'white' : '#1f2937',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '6px',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.role === 'bot' && msg.content && (
                        <button
                          onClick={() => speakText(msg.content.replace(/<[^>]*>/g, ''), idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: speakingMessageId === idx ? '#2c5f2d' : '#9ca3af',
                            padding: '2px 5px',
                            borderRadius: '12px'
                          }}
                          title={language === 'hi' ? 'सुनें' : 'Listen'}
                        >
                          {speakingMessageId === idx ? '🔊' : '🔈'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    background: '#e5e7eb',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>🌾</div>
                  <div style={{
                    background: 'white',
                    padding: '15px 20px',
                    borderRadius: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div style={{
              padding: '12px 20px',
              background: 'white',
              borderTop: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                📌 {language === 'hi' ? 'त्वरित प्रश्न' : 'Quick Questions'}
              </p>
              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                maxHeight: '100px',
                overflowY: 'auto'
              }}>
                {quickQuestions.slice(0, 8).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q.query)}
                    style={{
                      background: '#f3f4f6',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '25px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#2c5f2d';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f3f4f6';
                      e.target.style.color = '#374151';
                    }}
                  >
                    {q.icon} {q.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div style={{
              padding: '15px 20px',
              background: 'white',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <button
                onClick={startListening}
                disabled={isListening}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isListening ? '#ef4444' : '#2c5f2d',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
                title={language === 'hi' ? 'वॉयस इनपुट' : 'Voice input'}
              >
                🎤
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={language === 'hi' ? 'अपना प्रश्न लिखें...' : 'Type your question...'}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '30px',
                  outline: 'none',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2c5f2d';
                  e.target.style.boxShadow = '0 0 0 3px rgba(44,95,45,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#2c5f2d',
                  border: 'none',
                  color: 'white',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s',
                  opacity: loading || !input.trim() ? 0.5 : 1
                }}
              >
                📤
              </button>
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 20px',
              background: '#f8fafc',
              textAlign: 'center',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>
                {language === 'hi' 
                  ? '🌾 FarmGuru • AI द्वारा संचालित • किसानों के लिए मुफ्त'
                  : '🌾 FarmGuru • Powered by AI • Free for farmers'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .typing-indicator {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%, 60%, 100% { opacity: 0.4; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-5px); }
        }
        
        ::-webkit-scrollbar {
          width: 5px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #2c5f2d;
        }
      `}</style>
    </>
  );
}

export default Chatbot;
