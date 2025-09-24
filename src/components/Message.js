import React from 'react';

const Message = ({ message }) => {
  return (
    <div className={`message ${message.sender}`}>
      <div className="message-content">
        <div className="message-text">{message.text}</div>
        <div className="message-timestamp">{message.timestamp}</div>
        {message.cypherQuery && (
          <div className="message-details">
            <small>Requête Cypher: {message.cypherQuery}</small>
            {message.executionTime && <small> | Temps: {message.executionTime}ms</small>}
            {message.dataCount !== undefined && <small> | Résultats: {message.dataCount}</small>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;