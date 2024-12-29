// Import fungsi sendPasswordResetEmail dari Firebase Auth
import { getAuth, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Tambahkan event listener untuk tombol change-password
document.getElementById('change-password').addEventListener('click', async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    try {
      // Kirim email reset password ke email user yang sedang login
      await sendPasswordResetEmail(auth, user.email);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Email reset password berhasil dikirim silahkan cek email anda pada inbox' + user.email,
        timer: 3000,
        showConfirmButton: true
      });
    } catch (error) {
      console.error('Error mengirim email reset password:', error);
      
      // Tampilkan pesan error yang sesuai
      switch (error.code) {
        case 'auth/invalid-email':
          alert('Email tidak valid');
          break;
        case 'auth/user-not-found':
          alert('User tidak ditemukan');
          break;
        default:
          alert('Terjadi kesalahan saat mengirim email reset password');
      }
    }
  } else {
    alert('Tidak ada user yang sedang login');
  }
});