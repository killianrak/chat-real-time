// server/database/db.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Dossier + fichier DB
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'app.sqlite');

// Créer le dossier si besoin
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Dossier database/data créé');
}

let db; // instance better-sqlite3

// -- SCHEMA & MIGRATIONS ------------------------------------------------------

function runMigrations() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastLogin TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('message','notification'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
  `);
}

// -- HELPERS ------------------------------------------------------------------

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// -- USERS API ----------------------------------------------------------------

const stmts = {
  insertUser: null,
  getUserByUsername: null,
  updateUserLastLogin: null,
  getAllUsers: null,
  getUsersCount: null,

  insertMessage: null,
  getRecentMessages: null,
  getAllMessages: null,
  getMessagesCount: null,
  pruneOldMessages: null,

  deleteMessageById: null,
};

function prepareStatements() {
  // Users
  stmts.insertUser = db.prepare(`
    INSERT INTO users (id, username, password, createdAt, lastLogin)
    VALUES (@id, @username, @password, @createdAt, @lastLogin)
  `);
  stmts.getUserByUsername = db.prepare(`
    SELECT id, username, password, createdAt, lastLogin
    FROM users WHERE LOWER(username) = LOWER(?)
  `);
  stmts.updateUserLastLogin = db.prepare(`
    UPDATE users SET lastLogin = @lastLogin WHERE LOWER(username) = LOWER(@username)
  `);
  stmts.getAllUsers = db.prepare(`
    SELECT id, username, password, createdAt, lastLogin FROM users
    ORDER BY createdAt ASC
  `);
  stmts.getUsersCount = db.prepare(`SELECT COUNT(*) AS n FROM users`);

  // Messages
  stmts.insertMessage = db.prepare(`
    INSERT INTO messages (id, username, message, timestamp, type)
    VALUES (@id, @username, @message, @timestamp, @type)
  `);
  stmts.getRecentMessages = db.prepare(`
    SELECT id, username, message, timestamp, type
    FROM messages
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  stmts.getAllMessages = db.prepare(`
    SELECT id, username, message, timestamp, type
    FROM messages
    ORDER BY timestamp ASC
  `);
  stmts.getMessagesCount = db.prepare(`SELECT COUNT(*) AS n FROM messages`);

  // Supprime les messages les plus anciens au-delà d’un plafond
  stmts.pruneOldMessages = db.prepare(`
    DELETE FROM messages
    WHERE id IN (
      SELECT id FROM messages
      ORDER BY timestamp ASC
      LIMIT (SELECT MAX(count - 1000, 0)
             FROM (SELECT COUNT(*) AS count FROM messages))
    )
  `);

  stmts.deleteMessageById = db.prepare(`DELETE FROM messages WHERE id = ?`); // <-- AJOUT
}

// -- PUBLIC API (même surface que ton ancien module) --------------------------

function initialize() {
  console.log('🔄 Initialisation de la base de données (SQLite)…');
  db = new Database(DB_FILE, { fileMustExist: false });
  runMigrations();
  prepareStatements();
  console.log('✅ Base de données initialisée');

  // Sauvegarde/maintenance périodique : on peut vacuum/optimize si besoin
  setInterval(() => {
    try {
      // Nettoyage pour rester ≈1000 messages
      pruneMessagesIfNeeded();
      // Conseillé de temps en temps :
      db.pragma('wal_checkpoint(TRUNCATE)'); // compacte le WAL
      // db.exec('VACUUM'); // optionnel (plus lourd)
    } catch (e) {
      console.warn('⚠️ Maintenance DB:', e.message);
    }
  }, 5 * 60 * 1000);

  // Fermeture propre
  const shutdown = () => {
    console.log('📴 Fermeture DB…');
    try { db.close(); } catch (_) {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function saveAll() {
  // plus nécessaire avec SQLite, mais on laisse pour compat
  // On peut forcer un checkpoint WAL pour “flusher”
  try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch (_) {}
  console.log('✅ SQLite synchronisée');
}

// Users

function createUser(username, hashedPassword) {
  const user = {
    id: generateId('user'),
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };
  try {
    stmts.insertUser.run(user);
    return user;
  } catch (e) {
    // Conflit username unique
    if (String(e.message).includes('UNIQUE constraint failed')) {
      // Retourne l’existant pour rester proche du comportement précédent
      return getUserByUsername(username);
    }
    throw e;
  }
}

function getUserByUsername(username) {
  return stmts.getUserByUsername.get(username) || null;
}

function updateUserLastLogin(username) {
  const lastLogin = new Date().toISOString();
  const result = stmts.updateUserLastLogin.run({ username, lastLogin });
  if (result.changes > 0) {
    return getUserByUsername(username);
  }
  return null;
}

function getAllUsers() {
  return stmts.getAllUsers.all();
}

function getUsersCount() {
  return stmts.getUsersCount.get().n;
}

// Messages

function addMessage(username, messageText) {
  const msg = {
    id: generateId('msg'),
    username,
    message: messageText,
    timestamp: new Date().toISOString(),
    type: 'message',
  };
  const trx = db.transaction((m) => {
    stmts.insertMessage.run(m);
    pruneMessagesIfNeeded(); // garde ~1000 messages
  });
  trx(msg);
  return msg;
}

function deleteMessageById(id) {
    const res = stmts.deleteMessageById.run(id);
    return res.changes > 0;
  }

function pruneMessagesIfNeeded() {
  // Supprime les plus anciens au-delà de 1000
  stmts.pruneOldMessages.run();
}

function getRecentMessages(count = 50) {
  // On renvoie du plus ancien au plus récent (comme avant) :
  const rowsDesc = stmts.getRecentMessages.all(Math.max(0, count));
  return rowsDesc.reverse();
}

function getAllMessages() {
  return stmts.getAllMessages.all();
}

function getMessagesCount() {
  return stmts.getMessagesCount.get().n;
}

// Accès “direct” (pour compatibilité)
Object.defineProperties(module.exports, {
  users: {
    get() {
      // Retour lecture seule : liste de users
      return getAllUsers();
    },
  },
  messages: {
    get() {
      return getAllMessages();
    },
  },
});

// Export public
module.exports.initialize = initialize;
module.exports.saveAll = saveAll;

module.exports.createUser = createUser;
module.exports.getUserByUsername = getUserByUsername;
module.exports.updateUserLastLogin = updateUserLastLogin;
module.exports.getAllUsers = getAllUsers;
module.exports.getUsersCount = getUsersCount;

module.exports.addMessage = addMessage;
module.exports.getRecentMessages = getRecentMessages;
module.exports.getAllMessages = getAllMessages;
module.exports.getMessagesCount = getMessagesCount;
module.exports.deleteMessageById = deleteMessageById;