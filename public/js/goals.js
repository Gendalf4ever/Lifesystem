// Инициализируем Firebase
const db = window.db;


// DOM элементы
const goalNameInput = document.getElementById('goalName');
const goalTargetInput = document.getElementById('goalTarget');
const addGoalBtn = document.getElementById('addGoalBtn');
const goalsList = document.getElementById('goalsList');


// Добавление новой цели
addGoalBtn.addEventListener('click', async () => {
    const name = goalNameInput.value.trim();
    const target = parseFloat(goalTargetInput.value);
    
    if (name && target > 0) {
        try {
            await db.collection('goals').add({
                name,
                target,
                saved: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Очищаем поля ввода
            goalNameInput.value = '';
            goalTargetInput.value = '';
        } catch (error) {
            console.error("Ошибка при добавлении цели: ", error);
            alert("Не удалось добавить цель");
        }
    }
});


//  deleteGoal
async function deleteGoal(goalId) {
    const goalElement = document.querySelector(`.goal-item[data-id="${goalId}"]`);
    const goalName = goalElement ? goalElement.querySelector('h3').textContent : 'эту цель';
    
    if (confirm(`Вы уверены, что хотите удалить "${goalName}"?`)) {
        try {
            if (goalElement) {
                goalElement.classList.add('deleting');
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            await db.collection('goals').doc(goalId).delete();
        } catch (error) {
            console.error("Ошибка при удалении:", error);
            if (goalElement) goalElement.classList.remove('deleting');
            alert("Не удалось удалить цель");
        }
    }
}




// Отображение целей
function renderGoal(goal, id) {
    const goalElement = document.createElement('div');
    goalElement.className = 'goal-item';
    goalElement.innerHTML = `
        <div class="goal-info">
            <h3>${goal.name}</h3>
            <p>Накоплено: ${goal.saved} руб. из ${goal.target} руб.</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${(goal.saved / goal.target) * 100}%"></div>
            </div>
        </div>
        <div class="goal-controls">
            <input type="number" id="add-${id}" placeholder="Сумма">
            <button onclick="addMoney('${id}')">Добавить</button>
            <button class="delete-btn" onclick="deleteGoal('${id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
        <div class="chart-container">
            <canvas id="chart-${id}"></canvas>
        </div>
    `;
    goalsList.appendChild(goalElement);
    createChart(`chart-${id}`, goal);
}

// Создание круговой диаграммы
function createChart(canvasId, goal) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Накоплено', 'Осталось'],
            datasets: [{
                data: [goal.saved, Math.max(0, goal.target - goal.saved)],
                backgroundColor: ['#4CAF50', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Добавление денег к цели
async function addMoney(goalId) {
    const input = document.getElementById(`add-${goalId}`);
    const amount = parseFloat(input.value);
    
    if (amount > 0) {
        try {
            const goalRef = db.collection('goals').doc(goalId);
            await db.runTransaction(async (transaction) => {
                const goalDoc = await transaction.get(goalRef);
                const goalData = goalDoc.data();
                const newSaved = goalData.saved + amount;
                
                transaction.update(goalRef, {
                    saved: Math.min(newSaved, goalData.target)
                });
            });
            
            input.value = '';
        } catch (error) {
            console.error("Ошибка при добавлении средств: ", error);
        }
    }
}

// Удаление цели
async function deleteGoal(goalId) {
    if (confirm('Удалить эту цель?')) {
        try {
            await db.collection('goals').doc(goalId).delete();
        } catch (error) {
            console.error("Ошибка при удалении цели: ", error);
        }
    }
}

// Режим реального времени
db.collection('goals')
    .orderBy('createdAt')
    .onSnapshot((snapshot) => {
        goalsList.innerHTML = '';
        snapshot.forEach((doc) => {
            renderGoal(doc.data(), doc.id);
        });
    }, (error) => {
        console.error("Ошибка при загрузке целей: ", error);
    });