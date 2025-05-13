// Инициализация грида
let grid = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    // Инициализация сетки
    grid = GridStack.init({
        cellHeight: 80,
        minRow: 1,
        margin: 10,
        float: true,
        removable: true,
        removeTimeout: 100
    });
    
    loadLayout();
    
    // Инициализация обработчиков для существующих виджетов
    document.querySelectorAll('.weather-widget').forEach(widget => {
        WeatherWidget.init(widget.closest('.grid-stack-item').getAttribute('gs-id'));
    });
}

// Модуль управления виджетами
const WidgetManager = {
    add: function(type) {
        const widgetId = `widget-${Date.now()}`;
        const widgetConfig = this.getWidgetConfig(type, widgetId);
        
        const widgetHtml = `
        <div class="grid-stack-item" gs-w="4" gs-h="3" gs-id="${widgetId}">
            <div class="grid-stack-item-content widget">
                <div class="widget-header">
                    <h3 class="widget-title">${widgetConfig.title}</h3>
                    <button class="widget-close" onclick="WidgetManager.remove('${widgetId}')">×</button>
                </div>
                ${widgetConfig.content}
            </div>
        </div>`;
        
        const widgetEl = document.createElement('div');
        widgetEl.innerHTML = widgetHtml;
        grid.addWidget(widgetEl.firstElementChild);
        
        // Инициализация виджета
        if (type === 'weather') {
            WeatherWidget.init(widgetId);
        }
    },
    
    remove: function(id) {
        const el = document.querySelector(`[gs-id="${id}"]`);
        if (el) grid.removeWidget(el);
    },
    
    getWidgetConfig: function(type, widgetId) {
        const widgets = {
            weather: {
                title: 'Погода',
                content: `
                    <div class="weather-widget">
                        <div class="weather-controls">
                            <input type="text" placeholder="Город" class="weather-city" value="Санкт-Петербург">
                            <button class="weather-update-btn" onclick="WeatherWidget.update('${widgetId}')">Обновить</button>
                        </div>
                        <div class="weather-current">
                            <h2 class="weather-city-name">Санкт-Петербург</h2>
                            <div class="weather-main">
                                <img class="weather-icon" src="" alt="Погода">
                                <div class="weather-temp">--°C</div>
                            </div>
                            <div class="weather-description">--</div>
                            <div class="weather-details">
                                <div>Влажность: <span class="weather-humidity">--</span>%</div>
                                <div>Ветер: <span class="weather-wind">--</span> м/с</div>
                            </div>
                        </div>
                        <div class="weather-forecast"></div>
                    </div>`
            },
            tasks: {
                title: 'Задачи',
                content: `
                    <div class="task-widget">
                        <input type="text" placeholder="Новая задача">
                        <button onclick="TaskWidget.addTask('${widgetId}')">Добавить</button>
                        <ul class="task-list"></ul>
                    </div>`
            },
            calendar: {
                title: 'Календарь',
                content: `
                    <div class="calendar-widget">
                        <div class="calendar-header">
                            <button class="prev-month">‹</button>
                            <h4 class="month-title"></h4>
                            <button class="next-month">›</button>
                        </div>
                        <div class="calendar-grid"></div>
                    </div>`
            },
            activity: {
                title: 'Активность',
                content: `
                    <div class="activity-widget">
                        <div class="steps">Шаги: <span>0</span></div>
                        <div class="heart-rate">Пульс: <span>—</span></div>
                    </div>`
            }
        };
        
        return widgets[type] || { title: 'Новый виджет', content: '' };
    }
};

// Модуль виджета погоды
const WeatherWidget = {
    init: function(widgetId) {
        const widget = document.querySelector(`[gs-id="${widgetId}"]`);
        const cityInput = widget.querySelector('.weather-city');
        
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.update(widgetId);
        });
        
        this.update(widgetId);
    },
    
    update: async function(widgetId) {
        const widget = document.querySelector(`[gs-id="${widgetId}"]`);
        const cityInput = widget.querySelector('.weather-city');
        const city = cityInput.value.trim();
        
        if (!city) {
            alert('Введите название города');
            return;
        }
        
        try {
            widget.querySelector('.weather-temp').textContent = '...';
            
            // Используем API ключ из конфига
            const currentResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=ru&appid=${CONFIG.WEATHER_API_KEY}`
            );
            
            if (!currentResponse.ok) throw new Error('Город не найден');
            
            const currentData = await currentResponse.json();
            this.displayCurrentWeather(widget, currentData);
            
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=ru&appid=${CONFIG.WEATHER_API_KEY}`
            );
            
            const forecastData = await forecastResponse.json();
            this.displayForecast(widget, forecastData);
            
        } catch (error) {
            console.error('Ошибка получения погоды:', error);
            this.showError(widget);
        }
    },
    
    displayCurrentWeather: function(widget, data) {
        widget.querySelector('.weather-city-name').textContent = data.name;
        widget.querySelector('.weather-temp').textContent = `${Math.round(data.main.temp)}°C`;
        widget.querySelector('.weather-description').textContent = data.weather[0].description;
        widget.querySelector('.weather-humidity').textContent = data.main.humidity;
        widget.querySelector('.weather-wind').textContent = data.wind.speed.toFixed(1);
        
        const iconCode = data.weather[0].icon;
        const iconElement = widget.querySelector('.weather-icon');
        iconElement.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconElement.alt = data.weather[0].main;
        
        // Обновляем значение в поле ввода
        widget.querySelector('.weather-city').value = data.name;
    },
    
    displayForecast: function(widget, data) {
        const forecastContainer = widget.querySelector('.weather-forecast');
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
                <div class="forecast-desc">${forecast.description}</div>
            `;
            
            forecastContainer.appendChild(dayElement);
        });
    },
    
    showError: function(widget) {
        widget.querySelector('.weather-city-name').textContent = 'Ошибка';
        widget.querySelector('.weather-temp').textContent = '--';
        alert('Не удалось получить данные о погоде. Проверьте название города.');
    }
};

// Управление layout
const LayoutManager = {
    save: function() {
        const layout = grid.save();
        localStorage.setItem('dashboardLayout', JSON.stringify(layout));
        alert('Расположение сохранено!');
    },
    
    load: function() {
        const savedLayout = localStorage.getItem('dashboardLayout');
        if (savedLayout) {
            grid.load(JSON.parse(savedLayout));
        } else {
            // Добавляем виджеты по умолчанию
            WidgetManager.add('weather');
            WidgetManager.add('tasks');
        }
    },
    
    reset: function() {
        if (confirm('Сбросить расположение виджетов?')) {
            localStorage.removeItem('dashboardLayout');
            location.reload();
        }
    }
};

// Глобальные функции для вызова из HTML
window.addWidget = WidgetManager.add;
window.removeWidget = WidgetManager.remove;
window.saveLayout = LayoutManager.save;
window.loadLayout = LayoutManager.load;
window.resetLayout = LayoutManager.reset;
window.updateWeather = WeatherWidget.update;