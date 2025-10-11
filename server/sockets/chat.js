// server/sockets/chat.js
const { verifyToken } = require('../routes/auth');
const db = require('../database/db');

// socketId -> { username, userId, socketId, joinedAt }
const connectedUsers = new Map();
// userId -> socketId (garantie 1 socket par user)
const userToSocket = new Map();

function initializeChat(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Token d'authentification manquant"));

      const decoded = verifyToken(token);
      if (!decoded) return next(new Error('Token invalide'));

      const user = db.getUserByUsername(decoded.username);
      if (!user) return next(new Error('Utilisateur introuvable'));

      socket.username = user.username;
      socket.userId = user.id;
      next();
    } catch (error) {
      console.error('Erreur authentification Socket.io:', error);
      next(new Error("Erreur d'authentification"));
    }
  });

  io.on('connection', (socket) => {
    const { username, userId } = socket;
    console.log(`🔌 ${username} connecté (${socket.id})`);

    // S'il y a déjà un socket pour ce user, on le remplace proprement
    const existingSocketId = userToSocket.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const oldSocket = io.sockets.sockets.get(existingSocketId);
      if (oldSocket) {
        try {
          oldSocket.disconnect(true);
          console.log(
            `♻️ Remplacement du socket pour ${username} (${existingSocketId} -> ${socket.id})`
          );
        } catch (e) {
          console.warn('⚠️ Impossible de déconnecter l’ancien socket:', e.message);
        }
      }
      connectedUsers.delete(existingSocketId);
    }

    // Enregistrer le nouveau socket
    userToSocket.set(userId, socket.id);
    connectedUsers.set(socket.id, {
      username,
      userId,
      socketId: socket.id,
      joinedAt: new Date().toISOString(),
    });

    // Notifier arrivée
    socket.broadcast.emit('userJoined', {
      username,
      message: `${username} a rejoint le chat`,
      timestamp: new Date().toISOString(),
      type: 'notification',
    });

    // Pousse une liste à tout le monde (si le client n'a pas encore ses listeners,
    // il la redemandera explicitement via 'getUsersList')
    emitUsersList(io);

    // Historique pour le nouveau client
    const recentMessages = db.getRecentMessages(50);
    socket.emit('messageHistory', recentMessages);

    // --- Handlers applicatifs ---
    socket.on('message', (data) => {
      try {
        const messageText = (data?.message || '').trim();
        if (!messageText) return;
        if (messageText.length > 500) {
          socket.emit('error', { message: 'Message trop long (max 500 caractères)' });
          return;
        }
        const messageData = db.addMessage(username, messageText);
        io.emit('message', messageData);
        console.log(`💬 [${username}]: ${messageText}`);
      } catch (error) {
        console.error('Erreur traitement message:', error);
        socket.emit('error', { message: "Erreur lors de l'envoi du message" });
      }
    });

    socket.on('typing', (data) => {
      try {
        const isTyping = Boolean(data?.isTyping);
        socket.broadcast.emit('userTyping', { username, isTyping });
      } catch (error) {
        console.error('Erreur typing:', error);
      }
    });

    // >>> Nouveau : réponse à la demande explicite de la liste
    socket.on('getUsersList', () => {
      const list = getUniqueUsernames();
      socket.emit('usersList', list);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${username} déconnecté (${socket.id}) - Raison: ${reason}`);
      connectedUsers.delete(socket.id);
      if (userToSocket.get(userId) === socket.id) {
        userToSocket.delete(userId);
      }

      socket.broadcast.emit('userLeft', {
        username,
        message: `${username} a quitté le chat`,
        timestamp: new Date().toISOString(),
        type: 'notification',
      });

      emitUsersList(io);

      socket.broadcast.emit('userTyping', { username, isTyping: false });
    });

    socket.on('error', (error) => {
      console.error(`❌ Erreur socket pour ${username}:`, error);
    });
  });

  console.log('💬 Gestionnaire de chat Socket.io initialisé');
}

function getUniqueUsernames() {
  return Array.from(
    new Set(Array.from(connectedUsers.values()).map((u) => u.username))
  );
}

function emitUsersList(io) {
  io.emit('usersList', getUniqueUsernames());
}

function getStats() {
  return {
    connectedUsers: new Set(Array.from(connectedUsers.values()).map((u) => u.userId)).size,
    totalMessages: db.getMessagesCount?.() ?? 0,
    totalUsers: db.getUsersCount?.() ?? 0,
    connectedUsersList: Array.from(connectedUsers.values()).map((u) => ({
      username: u.username,
      joinedAt: u.joinedAt,
    })),
  };
}

function getRecentMessages(count = 50) {
  return db.getRecentMessages(count);
}

module.exports = {
  initializeChat,
  getStats,
  getRecentMessages,
};
