import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Coffee, 
  ChevronLeft, 
  ChevronRight,
  Trash2
} from 'lucide-react';

export const FocusSchedule: React.FC = () => {
  const { 
    tasks, 
    schedule, 
    generateDaySchedule, 
    completeSlot, 
    skipSlot, 
    deleteSlot, 
    loading 
  } = useApp();

  const [targetDate, setTargetDate] = useState<Date>(new Date());

  const dateStr = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // Format date display (e.g., "Tuesday, June 23")
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const handlePrevDay = () => {
    const prev = new Date(targetDate);
    prev.setDate(prev.getDate() - 1);
    setTargetDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(targetDate);
    next.setDate(next.getDate() + 1);
    setTargetDate(next);
  };

  const handleAutopilot = async () => {
    await generateDaySchedule(dateStr);
  };

  // Filter slots for the selected day and sort chronologically
  const daySlots = schedule
    .filter(s => s.startTime.slice(0, 10) === dateStr)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Get task info for a slot
  const getSlotDetails = (taskId: string, subtaskId: string | null) => {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(s => s.id === subtaskId);
    return {
      taskTitle: task?.title || 'Unknown Goal',
      subtaskTitle: subtask?.title || '',
      category: task?.category || 'personal',
      priority: task?.priority || 'low'
    };
  };

  // Format time HH:MM from ISO string
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate duration in minutes
  const calculateDuration = (start: string, end: string) => {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  };

  // Render vertical timeline
  const renderTimeline = () => {
    if (daySlots.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <CalendarIcon size={40} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No Scheduled Slots</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '300px', margin: '0.5rem auto 0' }}>
              Your schedule is empty for this day. Click the AI Autopilot button to automatically generate optimized slots from your active goals.
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleAutopilot}
            disabled={loading}
            style={{ marginTop: '1rem', padding: '0.6rem 1.25rem' }}
          >
            <Sparkles size={16} />
            <span>AI Autopilot Planner</span>
          </button>
        </div>
      );
    }

    const timelineElements: React.ReactNode[] = [];

    for (let i = 0; i < daySlots.length; i++) {
      const slot = daySlots[i];
      const { taskTitle, subtaskTitle, category, priority } = getSlotDetails(slot.taskId, slot.subtaskId);
      const duration = calculateDuration(slot.startTime, slot.endTime);
      const startTimeStr = formatTime(slot.startTime);
      const endTimeStr = formatTime(slot.endTime);

      // 1. Render the Focus Slot card
      timelineElements.push(
        <div key={slot.id} className="timeline-slot-wrapper" style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
          {/* Time indicator column */}
          <div style={{ width: '55px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '0.5rem', flexShrink: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{startTimeStr}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{duration} min</div>
          </div>

          {/* Timeline node line circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div 
              style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: slot.status === 'completed' ? 'var(--status-success)' : slot.status === 'skipped' ? 'var(--priority-urgent)' : 'var(--accent-primary)',
                border: '2.5px solid var(--bg-gradient-start)',
                zIndex: 2,
                boxShadow: slot.status === 'completed' ? '0 0 8px var(--status-success-glow)' : '0 0 8px var(--accent-primary-glow)'
              }} 
            />
            {/* Connector line down to next element */}
            <div 
              style={{ 
                width: '2px', 
                flex: 1, 
                background: 'rgba(255, 255, 255, 0.08)',
                minHeight: '40px'
              }} 
            />
          </div>

          {/* Focus Slot Card Content */}
          <div 
            className="glass-card" 
            style={{ 
              flex: 1, 
              padding: '1rem', 
              marginBottom: '1rem',
              borderLeft: `4px solid var(--priority-${priority})`,
              background: slot.status === 'completed' ? 'rgba(46, 213, 115, 0.03)' : slot.status === 'skipped' ? 'rgba(255, 71, 87, 0.03)' : 'var(--card-bg)',
              opacity: (slot.status === 'completed' || slot.status === 'skipped') ? 0.7 : 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <span 
                  className="badge" 
                  style={{ 
                    fontSize: '0.65rem', 
                    padding: '0.1rem 0.4rem', 
                    background: 'rgba(255,255,255,0.04)', 
                    color: 'var(--text-secondary)',
                    textTransform: 'capitalize',
                    marginBottom: '0.35rem'
                  }}
                >
                  {category}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {taskTitle}
                </h4>
                {subtaskTitle && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 500, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Sparkles size={11} /> {subtaskTitle}
                  </p>
                )}
              </div>

              {/* Slot Actions */}
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {slot.status === 'scheduled' && (
                  <>
                    <button 
                      onClick={() => completeSlot(slot.id)}
                      className="btn btn-ghost" 
                      style={{ padding: '0.35rem', color: 'var(--status-success)', background: 'rgba(46, 213, 115, 0.05)', borderRadius: '6px' }}
                      title="Mark Completed"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button 
                      onClick={() => skipSlot(slot.id)}
                      className="btn btn-ghost" 
                      style={{ padding: '0.35rem', color: 'var(--priority-urgent)', background: 'rgba(255, 71, 87, 0.05)', borderRadius: '6px' }}
                      title="Skip Focus Block"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}

                {slot.status === 'completed' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    ✓ Done
                  </span>
                )}

                {slot.status === 'skipped' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--priority-urgent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    ⚠️ Skipped
                  </span>
                )}

                <button 
                  onClick={() => deleteSlot(slot.id)}
                  className="btn btn-ghost" 
                  style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
                  title="Remove Block"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Clock size={11} />
                <span>{startTimeStr} - {endTimeStr}</span>
              </div>
            </div>
          </div>
        </div>
      );

      // 2. If there is a next slot, check if we need to render a break buffer gap
      const nextSlot = daySlots[i + 1];
      if (nextSlot) {
        const currentEnd = new Date(slot.endTime).getTime();
        const nextStart = new Date(nextSlot.startTime).getTime();
        const gapMinutes = Math.round((nextStart - currentEnd) / 60000);

        if (gapMinutes > 5) {
          // Render a Break element
          timelineElements.push(
            <div key={`break-${slot.id}`} className="timeline-break-wrapper" style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
              <div style={{ width: '55px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{formatTime(slot.endTime)}</div>
              </div>

              {/* Node connector line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '2px solid var(--bg-gradient-start)',
                    zIndex: 2 
                  }} 
                />
                <div style={{ width: '2px', flex: 1, background: 'rgba(255, 255, 255, 0.04)', minHeight: '30px' }} />
              </div>

              {/* Break details banner */}
              <div 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.4rem 1rem', 
                  marginBottom: '1rem', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px dashed rgba(255, 255, 255, 0.05)', 
                  borderRadius: '10px' 
                }}
              >
                <Coffee size={12} style={{ color: 'var(--accent-secondary)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Break buffer: <strong>{gapMinutes} minutes</strong> (stretch, hydrate, or rest)
                </span>
              </div>
            </div>
          );
        }
      }
    }

    return (
      <div className="vertical-timeline-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '1rem' }}>
        {timelineElements}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
      {/* Target Date Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={20} style={{ color: 'var(--accent-primary)' }} />
          Focus Timetable
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={handlePrevDay} style={{ padding: '0.35rem' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: '150px', textAlign: 'center' }}>
            {formatDateDisplay(targetDate)}
          </span>
          <button className="btn btn-ghost" onClick={handleNextDay} style={{ padding: '0.35rem' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Control Banner */}
      {daySlots.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              You have <strong>{daySlots.length} blocks</strong> scheduled today.
            </span>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleAutopilot}
            disabled={loading}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={12} />
            <span>Regenerate Day</span>
          </button>
        </div>
      )}

      {/* Main Timeline Display */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
          Generating schedule and slot assignments...
        </div>
      ) : (
        renderTimeline()
      )}
    </div>
  );
};
