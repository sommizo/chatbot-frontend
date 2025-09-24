import React from 'react';

const ChatHeader = ({ title, sessionId }) => {
  return (
    <div className="chat-header">
      <h1>{title}</h1>
      <div className="session-info">Session: {sessionId}</div>
    </div>
  );
};

export default ChatHeader;