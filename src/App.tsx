import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { TaskControl } from './components/TaskControl';
import { FocusSchedule } from './components/FocusSchedule';
import { AnalyticsHabits } from './components/AnalyticsHabits';
import { ChatCompanion } from './components/ChatCompanion';
import { ReminderToast } from './components/ReminderToast';
import { AuthScreen } from './components/AuthScreen';
import { 
  Sparkles, 
  Settings, 
  Eye, 
  EyeOff, 
  LayoutDashboard, 
  CheckSquare, 
  Key,
  HelpCircle,
  X,
  Calendar,
  BarChart2,
  Brain,
  LogOut
} from 'lucide-react';

const FocusAppContent: React.FC = () => {
  const { currentUser, logout, apiKey, setApiKey } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [showKeyText, setShowKeyText] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'schedule' | 'analytics' | 'coach'>('dashboard');

  // Save API Key setting
  const handleSaveSettings = () => {
    setApiKey(tempKey);
    setShowSettings(false);
    setTestStatus('idle');
  };

  // Test the Gemini key validity
  const handleTestConnection = async () => {
    if (!tempKey.trim()) {
      setTestStatus('error');
      return;
    }
    setTestStatus('testing');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${tempKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello' }] }]
        })
      });
      const data = await response.json();
      if (response.ok && data.candidates) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      setTestStatus('error');
    }
  };

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return (
      <div className="app-container" style={{ gridTemplateColumns: '1fr', gridTemplateAreas: '"main"', height: '100vh' }}>
        <main className="main-content-wrapper" style={{ gridArea: 'main', height: '100vh', overflowY: 'auto' }}>
          <AuthScreen />
        </main>
      </div>
    );
  }

  // Helper to render the active page component
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onOpenSettings={() => setShowSettings(true)} />;
      case 'tasks':
        return <TaskControl />;
      case 'schedule':
        return <FocusSchedule />;
      case 'analytics':
        return <AnalyticsHabits />;
      case 'coach':
        return (
          <div style={{ height: '100%' }} className="mobile-only-companion-container">
            <ChatCompanion />
          </div>
        );
      default:
        return <Dashboard onOpenSettings={() => setShowSettings(true)} />;
    }
  };

  const getPersonaLabel = () => {
    switch (currentUser.persona) {
      case 'work': return 'Priya (Engineer)';
      case 'entrepreneur': return 'Arjun (Founder)';
      default: return 'Rahul (Student)';
    }
  };

  const getUserInitials = () => {
    return currentUser.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="app-container">
      {/* Global Toast Reminders */}
      <ReminderToast />

      {/* Top Header */}
      <header className="app-header">
        <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
          Focus<span>AI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span 
            className="badge badge-medium" 
            style={{ 
              textTransform: 'capitalize', 
              fontSize: '0.8rem', 
              background: 'rgba(99,102,241,0.08)', 
              borderColor: 'var(--accent-primary)',
              color: 'var(--text-primary)'
            }}
          >
            Active: {getPersonaLabel()}
          </span>
          <button 
            className="btn btn-ghost"
            onClick={() => setShowSettings(true)}
            style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}
            title="AI Config Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Left Navigation Sidebar (Desktop only) */}
      <nav className="sidebar-nav" style={{ gridArea: 'nav', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', gap: '1.5rem', background: 'rgba(10,11,16,0.3)' }}>
        {/* User Card */}
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-purple) 100%)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            {getUserInitials()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.email}
            </div>
          </div>
        </div>

        {/* Menu Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            <CheckSquare size={18} />
            <span>Goals & Steps</span>
          </button>

          <button 
            onClick={() => setActiveTab('schedule')}
            className={`nav-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Focus Timeline</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart2 size={18} />
            <span>Analytics & Habits</span>
          </button>
        </div>

        {/* Spacer & Logout */}
        <div style={{ flex: 1 }} />
        <button 
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', background: 'rgba(255, 71, 87, 0.03)', borderColor: 'rgba(255, 71, 87, 0.1)' }}
        >
          <LogOut size={15} style={{ color: 'var(--priority-urgent)' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>Log Out</span>
        </button>
      </nav>

      {/* Center/Main Tab Content Area */}
      <main className="main-content-wrapper" style={{ gridArea: 'main', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
        {renderActiveTabContent()}
      </main>

      {/* Right Sidebar: Persistent AI Companion Chat (Desktop Only) */}
      <aside 
        className="companion-sidebar"
        style={{ gridArea: 'sidebar', height: 'calc(100vh - 70px)', borderLeft: '1px solid var(--border-light)' }}
      >
        <ChatCompanion />
      </aside>

      {/* Mobile Tab Navigator (Bottom sticky bar) */}
      <div className="mobile-nav-bar">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`mobile-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`mobile-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
        >
          <CheckSquare size={18} />
          Planning
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`mobile-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
        >
          <Calendar size={18} />
          Schedule
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`mobile-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <BarChart2 size={18} />
          Stats
        </button>
        <button 
          onClick={() => setActiveTab('coach')}
          className={`mobile-tab-btn ${activeTab === 'coach' ? 'active' : ''}`}
        >
          <Brain size={18} />
          Coach
        </button>
      </div>

      {/* CSS overrides specifically for Mobile Layout and Nav button classes */}
      <style>{`
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          color: var(--text-secondary);
          font-family: var(--font-sans);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-smooth);
          text-align: left;
        }
        .nav-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.03);
          border-color: var(--border-light);
        }
        .nav-btn.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 100%);
          border-color: var(--border-focus);
          box-shadow: 0 4px 12px rgba(99,102,241,0.05);
          font-weight: 600;
        }

        .mobile-tab-btn {
          background: none; 
          border: none; 
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.7rem;
          font-family: var(--font-sans);
          gap: 3px;
          cursor: pointer;
          flex: 1;
        }
        .mobile-tab-btn.active {
          color: var(--accent-primary);
          font-weight: 600;
        }

        @media (max-width: 1100px) {
          .app-container {
            grid-template-columns: 1fr !important;
            grid-template-areas: 
              "header"
              "main" !important;
          }
          .sidebar-nav, .companion-sidebar {
            display: none !important;
          }
          .mobile-nav-bar {
            display: grid !important;
          }
          .main-content-wrapper {
            height: calc(100vh - 130px) !important;
          }
        }

        .mobile-nav-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(18, 19, 30, 0.96);
          border-top: 1px solid var(--border-light);
          backdrop-filter: blur(10px);
          z-index: 50;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          text-align: center;
        }
      `}</style>

      {/* Config Settings Modal */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal glass-panel">
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                <Key size={18} style={{ color: 'var(--accent-primary)' }} />
                Gemini AI Configuration
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="btn btn-ghost"
                style={{ padding: '0.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                  Input a Google Gemini API Key to enable advanced LLM capabilities (conversational productivity coach, customized task breakdown, dynamic prioritizing). 
                  If left empty, FocusAI will run in <strong>Offline Mode</strong> using smart local rule-based engines.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-focus)', marginBottom: '1rem' }}>
                  <HelpCircle size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Don't have a key? Get one for free at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', textDecoration: 'underline' }}>Google AI Studio</a>.
                  </span>
                </div>
              </div>

              {/* API Key Form Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Gemini API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showKeyText ? 'text' : 'password'}
                    className="form-input"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Enter API Key here..."
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Testing Indicators */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  {testStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
                </button>

                {testStatus === 'success' && (
                  <span style={{ color: 'var(--status-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✓ Connected Successfully!
                  </span>
                )}
                {testStatus === 'error' && (
                  <span style={{ color: 'var(--priority-urgent)', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✗ Connection Failed
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <FocusAppContent />
    </AppProvider>
  );
}
