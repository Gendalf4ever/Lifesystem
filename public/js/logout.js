async function logout() {
    try {
        await auth.signOut();
        sessionStorage.removeItem('userLoggedIn');
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Ошибка выхода:", error);
    }
}