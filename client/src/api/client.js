// src/api/client.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data; // { message, user, token }
}

export async function register(username, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Register failed');
  return data; // { message, user, token }
}

// Vérifie le token côté serveur (compatible avec ton auth.js)
export async function verify(token) {
  const res = await fetch(`${API_URL}/api/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid token');
  return data; // { message, user }
}

// Helpers localStorage
export function getStoredAuth() {
  const token = localStorage.getItem('auth_token');
  const username = localStorage.getItem('auth_username');
  return token && username ? { token, username } : null;
}

export function setStoredAuth({ token, username }) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_username', username);
}

export function clearStoredAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_username');
}
