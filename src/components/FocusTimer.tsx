import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  AlertCircle,
  Zap
} from 'lucide-react';

export const FocusTimer: React.FC = () => {
  const { tasks, selectedPersona, completeSlot, timeSpentOnTask, schedule } = useApp();

  // Find next focus suggestion
  const getNextRecommendedFocus = () => {
    const personaTasks = tasks.filter(t => t.category === selectedPersona && !t.completed);
    
    // Sort tasks: urgent first, then high, then medium, then low
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...personaTasks].sort((a, b) => {
      const aVal = priorityOrder[a.priority] ?? 99;
      const bVal = priorityOrder[b.priority] ?? 99;
      if (aVal !== bVal) return aVal - bVal;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const targetTask = sorted[0];
    if (!targetTask) return null;

    const nextSubtask = targetTask.subtasks.find(sub => !sub.completed);
    return {
      task: targetTask,
      subtask: nextSubtask || null
    };
  };

  const recommendation = getNextRecommendedFocus();

  // Timer Configuration
  const [sessionLength, setSessionLength] = useState(25); // default 25 mins
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);

  const intervalRef = useRef<any | null>(null);

  // Sync timer length if recommendation changes (when not running)
  useEffect(() => {
    if (!timerRunning && !timerPaused) {
      if (recommendation?.subtask) {
        setSessionLength(recommendation.subtask.durationMinutes);
        setTimeLeft(recommendation.subtask.durationMinutes * 60);
      } else {
        setSessionLength(25);
        setTimeLeft(25 * 60);
      }
    }
  }, [recommendation?.subtask?.id, timerRunning, timerPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStart = () => {
    if (timerRunning) return;
    setTimerRunning(true);
    setTimerPaused(false);
    
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished!
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    if (!timerRunning) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerPaused(true);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerPaused(false);
    setTimeLeft(sessionLength * 60);
  };

  const handleTimerComplete = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerPaused(false);

    // Audio chime notification
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Chime failed to play due to audio context restrictions", e);
    }

    // Log focus minutes in state
    if (recommendation?.task) {
      timeSpentOnTask(recommendation.task.id, sessionLength);
    }
    
    alert(`🎉 Focus session complete! Logged ${sessionLength} minutes to your task.`);
    
    // Find matching scheduled slot for today and mark complete
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeSlot = schedule.find(s => 
      s.status === 'scheduled' && 
      s.startTime.slice(0, 10) === todayStr &&
      s.taskId === recommendation?.task.id &&
      s.subtaskId === recommendation?.subtask?.id
    );
    if (activeSlot) {
      completeSlot(activeSlot.id);
    }
  };

  // Format MM:SS
  const formatTimeStr = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border-focus)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-primary)' }}>
        <Timer size={18} />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Focus Sprint Timer</h3>
      </div>

      {recommendation ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              {recommendation.task.title}
            </h4>
            {recommendation.subtask && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.15rem' }}>
                <Zap size={10} /> Active step: {recommendation.subtask.title}
              </p>
            )}
          </div>

          {/* Time digits */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.25rem 0' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: '#fff', letterSpacing: '2px', textShadow: '0 0 10px var(--accent-primary-glow)' }}>
              {formatTimeStr(timeLeft)}
            </div>

            {/* Timer controls */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {!timerRunning ? (
                <button 
                  onClick={handleStart} 
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
                >
                  <Play size={14} /> Start
                </button>
              ) : (
                <button 
                  onClick={handlePause} 
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
                >
                  <Pause size={14} /> Pause
                </button>
              )}
              <button 
                onClick={handleReset} 
                className="btn btn-ghost"
                style={{ padding: '0.5rem', borderRadius: '8px', color: 'var(--text-muted)' }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${(timeLeft / (sessionLength * 60)) * 100}%`, 
                height: '100%', 
                background: 'var(--accent-primary)',
                transition: 'width 1s linear'
              }} 
            />
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '0.8rem' }}>No pending tasks in this profile. Create a task to start a focus timer.</span>
        </div>
      )}
    </div>
  );
};
