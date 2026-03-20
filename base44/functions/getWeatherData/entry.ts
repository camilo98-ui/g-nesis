import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { method } = req;
    if (method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { latitude, longitude, startDate, endDate } = await req.json();

    if (!latitude || !longitude) {
      return Response.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Si se solicitan datos históricos (startDate y endDate)
    if (startDate && endDate) {
      // OpenWeatherMap histórico requiere suscripción paga
      // Usamos Open-Meteo que es gratuito para datos históricos
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=weathercode,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean&timezone=America%2FBogota`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      return Response.json({
        historical: true,
        data: data.daily,
        location: { latitude, longitude }
      });
    }

    // Datos del clima actual usando OpenWeatherMap
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`;
    
    const currentResponse = await fetch(currentUrl);
    const currentData = await currentResponse.json();

    if (currentData.cod !== 200) {
      return Response.json({ error: 'Failed to fetch weather data', details: currentData }, { status: 400 });
    }

    // Pronóstico de 5 días (gratuito)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`;
    
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    return Response.json({
      current: {
        temperature: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        pressure: currentData.main.pressure,
        weather: currentData.weather[0].main,
        weatherDescription: currentData.weather[0].description,
        weatherIcon: currentData.weather[0].icon,
        windSpeed: currentData.wind.speed,
        clouds: currentData.clouds.all,
        precipitation: currentData.rain ? currentData.rain['1h'] || 0 : 0,
        timestamp: currentData.dt,
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset
      },
      forecast: forecastData.list.map(item => ({
        timestamp: item.dt,
        date: item.dt_txt,
        temperature: item.main.temp,
        humidity: item.main.humidity,
        weather: item.weather[0].main,
        weatherDescription: item.weather[0].description,
        weatherIcon: item.weather[0].icon,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0,
        clouds: item.clouds.all
      })),
      location: {
        name: currentData.name,
        latitude,
        longitude
      }
    });

  } catch (error) {
    console.error('Weather API Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});