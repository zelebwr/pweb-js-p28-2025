document.addEventListener('DOMContentLoaded', function () {

    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const notification = document.getElementById('notification');
    const registerLink = document.querySelector('.register-link a');

    registerLink.addEventListener('click', function(event) {
        event.preventDefault(); 
        showNotification('Coming Soon!', 'info');
        alert('Coming Soon! Fitur registrasi belum tersedia.');
    });

    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type}`;
    }

    function hideNotification() {
        notification.textContent = '';
        notification.className = 'notification';
    }
    
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        hideNotification();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username === '' && password === '') {
            showNotification('Username dan Password tidak boleh kosong!', 'error');
            return;
        } else if (username === '') {
            showNotification('Username tidak boleh kosong!', 'error');
            return;
        } else if (password === '') {
            showNotification('Password tidak boleh kosong!', 'error');
            return;
        }

        authenticateUser(username, password);
    });

    async function authenticateUser(username, password) {
        loginButton.disabled = true;
        loginButton.textContent = 'Sabar....';

        try {
            const response = await fetch('https://dummyjson.com/users');
            
            if (!response.ok) {
                throw new Error('Server tidak merespons. Coba lagi nanti.');
            }

            const data = await response.json();
            const user = data.users.find(u => u.username === username);

            if (user && user.password === password) {
                showNotification(`Login berhasil! Selamat datang, ${user.firstName}.`, 'success');
                localStorage.setItem('firstName', user.firstName);
                setTimeout(() => {
                    window.location.href = 'recipePage.html';
                }, 1500);

            } else {
                showNotification('Username atau Password salah!', 'error');
            }

        } catch (error) {
            console.error('Terjadi kesalahan:', error);
            showNotification('Gagal terhubung ke server. Periksa koneksi internet Anda.', 'error');

        } finally {
            const isLoginSuccessful = notification.classList.contains('success');
            if (!isLoginSuccessful) {
                loginButton.disabled = false;
                loginButton.textContent = 'Login';
            }
        }
    }
});
// Kurung kurawal '}' yang berlebih di sini telah dihapus