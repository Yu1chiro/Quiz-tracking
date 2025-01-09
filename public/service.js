import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getDatabase, ref, set, push, onValue, get, update, onDisconnect, remove } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

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
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    // Global delete function
    window.deleteParticipant = async function(sessionId) {
        try {
            Swal.fire({
                title: 'Apakah Anda yakin?',
                text: "Data yang dihapus tidak dapat dikembalikan!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Ya, hapus!',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const participantRef = ref(database, `data-mahasiswa/${sessionId}`);
                    await remove(participantRef);
                    
                    Swal.fire(
                        'Terhapus!',
                        'Data peserta telah dihapus.',
                        'success'
                    );
                }
            });
        } catch (error) {
            Swal.fire(
                'Error!',
                'Gagal menghapus data peserta.',
                'error'
            );
        }
    };

    async function validateQuizCode(code) {
        const quizRef = ref(database, 'quiz');
        const snapshot = await get(quizRef);
        
        if (!snapshot.exists()) {
            throw new Error('Database kuis tidak tersedia');
        }

        let validQuiz = null;
        snapshot.forEach((quizSnapshot) => {
            const data = quizSnapshot.val();
            if (data.code === code) {
                validQuiz = data;
            }
        });

        return validQuiz;
    }

    async function registerParticipant(participantData, quizData) {
        const mahasiswaRef = ref(database, 'data-mahasiswa');
        const snapshot = await get(mahasiswaRef);
        let existingParticipant = null;
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data.nim === participantData.nim && data.kodeKuis === quizData.code) {
                    existingParticipant = {
                        ...data,
                        sessionId: childSnapshot.key
                    };
                }
            });
        }

        if (existingParticipant) {
            const participantRef = ref(database, `data-mahasiswa/${existingParticipant.sessionId}`);
            await update(participantRef, {
                status: "sedang mengerjakan",
                lastActive: Date.now(),
                isOnline: true
            });
            return { 
                sessionId: existingParticipant.sessionId, 
                formUrl: quizData.link 
            };
        }

        const newParticipantRef = push(mahasiswaRef);
        const registrationData = {
            nama: participantData.nama,
            nim: participantData.nim,
            kodeKuis: quizData.code,
            namaKuis: quizData.name,
            status: "sedang mengerjakan",
            timestamp: Date.now(),
            sessionId: newParticipantRef.key,
            lastActive: Date.now(),
            isOnline: true
        };

        await set(newParticipantRef, registrationData);
        return { sessionId: newParticipantRef.key, formUrl: quizData.link };
    }

    const signQuizForm = document.getElementById('sign-quiz');
    if (signQuizForm) {
        signQuizForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nama = document.getElementById('nama-lengkap').value.trim();
            const nim = document.getElementById('nim-mahasiswa').value.trim();
            const kodeKuis = document.getElementById('kode-kuis').value.trim();

            if (!nama || !nim || !kodeKuis) {
                Swal.fire({
                    icon: 'error',
                    title: 'Form Tidak Lengkap',
                    text: 'Mohon lengkapi semua field yang diperlukan',
                    confirmButtonText: 'OK'
                });
                return;
            }

            try {
                Swal.fire({
                    title: 'Memuat Quiz',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => Swal.showLoading()
                });

                const quizData = await validateQuizCode(kodeKuis);
                if (!quizData) {
                    throw new Error('Kode telah expired/tidak bisa digunakan. Silahkan minta kode quiz yang baru pada pengajar anda ');
                }

                const registration = await registerParticipant(
                    { nama, nim, kodeKuis },
                    quizData
                );

                sessionStorage.setItem('quizSession', JSON.stringify({
                    nama,
                    nim,
                    kodeKuis,
                    ...registration
                }));

                window.location.href = '/form.html';

            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Access Denied !',
                    text: error.message,
                    confirmButtonText: 'OK'
                });
            }
        });
    }

    const tableBody = document.getElementById('mahasiswa-table-body');
    if (tableBody) {
        const mahasiswaRef = ref(database, 'data-mahasiswa');
        onValue(mahasiswaRef, (snapshot) => {
            if (!snapshot.exists()) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Tidak ada peserta yang aktif</td></tr>';
                return;
            }

            const participantsMap = new Map();
            
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                const key = `${data.nim}-${data.kodeKuis}`;
                
                if (!participantsMap.has(key) || 
                    data.lastActive > participantsMap.get(key).lastActive) {
                    participantsMap.set(key, {
                        ...data,
                        key: childSnapshot.key
                    });
                }
            });

            tableBody.innerHTML = '';
            participantsMap.forEach((data) => {
                const row = document.createElement('tr');
                row.id = `participant-${data.key}`;
                row.innerHTML = `
                    <td class="text-center py-3 px-4">${data.nama}</td>
                    <td class="text-center py-3 px-4">${data.nim}</td>
                    <td class="text-center py-3 px-4 text-green-500 status-cell dot"> ${data.status}</td>
                    <td class="text-center py-3 px-4">
                        <button 
                            onclick="deleteParticipant('${data.key}')"
                            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Hapus
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
    }

    if (window.location.pathname === '/form.html') {
        let redirectInProgress = false;

        function enforceSecurityMeasures() {
            // Prevent text selection
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
            document.body.style.msUserSelect = 'none';
            document.body.style.mozUserSelect = 'none';

            // Disable right-click
            document.addEventListener('contextmenu', (e) => e.preventDefault());

            // Prevent copying
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
                    e.preventDefault();
                }
            });

            // Disable developer tools
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'u' || 
                    (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i' || 
                    e.key === 'F12') {
                    e.preventDefault();
                }
            });
               // Menambahkan deteksi orientasi layar
    if (window.screen.orientation) {
        window.screen.orientation.addEventListener('change', function() {
            if (window.screen.orientation.angle !== 0) {
                redirectToHome("Split screen tidak diizinkan. Harap gunakan orientasi portrait");
                try {
                    window.screen.orientation.lock('portrait');
                } catch (error) {
                    console.log("Orientasi tidak dapat dikunci:", error);
                }
            }
        });
    }

    // Menambahkan deteksi rasio layar untuk split screen
    const checkSplitScreen = () => {
        if (window.innerHeight / window.innerWidth < 1.2) {
            redirectToHome("Access Denied ! Anda terdeteksi melakukan kecurangan");
        }
    };

    window.addEventListener("resize", checkSplitScreen);
    checkSplitScreen(); // Cek saat pertama kali dimuat
            // Prevent screenshots on mobile
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // Disable screenshot capabilities
                document.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) e.preventDefault();
                });
            }
        }

        async function redirectToHome(message) {
            if (!redirectInProgress) {
                redirectInProgress = true;
                await Swal.fire({
                    icon: 'warning',
                    title: 'Peringatan !',
                    text: message || 'Anda terdeteksi melakukan aktivitas yang tidak diizinkan',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                window.location.href = '/';
            }
        }

        const session = JSON.parse(sessionStorage.getItem('quizSession'));
        
        if (!session) {
            redirectToHome();
            return;
        }

        const iframeContainer = document.getElementById('quiz-iframe-container');
        if (iframeContainer && session.formUrl) {
            const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            const iframeHeight = Math.min(viewportHeight * 0.9, 1200);
            
            iframeContainer.innerHTML = `
                <iframe 
                    src="${session.formUrl}" 
                    width="100%" 
                    height="${iframeHeight}px" 
                    frameborder="0"
                    style="margin: 0 auto; display: block; pointer-events: auto;"
                    class="quiz-iframe"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                ></iframe>
            `;

            // Add security styles
            const style = document.createElement('style');
            style.textContent = `
                #quiz-iframe-container {
                    position: relative;
                    padding: 20px;
                    background: #fff;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                .quiz-iframe {
                    background: #fff;
                    border-radius: 8px;
                    pointer-events: auto !important;
                }
                @media (max-width: 768px) {
                    #quiz-iframe-container {
                        padding: 10px;
                    }
                    .quiz-iframe {
                        height: calc(100vh - 80px) !important;
                    }
                }
                * {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }
            `;
            document.head.appendChild(style);
        }

        if (session.sessionId) {
            const userStatusRef = ref(database, `data-mahasiswa/${session.sessionId}`);
            
            enforceSecurityMeasures();

            const connectedRef = ref(database, '.info/connected');
            onValue(connectedRef, (snap) => {
                if (snap.val() === true) {
                    update(userStatusRef, {
                        status: "sedang mengerjakan",
                        isOnline: true,
                        lastActive: Date.now()
                    });

                    onDisconnect(userStatusRef).update({
                        status: "User dikeluarkan oleh sistem",
                        isOnline: false,
                        lastActive: Date.now()
                    });
                }
            });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    update(userStatusRef, {
                        status: "User terdeteksi membuka tab/browsing",
                        lastActive: Date.now()
                    });
                    redirectToHome("Anda terdeteksi membuka tab lain, mohon menunggu 3 detik");
                }
            });

            const statusInterval = setInterval(() => {
                if (!document.hidden) {
                    update(userStatusRef, {
                        lastActive: Date.now()
                    });
                }
            }, 30000);

            window.addEventListener('beforeunload', () => {
                clearInterval(statusInterval);
                update(userStatusRef, {
                    status: "User dikeluarkan oleh sistem",
                    isOnline: false,
                    lastActive: Date.now()
                });
                sessionStorage.removeItem('quizSession');
            });

            // Additional security for mobile devices
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                document.addEventListener('touchstart', (e) => {
                    if (e.touches.length > 1) {
                        e.preventDefault();
                        redirectToHome("Anda terdeteksi melakukan gesture yang tidak diizinkan, mohon menunggu 3 detik");
                    }
                }, false);
            }

            // Check user status when returning to the page
            const checkUserStatus = async () => {
                const snapshot = await get(userStatusRef);
                if (snapshot.exists()) {
                    const status = snapshot.val().status;
                    if (status === "User dikeluarkan oleh sistem") {
                        redirectToHome("Anda terdeteksi menutup browser, mohon menunggu 3 detik");
                    } else if (status === "user membuka tab lain") {
                        redirectToHome("Anda terdeteksi membuka tab lain, mohon menunggu 3 detik");
                    }
                }
            };

            onValue(userStatusRef, (snapshot) => {
                if (!snapshot.exists()) {
                    redirectToHome('Data sesi tidak ditemukan. Silakan daftar ulang.');
                    return;
                }

                const userData = snapshot.val();

                // Check if the user is marked as offline or unauthorized
                if (!userData.isOnline || userData.status === 'dikeluarkan') {
                    redirectToHome('Sesi Anda telah diakhiri atau Anda tidak diizinkan melanjutkan.');
                }
            });

            // Update the user's last activity timestamp periodically
            const updateActivity = () => {
                update(userStatusRef, {
                    lastActive: Date.now()
                });
            };

            // Trigger the activity update every minute
            const activityInterval = setInterval(updateActivity, 60000);

            // Mark user as offline on disconnect
            onDisconnect(userStatusRef).update({
                isOnline: false,
                lastActive: Date.now()
            });

            // Clean up listeners on window unload
            window.addEventListener('beforeunload', () => {
                clearInterval(activityInterval);
                update(userStatusRef, { isOnline: false });
            });
        }
    }
});
