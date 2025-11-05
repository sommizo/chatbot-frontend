import React from 'react';
import StatsChart from './StatsChart';

const Message = ({ message }) => {
  const type = (message.type || (message.sender === 'user' ? 'USER' : 'BOT')).toUpperCase();
  const isChart = message?.metadata?.render === 'chart' && message?.content;
  const senderClass = message.sender || (type === 'USER' ? 'user' : 'bot');

  return (
    <div className={`message ${senderClass}`}>
      <div className="message-content">
        {isChart ? (
          <div className="message-chart">
            {message.metadata?.title && (
              <div className="message-title"><strong>{message.metadata.title}</strong></div>
            )}
            <StatsChart data={message.content} chartType={message.metadata?.chartType || 'bar'} />
            <div className="message-timestamp">{message.timestamp}</div>
          </div>
        ) : (
          <>
            <div className="message-text">{message.text || String(message.content || '')}</div>
            <div className="message-timestamp">{message.timestamp}</div>
            {message.cypherQuery && (
              <div className="message-details">
                <small>{message.cypherQuery}</small>
                {message.executionTime && <small> | Temps: {message.executionTime}ms</small>}
                {message.dataCount !== undefined && <small> | Résultats: {message.dataCount}</small>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Message;