// ui-auth.js - полная версия с кнопкой выхода слева
window.authUI = {
    init: function() {
        console.log('Инициализация AuthUI');
        this.createAuthContainer();
        this.setupEventListeners();
        this.renderAuthState();
        
        // Подписываемся на изменения состояния аутентификации
        window.authModule.onLoginCallback = () => this.renderAuthState();
        window.authModule.onLogoutCallback = () => this.renderAuthState();
    },

    createAuthContainer: function() {
        if (!document.getElementById('auth-container')) {
            const container = document.createElement('div');
            container.id = 'auth-container';
            document.body.prepend(container);
        }
    },

    setupEventListeners: function() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-auth-action]')) {
                const action = e.target.closest('[data-auth-action]').dataset.authAction;
                this.handleAuthAction(action);
            }
        });
    },

    renderAuthState: function() {
        const container = document.getElementById('auth-container');
        if (!container) return;

        if (window.authModule.currentUser) {
            container.innerHTML = `
                <div class="user-panel">
                    <button data-auth-action="logout" class="logout-btn" title="Выйти">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>
                        </svg>
                        <span class="logout-text">Выйти</span>
                    </button>
                    <span class="user-email">${window.authModule.currentUser.email}</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="auth-form-container">
                    <div class="auth-form">
                        <h2>Вход в систему</h2>
                        <input type="email" id="authEmail" placeholder="Email" autocomplete="username">
                        <input type="password" id="authPassword" placeholder="Пароль" autocomplete="current-password">
                        <button data-auth-action="login" class="auth-btn">Войти</button>
                        <div class="auth-links">
                            <a href="#" data-auth-action="showRegister">Создать аккаунт</a>
                            <a href="#" data-auth-action="resetPassword">Забыли пароль?</a>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    handleAuthAction: async function(action) {
        try {
            const email = document.getElementById('authEmail')?.value;
            const password = document.getElementById('authPassword')?.value;

            switch(action) {
                case 'login':
                    await this.handleLogin(email, password);
                    break;
                    
                case 'logout':
                    await window.authModule.logout();
                    break;
                    
                case 'showRegister':
                    this.showRegisterForm();
                    break;
                    
                case 'register':
                    await this.handleRegister(email, password);
                    break;
                    
                case 'resetPassword':
                    await this.handlePasswordReset(email);
                    break;
                    
                case 'showLogin':
                    this.renderAuthState();
                    break;
            }
        } catch (error) {
            this.showError(error.message || 'Произошла ошибка');
            console.error('Auth action error:', error);
        }
    },

    handleLogin: async function(email, password) {
        if (!this.validateCredentials(email, password)) return;
        
        const result = await window.authModule.login(email, password);
        if (!result.success) throw new Error(result.error);
    },

    handleRegister: async function(email, password) {
        if (!this.validateCredentials(email, password)) return;
        
        const result = await window.authModule.register(email, password);
        if (!result.success) throw new Error(result.error);
        this.showMessage('Регистрация прошла успешно!');
    },

    handlePasswordReset: async function(email) {
        if (!email) {
            this.showError('Введите email для сброса пароля');
            return;
        }
        
        const result = await window.authModule.resetPassword(email);
        if (!result.success) throw new Error(result.error);
        this.showMessage('Инструкции отправлены на ваш email');
    },

    validateCredentials: function(email, password) {
        if (!email || !password) {
            this.showError('Заполните все поля');
            return false;
        }
        
        if (password.length < 6) {
            this.showError('Пароль должен быть не менее 6 символов');
            return false;
        }
        
        return true;
    },

    showRegisterForm: function() {
        const container = document.getElementById('auth-container');
        container.innerHTML = `
            <div class="auth-form-container">
                <div class="auth-form">
                    <h2>Регистрация</h2>
                    <input type="email" id="authEmail" placeholder="Email" autocomplete="username">
                    <input type="password" id="authPassword" placeholder="Пароль" autocomplete="new-password">
                    <input type="password" id="authConfirmPassword" placeholder="Повторите пароль">
                    <button data-auth-action="register" class="auth-btn">Зарегистрироваться</button>
                    <div class="auth-links">
                        <a href="#" data-auth-action="showLogin">Назад ко входу</a>
                    </div>
                </div>
            </div>
        `;
    },

    showError: function(message) {
        this.showMessage(message, 'error');
    },

    showMessage: function(message, type = 'success') {
        const container = document.getElementById('auth-container');
        if (!container) return;
        
        // Удаляем предыдущие сообщения
        const oldMessages = container.querySelectorAll('.message');
        oldMessages.forEach(msg => msg.remove());
        
        const msgEl = document.createElement('div');
        msgEl.className = `message ${type}`;
        msgEl.textContent = message;
        
        const formContainer = container.querySelector('.auth-form') || container;
        formContainer.appendChild(msgEl);
        
        setTimeout(() => msgEl.remove(), 5000);
    }
};

// Инициализация после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    if (window.authModule) {
        window.authUI.init();
    } else {
        console.error('AuthModule не найден!');
    }
});