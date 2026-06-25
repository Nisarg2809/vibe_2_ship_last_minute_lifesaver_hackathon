import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, RefreshCw, Zap } from 'lucide-react';

export const ReminderToast: React.FC = () => {
  const { reminders, dismissReminder, generateDaySchedule, sendChatMessage } = useApp();
  const [tick, setTick] = useState(Date.now());

  // Periodically check if reminders are due
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter triggered reminders that are pending
  const activeAlerts = reminders.filter(r => {
    return r.status === 'pending' && new Date(r.triggerTime).getTime() <= tick;
  });

  const handleReschedule = async (id: string, dateStr: string) => {
    dismissReminder(id);
    await generateDaySchedule(dateStr);
  };

  const handleAskCoach = async (id: string, message: string) => {
    dismissReminder(id);
    await sendChatMessage(`Help me reschedule: "${message}"`);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div 
      className="reminder-toast-container" 
      style={{ 
        position: 'fixed', 
        top: '80px', 
        right: '20px', 
        zIndex: 90, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        maxWidth: '360px',
        width: 'calc(100% - 40px)'
      }}
    >
      {activeAlerts.map((alert) => (
        <div 
          key={alert.id}
          className="glass-panel animate-slide-up"
          style={{ 
            padding: '1rem', 
            background: 'rgba(18, 19, 30, 0.95)',
            borderColor: 'var(--accent-primary)',
            boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
              <Bell size={14} style={{ animation: 'glowPulse 2s infinite' }} />
              <span>FocusAI Nudge Alert</span>
            </div>
            <button 
              onClick={() => dismissReminder(alert.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Alert Message */}
          <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
            {alert.message}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            {alert.type === 'reschedule_suggestion' ? (
              <>
                <button 
                  onClick={() => handleReschedule(alert.id, alert.triggerTime.slice(0,10))}
                  className="btn btn-primary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <RefreshCw size={11} /> Autopilot Reschedule
                </button>
                <button 
                  onClick={() => handleAskCoach(alert.id, alert.message)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                >
                  Ask Coach
                </button>
              </>
            ) : (
              <button 
                onClick={() => dismissReminder(alert.id)}
                className="btn btn-primary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Zap size={11} /> Let's Start
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
