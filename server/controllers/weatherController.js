import axios from 'axios';

export const getWeatherByCoords = async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    const weather = {
      temperature: Math.round(response.data.main.temp),
      feelsLike: Math.round(response.data.main.feels_like),
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      windSpeed: Math.round(response.data.wind.speed * 3.6), // Convert to km/h
      rain: response.data.rain ? response.data.rain['1h'] || 0 : 0,
      city: response.data.name,
      icon: response.data.weather[0].icon
    };
    
    let advice = '';
    if (weather.rain > 0) {
      advice = '🌧️ Rain expected. Avoid spraying fertilizers today.';
    } else if (weather.temperature > 35) {
      advice = '🔥 Extreme heat! Water your crops in the evening.';
    } else if (weather.temperature < 15) {
      advice = '❄️ Cold weather! Protect young plants with mulch.';
    } else {
      advice = '✅ Weather is favorable for farming activities.';
    }
    
    res.json({
      success: true,
      weather,
      advice
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch weather data'
    });
  }
};

export const getForecast = async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    const dailyForecast = [];
    const days = new Set();
    
    for (const item of response.data.list) {
      const date = item.dt_txt.split(' ')[0];
      if (!days.has(date) && dailyForecast.length < 7) {
        days.add(date);
        
        // Generate alert and suggestions based on weather conditions
        let alert = null;
        let suggestions = [];
        const desc = item.weather[0].description.toLowerCase();
        const temp = item.main.temp;
        
        // Alert logic for next 1-2 days
        if (dailyForecast.length < 2) {
          if (desc.includes('rain') || desc.includes('thunderstorm')) {
            alert = { type: 'rain', severity: 'warning' };
            suggestions.push('⚠️ Avoid spraying pesticides/fertilizers during rain');
            suggestions.push('🌾 Postpone irrigation if heavy rain expected');
          } else if (temp > 38) {
            alert = { type: 'heat', severity: 'warning' };
            suggestions.push('💧 Increase irrigation in evening hours');
            suggestions.push('🌿 Provide shade for sensitive crops');
          } else if (temp < 5) {
            alert = { type: 'frost', severity: 'critical' };
            suggestions.push('🔥 Prepare frost protection measures');
            suggestions.push('🌱 Cover young plants with mulch');
          } else if (desc.includes('hail')) {
            alert = { type: 'hail', severity: 'critical' };
            suggestions.push('🛡️ Move valuable crops to sheltered areas');
            suggestions.push('⚡ Prepare for potential crop damage');
          }
        }
        
        dailyForecast.push({
          date: new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
          temp: Math.round(item.main.temp),
          tempMax: Math.round(item.main.temp_max),
          tempMin: Math.round(item.main.temp_min),
          humidity: item.main.humidity,
          description: item.weather[0].description,
          rain: item.rain ? item.rain['3h'] || 0 : 0,
          windSpeed: Math.round(item.wind.speed * 3.6), // Convert to km/h
          icon: item.weather[0].icon,
          alert,
          suggestions
        });
      }
    }
    
    res.json({
      success: true,
      forecast: dailyForecast
    });
  } catch (error) {
    console.error("Forecast error:", error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch forecast'
    });
  }
};