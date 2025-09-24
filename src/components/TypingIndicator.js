import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="message bot">
      <div className="message-content">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;