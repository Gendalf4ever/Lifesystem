// Объект состояния приложения
const appState = {
    activityData: {
        steps: 0,
        heartRate: 0
    },
    currentDate: new Date(),
    selectedDate: new Date()
};

// Проверяем доступность DOM элементов
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const stepsElement = document.getElementById('steps');
const heartRateElement = document.getElementById('heartRate');

// Проверяем доступность Firestore
if (typeof firebase === 'undefined' || typeof db === 'undefined') {
    console.warn('Firestore не доступен. Используется localStorage');
    if (taskInput) taskInput.disabled = false;
} else {
    console.log('Firestore доступен');
}

// Инициализация приложения
async function initApp() {
    try {
        // Проверяем необходимые DOM элементы
        if (!taskList || !stepsElement || !heartRateElement) {
            throw new Error('Не найдены необходимые DOM элементы');
        }

        await loadTasks();
        initCalendar();
        startActivitySimulation();
        updateActivity();
    } catch (error) {
        console.error("Ошибка инициализации:", error);
        showError("Ошибка загрузки приложения");
    }
}

// Загрузка задач (из Firestore или localStorage)
async function loadTasks() {
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    try {
        const dateStr = formatFirestoreDate(appState.selectedDate);
        let tasks = [];
        let source = '';

        // Показываем индикатор загрузки
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.textContent = 'Загрузка задач...';
        taskList.appendChild(loadingIndicator);

        if (window.db) {
            try {
                const querySnapshot = await window.db.collection("tasks").get();
                tasks = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(task => task.date === dateStr);
                source = 'Firestore';
            } catch (error) {
                console.error('Ошибка Firestore:', error);
                source = 'localStorage (fallback)';
                const saved = localStorage.getItem('tasks') || '[]';
                tasks = JSON.parse(saved).filter(task => task.date === dateStr);
            }
        } else {
            source = 'localStorage';
            const saved = localStorage.getItem('tasks') || '[]';
            tasks = JSON.parse(saved).filter(task => task.date === dateStr);
        }

        // Удаляем индикатор загрузки
        taskList.removeChild(loadingIndicator);

        if (tasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-tasks-message';
            emptyMessage.textContent = 'На этот день задач нет. Добавьте первую!';
            taskList.appendChild(emptyMessage);
            return;
        }

        // Отображение задач
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id;
            li.innerHTML = `
                <input type="checkbox" onchange="toggleTask(this)" ${task.done ? 'checked' : ''}>
                <span class="${task.done ? 'done' : ''}">${task.text}</span>
                <button class="delete-task" onclick="deleteTask('${task.id}')">×</button>
            `;
            taskList.appendChild(li);
        });

    } catch (error) {
        console.error("Ошибка загрузки задач:", error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Не удалось загрузить задачи';
        taskList.appendChild(errorMessage);
    }
}

// Добавление новой задачи
async function addTask() {
    if (!taskInput || !taskList) return;
    
    const taskText = taskInput.value.trim();
    if (!taskText) return;
    
    try {
        const taskData = {
            text: taskText,
            done: false,
            date: formatFirestoreDate(appState.selectedDate),
            createdAt: window.db ? 
                firebase.firestore.FieldValue.serverTimestamp() : 
                new Date().toISOString()
        };

        if (window.db) {
            await window.db.collection("tasks").add(taskData);
        } else {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks.push({ ...taskData, id: Date.now().toString() });
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        taskInput.value = '';
        await loadTasks();
    } catch (error) {
        console.error("Ошибка добавления задачи:", error);
        showError("Не удалось добавить задачу");
    }
}

// Обновление статуса задачи
async function toggleTask(checkbox) {
    if (!checkbox) return;
    
    const taskItem = checkbox.closest('li');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    const isDone = checkbox.checked;
    
    try {
        if (window.db) {
            await window.db.collection("tasks").doc(taskId).update({
                done: isDone,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].done = isDone;
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
        }

        if (checkbox.nextElementSibling) {
            checkbox.nextElementSibling.classList.toggle('done');
        }
    } catch (error) {
        console.error("Ошибка обновления задачи:", error);
        checkbox.checked = !checkbox.checked;
        showError("Не удалось обновить задачу");
    }
}

// Удаление задачи
async function deleteTask(taskId) {
    if (!taskId || !confirm('Вы уверены, что хотите удалить эту задачу?')) return;
    
    try {
        if (window.db) {
            await window.db.collection("tasks").doc(taskId).delete();
        } else {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const updatedTasks = tasks.filter(task => task.id !== taskId);
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        }
        await loadTasks();
    } catch (error) {
        console.error("Ошибка удаления задачи:", error);
        showError("Не удалось удалить задачу");
    }
}

// Вспомогательные функции
function formatFirestoreDate(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showError(message) {
    if (!message) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    document.body.prepend(errorElement);
    setTimeout(() => errorElement.remove(), 3000);
}

// Активность
function updateActivity() {
    if (stepsElement) stepsElement.textContent = appState.activityData.steps;
    if (heartRateElement) {
        heartRateElement.textContent = appState.activityData.heartRate || '—';
    }
}

function startActivitySimulation() {
    setInterval(() => {
        appState.activityData.steps += 10;
        updateActivity();
    }, 5000);
}

// Календарь


function initCalendar() {
    // Создаем контейнер для календаря
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-container';
    
    // Создаем элементы календаря
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    
    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.className = 'prev-month';
    prevMonthBtn.innerHTML = '&lt;';
    
    const currentMonthEl = document.createElement('h3');
    currentMonthEl.className = 'current-month';
    
    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.className = 'next-month';
    nextMonthBtn.innerHTML = '&gt;';
    
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // Собираем структуру
    calendarHeader.appendChild(prevMonthBtn);
    calendarHeader.appendChild(currentMonthEl);
    calendarHeader.appendChild(nextMonthBtn);
    
    calendarContainer.appendChild(calendarHeader);
    calendarContainer.appendChild(calendarGrid);
    
    // Добавляем календарь в правый верхний угол
    document.body.insertBefore(calendarContainer, document.body.firstChild);

    function renderCalendar() {
        calendarGrid.innerHTML = `
            <div class="day-name">Пн</div>
            <div class="day-name">Вт</div>
            <div class="day-name">Ср</div>
            <div class="day-name">Чт</div>
            <div class="day-name">Пт</div>
            <div class="day-name">Сб</div>
            <div class="day-name">Вс</div>
        `;

        const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
                          "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        currentMonthEl.textContent = `${monthNames[appState.currentDate.getMonth()]} ${appState.currentDate.getFullYear()}`;

        const firstDay = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth(), 1);
        const lastDay = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth() + 1, 0);
        const prevLastDay = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth(), 0).getDate();
        const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        // Дни предыдущего месяца
        for (let i = firstDayIndex; i > 0; i--) {
            const day = prevLastDay - i + 1;
            const dayElement = createDayElement(day, true);
            calendarGrid.appendChild(dayElement);
        }

        // Дни текущего месяца
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(appState.currentDate.getFullYear(), appState.currentDate.getMonth(), i);
            const isToday = isSameDate(date, new Date());
            const isSelected = isSameDate(date, appState.selectedDate);
            
            const dayElement = createDayElement(i, false, isToday, isSelected);
            dayElement.addEventListener('click', () => {
                appState.selectedDate = date;
                renderCalendar();
                loadTasks();
            });
            
            calendarGrid.appendChild(dayElement);
        }

        // Дни следующего месяца
        const totalDays = firstDayIndex + lastDay.getDate();
        const nextDays = 7 - (totalDays % 7);
        if (nextDays < 7) {
            for (let i = 1; i <= nextDays; i++) {
                const dayElement = createDayElement(i, true);
                calendarGrid.appendChild(dayElement);
            }
        }
    }

    function isSameDate(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function createDayElement(day, isOtherMonth, isToday = false, isSelected = false) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        if (isToday) {
            dayElement.classList.add('today');
        }
        if (isSelected) {
            dayElement.classList.add('selected');
        }
        
        return dayElement;
    }

    prevMonthBtn.addEventListener('click', () => {
        appState.currentDate.setMonth(appState.currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        appState.currentDate.setMonth(appState.currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar();
}


// Делаем функции доступными глобально
if (typeof window !== 'undefined') {
    window.addTask = addTask;
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
}

// Инициализация при загрузке
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.db) {
            console.warn('Firestore не доступен, используется localStorage');
        }
        if (typeof initApp === 'function') {
            initApp();
        }
    });
}