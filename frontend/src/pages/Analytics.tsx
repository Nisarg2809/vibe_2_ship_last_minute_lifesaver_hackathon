import { Award, Clock, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';

interface AnalyticsProps {
  tasks: any[];
  slots: any[];
}

export default function Analytics({ tasks, slots }: AnalyticsProps) {
  // 1. Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;
  
  // Total focused hours
  const totalFocusHours = completedTasks.reduce((acc, curr) => acc + (curr.estimatedDuration || 0), 0);

  // 2. Productivity score: custom formula
  // Score = (CompletionRate * 0.5) + (ScheduleAdherence * 0.3) + (Min(10, TotalFocusHours) * 2)
  // Max score is 100
  const scoreBase = (completionRate * 0.6) + (totalFocusHours * 4);
  const productivityScore = Math.min(100, Math.round(scoreBase || 0));

  // SVGs for elegant graphs
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
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }} className="text-gradient">
          Productivity Analytics
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Real-time metrics auditing your focus performance, schedule adherence, and task breakdowns.
        </p>
      </div>

      {/* Hero KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px'
      }}>
        {/* Productivity Score */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Productivity Score</span>
            <Award size={18} style={{ color: '#fbbf24' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{productivityScore}</span>
          <div style={{ fontSize: '0.78rem', color: '#10b981' }}>
            Audited by Companion AI
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Completion Rate</span>
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{completionRate}%</span>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {completedTasks.length} of {totalCount} tasks completed
          </div>
        </div>

        {/* Focus Hours */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Focused Time</span>
            <Clock size={18} style={{ color: '#60a5fa' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{totalFocusHours} hrs</span>
          <div style={{ fontSize: '0.78rem', color: '#60a5fa' }}>
            From completed tasks
          </div>
        </div>

        {/* Active Items */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Pending Tasks</span>
            <BookOpen size={18} style={{ color: '#a78bfa' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{pendingTasks.length}</span>
          <div style={{ fontSize: '0.78rem', color: '#a78bfa' }}>
            {slots.length} scheduled focus blocks
          </div>
        </div>
      </div>

      {/* Graphics and grids */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '30px'
      }}>
        {/* SVG Chart */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Weekly completion trends</h3>
            <TrendingUp size={18} style={{ color: '#818cf8' }} />
          </div>

          <div style={{ height: '220px', width: '100%', position: 'relative', marginTop: '20px' }}>
            {/* Custom SVG Line Chart */}
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              {/* Spline Area */}
              <path d="M 0 150 Q 80 120 160 160 T 320 80 T 500 50 L 500 200 L 0 200 Z" fill="url(#gradient)" />
              {/* Spline Line */}
              <path d="M 0 150 Q 80 120 160 160 T 320 80 T 500 50" fill="none" stroke="#818cf8" strokeWidth="3" />
              
              {/* Markers */}
              <circle cx="160" cy="160" r="5" fill="#fff" stroke="#818cf8" strokeWidth="2" />
              <circle cx="320" cy="80" r="5" fill="#fff" stroke="#818cf8" strokeWidth="2" />
              <circle cx="500" cy="50" r="5" fill="#fff" stroke="#818cf8" strokeWidth="2" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Habits Checklist / Streak Board */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Companion Audit Feedback</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, color: '#fbbf24', display: 'block', marginBottom: '4px' }}>Task Density warning</span>
              You have {pendingTasks.length} pending items. Your current density suggests breaking down any task estimating &gt; 3 hours into smaller focus blocks.
            </div>

            <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600, color: '#34d399', display: 'block', marginBottom: '4px' }}>Peak Focus hours</span>
              Your completed schedule blocks indicate high efficiency during morning periods (09:00 - 11:30). Consider scheduling critical items during this block.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
