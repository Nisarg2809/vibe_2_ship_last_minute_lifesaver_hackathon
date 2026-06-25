import { useState } from 'react';
import { apiRequest } from '../utils/api';
import { Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronUp, Sparkles, RefreshCw, Calendar, Clock } from 'lucide-react';

interface TasksProps {
  tasks: any[];
  onRefresh: () => void;
}

export default function Tasks({ tasks, onRefresh }: TasksProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('2');
  const [importance, setImportance] = useState(3);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [decomposingId, setDecomposingId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Add Task submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          estimatedDuration: Number(estimatedDuration),
          importance: Number(importance)
        })
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setDeadline('');
      setEstimatedDuration('2');
      setImportance(3);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add task.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Task
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiRequest(`/api/tasks/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Decompose task with AI
  const handleDecompose = async (id: string) => {
    setDecomposingId(id);
    try {
      await apiRequest(`/api/ai/tasks/${id}/decompose`, { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error('Decomposition error:', err);
      alert('Failed to decompose task using AI. Ensure your API key is correct.');
    } finally {
      setDecomposingId(null);
    }
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = async (task: any, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st: any) => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle full task complete
  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    try {
      await apiRequest(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Category tags
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical': return 'tag-critical';
      case 'high': return 'tag-high';
      case 'medium': return 'tag-medium';
      default: return 'tag-low';
    }
  };

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
            Task Board
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Manage and decompose your items. Priority levels are calculated automatically.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add New Task
        </button>
      </div>

      {/* Task Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const formattedDeadline = new Date(task.deadline).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const hasSubtasks = task.subtasks && task.subtasks.length > 0;

          return (
            <div
              key={task.id}
              className="glass-card"
              style={{
                padding: '20px',
                borderLeft: `4px solid ${
                  task.priority === 'critical' ? '#ff4b2b' :
                  task.priority === 'high' ? '#e100ff' :
                  task.priority === 'medium' ? '#00b4db' : '#38ef7d'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}
            >
              {/* Top Row: Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1 }}>
                  <button
                    onClick={() => handleToggleTaskStatus(task)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center' }}
                  >
                    {task.status === 'completed' ? <CheckSquare size={22} /> : <Square size={22} style={{ color: '#475569' }} />}
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? '#64748b' : '#fff'
                    }}>
                      {task.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {formattedDeadline}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {task.estimatedDuration} hrs
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span className={`${getPriorityStyle(task.priority)}`} style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {task.priority}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${task.progress}%`, height: '100%', background: 'var(--grad-royal)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc', minWidth: '35px', textAlign: 'right' }}>
                  {task.progress}%
                </span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {task.description && (
                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Subtasks Section */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a5b4fc' }}>Subtask breakdown</h4>
                      
                      {!hasSubtasks && (
                        <button
                          onClick={() => handleDecompose(task.id)}
                          className="btn-glass"
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            borderColor: '#818cf8',
                            color: '#a5b4fc'
                          }}
                          disabled={decomposingId === task.id}
                        >
                          {decomposingId === task.id ? (
                            <RefreshCw size={12} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          Decompose with AI
                        </button>
                      )}
                    </div>

                    {hasSubtasks ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {task.subtasks.map((subtask: any) => (
                          <div
                            key={subtask.id}
                            onClick={() => handleToggleSubtask(task, subtask.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {subtask.completed ? (
                                <CheckSquare size={16} style={{ color: '#818cf8' }} />
                              ) : (
                                <Square size={16} style={{ color: '#475569' }} />
                              )}
                              <span style={{
                                fontSize: '0.85rem',
                                textDecoration: subtask.completed ? 'line-through' : 'none',
                                color: subtask.completed ? '#64748b' : '#fff'
                              }}>
                                {subtask.title}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {subtask.estimatedDuration} hrs
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
                        No subtasks. Click "Decompose with AI" to automatically split this task.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#475569'
          }}>
            No tasks registered yet. Click "Add New Task" to begin!
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create New Task</h2>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 500 }}>Task Title</label>
                <input
                  type="text"
                  placeholder="Complete Physics Homework"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 500 }}>Description (Optional)</label>
                <textarea
                  placeholder="Drafting experiments and completing outline"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 500 }}>Deadline</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 500 }}>Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 500 }}>
                  <span>Importance Scale</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>{importance} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  style={{
                    accentColor: '#818cf8',
                    background: 'rgba(255,255,255,0.05)',
                    height: '6px',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-glass"
                  style={{ flexGrow: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flexGrow: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
