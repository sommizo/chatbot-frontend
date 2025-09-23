import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef(null);

  // Generate a unique session ID
  function generateSessionId() {
    const prefix = process.env.REACT_APP_SESSION_PREFIX || 'session_';
    return prefix + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial welcome message
  useEffect(() => {
    setMessages([{
      id: 1,
      text: "Bonjour! Je suis votre assistant chatbot. Comment puis-je vous aider aujourd'hui?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  // Send message to backend
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      const chatEndpoint = process.env.REACT_APP_CHAT_ENDPOINT || '/api/chat/query';
      const apiUrl = `${apiBaseUrl}${chatEndpoint}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        text: data.success ? data.response : data.error || 'Désolé, une erreur est survenue.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        cypherQuery: data.cypherQuery,
        executionTime: data.executionTime,
        dataCount: data.data ? data.data.length : 0
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Désolé, je ne peux pas me connecter au serveur en ce moment. Veuillez réessayer plus tard.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>{process.env.REACT_APP_NAME || 'Chatbot Assistant'}</h1>
          <div className="session-info">Session: {sessionId}</div>
        </div>
        
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
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
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

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
            onClick={sendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            {isLoading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
