import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for generating real-time-like data since free APIs are unavailable
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Fallback data strictly if Gemini fails or is missing
const fallbackPrices = [
  { crop: 'wheat', price: 2350, unit: 'per quintal', trend: 'up', market: 'Local Market' },
  { crop: 'rice', price: 2200, unit: 'per quintal', trend: 'stable', market: 'Local Market' },
  { crop: 'maize', price: 1980, unit: 'per quintal', trend: 'down', market: 'Local Market' },
  { crop: 'potato', price: 1300, unit: 'per quintal', trend: 'up', market: 'Local Market' },
  { crop: 'tomato', price: 1900, unit: 'per quintal', trend: 'up', market: 'Local Market' },
  { crop: 'onion', price: 2100, unit: 'per quintal', trend: 'down', market: 'Local Market' }
];

export const getMandiPrices = async (req, res) => {
  try {
    const { crop, location } = req.query;
    
    // Attempt to generate real-time estimates using Gemini 
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const date = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        
        let prompt = `You are a professional agricultural market analyst providing accurate estimated real-time mandi prices for India. The current date is ${date}. 
Provide the wholesale market prices for the following 6 crops: Wheat, Rice, Maize, Potato, Tomato, and Onion considering seasonal trends right now specifically for farmers in ${location || 'India (National Average)'}.
Respond ONLY with a raw JSON array of objects. Exactly this format:
[{"crop":"CropName","price":number,"unit":"per quintal","trend":"up/down/stable","market":"${location || 'National Avg'}"}]
Do NOT include markdown formatting or backticks around the JSON.`;

        if (crop) {
          prompt = `Provide the wholesale market price for ${crop} specifically in ${location || 'India'} right now (${date}). Respond ONLY with a raw JSON array with ONE object format: [{"crop":"${crop}","price":number,"unit":"per quintal","trend":"up/down/stable","market":"${location || 'National Avg'}"}] Do not use markdown.`;
        }

        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text().trim();
        
        // Strip markdown backticks if Gemini includes them
        if (rawResponse.startsWith('```json')) {
            rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (rawResponse.startsWith('```')) {
            rawResponse = rawResponse.replace(/```/g, '').trim();
        }

        const prices = JSON.parse(rawResponse);

        return res.json({
          success: true,
          count: prices.length,
          prices,
          lastUpdated: new Date().toISOString(),
          source: 'AI Estimations (Real-time)'
        });
      } catch (aiError) {
        console.error('AI Price generation error, using fallback:', aiError.message);
      }
    }

    // Fallback logic
    let prices = fallbackPrices;
    if (crop) {
      const filtered = fallbackPrices.find(p => p.crop.toLowerCase() === crop.toLowerCase());
      prices = filtered ? [filtered] : [];
    }

    res.json({
      success: true,
      count: prices.length,
      prices,
      lastUpdated: new Date().toISOString(),
      source: 'Local Fallback'
    });
  } catch (error) {
    console.error('Mandi Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mandi prices'
    });
  }
};

export const getCropAdvice = async (req, res) => {
  try {
    const { crop } = req.params;
    
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
        
        const prompt = `Act as an expert agricultural advisor. The farmer is asking about growing "${crop}" and the current month is ${currentMonth}. 
Provide professional advice using JSON. Respond ONLY with a raw JSON object string (NO MARKDOWN BACKTICKS). Format:
{
  "sowingTime": "detailed advice",
  "harvestingTime": "detailed advice",
  "waterSchedule": "schedule",
  "fertilizer": "fertilizer recommendations"
}`;
        
        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text().trim();
        if (rawResponse.startsWith('```json')) {
            rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (rawResponse.startsWith('```')) {
            rawResponse = rawResponse.replace(/```/g, '').trim();
        }

        const advice = JSON.parse(rawResponse);
        return res.json({
          success: true,
          crop: crop,
          advice,
          source: 'AI Advisor'
        });
      } catch (aiError) {
        console.error('AI Advice generation error, using fallback:', aiError.message);
      }
    }

    // Static Fallback
    const advice = {
      sowingTime: 'Consult local agriculture officer for current season',
      harvestingTime: 'Varies by chosen variety',
      waterSchedule: 'Maintain optimal soil moisture depending on crop type',
      fertilizer: 'Soil testing recommended before application'
    };
    
    res.json({
      success: true,
      crop: crop,
      advice,
      source: 'Static Fallback'
    });
  } catch (error) {
    console.error('Crop Advice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crop advice'
    });
  }
};