import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, set, push, onValue, remove, get, update } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

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

getFirebaseConfig().then(firebaseConfig => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const database = getDatabase(app);

    // Event listener for adding new quiz
    document.getElementById('add-quiz').addEventListener('click', () => {
        Swal.fire({
            title: 'Tambah Quiz Baru',
            html: `
                <input type="text" id="quiz-name" class="swal2-input" placeholder="Nama Quiz" required>
                <input type="url" id="quiz-link" class="swal2-input" placeholder="Link Quiz" required>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const name = document.getElementById('quiz-name').value.trim();
                const link = document.getElementById('quiz-link').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('Nama quiz harus diisi');
                    return false;
                }
                
                if (!link) {
                    Swal.showValidationMessage('Link quiz harus diisi');
                    return false;
                }

                try {
                    new URL(link);
                } catch (e) {
                    Swal.showValidationMessage('Format link tidak valid');
                    return false;
                }

                const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                return { name, link, code };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Menyimpan Data...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const quizRef = ref(database, 'quiz');
                const newQuizRef = push(quizRef);
                
                const dataToSave = {
                    name: result.value.name,
                    link: result.value.link,
                    code: result.value.code,
                    timestamp: Date.now()
                };

                set(newQuizRef, dataToSave)
                    .then(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Sukses',
                            text: 'Add quiz success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    })
                    .catch(error => {
                        Swal.fire('Error', 'Gagal menyimpan data: ' + error.message, 'error');
                    });
            }
        });
    });

    // Function to load quiz data
    function loadQuizData() {
        const quizRef = ref(database, 'quiz');
        const tbody = document.getElementById('quiz-table-body');
        
        if (!tbody) {
            console.error('Element tbody tidak ditemukan');
            return;
        }

        onValue(quizRef, (snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="4" class="text-center py-4 text-gray-500">
                        Belum ada data quiz tersedia
                    </td>
                `;
                tbody.appendChild(tr);
                return;
            }

            snapshot.forEach((childSnapshot) => {
                const quiz = childSnapshot.val();
                const quizId = childSnapshot.key;
                
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-100";
                
                const sanitizedLink = quiz.link ? encodeURI(quiz.link) : '#';
                
                tr.innerHTML = `
                    <td class="text-left py-3 px-4">${escapeHtml(quiz.name || '-')}</td>
                    <td class="text-left py-3 px-4">
                        <a href="${sanitizedLink}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="text-blue-600 hover:text-blue-800 underline break-all">
                            ${escapeHtml(quiz.link || '-')}
                        </a>
                    </td>
                    <td class="text-left py-3 px-4">${escapeHtml(quiz.code || '-')}</td>
                    <td class="text-left py-3 px-4">
                        <button onclick="window.viewQuiz('${quizId}')" 
                                class="bg-blue-500 mb-2 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2">
                            Detail
                        </button>
                        <button onclick="window.editQuiz('${quizId}')" 
                                class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded mr-2">
                            Edit
                        </button>
                        <button onclick="window.deleteQuiz('${quizId}')" 
                                class="bg-red-500 mb-2 hover:bg-red-600 text-white px-2 py-1 rounded">
                            Delete
                        </button>
                        <button onclick="window.refreshQuiz('${quizId}')" 
                                class="bg-green-500 mb-2 hover:bg-green-600 text-white px-2 py-1 rounded">
                            Refresh Code
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }, {
            onlyOnce: false
        });
    }

    // Global functions for CTA buttons
   // Fungsi untuk menampilkan detail quiz
window.viewQuiz = (quizId) => {
    if (!quizId) {
        Swal.fire('Error', 'ID Quiz tidak valid', 'error');
        return;
    }

    const quizRef = ref(database, `quiz/${quizId}`);
    
    get(quizRef).then((snapshot) => {
        if (!snapshot.exists()) {
            Swal.fire('Error', 'Data quiz tidak ditemukan', 'error');
            return;
        }

        const quiz = snapshot.val();
        Swal.fire({
            title: 'Detail Quiz',
            html: `
                <div class="text-left">
                    <div class="mb-3">
                        <p class="font-bold">Nama Quiz:</p>
                        <p class="ml-2">${escapeHtml(quiz.name || '-')}</p>
                    </div>
                    <div class="mb-3">
                        <p class="font-bold">Link Quiz:</p>
                        <p class="ml-2">
                            <a href="${encodeURI(quiz.link)}" target="_blank" 
                               class="text-blue-600 hover:text-blue-800 underline break-all">
                                ${escapeHtml(quiz.link || '-')}
                            </a>
                        </p>
                    </div>
                    <div class="mb-3">
                        <p class="font-bold">Kode Quiz:</p>
                        <p class="ml-2">${escapeHtml(quiz.code || '-')}</p>
                    </div>
                    <div class="mb-3">
                        <p class="font-bold">Dibuat pada:</p>
                        <p class="ml-2">${new Date(quiz.timestamp).toLocaleString('id-ID')}</p>
                    </div>
                </div>
            `,
            confirmButtonText: 'Tutup',
            customClass: {
                htmlContainer: 'swal2-html-container custom-html'
            }
        });
    }).catch((error) => {
        Swal.fire('Error', 'Gagal memuat data: ' + error.message, 'error');
    });
};

// Fungsi untuk mengedit quiz
window.editQuiz = (quizId) => {
    if (!quizId) {
        Swal.fire('Error', 'ID Quiz tidak valid', 'error');
        return;
    }

    const quizRef = ref(database, `quiz/${quizId}`);
    
    get(quizRef).then((snapshot) => {
        if (!snapshot.exists()) {
            Swal.fire('Error', 'Data quiz tidak ditemukan', 'error');
            return;
        }

        const quiz = snapshot.val();
        Swal.fire({
            title: 'Edit Quiz',
            html: `
                <div class="space-y-4">
                    <div class="text-left">
                        <label for="edit-quiz-name" class="block text-sm font-medium text-gray-700 mb-1">
                            Nama Quiz
                        </label>
                        <input type="text" id="edit-quiz-name" class="swal2-input" 
                               value="${escapeHtml(quiz.name)}" placeholder="Masukkan nama quiz">
                    </div>
                    
                    <div class="text-left">
                        <label for="edit-quiz-link" class="block text-sm font-medium text-gray-700 mb-1">
                            Link Quiz
                        </label>
                        <input type="url" id="edit-quiz-link" class="swal2-input" 
                               value="${escapeHtml(quiz.link)}" placeholder="Masukkan link quiz">
                    </div>
                    
                    <div class="text-left">
                        <label for="edit-quiz-code" class="block text-sm font-medium text-gray-700 mb-1">
                            Kode Quiz
                        </label>
                        <input type="text" id="edit-quiz-code" class="swal2-input" 
                               value="${escapeHtml(quiz.code)}" readonly>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            focusConfirm: false,
            preConfirm: () => {
                const name = document.getElementById('edit-quiz-name').value.trim();
                const link = document.getElementById('edit-quiz-link').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('Nama quiz harus diisi');
                    return false;
                }
                
                if (!link) {
                    Swal.showValidationMessage('Link quiz harus diisi');
                    return false;
                }

                try {
                    new URL(link);
                } catch (e) {
                    Swal.showValidationMessage('Format link tidak valid');
                    return false;
                }

                return {
                    name,
                    link,
                    code: quiz.code,
                    timestamp: quiz.timestamp,
                    updatedAt: Date.now()
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Menyimpan Perubahan...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                update(quizRef, result.value)
                    .then(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Sukses',
                            text: 'Data quiz berhasil diperbarui',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    })
                    .catch(error => {
                        Swal.fire('Error', 'Gagal memperbarui data: ' + error.message, 'error');
                    });
            }
        });
    }).catch((error) => {
        Swal.fire('Error', 'Gagal memuat data: ' + error.message, 'error');
    });
};
window.deleteQuiz = (quizId) => {
    Swal.fire({
      title: 'Hapus Quiz?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.showLoading();
        const quizRef = ref(database, `quiz/${quizId}`);
        remove(quizRef).then(() => {
          Swal.fire('Sukses', 'Quiz berhasil dihapus', 'success');
        }).catch(error => {
          Swal.fire('Error', 'Gagal menghapus data: ' + error.message, 'error');
        });
      }
    });
  };
window.refreshQuiz = (quizId) => {
    // Generate a new random code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Update the Firebase database with the new code for the quiz
    const quizRef = ref(database, `quiz/${quizId}`);
    update(quizRef, { code: newCode })
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Sukses',
                text: 'success refresh',
                timer: 2000,
                showConfirmButton: false
            });
        })
        .catch((error) => {
            console.error(`Error updating quiz ID ${quizId}:`, error);
            alert("Terjadi kesalahan dalam memperbarui kode!");
        });
};

    // Helper function untuk sanitasi HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Load data saat halaman dimuat
    loadQuizData();
});