// src/components/LoginForm.js
import React, { useMemo, useState } from "react";
import { login as apiLogin, register as apiRegister } from '../api/client';

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MIN = 2;
const MAX = 20;

export default function LoginForm({ onJoin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [mode, setMode] = useState("login");
  const [authError, setAuthError] = useState("");

  const trimmed = username.trim();

  const usernameError = useMemo(() => {
    if (!touched.username) return "";
    if (!trimmed) return "Veuillez entrer un nom d'utilisateur.";
    if (trimmed.length < MIN)
      return `Le nom d'utilisateur doit contenir au moins ${MIN} caractères.`;
    if (trimmed.length > MAX)
      return `Le nom d'utilisateur ne peut pas dépasser ${MAX} caractères.`;
    if (!USERNAME_REGEX.test(trimmed))
      return "Utilisez uniquement des lettres, chiffres, tirets et underscores ( _ ).";
    return "";
  }, [touched.username, trimmed]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!password) return "Veuillez entrer un mot de passe.";
    if (mode === "register" && password.length < 6)
      return "Le mot de passe doit contenir au moins 6 caractères.";
    return "";
  }, [touched.password, password, mode]);

  const isValid = !usernameError && !passwordError && 
    trimmed.length >= MIN && trimmed.length <= MAX && 
    USERNAME_REGEX.test(trimmed) && password.length > 0 &&
    (mode === "login" || password.length >= 6);

  const progress = Math.min(100, Math.round((Math.min(username.length, MAX) / MAX) * 100));

  const initials = useMemo(() => {
    if (!trimmed) return "👤";
    const letters = trimmed.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
    return letters || "👤";
  }, [trimmed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    setAuthError("");
    if (!isValid) return;

    try {
      setIsLoading(true);
      const action = mode === 'register' ? apiRegister : apiLogin;
      const { user, token } = await action(trimmed, password);

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_username', user.username);

      await onJoin({ username: user.username, token });
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.message || `Impossible de ${mode === 'login' ? 'se connecter' : 'créer le compte'}`);
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setTouched({ username: false, password: false });
    setAuthError("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      {/* Décor gradient blobs */}
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

      {/* Carte principale */}
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 shadow-xl shadow-slate-800/5 rounded-3xl p-5 sm:p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <LogoIcon />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {mode === "login" ? "Connexion" : "Créer un compte"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {mode === "login" 
                ? "Connectez-vous pour rejoindre la conversation."
                : "Créez votre compte pour commencer à discuter."
              }
            </p>
          </div>

          {/* Message d'erreur d'authentification */}
          {authError && (
            <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 sm:p-4 animate-shake">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                    {mode === "login" ? "Échec de connexion" : "Échec de l'inscription"}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-red-700 dark:text-red-400">
                    {authError}
                  </p>
                </div>
                <button
                  onClick={() => setAuthError("")}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
                  aria-label="Fermer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Onglets */}
          <div className="mb-5 sm:mb-6 flex rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1">
            <button
              type="button"
              onClick={toggleMode}
              className={`flex-1 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={toggleMode}
              className={`flex-1 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
                mode === "register"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Nom d'utilisateur
              </label>
              <div className={`group relative flex items-stretch rounded-xl border transition focus-within:ring-2 focus-within:ring-blue-500 ${
                usernameError ? "border-red-400 ring-red-200" : "border-slate-300 dark:border-slate-700"
              }`}>
                <span className="pl-3 pr-2 flex items-center text-slate-400 dark:text-slate-500">
                  <UserIcon />
                </span>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, MAX);
                    setUsername(v);
                    if (!touched.username) setTouched(prev => ({ ...prev, username: true }));
                  }}
                  placeholder="pierre_du_13"
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white px-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-r-xl"
                  aria-describedby="username-help username-error"
                  aria-invalid={!!usernameError}
                />
                {/* Avatar preview */}
                <div className="hidden sm:flex items-center pr-2">
                  <div className="ml-2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {initials}
                  </div>
                </div>
              </div>

              {/* Barre de progression caractères */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span id="username-help" className="text-[10px] sm:text-xs">2–20 caractères • lettres, chiffres, - et _</span>
                  <span className="text-[10px] sm:text-xs">{username.length}/{MAX}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${progress === 100 ? "rounded-full" : "rounded-r-full"} transition-all duration-300`}
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg, #2563eb, #7c3aed)" }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  />
                </div>
              </div>

              {/* Message d'erreur username */}
              {usernameError && (
                <p id="username-error" className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {usernameError}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Mot de passe
              </label>
              <div className={`group relative flex items-stretch rounded-xl border transition focus-within:ring-2 focus-within:ring-blue-500 ${
                passwordError ? "border-red-400 ring-red-200" : "border-slate-300 dark:border-slate-700"
              }`}>
                <span className="pl-3 pr-2 flex items-center text-slate-400 dark:text-slate-500">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!touched.password) setTouched(prev => ({ ...prev, password: true }));
                  }}
                  placeholder={mode === "login" ? "Votre mot de passe" : "Choisir un mot de passe"}
                  className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white px-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-r-xl"
                  aria-describedby="password-help password-error"
                  aria-invalid={!!passwordError}
                />
              </div>

              {/* Aide mot de passe */}
              {mode === "register" && (
                <div className="mt-2">
                  <span id="password-help" className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Au moins 6 caractères
                  </span>
                </div>
              )}

              {/* Message d'erreur password */}
              {passwordError && (
                <p id="password-error" className="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white font-medium shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                isValid ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 active:brightness-95" : "bg-slate-400"
              }`}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  {mode === "login" ? "Connexion…" : "Création…"}
                </>
              ) : (
                <>
                  <EnterIcon />
                  {mode === "login" ? "Se connecter" : "Créer le compte"}
                </>
              )}
            </button>
          </form>

          {/* Footer aide */}
          <div className="mt-5 sm:mt-6 text-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {mode === "login" 
              ? "Première fois ? Créez un compte ci-dessus."
              : "Respectez la casse et évitez les espaces dans votre nom d'utilisateur."
            }
          </div>
        </div>

        {/* Ombre douce */}
        <div className="absolute -inset-1 -z-10 rounded-[28px] bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 blur-2xl" />
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3l8.66 5v8L12 21l-8.66-5V8L12 3z" className="opacity-90" />
      <path d="M12 3v8l8.66 5" className="opacity-60" />
      <path d="M12 11L3.34 16" className="opacity-60" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.52 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.48-5-8-5Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h12" />
      <path d="m11 8 4 4-4 4" />
      <path d="M21 4v16" opacity=".5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
      <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor" />
    </svg>
  );
}