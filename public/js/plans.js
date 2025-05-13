let plansApp = {
    priorities: [
        { id: 1, name: "Здоровье", weight: 90, color: "#e74c3c" },
        { id: 2, name: "Карьера", weight: 80, color: "#3498db" },
        { id: 3, name: "Семья", weight: 70, color: "#2ecc71" }
    ],
    tasks: [],
    
    init() {
        this.loadData();
        this.renderPriorities();
        this.renderTasks();

        //явное добавление обработчика
        document.getElementById('addPriorityBtn')?.addEventListener('click', () => {
            this.addPriority();
        });

    },
    
    loadData() {
        const saved = localStorage.getItem('plansData');
        if (saved) Object.assign(this, JSON.parse(saved));
    },
    
    saveData() {
        localStorage.setItem('plansData', JSON.stringify({
            priorities: this.priorities,
            tasks: this.tasks
        }));
    },
    
    renderPriorities() {
        const container = document.getElementById('prioritiesContainer');
        container.innerHTML = '';
        
        this.priorities.sort((a, b) => b.weight - a.weight);
        
        this.priorities.forEach(priority => {
            const priorityEl = document.createElement('div');
            priorityEl.className = 'priority';
            priorityEl.innerHTML = `
                <div class="priority-header" style="border-left: 4px solid ${priority.color}">
                    <h3>${priority.name}</h3>
                    <div class="priority-actions">
                        <div class="priority-weight">
                            <span>${priority.weight}</span>
                            <button onclick="plansApp.changeWeight(${priority.id}, 1)">↑</button>
                            <button onclick="plansApp.changeWeight(${priority.id}, -1)">↓</button>
                        </div>
                    </div>
                </div>
                <div class="tasks-list" id="tasks-${priority.id}"></div>
                <div class="add-task-form">
                    <input type="text" id="newTask-${priority.id}" placeholder="Новая задача">
                    <button onclick="plansApp.addTask(${priority.id})">+</button>
                </div>
            `;
            
            // Явное создание кнопки удаления
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-priority';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = () => this.deletePriority(priority.id);
            
            // Добавляем кнопку в контейнер действий
            priorityEl.querySelector('.priority-actions').appendChild(deleteBtn);
            
            container.appendChild(priorityEl);
        });
    },
    
    // Удаление приоритета
    deletePriority(priorityId) {
        if (confirm("Удалить этот приоритет и все связанные задачи?")) {
            // Удаляем приоритет
            this.priorities = this.priorities.filter(p => p.id !== priorityId);
            
            // Удаляем связанные задачи
            this.tasks = this.tasks.filter(t => t.priorityId !== priorityId);
            
            this.saveData();
            this.renderPriorities();
            this.renderTasks();
        }
    },
    
    renderTasks() {
        this.priorities.forEach(priority => {
            const container = document.getElementById(`tasks-${priority.id}`);
            if (!container) return;
            
            container.innerHTML = '';
            const tasks = this.tasks.filter(t => t.priorityId === priority.id);
            
            tasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = `task ${task.completed ? 'completed' : ''}`;
                taskEl.innerHTML = `
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="plansApp.toggleTask('${task.id}')">
                    <span>${task.text}</span>
                    <button onclick="plansApp.deleteTask('${task.id}')">×</button>
                `;
                container.appendChild(taskEl);
            });
        });
    },
    
    changeWeight(priorityId, delta) {
        const priority = this.priorities.find(p => p.id === priorityId);
        if (priority) {
            priority.weight = Math.max(1, Math.min(100, priority.weight + delta));
            this.saveData();
            this.renderPriorities();
        }
    },
    
    addTask(priorityId) {
        const input = document.getElementById(`newTask-${priorityId}`);
        const text = input.value.trim();
        
        if (text) {
            this.tasks.push({
                id: Date.now().toString(),
                priorityId,
                text,
                completed: false
            });
            
            input.value = '';
            this.saveData();
            this.renderTasks();
        }
    },
    
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.renderTasks();
        }
    },
    
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderTasks();
    },
    
    addPriority() {
        try {
            const name = prompt('Введите название приоритета:');
            if (!name) return;
            
            const newPriority = {
                id: Date.now(),
                name,
                weight: 50,
                color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
            };
            
            this.priorities.push(newPriority);
            this.saveData();
            this.renderPriorities();
            
            console.log('Добавлен новый приоритет:', newPriority); // Для отладки
        } catch (error) {
            console.error('Ошибка при добавлении приоритета:', error);
            alert('Не удалось добавить приоритет');
        }
    }
};

// Инициализация при загрузке
// Защищенная инициализация
document.addEventListener('DOMContentLoaded', () => {
    try {
        plansApp.init();
        console.log('PlansApp инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации PlansApp:', error);
    }
});

// Делаем методы доступными глобально
window.plansApp = plansApp;