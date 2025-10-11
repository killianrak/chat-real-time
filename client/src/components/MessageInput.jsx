// src/components/MessageInput.js
import React, { useState, useRef, useEffect } from 'react';

const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emojis populaires pour le picker simple
  const popularEmojis = [
    '😀', '😂', '🥰', '😍', '🤔', '😎', '😢', '😭',
    '😤', '🙄', '😴', '🤯', '🥳', '😇', '🤗', '👍',
    '👎', '👏', '🙏', '❤️', '💔', '🔥', '⭐', '✨'
  ];

  useEffect(() => {
    // Focus sur l'input au montage du composant
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Gestion de l'indicateur de frappe
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    if (value.trim()) {
      // Réinitialiser le timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Arrêter l'indicateur après 3 secondes d'inactivité
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 3000);
    } else if (isTyping) {
      // Arrêter immédiatement si le champ est vide
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      
      // Arrêter l'indicateur de frappe
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Refocus sur l'input
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertEmoji = (emoji) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    setShowEmojiPicker(false);
    
    // Refocus sur l'input
    inputRef.current?.focus();
  };

  const handleEmojiPickerToggle = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Picker d'emojis */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 sm:left-4 mb-2 sm:mb-3 backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/40 p-3 sm:p-4 z-10 max-w-[90vw] sm:max-w-xs">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
            {popularEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-base sm:text-lg hover:bg-slate-100/80 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Cliquez pour ajouter un emoji
            </p>
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-2 sm:p-4">
        <div className="flex items-end space-x-2 sm:space-x-3 max-w-4xl mx-auto">
          {/* Bouton emoji */}
          <button
            type="button"
            onClick={handleEmojiPickerToggle}
            disabled={disabled}
            className={`flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm text-lg sm:text-xl ${
              disabled 
                ? 'bg-slate-200/50 text-slate-400 cursor-not-allowed' 
                : 'bg-white/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800/80 border border-white/40 dark:border-slate-700/40 shadow-sm hover:shadow-md'
            }`}
          >
            😊
          </button>

          {/* Zone de texte */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? "Connexion perdue..." : "Tapez votre message..."}
              disabled={disabled}
              rows="1"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-sm border-2 rounded-2xl resize-none focus:outline-none transition-all duration-200 text-sm sm:text-base ${
                disabled
                  ? 'border-slate-200/50 bg-slate-100/50 text-slate-400 cursor-not-allowed'
                  : 'border-white/40 dark:border-slate-700/40 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-blue-500 focus:shadow-lg focus:bg-white/90 dark:focus:bg-slate-800/80'
              }`}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                overflowY: message.split('\n').length > 3 ? 'auto' : 'hidden'
              }}
            />
            
            {/* Compteur de caractères */}
            {message.length > 200 && (
              <div className={`absolute right-2 sm:right-3 bottom-2 text-xs px-2 py-1 rounded-full backdrop-blur-sm ${
                message.length > 300 
                  ? 'text-red-600 bg-red-100/80 dark:bg-red-900/40 dark:text-red-400' 
                  : 'text-slate-500 bg-slate-100/80 dark:bg-slate-800/60 dark:text-slate-400'
              }`}>
                {message.length}/500
              </div>
            )}
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            onClick={sendMessage}
            disabled={disabled || !message.trim()}
            className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
              disabled || !message.trim()
                ? 'bg-slate-200/50 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Indicateurs */}
        <div className="flex justify-between items-center mt-2 sm:mt-3 px-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                </div>
                <span className="hidden sm:inline">Vous tapez...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;