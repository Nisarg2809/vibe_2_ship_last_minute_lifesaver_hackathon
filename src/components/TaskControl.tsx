import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Task } from '../services/ai';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';

export const TaskControl: React.FC = () => {
  const { tasks, selectedPersona, addNewTask, deleteTask, toggleSubtask, toggleTaskCompletion, loading } = useApp();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [showAddForm, setShowAddForm] = useState(false);

  // Expanded Tasks State (to track which task details/subtasks are open)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Filter tasks based on current selected persona
  const personaTasks = tasks.filter(t => t.category === selectedPersona);
  const activeTasks = personaTasks.filter(t => !t.completed);
  const completedTasks = personaTasks.filter(t => t.completed);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Submit new task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    await addNewTask(title, description, deadline, estimatedHours, selectedPersona);

    // Reset form
    setTitle('');
    setDescription('');
    setDeadline('');
    setEstimatedHours(2);
    setShowAddForm(false);
  };

  const getPriorityBorderClass = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'task-card-border-urgent';
      case 'high': return 'task-card-border-high';
      case 'medium': return 'task-card-border-medium';
      default: return 'task-card-border-low';
    }
  };

  // Render a single task card
  const renderTaskCard = (task: Task) => {
    const isExpanded = expandedTasks[task.id];
    const daysRemaining = Math.max(0, Math.ceil((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
      <div 
        key={task.id} 
        className={`glass-card animate-slide-up ${getPriorityBorderClass(task.priority)}`}
        style={{ 
          marginBottom: '1rem', 
          opacity: task.completed ? 0.7 : 1,
          padding: '1.25rem' 
        }}
      >
        {/* Card Main Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: 1 }}>
            <button 
              onClick={() => toggleTaskCompletion(task.id)}
              style={{ background: 'none', border: 'none', color: task.completed ? 'var(--status-success)' : 'var(--text-muted)', cursor: 'pointer', paddingTop: '0.2rem' }}
            >
              {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontSize: '1.05rem', 
                fontWeight: 600, 
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' 
              }}>
                {task.title}
              </h3>
              {task.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={`badge badge-${task.priority}`}>
              {task.priority}
            </span>
            <button 
              onClick={() => deleteTask(task.id)}
              className="btn btn-ghost"
              style={{ padding: '0.25rem', color: 'var(--priority-urgent)' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Info Grid (Deadline and Duration) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Calendar size={14} />
            <span>
              Due: {new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {!task.completed && (
                <strong style={{ marginLeft: '0.5rem', color: daysRemaining <= 1 ? 'var(--priority-urgent)' : 'inherit' }}>
                  ({daysRemaining}d left)
                </strong>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} />
            <span>Est: {task.estimatedHours} hrs</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${task.progress}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                borderRadius: '3px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Decomposed Subtasks Expansion Trigger */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => toggleExpand(task.id)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-secondary)' }}>
                <Sparkles size={12} />
                AI Decomposition checklist ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
              </span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Subtasks List */}
            {isExpanded && (
              <div className="animate-slide-up" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                {task.subtasks.map((subtask) => (
                  <div 
                    key={subtask.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.5rem', 
                      background: 'rgba(0,0,0,0.15)', 
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtask(task.id, subtask.id)}
                        style={{ accentColor: 'var(--accent-secondary)', width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: subtask.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                        textDecoration: subtask.completed ? 'line-through' : 'none'
                      }}>
                        {subtask.title}
                      </span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {subtask.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
      
      {/* Header with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Task Schedule & Planning
        </h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
        >
          {showAddForm ? 'Cancel' : <><Plus size={14} /> Add Task</>}
        </button>
      </div>

      {/* Add Task Form (Inline slide-down) */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-panel animate-slide-up" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Sparkles size={16} /> Describe New Goal
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Task Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Study for midterm exam" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Description / Focus Details</label>
              <textarea 
                className="form-input" 
                placeholder="Details help the AI break it down better..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Deadline Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Est. Hours: {estimatedHours}h</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="10" 
                  step="0.5"
                  value={estimatedHours} 
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value))} 
                  style={{ width: '100%', height: '36px', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', position: 'relative' }}
            >
              {loading ? (
                <span>Decomposing with AI...</span>
              ) : (
                <><Sparkles size={16} /> Create & Decompose Task</>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Dynamic Instruction Nudge */}
      {activeTasks.length === 0 && !showAddForm && (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(99,102,241,0.05)', display: 'flex', gap: '0.5rem' }}>
          <Info size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            All clear! Click the <strong>Add Task</strong> button above to input a goal. FocusAI will automatically analyze its urgency and split it into actionable milestones.
          </p>
        </div>
      )}

      {/* Loading overlay when editing/adding */}
      {loading && !showAddForm && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>
          Updating schedules and decomposing tasks...
        </div>
      )}

      {/* Task List Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {activeTasks.map(renderTaskCard)}

        {/* Collapsible Completed Section */}
        {completedTasks.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Completed Items ({completedTasks.length})
            </h3>
            {completedTasks.map(renderTaskCard)}
          </div>
        )}
      </div>
    </div>
  );
};
