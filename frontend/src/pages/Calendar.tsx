import { useState } from 'react';
import { apiRequest } from '../utils/api';
import { Sparkles, Calendar as CalendarIcon, Clock, Trash2, ShieldAlert, Coffee, RefreshCw } from 'lucide-react';

interface CalendarProps {
  tasks: any[];
  slots: any[];
  onRefresh: () => void;
}

export default function Calendar({ tasks, slots, onRefresh }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Generate AI Daily Schedule Autopilot
  const handleGenerateAISchedule = async () => {
    setLoadingSchedule(true);
    try {
      await apiRequest('/api/ai/schedule', {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to generate schedule. Ensure Gemini API key is configured.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Remove Slot
  const handleRemoveSlot = async (slotId: string) => {
    try {
      await apiRequest(`/api/ai/schedule/${slotId}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter slots for the selected date
  const filteredSlots = slots
    .filter(s => s.startTime.startsWith(selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Generate 7-day horizontal bar dates
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    // Start from yesterday to show context
    const start = new Date(today);
    start.setDate(today.getDate() - 2);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div style={{
      flexGrow: 1,
      padding: '40px',
      overflowY: 'auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '30px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }} className="text-gradient">
            Schedule Planner
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Autopilot compiles tasks into focus blocks separated by healthy break periods.
          </p>
        </div>
        
        <button
          onClick={handleGenerateAISchedule}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          disabled={loadingSchedule}
        >
          {loadingSchedule ? (
            <RefreshCw size={18} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
          ) : (
            <Sparkles size={18} />
          )}
          {loadingSchedule ? 'Creating schedule...' : 'Autopilot with AI'}
        </button>
      </div>

      {/* 7-day date slider */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '15px'
      }}>
        {weekDates.map((d) => {
          const dateStr = d.toISOString().split('T')[0];
          const isSelected = dateStr === selectedDate;
          const dayName = d.toLocaleDateString([], { weekday: 'short' });
          const dayNum = d.getDate();

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className="glass-card"
              style={{
                padding: '16px',
                border: isSelected ? '1px solid #818cf8' : '1px solid var(--glass-border)',
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.01)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: isSelected ? '#fff' : '#94a3b8'
              }}
            >
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {dayName}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date detail input */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon size={20} style={{ color: '#818cf8' }} />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Daily Schedule: {new Date(selectedDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="glass-input"
          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
        />
      </div>

      {/* Daily schedule blocks */}
      <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid rgba(255, 255, 255, 0.05)' }}>
          
          {filteredSlots.map((slot, index) => {
            const task = tasks.find(t => t.id === slot.taskId);
            const subtask = task?.subtasks?.find((st: any) => st.id === slot.subtaskId);
            const start = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const end = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={slot.id} style={{ position: 'relative', display: 'flex', gap: '20px', alignItems: 'start' }}>
                {/* Timeline node */}
                <div style={{
                  position: 'absolute',
                  left: '-30px',
                  top: '6px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--grad-royal)',
                  boxShadow: '0 0 8px rgba(233,64,87,0.5)'
                }} />

                {/* Slot block */}
                <div className="glass-card" style={{
                  flexGrow: 1,
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontWeight: 600 }}>
                    <Clock size={16} />
                    <span>{start} - {end}</span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                      {task?.title || 'Scheduled task'}
                    </h3>
                    {subtask && (
                      <span style={{ fontSize: '0.82rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                        <Sparkles size={12} /> Subtask: {subtask.title}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Breaks logic between slots */}
                {index < filteredSlots.length - 1 && (() => {
                  const nextStart = new Date(filteredSlots[index + 1].startTime);
                  const currEnd = new Date(slot.endTime);
                  const breakMin = Math.round((nextStart.getTime() - currEnd.getTime()) / (60 * 1000));
                  
                  if (breakMin > 0) {
                    return (
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        margin: '10px 0',
                        background: 'rgba(16, 185, 129, 0.02)',
                        border: '1px dashed rgba(16, 185, 129, 0.15)',
                        borderRadius: '12px',
                        color: '#34d399',
                        fontSize: '0.85rem',
                        width: '100%'
                      }}>
                        <Coffee size={16} />
                        <span>Break block • {breakMin} minutes</span>
                      </div>
                    );
                  }
                  return null;
                })()}

              </div>
            );
          })}

          {filteredSlots.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              gap: '15px',
              color: '#475569'
            }}>
              <ShieldAlert size={36} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No focus blocks created yet for this date</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px', textAlign: 'center' }}>
                Press "Autopilot with AI" to let Gemini organize your tasks into an optimal calendar schedule.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
