import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, RefreshCw, MessageSquare } from 'lucide-react';

export const ChatCompanion: React.FC = () => {
  const { chatHistory, sendChatMessage, clearChat, loading } = useApp();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const message = input;
    setInput('');
    await sendChatMessage(message);
  };

  // Simple custom Markdown formatter (bolding and bullet lists)
  const formatMessageText = (text: string) => {
    // 1. Handle double asterisks (bold)
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Handle bullet lists (* or - at start of lines)
    const lines = formatted.split('\n');
    const processedLines = lines.map((line) => {
      const match = line.match(/^(\s*)[*-]\s+(.*)$/);
      if (match) {
        return `${match[1]}• ${match[2]}`;
      }
      return line;
    });

    return processedLines.join('\n');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--border-light)', background: 'rgba(10, 11, 16, 0.4)' }}>
      
      {/* Companion Title Panel */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
          <MessageSquare size={18} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>FocusAI Companion</h2>
        </div>
        <button 
          className="btn btn-ghost" 
          onClick={clearChat}
          style={{ padding: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
          title="Clear Conversation"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages Pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {chatHistory.map((message) => {
          const isAI = message.sender === 'ai';
          return (
            <div 
              key={message.id}
              className="animate-slide-up"
              style={{ 
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '85%'
              }}
            >
              {/* Message Bubble */}
              <div 
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: isAI ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                  background: isAI ? 'var(--card-bg)' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-purple) 100%)',
                  border: isAI ? '1px solid var(--border-light)' : 'none',
                  boxShadow: isAI ? 'var(--shadow-sm)' : '0 4px 10px rgba(99,102,241,0.2)',
                  fontSize: '0.85rem',
                  color: '#fff',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5'
                }}
                dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }}
              />
              {/* Timestamp */}
              <div 
                style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)', 
                  marginTop: '0.25rem',
                  textAlign: isAI ? 'left' : 'right'
                }}
              >
                {message.timestamp}
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '12px 12px 12px 2px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px'
              }}
            >
              <div style={{ width: '6px', height: '6px', background: 'var(--accent-secondary)', borderRadius: '50%', animation: 'glowPulse 1s infinite' }} />
              <div style={{ width: '6px', height: '6px', background: 'var(--accent-primary)', borderRadius: '50%', animation: 'glowPulse 1s infinite 0.2s' }} />
              <div style={{ width: '6px', height: '6px', background: 'var(--accent-purple)', borderRadius: '50%', animation: 'glowPulse 1s infinite 0.4s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--border-light)', background: 'rgba(10,11,16,0.6)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FocusAI Coach or say 'help'..."
            disabled={loading}
            style={{ borderRadius: '8px' }}
          />
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || loading}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', minWidth: '40px' }}
          >
            <Send size={14} />
          </button>
        </div>
      </form>

    </div>
  );
};
