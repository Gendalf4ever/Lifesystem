// API ключ для OpenWeatherMap 
const API_KEY = '9ae6e2017fe89ec81982e0011eaf31a6';
let currentCity = 'Санкт-Петербург';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    fetchWeather();
    
    // Обработка ввода с клавиатуры
    document.getElementById('weatherLocation').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchWeather();
        }
    });
});

// Получение данных о погоде
async function fetchWeather() {
    const locationInput = document.getElementById('weatherLocation');
    const city = locationInput.value.trim() || currentCity;
    
    try {
        // Показываем индикатор загрузки
        document.getElementById('currentTemp').textContent = '...';
        
        // Получаем текущую погоду
        const currentResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=ru&appid=${API_KEY}`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Город не найден');
        }
        
        const currentData = await currentResponse.json();
        currentCity = currentData.name;
        updateCurrentWeather(currentData);
        
        // Получаем прогноз на 5 дней
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=ru&appid=${API_KEY}`
        );
        
        const forecastData = await forecastResponse.json();
        updateForecast(forecastData);
        
    } catch (error) {
        console.error('Ошибка получения погоды:', error);
        alert('Не удалось получить данные о погоде. Проверьте название города.');
    }
}

// Обновление текущей погоды
function updateCurrentWeather(data) {
    document.getElementById('currentCity').textContent = data.name;
    document.getElementById('currentTemp').textContent = Math.round(data.main.temp);
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('wind').textContent = data.wind.speed.toFixed(1);
    
    const iconCode = data.weather[0].icon;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    document.getElementById('weatherIcon').alt = data.weather[0].main;
}

// Обновление прогноза на 5 дней
function updateForecast(data) {
    const forecastContainer = document.getElementById('weatherForecast');
    forecastContainer.innerHTML = '';
    
    // Группируем прогноз по дням
    const dailyForecast = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
        
        if (!dailyForecast[dateStr]) {
            dailyForecast[dateStr] = {
                temp: [],
                icon: item.weather[0].icon,
                description: item.weather[0].description
            };
        }
        dailyForecast[dateStr].temp.push(item.main.temp);
    });
    
    // Отображаем прогноз
    Object.entries(dailyForecast).slice(0, 5).forEach(([day, forecast]) => {
        const avgTemp = Math.round(forecast.temp.reduce((a, b) => a + b) / forecast.temp.length);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        dayElement.innerHTML = `
            <div><strong>${day}</strong></div>
            <img src="https://openweathermap.org/img/wn/${forecast.icon}.png" alt="${forecast.description}">
            <div>${avgTemp}°C</div>
            <div style="font-size: 0.8em">${forecast.description}</div>
        `;
        
        forecastContainer.appendChild(dayElement);
    });
}