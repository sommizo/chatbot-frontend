import React from 'react';
import StatsChart from './StatsChart';

const Message = ({ message }) => {
  const type = (message.type || (message.sender === 'user' ? 'USER' : 'BOT')).toUpperCase();
  const senderClass = message.sender || (type === 'USER' ? 'user' : 'bot');
  const contentIsArray = Array.isArray(message?.content);
  const chartItems = contentIsArray ? (message.content || []).filter((it) => it && it.render === 'chart') : [];

  return (
    <div className={`message ${senderClass}`}>
      <div className="message-content">
        {chartItems.length > 0 ? (
          <>
            {chartItems.map((item, idx) => (
              <div className="message-chart" key={`chart-${idx}`}>
                {item.title && (
                  <div className="message-title"><strong>{item.title}</strong></div>
                )}
                <StatsChart data={item.data || item.content || {}} chartType={item.chartType || 'bar'} />
              </div>
            ))}
            <div className="message-timestamp">{message.timestamp}</div>
            {message.cypherQuery && (
              <div className="message-details">
                <small>{message.cypherQuery}</small>
                {message.executionTime && <small> | Temps: {message.executionTime}ms</small>}
                {message.dataCount !== undefined && <small> | Résultats: {message.dataCount}</small>}
              </div>
            )}
          </>
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