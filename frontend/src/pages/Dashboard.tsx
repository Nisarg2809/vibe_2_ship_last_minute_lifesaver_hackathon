import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Play, Pause, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

interface DashboardProps {
  tasks: any[];
  slots: any[];
  onRefresh: () => void;
}

export default function Dashboard({ tasks, slots, onRefresh }: DashboardProps) {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // In seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const [smartReminder, setSmartReminder] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Load recommendations & reminders
  useEffect(() => {
    async function getRecommendations() {
      try {
        const data = await apiRequest('/api/ai/recommend', { method: 'POST' });
        setSmartReminder(data.reminder || '');
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Recommendations error:', err);
      }
    }
    getRecommendations();
  }, [tasks]);

  // Determine if a slot is active right now
  useEffect(() => {
    const now = new Date();
    const active = slots.find(slot => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      return start <= now && now <= end && slot.status === 'scheduled';
    });

    if (active) {
      const task = tasks.find(t => t.id === active.taskId);
      setActiveSlot(active);
      setActiveTask(task);

      // Initialize timer duration to remaining seconds of slot
      const end = new Date(active.endTime);
      const remainingSecs = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      setTimeLeft(remainingSecs);
    } else {
      setActiveSlot(null);
      setActiveTask(null);
      setTimeLeft(0);
      setTimerRunning(false);
    }
  }, [slots, tasks]);

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      // Auto complete slot or notify user
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // Complete active task helper
  const handleCompleteActive = async () => {
    if (!activeTask) return;
    try {
      await apiRequest(`/api/tasks/${activeTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed', progress: 100 })
      });
      if (activeSlot) {
        await apiRequest(`/api/ai/schedule/${activeSlot.id}`, { method: 'DELETE' }); // Remove slot or set status
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Format timer text
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Group tasks by priority matrix quadrants
  const priorityMatrix = {
    critical: tasks.filter(t => t.priority === 'critical' && t.status !== 'completed'),
    high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed'),
    medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'completed'),
    low: tasks.filter(t => t.priority === 'low' && t.status !== 'completed'),
  };

  // Get today's slots sorted chronologically
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySlots = slots
    .filter(s => s.startTime.startsWith(todayStr))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

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
            Command Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            {new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* AI Smart Reminder Nudge Banner */}
      {smartReminder && (
        <div className="glass-card" style={{
          padding: '16px 20px',
          background: 'rgba(129, 140, 248, 0.05)',
          borderLeft: '4px solid #818cf8',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#818cf8', flexShrink: 0 }} />
          <div style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: '#a5b4fc', marginRight: '6px' }}>AI Companion Nudge:</span>
            {smartReminder}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Active Timer Card */}
          <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#a5b4fc', fontWeight: 600 }}>
                Active Focus Session
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
                <Clock size={14} />
                <span>Timer syncs with AI Schedule</span>
              </div>
            </div>

            {activeTask ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '30px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className={`tag-${activeTask.priority}`} style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {activeTask.priority}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Duration: {activeTask.estimatedDuration} hrs
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '10px' }}>
                    {activeTask.title}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px' }}>
                    {activeTask.description || 'Focus slot scheduled. Keep pushing!'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
                    >
                      {timerRunning ? <Pause size={16} /> : <Play size={16} />}
                      {timerRunning ? 'Pause Session' : 'Start Focus'}
                    </button>
                    <button
                      onClick={handleCompleteActive}
                      className="btn-glass"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', borderColor: '#10b981', color: '#34d399' }}
                    >
                      <CheckCircle2 size={16} />
                      Complete Task
                    </button>
                  </div>
                </div>

                <div style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  border: '6px solid rgba(255, 255, 255, 0.03)',
                  borderTopColor: timerRunning ? '#818cf8' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '4px',
                  animation: timerRunning ? 'pulse 2s infinite ease-in-out' : 'none'
                }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    {formatTime(timeLeft)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Remaining
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Calendar size={40} style={{ color: '#475569' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No active focus block scheduled</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '360px' }}>
                  There are no scheduled work slots for the current hour. Head to the calendar page to generate an AI plan for your day!
                </p>
              </div>
            )}
          </div>

          {/* Priority Matrix */}
          <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
              Priority Matrix quadrants
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }}>
              {/* Critical */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(255, 65, 108, 0.02)',
                border: '1px solid rgba(255, 65, 108, 0.15)',
                minHeight: '160px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: '#ff4b2b', fontSize: '0.95rem', fontWeight: 700 }}>Critical</h4>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255, 65, 108, 0.1)', padding: '2px 8px', borderRadius: '10px', color: '#ff4b2b' }}>
                    {priorityMatrix.critical.length} Left
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {priorityMatrix.critical.slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      • {t.title}
                    </div>
                  ))}
                  {priorityMatrix.critical.length === 0 && <span style={{ fontSize: '0.8rem', color: '#475569' }}>No critical tasks</span>}
                </div>
              </div>

              {/* High */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(127, 0, 255, 0.02)',
                border: '1px solid rgba(127, 0, 255, 0.15)',
                minHeight: '160px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: '#e100ff', fontSize: '0.95rem', fontWeight: 700 }}>High</h4>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(127, 0, 255, 0.1)', padding: '2px 8px', borderRadius: '10px', color: '#e100ff' }}>
                    {priorityMatrix.high.length} Left
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {priorityMatrix.high.slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      • {t.title}
                    </div>
                  ))}
                  {priorityMatrix.high.length === 0 && <span style={{ fontSize: '0.8rem', color: '#475569' }}>No high tasks</span>}
                </div>
              </div>

              {/* Medium */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(0, 180, 219, 0.02)',
                border: '1px solid rgba(0, 180, 219, 0.15)',
                minHeight: '160px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: '#00b4db', fontSize: '0.95rem', fontWeight: 700 }}>Medium</h4>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0, 180, 219, 0.1)', padding: '2px 8px', borderRadius: '10px', color: '#00b4db' }}>
                    {priorityMatrix.medium.length} Left
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {priorityMatrix.medium.slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      • {t.title}
                    </div>
                  ))}
                  {priorityMatrix.medium.length === 0 && <span style={{ fontSize: '0.8rem', color: '#475569' }}>No medium tasks</span>}
                </div>
              </div>

              {/* Low */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(17, 153, 142, 0.02)',
                border: '1px solid rgba(17, 153, 142, 0.15)',
                minHeight: '160px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ color: '#38ef7d', fontSize: '0.95rem', fontWeight: 700 }}>Low</h4>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(17, 153, 142, 0.1)', padding: '2px 8px', borderRadius: '10px', color: '#38ef7d' }}>
                    {priorityMatrix.low.length} Left
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {priorityMatrix.low.slice(0, 3).map(t => (
                    <div key={t.id} style={{ fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      • {t.title}
                    </div>
                  ))}
                  {priorityMatrix.low.length === 0 && <span style={{ fontSize: '0.8rem', color: '#475569' }}>No low tasks</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Timeline & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Today's Timeline */}
          <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
              Today's Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(255, 255, 255, 0.05)' }}>
              {todaySlots.map((slot, index) => {
                const task = tasks.find(t => t.id === slot.taskId);
                const start = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const end = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={slot.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* Timeline Dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-26px',
                      top: '4px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: activeSlot?.id === slot.id ? '#818cf8' : 'rgba(255,255,255,0.2)',
                      boxShadow: activeSlot?.id === slot.id ? '0 0 10px #818cf8' : 'none'
                    }} />
                    
                    <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>
                      {start} - {end}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {task?.title || 'Unknown Task'}
                    </span>
                    {task?.priority && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
                        Priority: {task.priority}
                      </span>
                    )}

                    {/* Inter-slot gap check for break display */}
                    {index < todaySlots.length - 1 && (() => {
                      const nextStart = new Date(todaySlots[index + 1].startTime);
                      const currEnd = new Date(slot.endTime);
                      const breakMin = Math.round((nextStart.getTime() - currEnd.getTime()) / (60 * 1000));
                      if (breakMin > 0) {
                        return (
                          <div style={{ margin: '8px 0', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={12} /> Break • {breakMin} mins
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}

              {todaySlots.length === 0 && (
                <div style={{ color: '#475569', fontSize: '0.9rem', paddingLeft: '10px' }}>
                  No scheduled slots for today.
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Card */}
          {recommendations.length > 0 && (
            <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
                AI Recommendation Engine
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.map(rec => (
                  <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{rec.title}</span>
                    <span className={`tag-${rec.priority}`} style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.01); opacity: 0.95; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
