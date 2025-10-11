// src/components/UsersList.js
import React, { useState } from 'react';

const UsersList = ({ users, currentUser, isConnected, onDisconnect, isOpen, onClose }) => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const getAvatarColor = (username) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleDisconnectClick = () => {
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = () => {
    setShowDisconnectModal(false);
    onDisconnect();
  };

  return (
    <>
      {/* Overlay pour mobile - apparaît quand la sidebar est ouverte */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-0
        w-72 sm:w-80 md:w-80 lg:w-96
        bg-white shadow-lg border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full
      `}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm sm:text-base">
              Utilisateurs connectés
            </h2>
            {/* Bouton fermer - visible uniquement sur mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-1 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fermer"
            >
              <svg 
                className="w-5 h-5 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600">
              {users.length} personne{users.length > 1 ? 's' : ''}
            </span>
            <div className={`flex items-center space-x-1 ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>{isConnected ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="flex-1 overflow-y-auto p-2">
          {users.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-xs sm:text-sm">Aucun utilisateur connecté</p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded hover:bg-gray-50 transition-colors ${
                    user === currentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${getAvatarColor(user)} rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm flex-shrink-0`}
                  >
                    {user.charAt(0).toUpperCase()}
                  </div>

                  {/* Nom et statut */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-xs sm:text-sm font-medium truncate ${
                        user === currentUser ? 'text-blue-800' : 'text-gray-900'
                      }`}>
                        {user}
                      </p>
                      {user === currentUser && (
                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">
                          Vous
                        </span>
                      )}
                    </div>

                    {/* Statut en ligne */}
                    <div className="flex items-center space-x-1 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span className="text-xs text-gray-500">En ligne</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton de déconnexion */}
        <div className="p-3 sm:p-4 border-t bg-gray-50">
          <button
            onClick={handleDisconnectClick}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Quitter</span>
          </button>
        </div>

        {/* Modal de confirmation */}
        {showDisconnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Confirmer la déconnexion
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Êtes-vous sûr de vouloir quitter le chat ?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDisconnectModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDisconnect}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UsersList;