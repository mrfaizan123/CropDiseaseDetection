// import express from 'express';
// import { 
//   getFarmerResponse, 
//   getCropPlan, 
//   getSellingAdvice,
//   diagnoseDisease,
//   getGovernmentSchemes 
// } from '../services/geminiService.js';

// const router = express.Router();

// // Main chat endpoint with location support
// router.post('/chat', async (req, res) => {
//   const { message, language = 'hi', userId, location } = req.body;
  
//   if (!message) {
//     return res.status(400).json({ success: false, message: 'Message required' });
//   }
  
//   const response = await getFarmerResponse(message, language, userId, location);
//   res.json(response);
// });

// // Crop planning endpoint
// router.post('/crop-plan', async (req, res) => {
//   const { location, season, landSize, soilType } = req.body;
  
//   const result = await getCropPlan(location, season, landSize, soilType);
//   res.json(result);
// });

// // Selling advice endpoint
// router.post('/selling-advice', async (req, res) => {
//   const { crop, price, location, quantity } = req.body;
  
//   const result = await getSellingAdvice(crop, price, location, quantity);
//   res.json(result);
// });

// // Disease diagnosis endpoint
// router.post('/diagnose', async (req, res) => {
//   const { symptoms, crop, weatherConditions } = req.body;
  
//   const result = await diagnoseDisease(symptoms, crop, weatherConditions);
//   res.json(result);
// });

// // Government schemes endpoint
// router.post('/schemes', async (req, res) => {
//   const { category, state } = req.body;
  
//   const result = await getGovernmentSchemes(category, state);
//   res.json(result);
// });

// export default router;



import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
 getChatbotResponse,
  getCropPlan,
  getSellingAdvice,
  diagnoseDisease,
  getGovernmentSchemes,
  getSmartCropPlan,
  chatWithSmartPlan
} from '../services/geminiService.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


router.post('/chat', async (req, res) => {
  const { message, language = 'hi', userId, location } = req.body;
  
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message required' });
  }
  
  try {
    const response = await getChatbotResponse(message, language);
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ 
      success: false, 
      reply: language === 'hi' 
        ? '🌾 क्षमा करें, सेवा उपलब्ध नहीं है। कृपया बाद में प्रयास करें।'
        : '🌾 Sorry, service unavailable. Please try again later.'
    });
  }
});

// ✅ NEW: Quick Explain endpoint - Direct Gemini call for short explanations

router.post('/quick-explain', async (req, res) => {
  const { 
    diseaseName, 
    symptoms, 
    treatment, 
    prevention, 
    organicRemedy, 
    language = 'en' 
  } = req.body;

  // Validation
  if (!diseaseName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Disease name required' 
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an agricultural expert assistant explaining crop disease analysis results to a farmer.

GOAL:
- Provide a clear, professional, and easy-to-understand explanation
- Keep language simple but not overly emotional
- Focus on practical actions

INSTRUCTIONS:
- Use simple and clear sentences (avoid complex scientific jargon)
- Be structured and informative
- Keep tone professional and helpful

LANGUAGE:
${language === 'hi' 
  ? 'Write in simple Hindi (Devanagari script, clear and professional tone)' 
  : 'Write in simple English (clear, professional and easy to understand)'}

FORMAT:
- Problem: (1 sentence explaining disease and cause)
- Immediate Action: (2 sentences with exact steps and quantity if possible)
- Prevention: (1 sentence)
- Advice: (1 short sentence)

LENGTH: 60-90 words total

DATA:
Disease: ${diseaseName}
Symptoms: ${symptoms || 'Not specified'}
Treatment: ${treatment || 'Apply recommended treatment'}
Prevention: ${prevention || 'Not specified'}
Organic Remedy: ${organicRemedy || 'Not specified'}

Generate a clear explanation now.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let reply = response.text();

    // Clean response
    reply = reply
      .replace(/\*\*/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    res.json({ 
      success: true, 
      reply 
    });

  } catch (error) {
    console.error('Quick explain error:', error);

    // Professional fallback
    const fallback = language === 'hi'
      ? `समस्या: ${diseaseName} एक सामान्य फसल रोग है। 
तुरंत कार्यवाही: ${treatment ? treatment.substring(0, 120) : 'उपयुक्त दवा का छिड़काव करें।'} 
रोकथाम: ${prevention ? prevention.substring(0, 80) : 'नियमित निगरानी रखें।'} 
सलाह: समय पर उपचार से फसल सुरक्षित रखी जा सकती है।`
      : `Problem: ${diseaseName} is a common crop disease. 
Immediate Action: ${treatment ? treatment.substring(0, 120) : 'Apply appropriate treatment immediately.'} 
Prevention: ${prevention ? prevention.substring(0, 80) : 'Monitor crops regularly.'} 
Advice: Timely action can help protect your crop.`;

    res.json({ 
      success: true, 
      reply: fallback 
    });
  }
});

// Crop planning endpoint
router.post('/crop-plan', async (req, res) => {
  const { location, season, landSize, soilType } = req.body;
  
  const result = await getCropPlan(location, season, landSize, soilType);
  res.json(result);
});

// Selling advice endpoint
router.post('/selling-advice', async (req, res) => {
  const { crop, price, location, quantity } = req.body;
  
  const result = await getSellingAdvice(crop, price, location, quantity);
  res.json(result);
});

// Disease diagnosis endpoint
router.post('/diagnose', async (req, res) => {
  const { symptoms, crop, weatherConditions } = req.body;
  
  const result = await diagnoseDisease(symptoms, crop, weatherConditions);
  res.json(result);
});

// Government schemes endpoint
router.post('/schemes', async (req, res) => {
  const { category, state, language = 'hi' } = req.body;
  
  const result = await getGovernmentSchemes(category, state, language);
  res.json(result);
});

// Smart Crop Plan Generation
router.post('/smart-plan', async (req, res) => {
  const { crop, location, language = 'hi' } = req.body;
  const result = await getSmartCropPlan(crop, location, language);
  res.json(result);
});

// Smart Crop Plan Follow-Up Chat
router.post('/smart-plan-chat', async (req, res) => {
  const { question, crop, location, language = 'hi' } = req.body;
  const result = await chatWithSmartPlan(question, crop, location, language);
  res.json(result);
});

export default router;