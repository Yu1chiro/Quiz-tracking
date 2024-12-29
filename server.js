import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const __dirname = path.resolve();

// Endpoint untuk memberikan konfigurasi Firebase secara langsung
app.get('/firebase-config', (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  res.json(firebaseConfig); // Mengirim konfigurasi sebagai JSON
});

// Middleware untuk melayani file statis (letakkan setelah API routes)
app.use(express.static(path.join(__dirname, 'public')));

// Jalankan server
app.listen(3000, () => console.log('Server running at http://localhost:3000'));
