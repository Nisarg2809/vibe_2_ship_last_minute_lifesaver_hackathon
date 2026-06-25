import React from 'react';
import { useApp } from '../context/AppContext';
import { FocusTimer } from './FocusTimer';
import { 
  Compass, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Zap,
  BookOpen,
  Briefcase,
  Layers,
  RefreshCw
} from 'lucide-react';

interface DashboardProps {
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenSettings }) => {
  const { tasks, selectedPersona, setSelectedPersona, resetToSampleData } = useApp();

  // Filter tasks based on current category persona
  const personaTasks = tasks.filter(t => t.category === selectedPersona);
  const activeTasks = personaTasks.filter(t => !t.completed);
  const completedTasks = personaTasks.filter(t => t.completed);

  // Stats calculation
  const totalTasksCount = personaTasks.length;
  const completedCount = completedTasks.length;
  
  // Calculate completion percentage
  const completionRate = totalTasksCount > 0 
    ? Math.round((completedCount / totalTasksCount) * 100) 
    : 0;

  // Calculate total focus hours scheduled
  const totalFocusHours = personaTasks.reduce((acc, t) => acc + t.estimatedHours, 0);

  // Find next focus suggestion (highest priority incomplete subtask from the most urgent task)
  const getNextRecommendedFocus = () => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sortedActive = [...activeTasks].sort((a, b) => {
      const aVal = priorityOrder[a.priority] ?? 99;
      const bVal = priorityOrder[b.priority] ?? 99;
      if (aVal !== bVal) return aVal - bVal;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const targetTask = sortedActive[0];
    if (!targetTask) return null;

    const nextSubtask = targetTask.subtasks.find(sub => !sub.completed);
    return {
      task: targetTask,
      subtask: nextSubtask || null
    };
  };

  const recommendation = getNextRecommendedFocus();

  // Greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Good morning";
    if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
    if (hour >= 17) timeGreeting = "Good evening";

    switch(selectedPersona) {
      case 'student':
        return `${timeGreeting}, Rahul! 🎓`;
      case 'work':
        return `${timeGreeting}, Priya! 💻`;
      case 'entrepreneur':
        return `${timeGreeting}, Arjun! 🚀`;
      default:
        return `${timeGreeting}, Planner! 🤝`;
    }
  };

  const getPersonaDescription = () => {
    switch(selectedPersona) {
      case 'student':
        return "Goal: Prepare for upcoming exams, organize labs, and manage study schedules without late-night cramming.";
      case 'work':
        return "Goal: Balance meetings, complete deliverables, and structure deep focus blocks to avoid burnout.";
      case 'entrepreneur':
        return "Goal: Coordinate client pitches, follow up on deals, and keep multiple business deliverables moving.";
      default:
        return "Goal: Structure tasks and maintain momentum.";
    }
  };

  return (
    <div className="dashboard-panel animate-fade-in" style={{ padding: '1.5rem', overflowY: 'auto', height: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
            {getGreeting()}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {getPersonaDescription()}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={resetToSampleData} 
            title="Reset default demo tasks"
            style={{ padding: '0.5rem' }}
          >
            <RefreshCw size={16} />
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onOpenSettings}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Settings size={16} />
            <span>AI Config</span>
          </button>
        </div>
      </div>

      {/* Persona Quick Switcher */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Simulate User Persona
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <button 
            className={`btn ${selectedPersona === 'student' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPersona('student')}
            style={{ padding: '0.5rem' }}
          >
            <BookOpen size={14} style={{ marginRight: '4px' }} />
            Rahul (Student)
          </button>
          <button 
            className={`btn ${selectedPersona === 'work' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPersona('work')}
            style={{ padding: '0.5rem' }}
          >
            <Briefcase size={14} style={{ marginRight: '4px' }} />
            Priya (Engineer)
          </button>
          <button 
            className={`btn ${selectedPersona === 'entrepreneur' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedPersona('entrepreneur')}
            style={{ padding: '0.5rem' }}
          >
            <Zap size={14} style={{ marginRight: '4px' }} />
            Arjun (Founder)
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card animate-slide-up" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent-primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Completion Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{completionRate}%</div>
          </div>
        </div>

        <div className="glass-card animate-slide-up" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', animationDelay: '0.1s' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent-secondary)' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Active Tasks</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{activeTasks.length} / {totalTasksCount}</div>
          </div>
        </div>

        <div className="glass-card animate-slide-up" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', animationDelay: '0.2s' }}>
          <div style={{ background: 'rgba(46, 213, 115, 0.15)', padding: '0.75rem', borderRadius: '12px', color: 'var(--status-success)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Focus Scheduled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>{totalFocusHours} hrs</div>
          </div>
        </div>
      </div>

      {/* Focus Timer & Suggestion panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Sprint Timer */}
        <FocusTimer />

        {/* AI suggested details */}
        <div className="glass-panel animate-slide-up" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)', animationDelay: '0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
            <Compass size={20} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Suggested Action Plan</h2>
          </div>

          {recommendation ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Based on priority and deadline, complete this item in your next focus slot:
              </p>
              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className={`badge badge-${recommendation.task.priority}`}>
                    {recommendation.task.priority}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {recommendation.task.estimatedHours}h total
                  </span>
                </div>
                
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {recommendation.task.title}
                </h4>

                {recommendation.subtask ? (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Immediate Next Action Step:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(6, 182, 212, 0.05)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px dashed var(--border-focus)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={14} style={{ color: 'var(--accent-secondary)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {recommendation.subtask.title}
                        </span>
                      </div>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        {recommendation.subtask.durationMinutes} mins
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', color: 'var(--status-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={14} /> Core subtasks complete! You can mark the main task as done.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={32} style={{ color: 'var(--status-success)', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                All caught up! No active tasks in this persona.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Create a new task in the Planning tab to begin.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
