// Проверяем доступность Firebase Auth перед созданием модуля
if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
    console.error('Firebase Auth не доступен');
    
    // Создаем заглушку для модуля аутентификации
    window.authModule = {
        currentUser: null,
        init: function() {
            console.warn('AuthModule работает в offline-режиме');
        },
        login: async function() {
            return { success: false, error: 'Сервис аутентификации недоступен' };
        },
        register: async function() {
            return { success: false, error: 'Сервис аутентификации недоступен' };
        },
        logout: async function() {
            return { success: false, error: 'Сервис аутентификации недоступен' };
        },
        resetPassword: async function() {
            return { success: false, error: 'Сервис аутентификации недоступен' };
        },
        getFriendlyError: function() {
            return 'Сервис аутентификации недоступен';
        }
    };
} else {
    // Создаем глобальный объект для управления аутентификацией
    window.authModule = {
        currentUser: null,
        
        init: function() {
            if (typeof auth === 'undefined') {
                console.error('Firebase Auth не инициализирован');
                return;
            }
            
            auth.onAuthStateChanged(user => {
                this.currentUser = user;
                
                if (user) {
                    console.log("Пользователь вошел:", user.email);
                    this.executeCallback('onLoginCallback');
                } else {
                    console.log("Пользователь вышел");
                    this.executeCallback('onLogoutCallback');
                }
            });
        },
        
        executeCallback: function(callbackName) {
            if (typeof this[callbackName] === 'function') {
                try {
                    this[callbackName]();
                } catch (error) {
                    console.error(`Ошибка в callback ${callbackName}:`, error);
                }
            }
        },
        
        login: async function(email, password) {
            if (!auth) return this.authNotAvailableResponse();
            
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                return { success: true, user: userCredential.user };
            } catch (error) {
                console.error("Ошибка входа:", error);
                return { 
                    success: false, 
                    error: this.getFriendlyError(error.code) 
                };
            }
        },
        
        register: async function(email, password) {
            if (!auth) return this.authNotAvailableResponse();
            
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                return { success: true, user: userCredential.user };
            } catch (error) {
                console.error("Ошибка регистрации:", error);
                return { 
                    success: false, 
                    error: this.getFriendlyError(error.code) 
                };
            }
        },
        
        logout: async function() {
            if (!auth) return this.authNotAvailableResponse();
            
            try {
                await auth.signOut();
                return { success: true };
            } catch (error) {
                console.error("Ошибка выхода:", error);
                return { success: false, error: error.message };
            }
        },
        
        resetPassword: async function(email) {
            if (!auth) return this.authNotAvailableResponse();
            
            try {
                await auth.sendPasswordResetEmail(email);
                return { success: true };
            } catch (error) {
                console.error("Ошибка сброса пароля:", error);
                return { 
                    success: false, 
                    error: this.getFriendlyError(error.code) 
                };
            }
        },
        
        getFriendlyError: function(errorCode) {
            const errors = {
                'auth/invalid-email': 'Некорректный email',
                'auth/user-disabled': 'Аккаунт отключен',
                'auth/user-not-found': 'Пользователь не найден',
                'auth/wrong-password': 'Неверный пароль',
                'auth/email-already-in-use': 'Email уже используется',
                'auth/weak-password': 'Пароль слишком простой',
                'auth/operation-not-allowed': 'Операция не разрешена',
                'auth/too-many-requests': 'Слишком много запросов. Попробуйте позже'
            };
            return errors[errorCode] || 'Произошла неизвестная ошибка';
        },
        
        authNotAvailableResponse: function() {
            console.error('Попытка использовать auth когда он недоступен');
            return { success: false, error: 'Сервис аутентификации недоступен' };
        },
        
        onLoginCallback: null,
        onLogoutCallback: null
    };

    // Инициализируем модуль после определения
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof auth !== 'undefined') {
            window.authModule.init();
        } else {
            console.error('Auth не доступен для инициализации');
        }
    });
}