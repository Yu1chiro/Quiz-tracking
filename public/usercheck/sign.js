import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Mendapatkan konfigurasi Firebase dari server
async function getFirebaseConfig() {
  try {
    const response = await fetch('/firebase-config'); // Pastikan endpoint ini benar
    if (!response.ok) throw new Error('Failed to load Firebase config');
    return response.json();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new Error('Gagal memuat konfigurasi Firebase');
  }
}

getFirebaseConfig().then(firebaseConfig => {
  // Inisialisasi Firebase dengan konfigurasi dari server
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app); // Inisialisasi auth

  // Form login submit handler
  document.getElementById('login-check').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();  // Menggunakan email
    const password = document.getElementById('password').value;

    try {
      // Tampilkan animasi loading
      Swal.fire({
        title: 'Sedang Memproses Login...',
        html: 'Harap tunggu sebentar...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      // Cek apakah email dan password sudah diisi
      if (!email || !password) {
        throw new Error('Email dan password tidak boleh kosong');
      }

      // Login dengan Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      // Hentikan animasi loading
      Swal.close();

      // Tampilkan pesan sukses dan arahkan ke halaman Dashboard
      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil!',
        text: 'Anda akan diarahkan ke Dashboard.',
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        // Arahkan ke halaman Dashboard
        window.location.href = '/Dashboard/admin.html';
      });

    } catch (error) {
      // Hentikan animasi loading jika gagal login
      Swal.close();

      // Tampilkan pesan error
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: error.message,
        confirmButtonText: 'Tutup'
      });
    }
  });
});
