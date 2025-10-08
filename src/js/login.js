// Menunggu hingga seluruh konten halaman HTML dimuat sebelum menjalankan skrip
document.addEventListener('DOMContentLoaded', function () {

    // 1. Memilih elemen-elemen dari HTML yang kita butuhkan
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');

    // 2. Menambahkan event listener ke form saat disubmit
    loginForm.addEventListener('submit', function (event) {
        // Mencegah form mengirim data secara default (yang akan me-refresh halaman)
        event.preventDefault();

        // Mengambil nilai dari input username dan password
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validasi sederhana: pastikan username dan password tidak kosong
        if (username === '' || password === '') {
            alert('Username dan Password tidak boleh kosong!');
            return; // Menghentikan eksekusi lebih lanjut
        }

        // Memanggil fungsi untuk proses autentikasi
        authenticateUser(username, password);
    });

    // 3. Fungsi utama untuk autentikasi pengguna
    async function authenticateUser(username, password) {
        // Menampilkan loading state saat proses login berlangsung 
        loginButton.disabled = true;
        loginButton.textContent = 'Sabar....';

        try {
            // Mengambil data user dari API menggunakan fetch [cite: 20]
            const response = await fetch('https://dummyjson.com/users');
            
            // Jika respons dari jaringan tidak ok (misal: error 404 atau 500)
            if (!response.ok) {
                throw new Error('Gagal mengambil data pengguna. Coba lagi nanti.');
            }

            const data = await response.json();
            
            // Mencari user di dalam array 'users' yang cocok dengan username yang diinput
            // Sesuai ketentuan: Username harus sesuai dengan data dummy [cite: 29]
            const user = data.users.find(u => u.username === username);

            // Cek apakah user ditemukan DAN passwordnya cocok (di dunia nyata, password akan di-hash)
            // Untuk soal ini, kita asumsikan password dari API adalah password yang benar.
            if (user && user.password === password) {
                // Menampilkan success message saat login berhasil [cite: 32]
                alert(`Login berhasil! Selamat datang, ${user.firstName}.`);

                // Pastikan variabel firstName dari user tersimpan di localStorage 
                localStorage.setItem('firstName', user.firstName);

                // Setelah login sukses, user otomatis diarahkan ke page recipes 
                window.location.href = 'recipePage.html';

            } else {
                // Error handling ketika username/password salah 
                alert('Username atau Password salah!');
            }

        } catch (error) {
            // Error handling ketika koneksi API bermasalah 
            console.error('Terjadi kesalahan:', error);
            alert('Gagal terhubung ke server. Periksa koneksi internet Anda.');

        } finally {
            // Bagian ini akan selalu dijalankan, baik login berhasil maupun gagal
            // Mengembalikan tombol ke keadaan semula
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    }
});