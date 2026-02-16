// commands/tools/weather.js - UPDATED WITH REAL API
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'weather',
    alias: ['forecast', 'climate', 'temp', 'weatherinfo'],
    category: 'tools',
    description: 'Get real weather information using Open-Meteo API',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'weather')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        const location = args.join(' ');
        
        if (!location) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🌤️ *REAL WEATHER FORECAST* 🦊\n\n` +
                      `Usage: ${prefix}weather <city_name>\n\n` +
                      `*Powered by:* Open-Meteo API (Free)\n\n` +
                      `*Examples:*\n` +
                      `${prefix}weather London\n` +
                      `${prefix}weather New York\n` +
                      `${prefix}weather Tokyo\n\n` +
                      `*For better accuracy:*\n` +
                      `${prefix}weather London, UK\n` +
                      `${prefix}weather Paris, France\n\n` +
                      `💡 *Uses real-time weather data!*\n\n` +
                      `🦊 The fox knows real weather!`
            });
            return;
        }
        
        // Show loading message
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🌤️ *Fetching weather data...* 🦊\n\n` +
                  `*Location:* ${location}\n` +
                  `*API:* Open-Meteo (Free)\n` +
                  `*Status:* Getting coordinates...`
        });
        
        try {
            // Step 1: Get coordinates from location name
            const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
            
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();
            
            if (!geocodeData.results || geocodeData.results.length === 0) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ *LOCATION NOT FOUND* 🦊\n\n` +
                          `Could not find "${location}"\n\n` +
                          `*Tips:*\n` +
                          `• Check spelling\n` +
                          `• Add country name\n` +
                          `• Use English names\n\n` +
                          `*Examples:*\n` +
                          `${prefix}weather London\n` +
                          `${prefix}weather Tokyo, Japan\n\n` +
                          `🦊 Even foxes can't find everything!`
                });
                return;
            }
            
            const { name, country, latitude, longitude, timezone } = geocodeData.results[0];
            
            // Step 2: Get weather data using coordinates
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🌤️ *Fetching weather...* 🦊\n\n` +
                      `*Location:* ${name}, ${country}\n` +
                      `*Coordinates:* ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E\n` +
                      `*Timezone:* ${timezone}\n` +
                      `*Status:* Getting forecast...`
            });
            
            // Your API endpoint with more parameters
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,relative_humidity_2m,rain,showers,snowfall,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,rain_sum,showers_sum,snowfall_sum,precipitation_probability_max&timezone=${timezone}&forecast_days=2`;
            
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();
            
            // Step 3: Parse and format weather data
            const current = weatherData.current;
            const daily = weatherData.daily;
            
            // Weather code to emoji mapping
            const weatherCodes = {
                0: '☀️ Clear sky',
                1: '🌤️ Mainly clear',
                2: '⛅ Partly cloudy',
                3: '☁️ Overcast',
                45: '🌫️ Fog',
                48: '🌫️ Depositing rime fog',
                51: '🌧️ Light drizzle',
                53: '🌧️ Moderate drizzle',
                55: '🌧️ Dense drizzle',
                56: '🌧️ Light freezing drizzle',
                57: '🌧️ Dense freezing drizzle',
                61: '🌧️ Slight rain',
                63: '🌧️ Moderate rain',
                65: '🌧️ Heavy rain',
                66: '🌧️ Light freezing rain',
                67: '🌧️ Heavy freezing rain',
                71: '❄️ Slight snow',
                73: '❄️ Moderate snow',
                75: '❄️ Heavy snow',
                77: '❄️ Snow grains',
                80: '🌦️ Slight rain showers',
                81: '🌦️ Moderate rain showers',
                82: '🌦️ Violent rain showers',
                85: '🌨️ Slight snow showers',
                86: '🌨️ Heavy snow showers',
                95: '⛈️ Thunderstorm',
                96: '⛈️ Thunderstorm with hail',
                99: '⛈️ Heavy thunderstorm with hail'
            };
            
            const currentWeather = weatherCodes[current.weather_code] || '❓ Unknown';
            const isDay = current.is_day ? '☀️ Day' : '🌙 Night';
            
            // Temperature with units
            const tempUnit = weatherData.current_units?.temperature_2m || '°C';
            const windUnit = weatherData.current_units?.wind_speed_10m || 'km/h';
            const rainUnit = weatherData.current_units?.rain || 'mm';
            
            // Format current weather
            let weatherText = `🌤️ *REAL-TIME WEATHER* 🦊\n`;
            weatherText += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            weatherText += `*Location:* ${name}, ${country}\n`;
            weatherText += `*Time:* ${new Date().toLocaleTimeString()}\n`;
            weatherText += `*Day/Night:* ${isDay}\n\n`;
            
            weatherText += `*Current Conditions:*\n`;
            weatherText += `• ${currentWeather}\n`;
            weatherText += `• Temperature: ${current.temperature_2m}${tempUnit}\n`;
            weatherText += `• Feels like: ${current.apparent_temperature}${tempUnit}\n`;
            weatherText += `• Humidity: ${current.relative_humidity_2m}%\n`;
            weatherText += `• Cloud cover: ${current.cloud_cover}%\n`;
            weatherText += `• Wind: ${current.wind_speed_10m} ${windUnit}\n`;
            weatherText += `• Rain: ${current.rain} ${rainUnit}\n`;
            weatherText += `• Snow: ${current.snowfall} ${rainUnit}\n\n`;
            
            // Today's forecast
            weatherText += `*Today's Forecast:*\n`;
            weatherText += `• Max: ${daily.temperature_2m_max[0]}${tempUnit}\n`;
            weatherText += `• Min: ${daily.temperature_2m_min[0]}${tempUnit}\n`;
            weatherText += `• Rain: ${daily.rain_sum[0]} ${rainUnit}\n`;
            weatherText += `• Snow: ${daily.snowfall_sum[0]} ${rainUnit}\n`;
            weatherText += `• Precipitation chance: ${daily.precipitation_probability_max[0]}%\n\n`;
            
            // Tomorrow's forecast
            weatherText += `*Tomorrow's Forecast:*\n`;
            const tomorrowWeather = weatherCodes[daily.weather_code[1]] || '❓ Unknown';
            weatherText += `• Weather: ${tomorrowWeather}\n`;
            weatherText += `• Max: ${daily.temperature_2m_max[1]}${tempUnit}\n`;
            weatherText += `• Min: ${daily.temperature_2m_min[1]}${tempUnit}\n`;
            weatherText += `• Rain: ${daily.rain_sum[1]} ${rainUnit}\n`;
            weatherText += `• Snow: ${daily.snowfall_sum[1]} ${rainUnit}\n\n`;
            
            // Weather alerts or tips
            let tips = '';
            if (current.temperature_2m < 0) tips = '❄️ *Freezing!* Dress very warmly!';
            else if (current.temperature_2m < 10) tips = '🧥 *Chilly!* Wear a jacket.';
            else if (current.temperature_2m > 30) tips = '🔥 *Hot!* Stay hydrated.';
            else if (current.rain > 5) tips = '☔ *Rainy!* Take an umbrella.';
            else if (current.snowfall > 2) tips = '⛄ *Snowy!* Be careful driving.';
            else tips = '😊 *Pleasant weather!* Enjoy your day!';
            
            weatherText += `*Weather Tip:* ${tips}\n\n`;
            
            weatherText += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
            weatherText += `*Data Source:* Open-Meteo API (Free)\n`;
            weatherText += `*Updated:* Just now\n`;
            weatherText += `*Accuracy:* High\n\n`;
            weatherText += `💡 *Check another location:*\n`;
            weatherText += `${prefix}weather <city_name>\n\n`;
            weatherText += `🦊 Real weather from fox intelligence!`;
            
            await sock.sendMessage(msg.key.remoteJid, { text: weatherText });
            
        } catch (error) {
            console.error('Weather API Error:', error);
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *WEATHER ERROR* 🦊\n\n` +
                      `Failed to get weather data!\n\n` +
                      `*Possible reasons:*\n` +
                      `• API service down\n` +
                      `• Network issue\n` +
                      `• Location not found\n\n` +
                      `*Try again later or:*\n` +
                      `• Check spelling\n` +
                      `• Use different city\n` +
                      `• Try in 5 minutes\n\n` +
                      `🦊 Even weather APIs have bad days!`
            });
        }
    }
};