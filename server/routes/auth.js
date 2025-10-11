// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const router = express.Router();

// Fonction pour générer un token JWT
const generateToken = (username) => {
  return jwt.sign(
    { username },
    process.env.JWT_SECRET || 'ma_cle_secrete_changez_moi',
    { expiresIn: '24h' }
  );
};

// Fonction pour vérifier un token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'ma_cle_secrete_changez_moi');
  } catch (error) {
    return null;
  }
};

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation simple
    if (!username || !password) {
      return res.status(400).json({
        error: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({
        error: 'Le nom d\'utilisateur doit contenir entre 2 et 20 caractères'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = db.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        error: 'Ce nom d\'utilisateur est déjà pris'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur dans la base de données
    const user = db.createUser(username, hashedPassword);

    // Générer le token JWT
    const token = generateToken(username);

    console.log(`✅ Nouvel utilisateur créé: ${username} (ID: ${user.id})`);

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      },
      token
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Trouver l'utilisateur dans la base de données
    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Nom d\'utilisateur ou mot de passe incorrect'
      });
    }

    // Mettre à jour la dernière connexion
    const updatedUser = db.updateUserLastLogin(username);

    // Générer le token JWT
    const token = generateToken(user.username);

    console.log(`✅ Connexion réussie: ${user.username} (ID: ${user.id})`);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      },
      token
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour vérifier un token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Token manquant'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Token invalide'
      });
    }

    const user = db.getUserByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({
        error: 'Utilisateur introuvable'
      });
    }

    res.json({
      message: 'Token valide',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Export du router ET de la fonction verifyToken (pour les sockets)
module.exports = router;
module.exports.verifyToken = verifyToken;