import React from 'react';

const MessageInput = ({ 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  isLoading 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="input-container">
      <textarea
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Tapez votre message ici..."
        disabled={isLoading}
        rows="2"
      />
      <button 
        onClick={onSendMessage} 
        disabled={isLoading || !inputMessage.trim()}
        className="send-button"
      >
        {isLoading ? 'Envoi...' : 'Envoyer'}
      </button>
    </div>
  );
};

export default MessageInput;