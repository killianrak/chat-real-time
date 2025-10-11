// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import des modules
const authRoutes = require('./routes/auth');
const chatHandler = require('./sockets/chat');
const db = require('./database/db');
const messagesRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware de base
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialiser la base de données
console.log('🔄 Initialisation de la base de données...');
db.initialize();

// Routes d'authentification
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: {
      users: db.getUsersCount(),
      messages: db.getMessagesCount(),
    },
  });
});

// Route des statistiques
app.get('/api/stats', (req, res) => {
  const stats = chatHandler.getStats();
  res.json(stats);
});

// Route pour obtenir les messages récents
app.get('/api/messages/recent', (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 50, 100);
    const messages = db.getRecentMessages(count);

    res.json({
      messages: messages,
      total: db.getMessagesCount(),
    });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      error: 'Erreur serveur',
    });
  }
});

// Initialiser la gestion du chat
chatHandler.initializeChat(io);

// Gestion propre de la fermeture
process.on('SIGINT', () => {
  console.log('\n📴 Arrêt du serveur...');
  db.saveAll();
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n📴 Arrêt du serveur...');
  db.saveAll();
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('🚀 Serveur de chat démarré');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`👥 ${db.getUsersCount()} utilisateurs enregistrés`);
  console.log(`💬 ${db.getMessagesCount()} messages en base`);
});

module.exports = { app, server };
