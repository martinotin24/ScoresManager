const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD ---
const JWT_SECRET = process.env.JWT_SECRET || "martin_violin_secret_2026";

// --- 1. MIDDLEWARES ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// CONFIGURACIÓN DE CARPETA UPLOADS
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// --- 2. CONFIGURACIÓN DE MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 500 * 1024 * 1024 
    } 
});

const uploadFields = upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]);

// --- 3. CONEXIÓN A BASE DE DATOS (DigitalOcean) ---
// OPTIMIZADO: Parámetros de Pool para evitar desconexiones cada 6 horas
const db = mysql.createPool({
    host: 'db-mysql-nyc1-81948-do-user-7368604-0.m.db.ondigitalocean.com',
    user: 'gig',
    password: process.env.DB_PASSWORD,
    database: 'gig',
    port: 25060,
    ssl: {
        ca: fs.readFileSync('./ca-certificate.crt'),
        rejectUnauthorized: true 
    },
    waitForConnections: true,
    connectionLimit: 15,
    maxIdle: 10, 
    idleTimeout: 60000, 
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

// Verificación y manejo de errores globales del Pool
db.on('error', (err) => {
    console.error('❌ Database Pool Error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('🔄 Attempting to reconnect...');
    }
});

// --- 4. ENDPOINTS DE AUTENTICACIÓN ---

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Missing data" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err) => {
            if (err) return res.status(500).json({ error: "Register failed", detail: err });
            res.json({ message: "Usuario creado exitosamente" });
        });
    } catch (error) {
        res.status(500).json({ message: "Error al procesar registro" });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error during login", detail: err });
        if (!results || results.length === 0) return res.status(401).json({ message: "Usuario no encontrado" });

        const user = results[0];
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign(
                    { id: user.id, username: user.username }, 
                    JWT_SECRET, 
                    { expiresIn: '24h' }
                );
                res.json({ token, message: "Login exitoso" });
            } else {
                res.status(401).json({ message: "Contraseña incorrecta" });
            }
        } catch (bcryptErr) {
            res.status(500).json({ message: "Error en validación de seguridad" });
        }
    });
});

// --- 5. ENDPOINTS DE EVENTOS ---
app.get('/api/events', (req, res) => {
    db.query('SELECT * FROM events ORDER BY event_date ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results || []);
    });
});

app.post('/api/events', (req, res) => {
    const { name, location, event_date } = req.body;
    const sql = 'INSERT INTO events (name, location, event_date) VALUES (?, ?, ?)';
    db.query(sql, [name, location, event_date], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, ...req.body });
    });
});

app.put('/api/events/:id', (req, res) => {
    const { name, location, event_date } = req.body;
    const sql = 'UPDATE events SET name = ?, location = ?, event_date = ? WHERE id = ?';
    db.query(sql, [name, location, event_date, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Event updated successfully" });
    });
});

app.delete('/api/events/:id', (req, res) => {
    db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Evento eliminado" });
    });
});

// --- 6. ENDPOINTS DE REPERTORIO ---
app.get('/api/songs', (req, res) => {
    db.query('SELECT * FROM songs ORDER BY title ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results || []);
    });
});

app.post('/api/songs', uploadFields, (req, res) => {
    const { title, composer, duration_seconds } = req.body;
    const pdf = req.files['pdf'] ? req.files['pdf'][0].filename : null;
    const audio = req.files['audio'] ? req.files['audio'][0].filename : null;
    const video = req.files['video'] ? req.files['video'][0].filename : null;

    const sql = `INSERT INTO songs 
        (title, composer, duration_seconds, pdf_filename, audio_filename, video_filename) 
        VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sql, [title, composer, duration_seconds || 0, pdf, audio, video], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Saved successfully', id: result.insertId });
    });
});

app.delete('/api/songs/:id', (req, res) => {
    const songId = req.params.id;
    db.query('SELECT pdf_filename, audio_filename, video_filename FROM songs WHERE id = ?', [songId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results && results.length > 0) {
            const song = results[0];
            const filesToDelete = [song.pdf_filename, song.audio_filename, song.video_filename];
            filesToDelete.forEach(filename => {
                if (filename) {
                    const filePath = path.join(uploadDir, filename);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
            });
        }
        db.query('DELETE FROM songs WHERE id = ?', [songId], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Canción y archivos eliminados" });
        });
    });
});

// --- 7. ENDPOINTS DE SETLIST ---
app.get('/api/events/:id/songs', (req, res) => {
    const sql = `SELECT s.*, es.order_index FROM songs s
                 JOIN event_songs es ON s.id = es.song_id
                 WHERE es.event_id = ? ORDER BY es.order_index ASC`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results || []);
    });
});

app.post('/api/event-songs', (req, res) => {
    const { event_id, song_id, order_index } = req.body;
    const sql = 'INSERT INTO event_songs (event_id, song_id, order_index) VALUES (?, ?, ?)';
    db.query(sql, [event_id, song_id, order_index], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, id: result.insertId });
    });
});

app.delete('/api/events/:eventId/songs/:songId', (req, res) => {
    const sql = 'DELETE FROM event_songs WHERE event_id = ? AND song_id = ?';
    db.query(sql, [req.params.eventId, req.params.songId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Eliminado del setlist" });
    });
});

// --- 8. INTEGRACIÓN CON FRONTEND (CATCH-ALL) ---
// 1. Dile a Node que exponga la carpeta donde Vite compiló tu frontend
app.use(express.static(path.join(__dirname, 'client/dist')));

// 2. Catch-All universal: Cualquier petición no manejada, envíala a React
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

// --- 9. LANZAMIENTO ---
const PORT = 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend Live en puerto ${PORT} con Pool y Resiliencia`);
});

server.keepAliveTimeout = 61000;
server.headersTimeout = 65000;
server.timeout = 300000;