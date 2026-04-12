import axios from 'axios';

export const getLocationFromCoords = async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    
    const address = response.data.address;
    
    res.json({
      success: true,
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        city: address.city || address.town || address.village,
        state: address.state,
        country: address.country,
        pincode: address.postcode,
        displayName: response.data.display_name
      }
    });
  } catch (error) {
    res.json({
      success: true,
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        city: 'Location detected',
        state: 'State'
      }
    });
  }
};

export const suggestCrops = async (req, res) => {
  try {
    const { season, soilType } = req.query;
    
    const cropSuggestions = {
      kharif: ['Rice', 'Maize', 'Cotton', 'Sugarcane', 'Groundnut'],
      rabi: ['Wheat', 'Mustard', 'Chickpea', 'Barley', 'Sunflower'],
      summer: ['Watermelon', 'Cucumber', 'Bitter Gourd', 'Pumpkin']
    };
    
    const seasonKey = season?.toLowerCase() === 'summer' ? 'summer' : 
                      (season?.toLowerCase() === 'rabi' ? 'rabi' : 'kharif');
    
    res.json({
      success: true,
      season: season || 'kharif',
      soilType: soilType || 'loamy',
      suggestions: cropSuggestions[seasonKey] || cropSuggestions.kharif
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error suggesting crops'
    });
  }
};