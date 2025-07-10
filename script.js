// Weather Dashboard Main Script (Dark/Light Theme, Animated Weather Background)
// Insert your WeatherAPI.com API key below
const API_KEY = 'YOUR_API_KEY'; // <-- Replace with your WeatherAPI.com API key
const BASE_URL = 'https://api.weatherapi.com/v1/';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
// Removed unit toggle button
const weatherInfo = document.getElementById('weather-info');
const weatherInfoWrapper = document.getElementById('weather-info-wrapper');
const forecastCards = document.getElementById('forecast-cards');
const errorMessage = document.getElementById('error-message');
const loadingSection = document.getElementById('loading');
const searchHistoryList = document.getElementById('search-history');
// Removed dark/light mode toggle button
const weatherBg = document.getElementById('weather-bg');

let debounceTimeout = null;
let currentUnit = 'C'; // 'C' or 'F'
let searchHistory = [];

// --- Utility Functions ---
function formatDate(dtTxt) {
  const date = new Date(dtTxt);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function getFlagEmoji(countryCode) {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}
function showLoading() {
  loadingSection.classList.remove('hidden');
  weatherInfo.innerHTML = '';
  forecastCards.innerHTML = '';
  errorMessage.classList.add('hidden');
}
function hideLoading() {
  loadingSection.classList.add('hidden');
}
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove('hidden');
  weatherInfo.innerHTML = '';
  forecastCards.innerHTML = '';
  hideLoading();
}
function saveSearchHistory(city) {
  city = city.trim();
  if (!city) return;
  searchHistory = searchHistory.filter(c => c.toLowerCase() !== city.toLowerCase());
  searchHistory.unshift(city);
  if (searchHistory.length > 5) searchHistory = searchHistory.slice(0, 5);
  localStorage.setItem('weather_search_history', JSON.stringify(searchHistory));
  renderSearchHistory();
}
function loadSearchHistory() {
  const stored = localStorage.getItem('weather_search_history');
  if (stored) searchHistory = JSON.parse(stored);
  renderSearchHistory();
}
function renderSearchHistory() {
  if (!searchHistory.length) {
    searchHistoryList.classList.add('hidden');
    return;
  }
  searchHistoryList.innerHTML = searchHistory.map(city => `<li class=\"px-4 py-2 cursor-pointer hover:bg-[#23272f]/70 rounded\">${city}</li>`).join('');
  searchHistoryList.classList.remove('hidden');
}
function setTheme(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    localStorage.setItem('weather_theme', 'light');
  } else {
    document.body.classList.remove('light-mode');
    localStorage.setItem('weather_theme', 'dark');
  }
}
function loadTheme() {
  const theme = localStorage.getItem('weather_theme');
  if (theme === 'light') {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
}
function setWeatherBg(weather) {
  // Palette-safe, subtle SVG/CSS backgrounds
  let bg = '';
  const desc = weather.condition.text.toLowerCase();
  if (desc.includes('rain')) {
    bg = 'linear-gradient(135deg, #23272f 60%, #4FC3F7 100%)';
    weatherBg.innerHTML = `<svg width="100%" height="100%" style="position:absolute;top:0;left:0;z-index:0;" viewBox="0 0 1440 320"><ellipse fill="#4FC3F7" fill-opacity="0.12" cx="720" cy="320" rx="900" ry="120"/></svg>`;
  } else if (desc.includes('clear') || desc.includes('sun')) {
    bg = 'linear-gradient(135deg, #23272f 60%, #4FC3F7 100%)';
    weatherBg.innerHTML = `<svg width="100%" height="100%" style="position:absolute;top:0;left:0;z-index:0;" viewBox="0 0 1440 320"><circle fill="#4FC3F7" fill-opacity="0.10" cx="1200" cy="80" r="120"/></svg>`;
  } else if (desc.includes('cloud')) {
    bg = 'linear-gradient(135deg, #23272f 60%, #4FC3F7 100%)';
    weatherBg.innerHTML = `<svg width="100%" height="100%" style="position:absolute;top:0;left:0;z-index:0;" viewBox="0 0 1440 320"><ellipse fill="#4FC3F7" fill-opacity="0.08" cx="900" cy="120" rx="300" ry="60"/></svg>`;
  } else if (desc.includes('snow')) {
    bg = 'linear-gradient(135deg, #23272f 60%, #4FC3F7 100%)';
    weatherBg.innerHTML = `<svg width="100%" height="100%" style="position:absolute;top:0;left:0;z-index:0;" viewBox="0 0 1440 320"><circle fill="#4FC3F7" fill-opacity="0.08" cx="400" cy="200" r="80"/></svg>`;
  } else {
    bg = 'linear-gradient(135deg, #23272f 60%, #4FC3F7 100%)';
    weatherBg.innerHTML = '';
  }
  weatherBg.style.background = bg;
}

// --- API Fetch Functions ---
async function fetchCurrentWeather(city) {
  const url = `${BASE_URL}current.json?key=${API_KEY}&q=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('City not found or API error.');
  return res.json();
}
async function fetchForecast(city) {
  const url = `${BASE_URL}forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast not available.');
  return res.json();
}
async function fetchCityByGeo(lat, lon) {
  const url = `${BASE_URL}current.json?key=${API_KEY}&q=${lat},${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Location not found.');
  const data = await res.json();
  if (!data.location || !data.location.name) throw new Error('Location not found.');
  return data.location.name;
}

// --- Render Functions ---
function renderCurrentWeather(data) {
  const { location, current } = data;
  const flag = getFlagEmoji(location.country_code || location.country);
  const iconUrl = `https:${current.condition.icon}`;
  const temp = currentUnit === 'C' ? current.temp_c : current.temp_f;
  const feels = currentUnit === 'C' ? current.feelslike_c : current.feelslike_f;
  const wind = currentUnit === 'C' ? `${current.wind_kph} kph` : `${current.wind_mph} mph`;
  weatherInfo.innerHTML = `
    <div class=\"flex flex-col md:flex-row items-center justify-between gap-4 mb-4 fade-in\">
      <div>
        <h2 class=\"text-2xl font-bold flex items-center gap-2 font-poppins\">${location.name} <span class=\"text-lg\">${flag}</span></h2>
        <div class=\"text-[#cccccc] text-sm mb-1\">${location.country} &middot; ${location.localtime}</div>
      </div>
      <img src=\"${iconUrl}\" alt=\"${current.condition.text}\" class=\"w-20 h-20 md:w-24 md:h-24 shadow-lg hover:scale-110 transition\" />
    </div>
    <div class=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
      <div class=\"bg-[#23272f] rounded-xl p-4 flex flex-col items-center\">
        <span class=\"text-3xl font-bold\">${temp}°${currentUnit}</span>
        <span class=\"text-xs mt-1 text-[#cccccc]\">Temperature</span>
      </div>
      <div class=\"bg-[#23272f] rounded-xl p-4 flex flex-col items-center\">
        <span class=\"text-lg\">${current.condition.text}</span>
        <span class=\"text-xs mt-1 text-[#cccccc]\">Description</span>
      </div>
      <div class=\"bg-[#23272f] rounded-xl p-4 flex flex-col items-center\">
        <span class=\"text-lg\">💧 ${current.humidity}%</span>
        <span class=\"text-xs mt-1 text-[#cccccc]\">Humidity</span>
      </div>
      <div class=\"bg-[#23272f] rounded-xl p-4 flex flex-col items-center\">
        <span class=\"text-lg\">🌬️ ${wind}</span>
        <span class=\"text-xs mt-1 text-[#cccccc]\">Wind</span>
      </div>
      <div class=\"bg-[#23272f] rounded-xl p-4 flex flex-col items-center\">
        <span class=\"text-lg\">🧊 ${feels}°${currentUnit}</span>
        <span class=\"text-xs mt-1 text-[#cccccc]\">Feels Like</span>
      </div>
    </div>
  `;
  setWeatherBg(current);
}
function renderForecast(data) {
  if (!data.forecast || !data.forecast.forecastday) {
    forecastCards.innerHTML = '<div>No forecast data available.</div>';
    return;
  }
  const days = data.forecast.forecastday;
  forecastCards.innerHTML = days.map(day => {
    const iconUrl = `https:${day.day.condition.icon}`;
    const min = currentUnit === 'C' ? day.day.mintemp_c : day.day.mintemp_f;
    const max = currentUnit === 'C' ? day.day.maxtemp_c : day.day.maxtemp_f;
    return `<div class=\"forecast-card glass-card p-4 rounded-xl flex flex-col items-center cursor-pointer hover:scale-105 transition slide-in\">
      <div class=\"font-semibold text-[#4FC3F7] mb-1\">${formatDate(day.date)}</div>
      <img src=\"${iconUrl}\" alt=\"${day.day.condition.text}\" class=\"w-12 h-12 mb-2\" />
      <div class=\"text-lg font-bold\">${min}° / ${max}°${currentUnit}</div>
      <div class=\"text-sm text-[#cccccc]\">${day.day.condition.text}</div>
    </div>`;
  }).join('');
}

// --- Main Search Handler ---
async function handleSearch(city) {
  if (!city) return;
  showLoading();
  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(city),
      fetchForecast(city)
    ]);
    renderCurrentWeather(current);
    renderForecast(forecast);
    saveSearchHistory(city);
    errorMessage.classList.add('hidden');
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
  }
}

// --- Event Listeners ---
cityInput.addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  const val = cityInput.value.trim();
  if (!val) {
    searchHistoryList.classList.add('hidden');
    return;
  }
  debounceTimeout = setTimeout(() => {
    renderSearchHistory();
    searchHistoryList.classList.remove('hidden');
  }, 300);
});

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) handleSearch(city);
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) handleSearch(city);
  }
});

searchHistoryList.addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    cityInput.value = e.target.textContent;
    handleSearch(e.target.textContent);
    searchHistoryList.classList.add('hidden');
  }
});

document.addEventListener('click', (e) => {
  if (!searchHistoryList.contains(e.target) && e.target !== cityInput) {
    searchHistoryList.classList.add('hidden');
  }
});

// Removed unit toggle event listener

// Removed dark/light mode toggle event listener

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        // Use WeatherAPI reverse geocoding to get city name
        const url = `${BASE_URL}search.json?key=${API_KEY}&q=${pos.coords.latitude},${pos.coords.longitude}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Location not found.');
        const data = await res.json();
        if (!data || !data.length || !data[0].name) throw new Error('Location not found.');
        const city = data[0].name;
        cityInput.value = city;
        handleSearch(city);
      } catch (err) {
        showError('Could not get location.');
      }
    },
    () => {
      showError('Permission denied for geolocation.');
    }
  );
});
// --- Initialization ---
window.onload = () => {
  loadTheme();
  loadSearchHistory();
  cityInput.focus();
  if (searchHistory.length) handleSearch(searchHistory[0]);
}; 
