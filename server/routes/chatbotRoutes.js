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
  getGovernmentPesticides,
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
    cropName,
    symptoms, 
    treatment, 
    prevention, 
    organicRemedy,
    location,
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

    const prompt = `You are a warm, experienced farming advisor talking directly to a farmer. Make the explanation feel like advice from a knowledgeable neighbor, not a textbook.

FARMER'S SITUATION:
- Crop: ${cropName || 'Unspecified crop'}
- Location: ${location || 'Their farm'}
- Problem: ${diseaseName}
- Symptoms Seen: ${symptoms || 'Visual disease symptoms'}
- Treatment Available: ${treatment || 'Chemical/Organic treatment'}
- Prevention Methods: ${prevention || 'Preventive measures'}
- Organic Option: ${organicRemedy || 'Organic remedy'}

WRITE ONE CLEAN PARAGRAPH (${language === 'hi' ? 'Hindi' : 'English'}) THAT FLOWS NATURALLY:

Start by acknowledging the problem (what causes this disease, why it happened). Then give practical immediate action (exact product names, quantities, timing). Finally, mention prevention for next time and encouragement (1-2 weeks improvement expected).

TONE: Like talking to a farming friend - warm, practical, encouraging. NO BULLET POINTS, NO BOLD HEADERS. Just a natural flowing explanation in 4-5 sentences.
LANGUAGE: ${language === 'hi' 
  ? 'Simple conversational Hindi (Devanagari) - use everyday words a farmer would understand' 
  : 'Simple English - warm and encouraging like talking to a friend. Avoid technical jargon.'}
LENGTH: 150-220 words (conversational, not rushed)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let reply = response.text();

    // Clean response - preserve formatting but remove markdown
    reply = reply
      .replace(/\*\*/g, '')
      .replace(/\*([^\*]+)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    res.json({ 
      success: true, 
      reply,
      disease: diseaseName,
      crop: cropName
    });

  } catch (error) {
    console.error('Quick explain error:', error);

    // Professional fallback
    const fallback = language === 'hi'
      ? `भाई, आपकी ${cropName || 'फसल'} में ${diseaseName} हुआ है। यह आमतौर पर नमी और गर्मी से होता है। घबराइए मत, सही इलाज से ठीक हो जाएगी।

तुरंत करना चाहिए: ${treatment ? treatment.substring(0, 150) : 'बाजार में मिलने वाली कॉपर सल्फेट या स्ट्रेप्टोमाइसिन दवा का छिड़काव करें। 10 लीटर पानी में 25 ग्राम दवा मिलाकर सुबह या शाम करें।'} 

अगली बार बचने के लिए: रोग-रोधी किस्में लगाएं, फसल चक्र अपनाएं, और जलभराव से बचें।

धैर्य रखें: 1-2 हफ्ते में सुधार दिखने लगेगा। नियमित निगरानी करते रहें।`
      : `Friend, your ${cropName || 'crop'} has ${diseaseName}. This usually happens in warm, humid weather. Don't worry - proper treatment will fix it quickly.

Do this immediately: ${treatment ? treatment.substring(0, 150) : 'Use Copper Sulfate or Streptomycin spray available at any agro shop. Mix 25g in 10 liters of water and spray early morning or evening.'} 

Prevent next time: Grow disease-resistant varieties, practice crop rotation, and avoid waterlogging.

Be patient: You\'ll see improvement in 1-2 weeks. Keep checking your plants regularly.`
    ;

    res.json({ 
      success: true, 
      reply: fallback,
      disease: diseaseName,
      crop: cropName
    });
  }
});

// ✅ NEW: Disease Q&A endpoint
router.post('/disease-qa', async (req, res) => {
  const { 
    diseaseName,
    cropName,
    question,
    language = 'en'
  } = req.body;

  if (!diseaseName || !question) {
    return res.status(400).json({ 
      success: false, 
      message: 'Disease and question required' 
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `A farmer is asking about ${diseaseName} affecting their ${cropName}. 
They want to know: "${question}"

Answer like a helpful farming expert - warm, practical, and direct.
${language === 'hi' ? 'Answer in conversational Hindi (Devanagari), like talking to a friend.' : 'Answer in simple English like talking to a friend.'}
Keep answer to 3-4 sentences maximum, practical and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let reply = response.text().trim();

    res.json({ 
      success: true, 
      reply 
    });

  } catch (error) {
    console.error('Disease QA error:', error);
    res.json({ 
      success: false, 
      reply: language === 'hi' 
        ? 'सवाल पूछने में समस्या आ रही है। कृपया फिर से कोशिश करें।'
        : 'Sorry, having trouble answering. Please try again.'
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

// Government pesticides endpoint
router.post('/pesticides', async (req, res) => {
  const { state, language = 'hi' } = req.body;
  
  const result = await getGovernmentPesticides(state, language);
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
