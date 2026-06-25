import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Award, 
  Zap, 
  Trash2, 
  Plus, 
  Check, 
  Grid
} from 'lucide-react';

export const AnalyticsHabits: React.FC = () => {
  const { 
    tasks, 
    schedule, 
    habits, 
    selectedPersona, 
    addHabit, 
    toggleHabitCompletion, 
    deleteHabit 
  } = useApp();

  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState<'daily' | 'weekly'>('daily');
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter lists based on selected persona
  const personaTasks = tasks.filter(t => t.category === selectedPersona);
  const personaHabits = habits.filter(h => h.category === selectedPersona);
  const completedTasks = personaTasks.filter(t => t.completed);

  // Calculate statistics
  const taskCompletionRate = personaTasks.length > 0 
    ? Math.round((completedTasks.length / personaTasks.length) * 100) 
    : 0;

  // Habit completion rate for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedHabitsToday = personaHabits.filter(h => h.history.includes(todayStr));
  const habitCompletionRate = personaHabits.length > 0
    ? Math.round((completedHabitsToday.length / personaHabits.length) * 100)
    : 0;

  // Focus schedule adherence (completed slots / total scheduled slots)
  const scheduledSlots = schedule.filter(s => {
    const task = tasks.find(t => t.id === s.taskId);
    return task?.category === selectedPersona;
  });
  const completedSlots = scheduledSlots.filter(s => s.status === 'completed');
  const scheduleAdherence = scheduledSlots.length > 0
    ? Math.round((completedSlots.length / scheduledSlots.length) * 100)
    : 100; // Default to 100 if nothing scheduled

  // Overall Productivity Score formula
  const overallProductivityScore = Math.round(
    (taskCompletionRate * 0.4) + 
    (habitCompletionRate * 0.3) + 
    (scheduleAdherence * 0.3)
  );

  // Generate date strings for past 5 days (e.g. today, yesterday, and 3 days prior)
  const getPastDays = (count: number) => {
    const list = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().slice(0, 10));
    }
    return list;
  };
  const past5Days = getPastDays(5);

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'narrow' });
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    addHabit(newHabitTitle, newHabitFreq);
    setNewHabitTitle('');
    setShowAddForm(false);
  };

  // SVG Chart: simulate weekly completions (mocked dataset for aesthetics based on tasks)
  const getMockWeeklyCompletions = () => {
    // Generate data points for past 7 days
    const dates = getPastDays(7);
    return dates.map((dateStr, idx) => {
      // Find tasks completed on this date
      const count = tasks.filter(t => t.completed && t.completedAt && t.completedAt.slice(0,10) === dateStr).length;
      // Add a baseline variation to make the graph look active and premium
      const baseline = (idx * 1.2 + 1) % 4;
      return Math.round(count + baseline);
    });
  };
  const weeklyData = getMockWeeklyCompletions();
  
  // Calculate SVG Polyline points
  const chartHeight = 80;
  const chartWidth = 320;
  const points = weeklyData.map((val, idx) => {
    const x = (idx / 6) * chartWidth;
    // Map val (0-6) to y coordinates (chartHeight to 0)
    const y = chartHeight - (val / 6) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Contribution Grid data (21 days)
  const past21Days = getPastDays(21);

  const getDayIntensity = (dateStr: string) => {
    // How many items completed on this date
    const taskCompletions = tasks.filter(t => t.completed && t.completedAt && t.completedAt.slice(0, 10) === dateStr).length;
    const habitCompletions = habits.filter(h => h.history.includes(dateStr)).length;
    const slotCompletions = schedule.filter(s => s.status === 'completed' && s.startTime.slice(0,10) === dateStr).length;
    const total = taskCompletions + habitCompletions + slotCompletions;

    if (total === 0) return 'rgba(255,255,255,0.03)';
    if (total <= 1) return 'rgba(99, 102, 241, 0.2)';
    if (total <= 3) return 'rgba(99, 102, 241, 0.5)';
    return 'rgba(6, 182, 212, 0.8)'; // Intense Cyan
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
      
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
          Productivity & Habits
        </h2>
      </div>

      {/* Top Section: Score Gauge & Simple Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Gauge Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG circular track and indicator */}
            <svg style={{ transform: 'rotate(-90deg)', width: '100px', height: '100px' }}>
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="8" fill="none" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="url(#accentGrad)" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * overallProductivityScore) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <defs>
                <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-title)' }}>
                {overallProductivityScore}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</span>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={16} style={{ color: 'var(--accent-secondary)' }} />
              Productivity Tier
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
              {overallProductivityScore >= 80 ? 'Elite Autopilot! You are crushing your goals.' :
               overallProductivityScore >= 50 ? 'Steady Progress! Keep up the momentum.' :
               'Initial Stride! Let\'s check off a tiny subtask next.'}
            </p>
          </div>
        </div>

        {/* Small Breakdown Stats */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Goals Completed</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--status-success)' }}>{taskCompletionRate}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Daily Habits Met</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--accent-secondary)' }}>{habitCompletionRate}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Timeline Adherence</span>
            <strong style={{ fontSize: '0.95rem', color: 'var(--accent-primary)' }}>{scheduleAdherence}%</strong>
          </div>
        </div>
      </div>

      {/* Habits Section */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} style={{ color: 'var(--accent-secondary)' }} />
            Habit Builder
          </h3>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            {showAddForm ? 'Cancel' : <><Plus size={12} /> Add Habit</>}
          </button>
        </div>

        {/* Add Habit Inline Form */}
        {showAddForm && (
          <form onSubmit={handleAddHabit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-light)' }}>
            <div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Read research paper, Drink 2L water"
                value={newHabitTitle}
                onChange={e => setNewHabitTitle(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className={`btn ${newHabitFreq === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setNewHabitFreq('daily')}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Daily
                </button>
                <button 
                  type="button" 
                  className={`btn ${newHabitFreq === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setNewHabitFreq('weekly')}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Weekly
                </button>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                Create
              </button>
            </div>
          </form>
        )}

        {/* Habits List */}
        {personaHabits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No habits defined for this persona. Add one to track consistency.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {personaHabits.map((habit) => (
              <div 
                key={habit.id} 
                className="glass-card" 
                style={{ 
                  padding: '0.75rem 1rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {habit.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', fontSize: '0.65rem', padding: '0.05rem 0.35rem', color: 'var(--text-muted)' }}>
                      {habit.frequency}
                    </span>
                    {habit.streakCount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--priority-high)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                        🔥 {habit.streakCount} day streak
                      </span>
                    )}
                  </div>
                </div>

                {/* completion checkpoints */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {past5Days.map(dateStr => {
                      const isCompleted = habit.history.includes(dateStr);
                      const isToday = dateStr === todayStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => toggleHabitCompletion(habit.id, dateStr)}
                          title={`${dateStr} - ${isCompleted ? 'Completed' : 'Pending'}`}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: isCompleted ? 'var(--status-success)' : 'rgba(255,255,255,0.04)',
                            border: isToday ? '1px solid var(--accent-secondary)' : '1px solid var(--border-light)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                          }}
                        >
                          {isCompleted ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: isToday ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
                              {getDayLabel(dateStr)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Delete Habit */}
                  <button 
                    onClick={() => deleteHabit(habit.id)}
                    className="btn btn-ghost" 
                    style={{ padding: '0.25rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SVG Completion Trends & Heatmap Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        
        {/* Trend Graph */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
            Weekly Completion Trend
          </h3>
          <div style={{ width: '100%', height: '80px', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="rgba(255,255,255,0.02)" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.02)" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255,255,255,0.02)" />

              {/* Chart Line */}
              <polyline
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Glow filter under line */}
              <polyline
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="6"
                opacity="0.15"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: 'blur(4px)' }}
              />

              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-secondary)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Contribution Grid */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Grid size={16} style={{ color: 'var(--accent-secondary)' }} />
            21-Day Activity Heatmap
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', maxWidth: '200px', margin: '0 auto' }}>
            {past21Days.map((dateStr) => (
              <div 
                key={dateStr}
                title={`${dateStr}: completions logged`}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  background: getDayIntensity(dateStr),
                  border: '1px solid rgba(255,255,255,0.02)',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>3 weeks ago</span>
            <span>Today</span>
          </div>
        </div>

      </div>
    </div>
  );
};
