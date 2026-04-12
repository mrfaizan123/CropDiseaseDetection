import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_API_URL = 'http://localhost:5001/predict';

export const predictDiseaseReal = async (imagePath) => {
  try {
    console.log(`📤 Calling Python API for: ${imagePath}`);
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    
    const response = await axios.post(ML_API_URL, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    console.log('📥 Python API Response:', response.data);
    
    // Always return the response data (success or error)
    return response.data;
    
  } catch (error) {
    console.error('❌ ML API Error:', error.message);
    
    // If there's a response from the API (like 400 error with data)
    if (error.response && error.response.data) {
      console.log('📋 Error response:', error.response.data);
      return error.response.data;
    }
    
    // Network error or server not running
    return {
      success: false,
      error: 'ML_SERVICE_ERROR',
      message: 'Prediction service unavailable',
      solution: 'Please check if Python server is running on port 5001'
    };
  }
};

export const predictMultipleReal = async (imagePaths) => {
  console.log(`📤 Processing ${imagePaths.length} images`);
  const results = [];
  
  for (let i = 0; i < imagePaths.length; i++) {
    console.log(`Processing image ${i + 1}/${imagePaths.length}`);
    const prediction = await predictDiseaseReal(imagePaths[i]);
    results.push(prediction);
  }
  
  return results;
};
