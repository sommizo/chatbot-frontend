import React from 'react';
import StatsChart from './StatsChart';
import StatsTable from './StatsTable';

const Message = ({ message }) => {
  const type = (message.type || (message.sender === 'user' ? 'USER' : 'BOT')).toUpperCase();
  const senderClass = message.sender || (type === 'USER' ? 'user' : 'bot');
  const contentIsArray = Array.isArray(message?.content);
  const visualItems = contentIsArray ? (message.content || []).filter((it) => it && (it.render === 'chart' || it.render === 'chart_pct' || it.render === 'table')) : [];

  return (
    <div className={`message ${senderClass}`}>
      <div className="message-content">
        {visualItems.length > 0 ? (
          <>
            {visualItems.map((item, idx) => {
              const chartTypeStr = String(item.chartType || '').toLowerCase();
              const isTableType = chartTypeStr === 'table';
              return (
                <div className="message-chart" key={`visual-${idx}`}>
                  {item.title && (
                    <div className="message-title"><strong>{item.title}</strong></div>
                  )}
                  {(item.render === 'chart' || item.render === 'chart_pct') && !isTableType && (
                    <StatsChart
                      data={item.data || item.content || {}}
                      chartType={item.chartType || 'bar'}
                      usePercent={item.render === 'chart_pct'}
                    />
                  )}
                  {(item.render === 'table' || isTableType) && (
                    <StatsTable
                      data={item.data || item.content || {}}
                      chartType={item.chartType}
                      usePercent={item.render === 'chart_pct'}
                    />
                  )}
                </div>
              );
            })}
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