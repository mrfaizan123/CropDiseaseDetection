import Detection from '../models/Detection.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { predictMultipleReal } from '../services/mlService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for AI explanation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==================== COMPLETE DISEASE DATABASE ====================

const diseaseDatabase = {
  "Pepper__bell___Bacterial_spot": {
    name: "Pepper Bell Bacterial Spot",
    cause: "Caused by Xanthomonas campestris pv. vesicatoria bacteria. Spreads rapidly in hot and humid weather.",
    symptoms: "Small, water-soaked spots on leaves that later turn brown. Raised spots on fruits.",
    treatment: "Spray Copper Oxychloride (3g/L) at 7-day intervals. Remove affected leaves.",
    prevention: "Grow resistant varieties. Treat seeds in hot water at 50°C for 20 minutes. Follow crop rotation.",
    organicRemedy: "Spray Neem oil (5ml/L) + Cow urine (100ml/L).",
    chemicalControl: "Copper Hydroxide (2g/L) + Streptomycin (0.5g/L)",
    duration: "Symptoms appear within 7-10 days",
    yieldLoss: "20-30% crop loss possible"
  },
  "Pepper__bell___healthy": {
    name: "Healthy Pepper Bell",
    cause: "No disease - Crop is completely healthy",
    symptoms: "Green and shiny leaves, normal size fruits, no spots or discoloration",
    treatment: "No treatment needed. Crop is healthy.",
    prevention: "Continue regular monitoring. Timely irrigation and organic fertilizer.",
    organicRemedy: "Use organic manure and vermicompost.",
    chemicalControl: "No chemical treatment needed",
    duration: "-",
    yieldLoss: "No loss - Normal yield expected"
  },
  "Potato___Early_blight": {
    name: "Potato Early Blight",
    cause: "Caused by Alternaria solani fungus. More common in warm and humid weather.",
    symptoms: "Round, brown spots with yellow halo on leaves. Lower leaves turn yellow and fall.",
    treatment: "Spray Mancozeb (2.5g/L) or Chlorothalonil (2g/L) at 7-10 day intervals.",
    prevention: "Grow resistant varieties (like Kufri Jyoti). Maintain 45-60cm plant spacing.",
    organicRemedy: "Spray Bordeaux mixture (1%).",
    chemicalControl: "Mancozeb (2.5g/L), Chlorothalonil (2g/L)",
    duration: "Symptoms appear 40-50 days after sowing",
    yieldLoss: "30-40% crop loss possible"
  },
  "Potato___Late_blight": {
    name: "Potato Late Blight",
    cause: "Caused by Phytophthora infestans fungus. One of the most destructive diseases in history.",
    symptoms: "Large, dark brown/black spots on leaves. Black streaks on stems. Tubers start rotting.",
    treatment: "Spray Metalaxyl + Mancozeb (2.5g/L) immediately. Repeat every 7 days.",
    prevention: "Use certified healthy seed tubers. Avoid excessive moisture.",
    organicRemedy: "Spray Garlic extract (20g/L) + Neem oil.",
    chemicalControl: "Metalaxyl (2g/L), Famoxadone (0.5ml/L)",
    duration: "Symptoms appear 60-70 days after sowing, spreads rapidly in wet weather",
    yieldLoss: "60-80% crop loss possible - highly destructive"
  },
  "Potato___healthy": {
    name: "Healthy Potato",
    cause: "No disease - Crop is completely healthy",
    symptoms: "Green soft leaves, strong stems, normal size tubers",
    treatment: "No treatment needed. Crop is healthy.",
    prevention: "Continue regular monitoring. Timely earthing up.",
    organicRemedy: "Use vermicompost and cow dung manure.",
    chemicalControl: "No chemical treatment needed",
    duration: "-",
    yieldLoss: "No loss - Normal yield expected"
  },
  "Tomato_Bacterial_spot": {
    name: "Tomato Bacterial Spot",
    cause: "Caused by Xanthomonas campestris pv. vesicatoria bacteria. More common in warm and humid weather.",
    symptoms: "Small, dark brown/black spots on leaves. Small, raised spots on fruits.",
    treatment: "Spray Copper Hydroxide (2g/L) + Streptomycin (0.5g/L).",
    prevention: "Grow resistant varieties. Follow crop rotation.",
    organicRemedy: "Spray Cow urine (10%) + Neem oil (5ml/L).",
    chemicalControl: "Copper Hydroxide (2g/L), Streptomycin (0.5g/L)",
    duration: "Symptoms appear 15-20 days after transplanting",
    yieldLoss: "20-30% crop loss possible"
  },
  "Tomato_Early_blight": {
    name: "Tomato Early Blight",
    cause: "Caused by Alternaria solani fungus. More common in warm and humid weather.",
    symptoms: "Round, brown spots with yellow halo on lower leaves. Leaves turn yellow and fall.",
    treatment: "Spray Chlorothalonil (2g/L) or Mancozeb (2.5g/L).",
    prevention: "Do mulching. Maintain 60cm plant spacing.",
    organicRemedy: "Spray Baking soda (1g/L) + Oil (2ml/L).",
    chemicalControl: "Chlorothalonil (2g/L), Mancozeb (2.5g/L)",
    duration: "Symptoms appear 30-40 days after transplanting",
    yieldLoss: "30-40% crop loss possible"
  },
  "Tomato_Late_blight": {
    name: "Tomato Late Blight",
    cause: "Caused by Phytophthora infestans fungus. Affects both potato and tomato.",
    symptoms: "Large, dark brown/black spots on leaves. Black streaks on stems. Dark spots on fruits.",
    treatment: "Spray Metalaxyl (2g/L) or Famoxadone (0.5ml/L) immediately.",
    prevention: "Irrigate in morning so leaves dry quickly. Maintain good field drainage.",
    organicRemedy: "Mix Copper sulfate (2g/L) + Lime (2g/L) and spray.",
    chemicalControl: "Metalaxyl (2g/L), Famoxadone (0.5ml/L)",
    duration: "Symptoms appear 50-60 days after transplanting, spreads rapidly in wet weather",
    yieldLoss: "50-70% crop loss possible"
  },
  "Tomato_Leaf_Mold": {
    name: "Tomato Leaf Mold",
    cause: "Passalora fulva fungus. More common in greenhouses and humid areas.",
    symptoms: "Light green to brown mold on the underside of leaves.",
    treatment: "Spray Chlorothalonil (2g/L) or Mancozeb (2.5g/L).",
    prevention: "Maintain proper ventilation in greenhouse. Keep proper distance between plants.",
    organicRemedy: "Spray Milk solution (1:9 ratio).",
    chemicalControl: "Chlorothalonil (2g/L), Mancozeb (2.5g/L)",
    duration: "Symptoms appear 25-35 days after transplanting",
    yieldLoss: "25-35% crop loss possible"
  },
  "Tomato_Septoria_leaf_spot": {
    name: "Tomato Septoria Leaf Spot",
    cause: "Septoria lycopersici fungus. More common in warm and humid weather.",
    symptoms: "Small, round, brown spots with white center on leaves.",
    treatment: "Spray Benzimidazole (1g/L) or Chlorothalonil.",
    prevention: "Remove affected leaves. Follow crop rotation.",
    organicRemedy: "Spray Turmeric powder (10g/L) or Neem oil.",
    chemicalControl: "Benzimidazole (1g/L), Chlorothalonil",
    duration: "Symptoms appear 20-30 days after transplanting",
    yieldLoss: "20-30% crop loss possible"
  },
  "Tomato_Spider_mites_Two_spotted_spider_mite": {
    name: "Tomato Spider Mites",
    cause: "Tetranychus urticae - This is a pest, not a disease. More common in dry and hot weather.",
    symptoms: "Small yellow/white spots on leaves. Leaves curl and dry up.",
    treatment: "Spray Dicofol (2.5ml/L) or Profenofos (2ml/L).",
    prevention: "Control weeds. Regularly check leaves.",
    organicRemedy: "Spray Garlic + Chili extract (50g/L).",
    chemicalControl: "Dicofol (2.5ml/L), Profenofos (2ml/L)",
    duration: "Pest lifecycle 5-7 days - spreads rapidly",
    yieldLoss: "30-40% crop loss possible"
  },
  "Tomato__Target_Spot": {
    name: "Tomato Target Spot",
    cause: "Corynespora cassiicola fungus. More common in warm and humid weather.",
    symptoms: "Round, brown spots with yellow halo. Target-like pattern in center of spots.",
    treatment: "Spray Chlorothalonil (2g/L) + Mancozeb (2.5g/L).",
    prevention: "Plant at proper spacing. Avoid excess moisture.",
    organicRemedy: "Spray Bordeaux mixture (1%).",
    chemicalControl: "Chlorothalonil (2g/L), Mancozeb (2.5g/L)",
    duration: "Symptoms appear 30-40 days after transplanting",
    yieldLoss: "25-35% crop loss possible"
  },
  "Tomato__Tomato_YellowLeaf__Curl_Virus": {
    name: "Tomato Yellow Leaf Curl Virus",
    cause: "Begomovirus virus. Spread by whitefly (Bemisia tabaci).",
    symptoms: "Leaves turn yellow, small and curl upward. Plant growth stops.",
    treatment: "No direct cure. Spray Imidacloprid (0.5ml/L) to control whiteflies.",
    prevention: "Grow virus-resistant varieties. Use yellow sticky traps.",
    organicRemedy: "Spray Neem oil (5ml/L) + Detergent (1g/L) twice a week.",
    chemicalControl: "Imidacloprid (0.5ml/L) - only for whitefly control",
    duration: "Symptoms appear 10-15 days after infection",
    yieldLoss: "50-80% crop loss possible - highly destructive"
  },
  "Tomato__Tomato_mosaic_virus": {
    name: "Tomato Mosaic Virus",
    cause: "Tobamovirus virus. Spreads through seeds, tools, and hand contact.",
    symptoms: "Mosaic pattern of green and yellow spots on leaves. Leaves are curled and deformed.",
    treatment: "No direct cure. Remove and destroy affected plants.",
    prevention: "Use healthy seeds. Keep tools clean with soap water.",
    organicRemedy: "Regularly spray Milk solution (1:10).",
    chemicalControl: "No chemical treatment - only prevention",
    duration: "Symptoms appear 10-14 days after infection",
    yieldLoss: "30-50% crop loss possible"
  },
  "Tomato_healthy": {
    name: "Healthy Tomato",
    cause: "No disease - Crop is completely healthy",
    symptoms: "Dark green leaves, normal flowers and fruits, no spots or discoloration",
    treatment: "No treatment needed. Crop is healthy.",
    prevention: "Continue regular care. Timely irrigation and fertilizer.",
    organicRemedy: "Regularly use organic fertilizer and neem cake.",
    chemicalControl: "No chemical treatment needed",
    duration: "-",
    yieldLoss: "No loss - Normal yield expected"
  },
  "PlantVillage": {
    name: "Unknown or Other Crop",
    cause: "This class is for images that could not be identified. The image may not be clear or the crop may be different.",
    symptoms: "Symptoms are not clear. Please take a clear, close-up photo.",
    treatment: "Please contact your nearest agriculture expert. Try again with a clear photo.",
    prevention: "Take photos in good light. Show the entire leaf.",
    organicRemedy: "Neem oil spray (5ml/L) is safe if you have any doubt.",
    chemicalControl: "Do not apply chemicals without expert advice",
    duration: "-",
    yieldLoss: "Cannot be determined"
  }
};

const getDiseaseInfo = (className) => {
  const diseaseInfo = diseaseDatabase[className];
  if (!diseaseInfo) {
    return {
      name: className.replace(/_/g, ' '),
      cause: "Information not available. Please contact agriculture expert.",
      symptoms: "Symptoms not clear. Please try again.",
      treatment: "Please contact your nearest agriculture expert.",
      prevention: "Do regular crop inspection. Follow crop rotation.",
      organicRemedy: "Neem oil spray (5ml/L) is safe.",
      chemicalControl: "Take expert advice",
      duration: "Information not available",
      yieldLoss: "Information not available"
    };
  }
  return diseaseInfo;
};

// ==================== HELPER FUNCTION FOR ERROR MESSAGES ====================

function getErrorMessage(errorCode, details = {}) {
  const messages = {
    'NO_IMAGE': {
      title: 'No Image Provided',
      message: 'Please upload an image of your crop leaf.',
      solution: 'Take a clear photo of the affected leaf and upload again.'
    },
    'IMAGE_QUALITY_ERROR': {
      title: 'Poor Image Quality',
      message: details.message || 'Image quality is poor.',
      solution: '📸 Tips for better photo:\n1. Use good lighting\n2. Keep camera steady\n3. Focus on the leaf\n4. Avoid shadows'
    },
    'NO_LEAF_DETECTED': {
      title: 'No Leaf Detected',
      message: 'No plant leaf detected in the image.',
      solution: '🌿 Please upload a clear photo showing the plant leaf clearly'
    },
    'LOW_CONFIDENCE': {
      title: 'Low Confidence',
      message: `Could not identify with confidence (${details.confidence || 'low'}%).`,
      solution: '📸 Please upload a clearer image:\n1. Take photo in good lighting\n2. Keep camera very steady\n3. Show the affected area clearly'
    },
    'UNSUPPORTED_CROP': {
      title: 'Unsupported Crop',
      message: 'This crop is not supported by our model.',
      solution: 'Please upload Tomato, Potato, or Bell Pepper leaf only.'
    },
    'ML_SERVICE_ERROR': {
      title: 'Service Error',
      message: 'Prediction service temporarily unavailable.',
      solution: 'Please try again in a few moments.'
    }
  };
  
  const error = messages[errorCode] || messages['IMAGE_QUALITY_ERROR'];
  return error;
}

// ==================== AI EXPLANATION FUNCTION ====================

const getAIExplanation = async (diseaseInfo, confidence) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are FarmGuru, a friendly farming assistant explaining disease detection results to a farmer.

DISEASE: ${diseaseInfo.name}
CONFIDENCE: ${confidence}%
SYMPTOMS: ${diseaseInfo.symptoms}
TREATMENT: ${diseaseInfo.treatment}
ORGANIC REMEDY: ${diseaseInfo.organicRemedy}

Explain to the farmer in a VERY FRIENDLY, SIMPLE, and ENCOURAGING way using EXACTLY this format:

🌾 [Simple explanation of what's happening - 1 sentence]

📋 What to do TODAY:
1. [First urgent action - be specific with quantities]
2. [Second action]
3. [Third action]

💡 Remember: [One encouraging message]

Keep language warm and respectful. Use simple English words. Keep response under 80 words. Be VERY PRACTICAL and ACTIONABLE.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("AI Explanation error:", error);
    if (diseaseInfo.name.includes("Healthy")) {
      return `🌾 Congratulations! Your crop is HEALTHY (${confidence}% confidence).

📋 What to do TODAY:
1. Continue regular monitoring
2. Water on time
3. Use organic fertilizer

💡 Remember: Healthy crops need regular care!`;
    } else {
      return `🌾 Your crop shows signs of ${diseaseInfo.name} (${confidence}% confidence).

📋 What to do TODAY:
1. ${diseaseInfo.treatment.split('.')[0]}
2. Remove affected plants
3. Contact agriculture expert if needed

💡 Remember: Timely treatment can save your crop!`;
    }
  }
};

// ==================== MAIN PREDICTION FUNCTION ====================

export const predictDiseasePublic = async (req, res) => {
  console.log("🔵 PUBLIC prediction called");
  console.log("Files received:", req.files?.length || 0);
  console.log("User from token:", req.user); // Debug log
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }
    
    const savedImages = [];
    const results = [];
    let hasValidImages = false;
    
    // Extract user ID properly
    let userId = null;
    if (req.user) {
      userId = req.user._id || req.user.id;
      console.log("✅ User ID found:", userId);
    } else {
      console.log("⚠️ No user in request - prediction will be anonymous");
    }
    
    // Process each image
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      savedImages.push({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: `/uploads/${file.filename}`
      });
      
      // Call ML model for this image
      const imagePaths = [file.path];
      const mlResults = await predictMultipleReal(imagePaths);
      const mlResult = mlResults[0];
      
      console.log("ML Result:", JSON.stringify(mlResult, null, 2));
      
      // Check if prediction was successful
      if (!mlResult.success) {
        results.push({
          className: 'INVALID_IMAGE',
          confidence: 0,
          diseaseName: 'Unsupported Image',
          cause: mlResult.message || 'Could not identify crop',
          symptoms: 'Image does not contain a supported crop',
          treatment: mlResult.solution || 'Please upload Tomato, Potato, or Bell Pepper leaf',
          prevention: 'Take clear photo of the crop leaf',
          organicRemedy: 'Not applicable',
          chemicalControl: 'Not applicable',
          duration: '-',
          yieldLoss: '-',
          isHealthy: false,
          isValid: false,
          errorMessage: mlResult.message,
          aiExplanation: `⚠️ ${mlResult.message || 'Unsupported image'}\n\n${mlResult.solution || 'Please upload a clear photo of Tomato, Potato, or Bell Pepper leaf'}`
        });
      } else {
        hasValidImages = true;
        
        let className, confidence;
        
        if (mlResult.className) {
          className = mlResult.className;
          confidence = mlResult.confidence;
        } else if (mlResult.disease && mlResult.disease.name) {
          className = mlResult.disease.name;
          confidence = mlResult.disease.confidence;
        } else if (mlResult.prediction && mlResult.prediction.className) {
          className = mlResult.prediction.className;
          confidence = mlResult.prediction.confidence;
        } else {
          className = 'Unknown';
          confidence = 0;
        }
        
        const diseaseInfo = getDiseaseInfo(className);
        const isHealthy = className.toLowerCase().includes('healthy');
        const aiExplanation = await getAIExplanation(diseaseInfo, confidence);
        
        results.push({
          className: className,
          confidence: confidence,
          diseaseName: diseaseInfo.name,
          cause: diseaseInfo.cause,
          symptoms: diseaseInfo.symptoms,
          treatment: diseaseInfo.treatment,
          prevention: diseaseInfo.prevention,
          organicRemedy: diseaseInfo.organicRemedy,
          chemicalControl: diseaseInfo.chemicalControl,
          duration: diseaseInfo.duration,
          yieldLoss: diseaseInfo.yieldLoss,
          isHealthy: isHealthy,
          isValid: true,
          aiExplanation: aiExplanation
        });
      }
    }
    
    // Cleanup temp files
    setTimeout(() => {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }, 5000);
    
    // If no valid images, return error
    if (!hasValidImages) {
      return res.status(400).json({
        success: false,
        message: 'Could not process any images. Please upload Tomato, Potato, or Bell Pepper leaf.',
        results: results,
        suggestion: 'Supported crops: 🍅 Tomato, 🥔 Potato, 🫑 Bell Pepper'
      });
    }
    
    const hasDisease = results.some(r => r.isValid && !r.isHealthy);
    const overallResult = hasDisease ? 'Diseased' : 'Healthy';
    
    // ✅ FIXED: Save detection with proper user ID
    const detection = await Detection.create({
      sessionId: uuidv4(),
      user: userId,  // Use the extracted userId
      images: savedImages,
      results: results,
      overallResult: overallResult
    });
    
    console.log("✅ Detection saved with user ID:", detection.user);
    
    res.json({
      success: true,
      detectionId: detection._id,
      results: results,
      overallResult: overallResult,
      message: hasDisease 
        ? '⚠️ Disease detected! Please check the suggestions below.'
        : '✅ Your crop is healthy! Continue good care.'
    });
    
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed: ' + error.message
    });
  }
};




// ==================== OTHER FUNCTIONS ====================

export const getDetectionHistory = async (req, res) => {
  try {
    const history = await Detection.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history'
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalScans = await Detection.countDocuments({ user: req.user.id });
    const healthyScans = await Detection.countDocuments({ 
      user: req.user.id, 
      overallResult: 'Healthy' 
    });
    const diseasedScans = await Detection.countDocuments({ 
      user: req.user.id, 
      overallResult: 'Diseased' 
    });
    
    res.json({
      success: true,
      stats: {
        totalScans,
        healthyScans,
        diseasedScans
      },
      recentScans: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
};

export const getDetectionById = async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id);
    
    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }
    
    if (detection.user && detection.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      detection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching detection'
    });
  }
};