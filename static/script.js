console.log('script.js loaded');

function setWeatherTheme(description) {
  const root = document.documentElement;
  root.classList.remove('theme-clear','theme-clouds','theme-rain','theme-snow','theme-fog','theme-thunder');

  const desc = (description || '').toLowerCase();
  let theme = 'theme-clear';

  if (desc.includes('thunder')) theme = 'theme-thunder';
  else if (desc.includes('snow')) theme = 'theme-snow';
  else if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) theme = 'theme-rain';
  else if (desc.includes('fog') || desc.includes('mist') || desc.includes('haze')) theme = 'theme-fog';
  else if (desc.includes('cloud')) theme = 'theme-clouds';

  root.classList.add(theme);

  // control hero rain layer
  const rainLayer = document.querySelector('.rain-layer');
  if (rainLayer) {
    if (theme === 'theme-rain' || theme === 'theme-thunder') {
      rainLayer.style.opacity = '1';
    } else {
      rainLayer.style.opacity = '0';
    }
  }
}

function getAQILevel(aqi) {
  if (aqi == null) return {name:'Unknown', color:'', advice:'No AQI data.'};
  if (aqi <= 50)   return {name:'Good',        color:'good',       advice:'Great air quality.'};
  if (aqi <= 100)  return {name:'Fair',        color:'fair',       advice:'OK for most; sensitive people take care.'};
  if (aqi <= 150)  return {name:'Moderate',    color:'moderate',   advice:'Limit very long outdoor exertion.'};
  if (aqi <= 200)  return {name:'Poor',        color:'poor',       advice:'Sensitive groups stay indoors more.'};
  if (aqi <= 300)  return {name:'Very Poor',   color:'very-poor',  advice:'Everyone should reduce outdoor activity.'};
  return            {name:'Hazardous',   color:'hazardous', advice:'Avoid going outside; close windows.'};
}

async function getWeather() {
  const cityInput   = document.getElementById('cityInput');
  const city        = cityInput.value.trim();
  const resultDiv   = document.getElementById('result');
  const forecastDom = document.getElementById('forecastList');

  if (!city) {
    alert('Please enter a city name');
    cityInput.focus();
    return;
  }

  // show loading
  resultDiv.hidden = false;
  resultDiv.textContent = `Loading ${city}...`;
  forecastDom.innerHTML = '';

  try {
    const response = await fetch('/weather', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({city})
    });

    const data = await response.json();

    if (!response.ok) {
      resultDiv.textContent = data.error || 'Unable to fetch weather.';
      return;
    }

    // header
    document.getElementById('cityNameDisplay').textContent = data.city || city;
    document.getElementById('conditionText').textContent   = data.description || 'Weather';
    document.getElementById('tempMain').textContent        = `${Math.round(data.temperature)}°`;
    document.getElementById('tempRange').textContent       =
      `H:${Math.round(data.temp_max)}° · L:${Math.round(data.temp_min)}°`;

    // now card
    document.getElementById('nowTemp').textContent   = `${Math.round(data.temperature)}°`;
    document.getElementById('nowDesc').textContent   = data.description || '';
    document.getElementById('feelsLike').textContent = `${Math.round(data.feels_like)}°`;
    document.getElementById('humidity').textContent  = `${data.humidity}%`;
    document.getElementById('wind').textContent      = `${data.wind_speed} km/h`;

    // AQI
    const aqiValueEl  = document.getElementById('aqiValue');
    const aqiLevelEl  = document.getElementById('aqiLevel');
    const aqiAdviceEl = document.getElementById('aqiAdvice');

    aqiValueEl.textContent = data.aqi != null ? data.aqi : '--';
    const level = getAQILevel(data.aqi);
    aqiLevelEl.textContent = level.name;
    aqiLevelEl.className   = `aqi-level ${level.color}`;
    aqiAdviceEl.textContent = level.advice;

    // forecast
    if (Array.isArray(data.forecast)) {
      data.forecast.forEach(item => {
        const date = new Date(item.date);
        const day  = date.toLocaleDateString('en-US',{weekday:'short'});

        const div = document.createElement('div');
        div.className = 'forecast-day';
        div.innerHTML = `
          <div>
            <div class="day">${day}</div>
            <div class="desc">${item.description}</div>
          </div>
          <div class="temp">${Math.round(item.temp)}°</div>
        `;
        forecastDom.appendChild(div);
      });
    }

    setWeatherTheme(data.description);
    resultDiv.hidden = true;
    cityInput.value = '';

  } catch (err) {
    console.error(err);
    resultDiv.hidden = false;
    resultDiv.textContent = 'Network error. Try again.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cityInput').focus();
});
