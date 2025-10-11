// src/components/ChatRoom.js
import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import UsersList from './UsersList';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';

const ChatRoom = ({ socket, username, onDisconnect }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);

    const handleConnect = () => setIsConnected(true);

    const handleDisconnect = (reason) => {
      console.log('⛔ Socket disconnect (ChatRoom):', reason);
      setIsConnected(false);
      setTypingUsers([]);
    };

    const handleHistory = (history) => {
      const base = Array.isArray(history) ? history : [];
      const welcome = {
        id: `welcome_${Date.now()}`,
        type: 'notification',
        message: `Bienvenue dans le chat, ${username} ! 👋`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...base, welcome]);
    };

    const handleMessage = (messageData) => {
      setMessages((prev) => [...prev, { ...messageData, type: 'message' }]);
    };

    const handleUserJoined = (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'notification' }]);
    };

    const handleUserLeft = (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'notification' }]);
    };

    const handleUsersList = (usersList) => setUsers(Array.isArray(usersList) ? usersList : []);

    const handleUserTyping = (data) => {
      const name = data?.username;
      const typing = Boolean(data?.isTyping);
      if (!name) return;

      setTypingUsers((prev) => {
        const exists = prev.includes(name);
        if (typing && !exists) return [...prev, name];
        if (!typing && exists) return prev.filter((u) => u !== name);
        return prev;
      });
    };

    const handleMessageDeleted = ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    const handleConnectError = (err) => {
      console.error('❌ connect_error (ChatRoom):', err?.message || err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('messageHistory', handleHistory);
    socket.on('message', handleMessage);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('usersList', handleUsersList);
    socket.on('userTyping', handleUserTyping);
    socket.on('messageDeleted', handleMessageDeleted);

    socket.emit('getUsersList');

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('messageHistory', handleHistory);
      socket.off('message', handleMessage);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('usersList', handleUsersList);
      socket.off('userTyping', handleUserTyping);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, username]);

  const sendMessage = (messageText) => {
    const text = (messageText || '').trim();
    if (!socket || !text) return;
    socket.emit('message', { message: text });
  };

  const handleTyping = (isTyping) => {
    if (!socket) return;
    socket.emit('typing', { isTyping: Boolean(isTyping) });
  };

  const handleDisconnectClick = () => {
    try {
      socket?.disconnect();
    } finally {
      onDisconnect?.();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar utilisateurs - Responsive */}
      <UsersList
        users={users}
        currentUser={username}
        isConnected={isConnected}
        onDisconnect={handleDisconnectClick}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* En-tête avec bouton hamburger */}
        <ChatHeader 
          username={username} 
          isConnected={isConnected} 
          userCount={users.length}
          onToggleSidebar={toggleSidebar}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessagesList 
            messages={messages} 
            currentUser={username} 
            typingUsers={typingUsers} 
          />
        </div>

        {/* Zone de saisie */}
        <div className="bg-white border-t border-gray-200">
          <MessageInput 
            onSendMessage={sendMessage} 
            onTyping={handleTyping} 
            disabled={!isConnected} 
          />
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;