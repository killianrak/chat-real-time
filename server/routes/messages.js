// server/routes/messages.js
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { verifyToken } = require('./auth'); // exporté par auth.js

// --- Auth simple via Bearer ---
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token manquant' });

    const decoded = verifyToken(token);
    if (!decoded?.username) return res.status(401).json({ error: 'Token invalide' });

    req.user = { username: decoded.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Non autorisé' });
  }
}

// --- Rate limit léger (IP+route) ---
const bucket = new Map(); // key -> {count, resetAt}
function rateLimit({ windowMs = 4000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const cur = bucket.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > cur.resetAt) {
      cur.count = 0;
      cur.resetAt = now + windowMs;
    }
    cur.count++;
    bucket.set(key, cur);
    if (cur.count > max) return res.status(429).json({ error: 'Trop de requêtes' });
    next();
  };
}

// --- Validation message ---
function validateMessage(text) {
  if (typeof text !== 'string') return 'Format invalide';
  const t = text.trim();
  if (!t) return 'Message vide';
  if (t.length > 500) return 'Message trop long (max 500 caractères)';
  return null;
}

/**
 * GET /api/messages
 * Query:
 *  - limit (<=100) | default 50
 *  - before (ISO) : renvoie les messages antérieurs à ce timestamp
 *  - q : filtre contient
 *  - user : filtre par username
 */
router.get('/', rateLimit({ windowMs: 3000, max: 30 }), (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 100);
    const q = (req.query.q || '').toString().trim();
    const user = (req.query.user || '').toString().trim();
    const before = (req.query.before || '').toString().trim();

    let items = db.getAllMessages(); // ASC dans l’impl SQLite proposée

    if (user) items = items.filter(m => m.username.toLowerCase() === user.toLowerCase());
    if (before) items = items.filter(m => m.timestamp < before);
    if (q) items = items.filter(m => m.message.toLowerCase().includes(q.toLowerCase()));

    const total = items.length;
    const slice = items.slice(-limit).reverse(); // renvoie récents d’abord

    res.json({
      messages: slice,
      total,
      hasMore: total > limit,
      nextCursor: slice.length ? slice[slice.length - 1].timestamp : null
    });
  } catch (e) {
    console.error('GET /api/messages error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/messages
 * Body: { message: string }
 * Auth: Bearer
 * Effet: sauvegarde + broadcast Socket.io
 */
router.post('/', requireAuth, rateLimit({ windowMs: 4000, max: 6 }), (req, res) => {
  try {
    const err = validateMessage(req.body?.message);
    if (err) return res.status(400).json({ error: err });

    const username = req.user.username;
    const saved = db.addMessage(username, req.body.message.trim());

    const io = req.app.get('io');
    if (io) io.emit('message', saved);

    res.status(201).json(saved);
  } catch (e) {
    console.error('POST /api/messages error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/messages/:id
 * Auth: Bearer (auteur ou admin si tu ajoutes une notion de rôle)
 */
router.delete('/:id', requireAuth, rateLimit({ windowMs: 5000, max: 5 }), (req, res) => {
  try {
    const id = req.params.id;
    const all = db.getAllMessages();
    const msg = all.find(m => m.id === id);
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });

    const isOwner = msg.username.toLowerCase() === req.user.username.toLowerCase();
    const isAdmin = false; // TODO: branche un vrai contrôle de rôle
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Interdit' });

    const ok = typeof db.deleteMessageById === 'function' ? db.deleteMessageById(id) : false;
    if (!ok) return res.status(501).json({ error: 'Suppression non implémentée' });

    const io = req.app.get('io');
    if (io) io.emit('messageDeleted', { id });

    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/messages/:id error:', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
