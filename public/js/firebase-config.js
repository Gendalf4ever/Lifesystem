// Проверка загрузки Firebase SDK
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK не загружен!');
  throw new Error('Firebase SDK не загружен');
}

try {
  // Инициализация Firebase
  let app;
  if (!firebase.apps.length) {
      app = firebase.initializeApp(CONFIG.FIREBASE);
  } else {
      app = firebase.app();
  }

  // Экспорт сервисов
  window.auth = firebase.auth();
  window.db = firebase.firestore();

  // Мониторинг аутентификации
  window.auth.onAuthStateChanged(user => {
      console.log('Auth state changed:', user ? user.email : 'No user');
  });

} catch (error) {
  console.error('Firebase init error:', error);
  throw error;
}