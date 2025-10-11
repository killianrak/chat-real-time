// src/components/ChatHeader.js
import React from 'react';

const ChatHeader = ({ username, isConnected, userCount, onToggleSidebar }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Bouton hamburger - visible uniquement sur mobile */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle sidebar"
          >
            <svg 
              className="w-6 h-6 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>

          {/* Avatar et infos utilisateur */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg">
              {username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-none">
                {username}
              </h1>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} 
                />
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'En ligne' : 'Hors ligne'}
                </span>
                {/* Séparateur et nombre d'utilisateurs - caché sur mobile */}
                <span className="hidden sm:inline text-gray-400">•</span>
                <span className="hidden sm:inline text-gray-600">
                  {userCount} utilisateur{userCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compteur d'utilisateurs - version mobile compacte */}
        <div className="md:hidden text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full font-medium">
          {userCount} 👥
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;