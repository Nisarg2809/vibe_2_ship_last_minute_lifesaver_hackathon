import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Send, Bot, User as UserIcon, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AIChatDrawerProps {
  onRefresh: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  commandsExecuted?: string[];
}

export default function AIChatDrawer({ onRefresh }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I am your AI Productivity Companion. Ask me things like:\n\n* *'What should I do now?'*\n* *'Which task is most urgent?'*\n* *'Create a task to study DSA for 2 hours with importance 5'*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setError('');
    
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend })
      });

      const executedList: string[] = [];
      if (data.executed && Array.isArray(data.executed)) {
        data.executed.forEach((ex: any) => {
          if (ex.action === 'CREATE_TASK') {
            executedList.push(`Created task: "${ex.result.title}"`);
          } else if (ex.action === 'COMPLETE_TASK') {
            executedList.push(`Marked task complete: "${ex.result.title}"`);
          } else if (ex.action === 'DECOMPOSE_TASK') {
            executedList.push(`Broken down task: "${ex.result.title}"`);
          }
        });
        if (data.executed.length > 0) {
          onRefresh(); // Trigger data reload in dashboard/tasks
        }
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        commandsExecuted: executedList.length > 0 ? executedList : undefined
      }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send message');
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "I ran into an issue communicating with my thoughts. Make sure your Gemini API Key is configured in settings or environment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const prebuiltPrompts = [
    { label: 'What should I do now?', text: 'What should I do now?' },
    { label: 'Which task is most urgent?', text: 'Which task is most urgent?' },
    { label: 'Suggest reschedule', text: 'Can I postpone or reschedule a task?' }
  ];

  return (
    <div className="glass-card" style={{
      width: '360px',
      height: 'calc(100vh - 40px)',
      margin: '20px 20px 20px 0',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      flexShrink: 0
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '15px',
        marginBottom: '15px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Bot size={20} style={{ color: '#818cf8' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Companion</h3>
          <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            Online & Ready
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        paddingRight: '6px',
        marginBottom: '15px'
      }}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '4px',
                maxWidth: '90%',
                alignSelf: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#64748b',
                paddingLeft: isUser ? '0' : '8px',
                paddingRight: isUser ? '8px' : '0'
              }}>
                {!isUser && <Bot size={12} style={{ color: '#818cf8' }} />}
                {isUser && <UserIcon size={12} style={{ color: '#a5b4fc' }} />}
                <span>{isUser ? 'You' : 'Companion'} • {msg.timestamp}</span>
              </div>
              
              <div style={{
                background: isUser ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: isUser ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--glass-border)',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '12px 16px',
                fontSize: '0.9rem',
                lineHeight: '1.45',
                color: '#fff',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}

                {msg.commandsExecuted && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.8rem',
                    color: '#34d399',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} /> Auto-executed:
                    </div>
                    {msg.commandsExecuted.map((cmd, cIdx) => (
                      <div key={cIdx}>• {cmd}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', alignItems: 'center', paddingLeft: '8px' }}>
            <RefreshCw size={14} className="spin" style={{ color: '#818cf8', animation: 'spin 1.5s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Companion is thinking...</span>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f87171',
            fontSize: '0.8rem',
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)'
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts chips */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '10px'
      }}>
        {prebuiltPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.text)}
            className="btn-glass"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.01)',
              color: '#a5b4fc',
              cursor: 'pointer'
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        style={{ display: 'flex', gap: '8px' }}
      >
        <input
          type="text"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="glass-input"
          style={{ flexGrow: 1, padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem' }}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          disabled={loading}
        >
          <Send size={16} />
        </button>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
