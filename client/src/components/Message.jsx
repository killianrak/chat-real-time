// src/components/Message.js
import React, { useState } from 'react';

const Message = ({ message, isOwn, showAvatar = true, showUsername = true }) => {
  const [showFullTime, setShowFullTime] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    
    if (showFullTime) {
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const toggleTimeDisplay = () => {
    setShowFullTime(!showFullTime);
  };

  // Message de notification (utilisateur rejoint/quitte)
  if (message.type === 'notification') {
    return (
      <div className="flex justify-center my-4 sm:my-6 px-2">
        <div className="backdrop-blur-sm bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm border border-white/20 dark:border-slate-700/30 max-w-[90%] sm:max-w-none text-center">
          {message.message}
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Message normal
  return (
    <div className={`flex items-end space-x-2 sm:space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'} group mb-3 sm:mb-4 px-2 sm:px-0`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className={`w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br ${getAvatarGradient(message.username)} rounded-xl flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg ring-2 ring-white/20 flex-shrink-0`}>
          {message.username ? message.username.charAt(0).toUpperCase() : '?'}
        </div>
      )}
      
      {/* Contenu du message */}
      <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : 'mr-auto'}`}>
        {/* Nom d'utilisateur */}
        {showUsername && !isOwn && (
          <div className="mb-1 sm:mb-2 ml-1">
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              {message.username}
            </span>
          </div>
        )}
        
        {/* Bulle de message */}
        <div 
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer backdrop-blur-sm ${
            isOwn
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md hover:shadow-md hover:from-blue-600 hover:to-indigo-700'
              : 'bg-white/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 rounded-bl-md border border-white/40 dark:border-slate-700/40 hover:shadow-md hover:bg-white/90 dark:hover:bg-slate-800/80'
          }`}
          onClick={toggleTimeDisplay}
        >
          {/* Contenu du message */}
          <p className="text-xs sm:text-sm leading-relaxed break-words">
            {message.message}
          </p>
          
          {/* Timestamp au hover */}
          <div className={`mt-1 sm:mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
        
        {/* Timestamp permanent pour les messages propres */}
        {isOwn && (
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right mr-1">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
      
      {/* Espace pour l'avatar des messages propres */}
      {showAvatar && isOwn && (
        <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0" />
      )}
    </div>
  );
};

export default Message;