// src/App.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ChatRoom from './components/ChatRoom';
import LoginForm from './components/LoginForm';
import {
  verify,
  getStoredAuth,
  setStoredAuth,
  clearStoredAuth,
} from './api/client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth()); // { token, username } | null
  const [socket, setSocket] = useState(null);
  const [checking, setChecking] = useState(true);

  // 1) Au démarrage, on vérifie le token côté serveur
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = getStoredAuth();
      if (!stored) {
        setChecking(false);
        return;
      }
      try {
        await verify(stored.token); // /api/auth/verify (ton endpoint)
        if (!cancelled) setAuth(stored);
      } catch (e) {
        // Token expiré/invalide -> on purge et on renvoie au login
        clearStoredAuth();
        if (!cancelled) setAuth(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 2) Crée le socket avec auth.token quand on a une session valide
  useEffect(() => {
    if (!auth?.token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: auth.token },
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [auth?.token]);

  // 3) Synchro multi-onglets (login/logout propagé)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'auth_token' || e.key === 'auth_username') {
        setAuth(getStoredAuth());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleJoin = ({ username, token }) => {
    setStoredAuth({ username, token });
    setAuth({ username, token });
  };

  const handleDisconnect = () => {
    clearStoredAuth();
    setAuth(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-600">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
            <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor" />
          </svg>
          <span>Vérification de la session…</span>
        </div>
      </div>
    );
  }

  return auth && socket ? (
    <ChatRoom socket={socket} username={auth.username} onDisconnect={handleDisconnect} />
  ) : (
    <LoginForm onJoin={handleJoin} />
  );
}
