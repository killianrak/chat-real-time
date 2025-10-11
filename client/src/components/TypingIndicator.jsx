// src/components/TypingIndicator.js
import React from 'react';

const TypingIndicator = ({ users }) => {
  if (users.length === 0) return null;

  const getAvatarGradient = (username) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600', 
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-indigo-500 to-purple-600',
      'from-teal-500 to-cyan-600',
      'from-rose-500 to-pink-600',
      'from-amber-500 to-orange-600'
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  const formatTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} est en train d'écrire`;
    } else if (users.length === 2) {
      return `${users[0]} et ${users[1]} sont en train d'écrire`;
    } else {
      return `${users.slice(0, -1).join(', ')} et ${users[users.length - 1]} sont en train d'écrire`;
    }
  };

  return (
    <div className="flex items-end space-x-3 mb-4 animate-fade-in">
      {/* Avatar du premier utilisateur qui tape */}
      <div className={`w-9 h-9 bg-gradient-to-br ${getAvatarGradient(users[0])} rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-lg ring-2 ring-white/20 flex-shrink-0`}>
        {users[0].charAt(0).toUpperCase()}
      </div>
      
      {/* Indicateur de frappe */}
      <div className="max-w-xs">
        <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-white/40 dark:border-slate-700/40">
          <div className="flex items-center space-x-3">
            {/* Points animés */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
            
            {/* Texte d'indication */}
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              {formatTypingText()}...
            </span>
          </div>
        </div>
        
        {/* Affichage des autres avatars si plusieurs utilisateurs tapent */}
        {users.length > 1 && (
          <div className="flex -space-x-2 mt-3 ml-4">
            {users.slice(1, 4).map((user, index) => (
              <div
                key={user}
                className={`w-7 h-7 bg-gradient-to-br ${getAvatarGradient(user)} rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-lg border-2 border-white dark:border-slate-800 ring-1 ring-slate-200/50 dark:ring-slate-700/50`}
                style={{ zIndex: 10 - index }}
              >
                {user.charAt(0).toUpperCase()}
              </div>
            ))}
            
            {/* Indicateur "+ X autres" si plus de 4 utilisateurs */}
            {users.length > 4 && (
              <div className="w-7 h-7 bg-slate-400 dark:bg-slate-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-lg border-2 border-white dark:border-slate-800 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                +{users.length - 4}
              </div>
            )}
          </div>
        )}
        
        {/* Indicateur de pulsation subtile */}
        <div className="flex justify-start mt-2 ml-1">
          <div className="flex items-center space-x-1 text-xs text-slate-400 dark:text-slate-500">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
            <span>En cours de frappe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;