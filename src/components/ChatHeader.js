import React from 'react';

const ChatHeader = ({ title, onLogout, username }) => {
  return (
    <div className="chat-header">
      <h1>{title}</h1>
      {username && (
        <div className="user-info">
          <span>Connecté en tant que: {username}</span>
          <button onClick={onLogout} className="logout-button">
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;