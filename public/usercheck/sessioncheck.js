import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

async function getFirebaseConfig() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    return response.json();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new Error('Gagal memuat konfigurasi Firebase');
  }
}

// Fungsi untuk mendapatkan current path
function getCurrentPath() {
  return window.location.pathname;
}

// Fungsi untuk menangani redirect berdasarkan status auth
function handleAuthRedirect(user) {
  const currentPath = getCurrentPath();
  
  if (user) {
    // User sudah login
    sessionStorage.setItem('isLoggedIn', 'true');
    
    // Jika user di halaman login, redirect ke admin
    if (currentPath === '/usercheck/login.html') {
      window.location.href = '/Dashboard/admin.html';
      return;
    }
    
    // Jika user belum di area Dashboard, redirect ke admin
    if (!currentPath.startsWith('/Dashboard/')) {
      window.location.href = '/Dashboard/admin.html';
      return;
    }
  } else {
    // User belum login
    sessionStorage.removeItem('isLoggedIn');
    
    // Jika user bukan di halaman login, redirect ke login
    if (currentPath !== '/usercheck/login.html') {
      window.location.href = '/usercheck/login.html';
    }
  }
}

getFirebaseConfig().then(firebaseConfig => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  // Tunggu status auth berubah sebelum melakukan redirect
  onAuthStateChanged(auth, (user) => {
    handleAuthRedirect(user);
    
    // Handle tampilan konten setelah status auth confirmed
    const content = document.getElementById('content');
    const hide = document.getElementById('hide-element');
    
    if (user && content && hide) {
      const updateDisplay = () => {
        if (window.innerWidth < 768) {
          content.style.display = 'none';
          hide.style.display = 'block';
        } else {
          content.style.display = 'block';
          hide.style.display = 'block';
        }
      };
      
      updateDisplay();
      window.addEventListener('resize', updateDisplay);
    }
  });
  
  // Setup logout handler
  const logoutButton = document.getElementById('logout-session');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      signOut(auth)
        .then(() => {
          sessionStorage.removeItem('isLoggedIn');
          window.location.href = '/usercheck/login.html';
        })
        .catch((error) => {
          console.error('Logout error:', error);
        });
    });
  }
});