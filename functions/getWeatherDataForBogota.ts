import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Coordenadas de Bogotá
    const latitude = 4.6097;
    const longitude = -74.0817;
    
    // Obtener datos históricos de los últimos 90 días
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    
    // API de Open-Meteo para datos históricos
    const apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startStr}&end_date=${endStr}&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum&timezone=America/Bogota`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.daily) {
      return Response.json({ 
        history: {
          time: [],
          temperature_2m_mean: [],
          precipitation_sum: [],
          weathercode: []
        }
      });
    }
    
    return Response.json({
      history: {
        time: data.daily.time || [],
        temperature_2m_mean: data.daily.temperature_2m_mean || [],
        temperature_2m_max: data.daily.temperature_2m_max || [],
        temperature_2m_min: data.daily.temperature_2m_min || [],
        precipitation_sum: data.daily.precipitation_sum || [],
        weathercode: data.daily.weather_code || []
      },
      location: {
        latitude: latitude,
        longitude: longitude,
        name: 'Bogotá, Colombia'
      }
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return Response.json({ 
      error: error.message,
      history: {
        time: [],
        temperature_2m_mean: [],
        precipitation_sum: [],
        weathercode: []
      }
    }, { status: 500 });
  }
});