import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ChatHeader, MessageList, MessageInput } from './components';
import Login from './components/Login';
import authService from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef(null);
  // Prevent multiple history loads (e.g., React StrictMode double-invoke)
  const hasLoadedHistoryRef = useRef(false);
  
  // Single conversation state
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Check authentication on app load
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Generate a unique session ID
  function generateSessionId() {
    const prefix = process.env.REACT_APP_SESSION_PREFIX || 'session_';
    return prefix + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load user's conversation history
  const loadConversationHistory = async () => {
    // Prevent duplicate loads (e.g., StrictMode double-invoke or multiple triggers)
    if (hasLoadedHistoryRef.current || loadingHistory) {
      console.debug('[DEBUG_LOG] Skipping loadConversationHistory: already loaded or in progress');
      return;
    }
    hasLoadedHistoryRef.current = true;
    try {
      setLoadingHistory(true);
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
      const token = authService.getToken();
      const userId = authService.getUserId();
      console.log('[DEBUG_LOG] Loading conversation history - userId:', userId);
      const response = await fetch(`${apiBaseUrl}/api/chat/history/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const history = await response.json();
      
      const formattedMessages = history.map(msg => ({
        id: msg.id,
        // Preserve raw content and metadata for conditional rendering (e.g., charts)
        content: msg.content,
        metadata: msg.metadata,
        type: msg.type,
        // Maintain existing fields for text rendering
        text: typeof msg.content === 'string' ? msg.content : '',
        sender: (msg.type || 'BOT').toLowerCase(),
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
        text: `Bonjour! Je suis votre assistant chatbot. Comment puis-je vous aider aujourd'hui?`,
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
        text: `Bonjour ${authService.getUsername()}! Je suis votre assistant chatbot. Comment puis-je vous aider aujourd'hui?`,
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

  const checkAuthentication = async () => {
    if (authService.isAuthenticated()) {
      const isValid = await authService.validateToken();
      if (isValid) {
        setIsAuthenticated(true);
        loadConversationHistory();
      } else {
        authService.logout();
        setIsAuthenticated(false);
      }
    }
    setIsCheckingAuth(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadConversationHistory();
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setMessages([]);
    // Reset history loaded flag so next login can load history again
    if (hasLoadedHistoryRef) {
      hasLoadedHistoryRef.current = false;
      console.debug('[DEBUG_LOG] Reset hasLoadedHistoryRef on logout');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      const token = authService.getToken();
      const userId = authService.getUserId();
      console.log('[DEBUG_LOG] Sending message - userId:', userId);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userMessage: inputMessage,
          sessionId: sessionId,
          userId: userId
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout();
          setIsAuthenticated(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // If backend returns a full ConversationMessage, map it directly
      if (data && data.message) {
        const m = data.message;
        const isStringContent = typeof m.content === 'string';
        const botMessage = {
          id: m.id || Date.now() + 1,
          content: m.content,
          metadata: m.metadata,
          type: (m.type || 'BOT').toUpperCase(),
          text: isStringContent ? m.content : (data.response || ''),
          sender: (m.type || 'BOT').toLowerCase(),
          timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          // Keep optional details if present on the envelope
          cypherQuery: data.cypherQuery || m?.metadata?.cypherQuery,
          executionTime: data.executionTime,
          dataCount: typeof data.dataCount === 'number' ? data.dataCount : m?.metadata?.dataCount
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Legacy text-only path
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
      }
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


  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main chat interface if authenticated
  return (
    <div className="App">
      <div className="chat-container">
        <ChatHeader 
          title={process.env.REACT_APP_NAME || 'Chatbot Assistant'}
          onLogout={handleLogout} 
          username={authService.getUsername()}
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
