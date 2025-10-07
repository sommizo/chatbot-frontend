import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ChatHeader, MessageList, MessageInput } from './components';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef(null);
  
  // Single conversation state
  const [userId] = useState(() => generateUserId());
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Generate a unique session ID
  function generateSessionId() {
    const prefix = process.env.REACT_APP_SESSION_PREFIX || 'session_';
    return prefix + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Generate a unique user ID and store it in sessionStorage
  function generateUserId() {
    // Check if userId already exists in sessionStorage
    const existingUserId = sessionStorage.getItem('userId');
    if (existingUserId) {
      return existingUserId;
    }
    
    // Generate a new UUID-like userId as specified in the requirement
    const newUserId = generateUUID();
    
    // Store it in sessionStorage for future use
    sessionStorage.setItem('userId', newUserId);
    return newUserId;
  }

  // Generate a UUID v4
  function generateUUID() {
      return 'putIdHere';
  }

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load user's conversation history
  const loadConversationHistory = async () => {
    try {
      setLoadingHistory(true);
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${apiBaseUrl}/api/chat/history/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const history = await response.json();
      
      const formattedMessages = history.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.type.toLowerCase(),
        timestamp: new Date(msg.timestamp).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        cypherQuery: msg.metadata?.cypherQuery,
        executionTime: msg.metadata?.executionTime,
        dataCount: msg.metadata?.dataCount
      }));
      
      // Add welcome message to the loaded conversation history
      const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        text: "Bonjour! Je suis votre assistant chatbot. Comment puis-je vous aider aujourd'hui?",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      };
      
      setMessages([...formattedMessages, welcomeMessage]);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // If no history exists, show welcome message
      setMessages([{
        id: 1,
        text: "Bonjour! Je suis votre assistant chatbot. Comment puis-je vous aider aujourd'hui?",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, [userId]);

  // Send message to backend
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
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
          userMessage: inputMessage,
          sessionId: sessionId,
          userId: userId
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
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
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
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="App">
      <div className="chat-container">
        <ChatHeader 
          title={process.env.REACT_APP_NAME || 'Chatbot Assistant'}
        />
        
        {loadingHistory ? (
          <div className="loading-history">
            <div className="loading-spinner"></div>
            <p>Chargement de l'historique...</p>
          </div>
        ) : (
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
        )}

        <MessageInput 
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
