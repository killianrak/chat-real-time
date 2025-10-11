// src/components/MessagesList.js
import React, { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const MessagesList = ({ messages, currentUser, typingUsers }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Grouper les messages par date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateString === today) {
      return "Aujourd'hui";
    } else if (dateString === yesterday) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const groupedMessages = groupMessagesByDate(messages);
  const dateKeys = Object.keys(groupedMessages).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-2 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-white"
    >
      {messages.length === 0 ? (
        // État vide
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">💬</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            Aucun message pour le moment
          </h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md">
            Soyez le premier à dire bonjour ! Commencez la conversation en tapant un message ci-dessous.
          </p>
        </div>
      ) : (
        // Messages groupés par date
        dateKeys.map(dateKey => (
          <div key={dateKey} className="space-y-3 sm:space-y-4">
            {/* Séparateur de date */}
            <div className="flex items-center justify-center my-4 sm:my-6">
              <div className="bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  {formatDateHeader(dateKey)}
                </span>
              </div>
            </div>

            {/* Messages du jour */}
            <div className="space-y-2 sm:space-y-3">
              {groupedMessages[dateKey].map((message, index) => (
                <Message
                  key={message.id || `${message.timestamp}-${index}`}
                  message={message}
                  isOwn={message.username === currentUser}
                  showAvatar={true}
                  showUsername={message.username !== currentUser}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Indicateur de frappe */}
      {typingUsers.length > 0 && (
        <div className="mt-2 sm:mt-4">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      {/* Point de référence pour le scroll automatique */}
      <div ref={messagesEndRef} className="h-px" />
    </div>
  );
};

export default MessagesList;