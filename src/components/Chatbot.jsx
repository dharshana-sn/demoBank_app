import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Wrench, History, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getAccounts, searchKnowledgeBase } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Chatbot.css';

// Simple bold text parser
const renderMessageText = (text) => {
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const INITIAL_MESSAGE = { id: 1, role: 'assistant', content: 'Hello! I am your AI banking assistant. How can I help you today?' };

export default function Chatbot() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // History State
  const [historyList, setHistoryList] = useState(() => {
    const saved = localStorage.getItem('chatbot_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState(Date.now());
  const [showHistory, setShowHistory] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping, showHistory]);

  // Persist to local storage whenever messages change and are meaningful
  useEffect(() => {
    if (messages.length > 1) {
      setHistoryList(prev => {
        const title = messages.find(m => m.role === 'user')?.content || 'New Chat';
        const updatedSession = { id: currentSessionId, title, messages };
        // Remove the existing version of this session and add the updated one at the top
        const filteredPrev = prev.filter(s => s.id !== currentSessionId);
        const newHistory = [updatedSession, ...filteredPrev];
        localStorage.setItem('chatbot_history', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, [messages, currentSessionId]);

  const startNewChat = () => {
    setCurrentSessionId(Date.now());
    setMessages([INITIAL_MESSAGE]);
    setShowHistory(false);
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const lowerInput = userMessage.content.toLowerCase();
    let aiResponse = [];

    // Simulate network delay and AI dynamic processing
    setTimeout(async () => {
      // Handle dynamic functional calling
      if (lowerInput.includes('balance')) {
        if (!isAuthenticated) {
          aiResponse.push({ id: Date.now() + 1, role: 'assistant', content: 'You must be logged in to securely view your balance.' });
        } else {
          try {
            const accounts = await getAccounts({ userId: user.id });
            const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            aiResponse.push({ 
              id: Date.now() + 1, 
              role: 'tool', 
              name: 'get_account_balance', 
              result: `Accounts Found: ${accounts.length}\nTotal Balance: $${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}\nStatus: Active` 
            });
            aiResponse.push({ 
              id: Date.now() + 2, 
              role: 'assistant', 
              content: `I checked your accounts! Your total combined balance is **$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}**.` 
            });
          } catch (error) {
            aiResponse.push({ id: Date.now() + 1, role: 'assistant', content: 'Sorry, I am unable to fetch your balance right now.' });
          }
        }
      } else if (lowerInput.includes('transfer') || lowerInput.includes('pay')) {
         aiResponse.push({ 
           id: Date.now() + 1, 
           role: 'tool', 
           name: 'open_transfer_ui', 
           result: 'Navigated user to Transfer/Pay UI context.' 
         });
         aiResponse.push({ 
           id: Date.now() + 2, 
           role: 'assistant', 
           content: 'I can certainly help with that. You should see the transfer options available on your dashboard. Let me know if you want me to initiate a specific transfer for you.' 
         });
      } else if (lowerInput.includes('card') && lowerInput.includes('block')) {
         aiResponse.push({ 
           id: Date.now() + 1, 
           role: 'tool', 
           name: 'block_credit_card', 
           result: 'Card ending in 9988 has been temporarily blocked.' 
         });
         aiResponse.push({ 
           id: Date.now() + 2, 
           role: 'assistant', 
           content: 'I have securely blocked your credit card ending in 9988. You can unblock it anytime from the card management section.' 
         });
      } else {
        // Fall back to RAG lookup over the knowledge-base documents for
        // everything else (Fixed Deposits, KYC, credit cards, fees, security, etc.)
        try {
          const { results } = await searchKnowledgeBase(userMessage.content, 2);
          if (results && results.length > 0) {
            const top = results[0];
            aiResponse.push({
              id: Date.now() + 1,
              role: 'tool',
              name: 'search_knowledge_base',
              result: `Matched document: ${top.docTitle}\nSection: ${top.heading}\nRelevance score: ${top.score}`
            });
            const answer = results.map(r => `**${r.heading}**\n${r.content}`).join('\n\n');
            aiResponse.push({
              id: Date.now() + 2,
              role: 'assistant',
              content: answer.length > 900 ? `${answer.slice(0, 900)}…` : answer
            });
          } else {
            aiResponse.push({
              id: Date.now() + 1,
              role: 'assistant',
              content: `You mentioned: "${userMessage.content}". I am a demonstration AI. Try asking me about your "balance", to "transfer" funds, "block card", or ask about Fixed Deposits, KYC, credit cards, fees, or security policies!`
            });
          }
        } catch (error) {
          aiResponse.push({
            id: Date.now() + 1,
            role: 'assistant',
            content: "Sorry, I couldn't search our knowledge base right now. Please try again in a moment."
          });
        }
      }

      setIsTyping(false);
      setMessages(prev => [...prev, ...aiResponse]);
    }, 800);
  };

  const handleQuickAction = (actionText) => {
    setInputValue(actionText);
  };

  if (location.pathname === '/login' || location.pathname === '/') {
    return null;
  }

  return (
    <div className="chatbot-container">
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-title">
            <div className="chatbot-header-avatar">
              <Bot size={18} />
            </div>
            AI Assistant
          </div>
          <div className="chatbot-header-actions">
            <button 
              className="chatbot-icon-btn" 
              onClick={startNewChat} 
              aria-label="New Chat"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
            <button 
              className={`chatbot-icon-btn ${showHistory ? 'active' : ''}`} 
              onClick={() => setShowHistory(!showHistory)} 
              aria-label="History"
              title="Chat History"
            >
              <History size={18} />
            </button>
            <button className="chatbot-icon-btn" onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <X size={20} />
            </button>
          </div>
        </div>

        {showHistory ? (
          <div className="chatbot-history-list">
            {historyList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>No chat history yet.</div>
            ) : (
              historyList.map(session => (
                <div key={session.id} className="history-item" onClick={() => loadSession(session)}>
                  <div className="history-item-title">{session.title}</div>
                  <div className="history-item-date">{new Date(session.id).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-message ${msg.role}`}>
                {msg.role === 'tool' ? (
                  <div className="tool-card">
                    <div className="tool-header">
                      <Wrench size={16} /> Tool Call: {msg.name}
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {msg.result}
                    </pre>
                  </div>
                ) : (
                  <div className="message-bubble">
                    {renderMessageText(msg.content)}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message assistant">
                <div className="message-bubble typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {!showHistory && (
          <form className="chatbot-input-area" onSubmit={handleSend}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
              {messages.length === 1 && (
                 <div className="quick-actions">
                   <button type="button" className="quick-action-chip" onClick={() => handleQuickAction('Check my balance')}>Check Balance</button>
                   <button type="button" className="quick-action-chip" onClick={() => handleQuickAction('I want to transfer funds')}>Transfer Funds</button>
                   <button type="button" className="quick-action-chip" onClick={() => handleQuickAction('Block my card')}>Block Card</button>
                 </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  className="chatbot-input"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="chatbot-send-btn" 
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Send Message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {!isOpen && (
        <button className="chatbot-fab" onClick={() => setIsOpen(true)} aria-label="Open Chat">
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
