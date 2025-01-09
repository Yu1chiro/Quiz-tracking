// Menambahkan interaksi manusia untuk mencegah salin teks dan klik kanan
document.querySelector('.iframe-overlay').addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Menonaktifkan klik kanan
});

document.querySelector('.iframe-overlay').addEventListener('touchstart', function(e) {
    e.preventDefault(); // Menonaktifkan pemilihan teks pada sentuhan pertama
});

// Menonaktifkan kombinasi tombol untuk menyalin teks (Ctrl+C atau Command+C)
document.querySelector('.iframe-overlay').addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault(); // Menonaktifkan Ctrl+C atau Command+C
    }
});

// Mencegah pemilihan teks saat menekan dan menyeret pada perangkat mobile
document.querySelector('.iframe-container').addEventListener('touchmove', function(e) {
    e.preventDefault(); // Mencegah pemilihan teks pada perangkat mobile
});