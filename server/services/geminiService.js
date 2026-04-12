// import { GoogleGenerativeAI } from '@google/generative-ai';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// console.log("🔑 GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing");

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Detect language of user input
// function detectLanguage(text) {
//   const hasDevanagari = /[\u0900-\u097F]/g.test(text);
//   const hasEnglish = /[a-zA-Z]/g.test(text);
  
//   if (hasDevanagari && hasEnglish) return 'hinglish';
//   if (hasDevanagari) return 'hi';
//   return 'en';
// }

// // ==================== MAIN CHATBOT FUNCTION ====================

// export const getChatbotResponse = async (userMessage, language = 'hi') => {
//   try {
//     console.log("🤖 Chatbot processing:", userMessage);
    
//     const detectedLang = detectLanguage(userMessage);
//     console.log("📝 Detected language:", detectedLang);
    
//     let responseLang = 'English';
//     if (detectedLang === 'hi') responseLang = 'Hindi';
//     if (detectedLang === 'hinglish') responseLang = 'Hinglish';
    
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
//     const prompt = `You are FarmGuru, an expert farming assistant for Indian farmers. You help with all farming related questions.

// CRITICAL LANGUAGE RULE:
// - User wrote in: ${responseLang}
// - You MUST respond in EXACTLY the SAME language
// - If user wrote in Hinglish (Hindi words with English script), respond in Hinglish

// YOUR EXPERTISE INCLUDES:
// - Crop diseases - diagnosis, treatment, prevention (organic and chemical)
// - Market prices for all crops (wheat, rice, maize, potato, tomato, onion, mustard, etc.)
// - Fertilizers - types, dosage, application timing, organic alternatives
// - Pesticides - when to use, how much, safety precautions
// - Crop planning - sowing time, harvesting, irrigation schedule
// - Weather-based farming advice
// - Government schemes for farmers
// - Soil health and management
// - Organic farming methods
// - Storage and preservation of produce

// RESPONSE RULES:
// - ANSWER THE QUESTION DIRECTLY - do NOT ask for more information
// - Give SPECIFIC numbers (quantity, price, dosage) whenever possible
// - Provide PRACTICAL, ACTIONABLE advice
// - Keep response CONCISE (3-4 sentences maximum)
// - Be WARM and RESPECTFUL like talking to an elder farmer
// - Include natural/organic solutions first, then chemical options

// EXAMPLE RESPONSES:

// Q: "आज गेहूं का मंडी भाव क्या है?"
// A: "🌾 किसान भाई, आज गेहूं का मंडी भाव ₹2275 प्रति क्विंटल है। यह भाव पिछले हफ्ते से 2% बढ़ा है। अगर आपके पास अच्छी क्वालिटी का गेहूं है तो अभी बेच सकते हैं।"

// Q: "My tomato leaves are turning yellow"
// A: "🌾 Dear farmer, yellow leaves on tomato indicate nitrogen deficiency or overwatering. Spray 1% urea solution (10g urea in 1L water) in the morning. Reduce watering to every 3-4 days. Add compost around the plants."

// Q: "धान में कौन सा खाद डालें?"
// A: "🌾 किसान भाई, धान में DAP 50kg और यूरिया 30kg प्रति एकड़ डालें। यूरिया को दो बार में बांटकर डालें - पहली बार बुवाई के 20 दिन बाद, दूसरी बार 45 दिन बाद।"

// Now answer this farmer question DIRECTLY (DO NOT ask for more information):

// Farmer Question: "${userMessage}"

// FarmGuru Response:`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     let reply = response.text();
    
//     // Clean up
//     reply = reply.replace(/\*\*/g, '').replace(/```/g, '').trim();
    
//     return {
//       success: true,
//       reply: reply,
//       detectedLanguage: detectedLang
//     };
    
//   } catch (error) {
//     console.error('Gemini API Error:', error.message);
    
//     // Fallback - still using Gemini but simpler prompt
//     try {
//       const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
//       const simplePrompt = `Answer this farming question in ${detectLanguage(userMessage) === 'hi' ? 'Hindi' : 'English'}: ${userMessage}. Give practical advice in 2-3 sentences.`;
//       const result = await model.generateContent(simplePrompt);
//       const response = await result.response;
//       return {
//         success: true,
//         reply: response.text().trim()
//       };
//     } catch (fallbackError) {
//       return {
//         success: false,
//         reply: detectLanguage(userMessage) === 'hi' 
//           ? '🌾 क्षमा करें, अभी सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद प्रयास करें।'
//           : '🌾 Sorry, service is temporarily unavailable. Please try again later.',
//         error: error.message
//       };
//     }
//   }
// };

// // ==================== QUICK EXPLAIN FUNCTION ====================

// export const getQuickExplain = async (diseaseName, treatment, language = 'en') => {
//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
//     const prompt = `Explain this crop disease to a farmer in ${language === 'hi' ? 'simple Hindi' : 'simple English'}:

// Disease: ${diseaseName}
// Treatment: ${treatment || 'Apply recommended treatment'}

// Give 2-3 practical, encouraging sentences. Be specific with quantities if possible.

// Example: ${language === 'hi' 
//   ? '"यह पत्ती उकता है। 2 ग्राम क्लोरोथालोनिल 1 लीटर पानी में मिलाकर सुबह छिड़काव करें। प्रभावित पत्तियों को हटा दें। फसल बच सकती है!"'
//   : '"This is leaf mold. Mix 2g Chlorothalonil in 1 liter water and spray in morning. Remove affected leaves. Your crop can be saved!"'}

// Now explain: ${diseaseName}`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     return { success: true, reply: response.text().trim() };
    
//   } catch (error) {
//     return { success: false, reply: treatment || "Apply recommended treatment." };
//   }
// };

// // ==================== OTHER FUNCTIONS ====================

// export const getFarmerResponse = async (userMessage, language = 'hi', userId = null, location = null) => {
//   return getChatbotResponse(userMessage, language);
// };

// export const getCropPlan = async (location, season, landSize, soilType = 'loamy') => {
//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
//     const prompt = `As FarmGuru, create a crop plan for ${landSize} acres in ${season} season. Soil: ${soilType}. Provide 3 crop options with yield estimates, sowing dates, and expected profit. Response in simple Hindi.`;
//     const result = await model.generateContent(prompt);
//     return { success: true, plan: result.response.text() };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };

// export const getSellingAdvice = async (crop, price, location, quantity) => {
//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
//     const prompt = `As FarmGuru, advise on selling ${crop} at ₹${price}/quintal. Should farmer sell now or wait? Response in simple Hindi.`;
//     const result = await model.generateContent(prompt);
//     return { success: true, advice: result.response.text() };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };

// export const diagnoseDisease = async (symptoms, crop, weatherConditions) => {
//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
//     const prompt = `As FarmGuru, diagnose disease in ${crop} with symptoms: ${symptoms}. Provide treatment in simple Hindi.`;
//     const result = await model.generateContent(prompt);
//     return { success: true, diagnosis: result.response.text() };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };

// export const getGovernmentSchemes = async (category, state) => {
//   try {
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
//     const prompt = `As FarmGuru, list 3 government schemes for farmers in ${state || 'India'}. Include scheme name, benefit, and how to apply. Response in simple Hindi.`;
//     const result = await model.generateContent(prompt);
//     return { success: true, schemes: result.response.text() };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };




import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

// Initialize Groq (free, higher limits)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

console.log("🔑 GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✅ Loaded" : "❌ Missing");

// Detect language
function detectLanguage(text) {
  const hasDevanagari = /[\u0900-\u097F]/g.test(text);
  if (hasDevanagari) return 'hi';
  return 'en';
}

// ==================== MAIN CHATBOT FUNCTION ====================

export const getChatbotResponse = async (userMessage, language = 'hi') => {
  try {
    console.log("🤖 Chatbot processing:", userMessage);
    
    const detectedLang = detectLanguage(userMessage);
    console.log("📝 Detected language:", detectedLang);
    
    const prompt = `You are FarmGuru, an expert farming assistant and consultant for Indian farmers.

CRITICAL LANGUAGE RULE:
- If the user specifies "in English", "translate to english", or writes completely in English, you MUST respond in ENGLISH.
- If the user specifies "in Hindi", "हिंदी में", or writes in Hindi/Devanagari, you MUST respond in HINDI (Devanagari script).
- Match their language dynamically. Do NOT strictly default to Hindi if they ask for English.

FARMING ADVICE REQUIREMENTS:
- Provide 360-degree consulting. If asked about a crop, provide the complete lifestyle:
  1. Harvesting estimates (in days/months).
  2. Specific pesticide/fertilizer recommendations (with exact dosages).
  3. The best month to sell the crop for maximum profit.
  4. Sowing techniques.
- Be warm and respectful like a "true farmer friend".
- Keep it highly professional but easy to read.

Question: ${userMessage}

FarmGuru:`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 200,
    });

    let reply = response.choices[0]?.message?.content || "";
    reply = reply.replace(/FarmGuru:/g, '').trim();
    
    return {
      success: true,
      reply: reply,
      detectedLanguage: detectedLang
    };
    
  } catch (error) {
    console.error('Groq API Error:', error.message);
    return {
      success: false,
      reply: detectedLang === 'hi' 
        ? '🌾 क्षमा करें, अभी सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद प्रयास करें।'
        : '🌾 Sorry, service is temporarily unavailable. Please try again later.',
    };
  }
};

// Quick explain function
export const getQuickExplain = async (diseaseName, treatment, language = 'en') => {
  try {
    const prompt = `Explain this crop disease to a farmer in ${language === 'hi' ? 'simple Hindi' : 'simple English'}:

Disease: ${diseaseName}
Treatment: ${treatment || 'Apply recommended treatment'}

Give 2-3 practical, encouraging sentences. Be specific with quantities if possible.`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 150,
    });

    return { success: true, reply: response.choices[0]?.message?.content || treatment };
  } catch (error) {
    return { success: false, reply: treatment || "Apply recommended treatment." };
  }
};

// Other functions (same as before but using Groq)
export const getFarmerResponse = getChatbotResponse;
export const getCropPlan = async (location, season, landSize, soilType = 'loamy') => {
  try {
    const prompt = `Create a crop plan for ${landSize} acres in ${season} season. Soil: ${soilType}. Provide 3 crop options with yield estimates. Response in simple Hindi.`;
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
    });
    return { success: true, plan: response.choices[0]?.message?.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSellingAdvice = async (crop, price, location, quantity) => {
  try {
    const prompt = `Advise on selling ${crop} at ₹${price}/quintal. Should farmer sell now or wait? Response in simple Hindi.`;
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
    });
    return { success: true, advice: response.choices[0]?.message?.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const diagnoseDisease = async (symptoms, crop, weatherConditions) => {
  try {
    const prompt = `Diagnose disease in ${crop} with symptoms: ${symptoms}. Provide treatment in simple Hindi.`;
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 250,
    });
    return { success: true, diagnosis: response.choices[0]?.message?.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getGovernmentSchemes = async (category, state, language = 'hi') => {
  try {
    const prompt = `List 3 government schemes for farmers in ${state || 'India'}. Include scheme name, benefit, and how to apply. Response in ${language === 'hi' ? 'simple Hindi (Devanagari)' : 'simple English'}.`;
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
    });
    return { success: true, schemes: response.choices[0]?.message?.content };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getSmartCropPlan = async (crop, location, language = 'hi') => {
  try {
    const prompt = `Act as an expert agricultural scientist. A farmer in exactly ${location || 'India'} wants to grow ${crop}. 
    Automatically infer the typical soil type and climate of ${location || 'their region'}.
    Provide a highly detailed, MONTH-BY-MONTH crop tracking plan covering:
    1. Local Soil Preparation.
    2. Best Seed Varieties for that exact weather.
    3. Precise Water Supply schedule.
    4. Exact Pesticide & Fertilizer names with timings.
    Month-by-month breakdown is CRITICAL.
    Keep it in ${language === 'hi' ? 'simple, actionable Hindi (Devanagari)' : 'simple, actionable English'}. Use emojis and bullet points for readability.`;
    
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", max_tokens: 800, temperature: 0.7
    });
    return { success: true, plan: response.choices[0]?.message?.content };
  } catch (error) { 
    return { success: false, error: error.message }; 
  }
};

export const chatWithSmartPlan = async (question, crop, location, language) => {
  try {
    const prompt = `Act as an expert agriculture AI. A farmer in ${location || 'India'} is growing ${crop}. They asked a follow-up question: "${question}".
    Answer directly and accurately in ${language === 'hi' ? 'Hindi (Devanagari)' : 'English'} with practical advice in 3 to 4 easy sentences.`;
    
    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", max_tokens: 300, temperature: 0.7
    });
    return { success: true, reply: response.choices[0]?.message?.content };
  } catch (error) { 
    return { success: false, error: error.message }; 
  }
};