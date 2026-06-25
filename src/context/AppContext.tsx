import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculatePriorityHeuristic, decomposeTask, getAICoachResponse, generateSchedule } from '../services/ai';
import type { Task, SubTask, ChatMessage, ScheduleSlot, Reminder, Habit, UserAccount } from '../services/ai';

interface AppContextType {
  currentUser: UserAccount | null;
  tasks: Task[];
  schedule: ScheduleSlot[];
  reminders: Reminder[];
  habits: Habit[];
  apiKey: string | null;
  chatHistory: ChatMessage[];
  selectedPersona: 'student' | 'work' | 'entrepreneur' | 'personal';
  loading: boolean;
  setApiKey: (key: string) => void;
  setSelectedPersona: (persona: 'student' | 'work' | 'entrepreneur' | 'personal') => void;
  addNewTask: (title: string, description: string, deadline: string, estimatedHours: number, category: 'student' | 'work' | 'entrepreneur' | 'personal') => Promise<void>;
  deleteTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  resetToSampleData: () => void;

  // Authentication Actions
  login: (email: string, passwordHash: string) => boolean;
  register: (name: string, email: string, passwordHash: string, persona: 'student' | 'work' | 'entrepreneur' | 'personal') => boolean;
  logout: () => void;

  // Scheduler Actions
  generateDaySchedule: (dateStr: string) => Promise<void>;
  completeSlot: (slotId: string) => void;
  skipSlot: (slotId: string) => void;
  deleteSlot: (slotId: string) => void;

  // Habit Actions
  addHabit: (title: string, frequency: 'daily' | 'weekly') => void;
  toggleHabitCompletion: (habitId: string, dateStr: string) => void;
  deleteHabit: (habitId: string) => void;

  // Reminder Actions
  dismissReminder: (reminderId: string) => void;

  // Focus Timer Actions
  timeSpentOnTask: (taskId: string, minutes: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Core initial mock data matching user personas
const getSampleTasks = (): Task[] => {
  const today = new Date();
  
  const getFutureDateString = (daysOffset: number, hoursOffset = 18): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hoursOffset, 0, 0, 0);
    return d.toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm
  };

  return [
    // Rahul (Student) tasks
    {
      id: 'task-student-1',
      title: 'Prepare for Physics Final Exam',
      description: 'Review mechanics, wave formulas, and solve mock question paper.',
      deadline: getFutureDateString(1), // Tomorrow
      priority: 'urgent',
      estimatedHours: 4,
      completed: false,
      progress: 33,
      category: 'student',
      subtasks: [
        { id: 'sub-s1-1', title: 'Review lecture notes & formula sheets', durationMinutes: 90, completed: true },
        { id: 'sub-s1-2', title: 'Solve 2025 practice exam questions', durationMinutes: 90, completed: false },
        { id: 'sub-s1-3', title: 'Active recall summary review', durationMinutes: 60, completed: false },
      ]
    },
    {
      id: 'task-student-2',
      title: 'Write Chemistry Lab Report',
      description: 'Submit report covering thermodynamics experiment data & analysis.',
      deadline: getFutureDateString(4),
      priority: 'medium',
      estimatedHours: 3,
      completed: false,
      progress: 0,
      category: 'student',
      subtasks: [
        { id: 'sub-s2-1', title: 'Plot temperature/volume graph in Sheets', durationMinutes: 45, completed: false },
        { id: 'sub-s2-2', title: 'Write discussion & source of error sections', durationMinutes: 90, completed: false },
        { id: 'sub-s2-3', title: 'Proofread and format report PDF', durationMinutes: 45, completed: false },
      ]
    },
    // Priya (Professional) tasks
    {
      id: 'task-prof-1',
      title: 'Sprint Retrospective & Demo Prep',
      description: 'Analyze sprint velocity charts and coordinate team slides.',
      deadline: getFutureDateString(2),
      priority: 'high',
      estimatedHours: 2.5,
      completed: false,
      progress: 50,
      category: 'work',
      subtasks: [
        { id: 'sub-p1-1', title: 'Collect developer velocity data from Jira', durationMinutes: 60, completed: true },
        { id: 'sub-p1-2', title: 'Create presentation slides outlining blockers', durationMinutes: 90, completed: false },
      ]
    },
    {
      id: 'task-prof-2',
      title: 'Refactor Core Payment Service API',
      description: 'Migrate legacy payment service code to typescript interfaces and add error boundaries.',
      deadline: getFutureDateString(6),
      priority: 'low',
      estimatedHours: 6,
      completed: false,
      progress: 0,
      category: 'work',
      subtasks: [
        { id: 'sub-p2-1', title: 'Document existing payment flow bottlenecks', durationMinutes: 60, completed: false },
        { id: 'sub-p2-2', title: 'Write types & interfaces for Stripe webhooks', durationMinutes: 120, completed: false },
        { id: 'sub-p2-3', title: 'Refactor handler logic & add Jest unit tests', durationMinutes: 180, completed: false },
      ]
    },
    // Arjun (Entrepreneur) tasks
    {
      id: 'task-ent-1',
      title: 'Follow up on TechCorp Enterprise Proposal',
      description: 'Negotiate service level agreements (SLAs) and secure contract signature.',
      deadline: getFutureDateString(0, 15), // Due today!
      priority: 'urgent',
      estimatedHours: 1.5,
      completed: false,
      progress: 0,
      category: 'entrepreneur',
      subtasks: [
        { id: 'sub-e1-1', title: 'Review SLA terms adjustments', durationMinutes: 30, completed: false },
        { id: 'sub-e1-2', title: 'Call Client VP of Procurement', durationMinutes: 30, completed: false },
        { id: 'sub-e1-3', title: 'Draft and email follow-up proposal', durationMinutes: 30, completed: false },
      ]
    }
  ];
};

const getSampleHabits = (): Habit[] => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: 'h1', title: 'Review lecture formulas', category: 'student', frequency: 'daily', streakCount: 4, lastCompletedDate: yesterday, history: [yesterday] },
    { id: 'h2', title: 'Solve 1 practice question', category: 'student', frequency: 'daily', streakCount: 2, lastCompletedDate: yesterday, history: [yesterday] },
    { id: 'h3', title: 'Check Jira Board Sync', category: 'work', frequency: 'daily', streakCount: 7, lastCompletedDate: today, history: [today] },
    { id: 'h4', title: 'Write Weekly Progress Report', category: 'work', frequency: 'weekly', streakCount: 1, lastCompletedDate: null, history: [] },
    { id: 'h5', title: 'Call 2 Client Contacts', category: 'entrepreneur', frequency: 'daily', streakCount: 0, lastCompletedDate: null, history: [] },
  ];
};

const getSampleSchedule = (): ScheduleSlot[] => {
  const todayStr = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 'slot-1',
      taskId: 'task-student-1',
      subtaskId: 'sub-s1-2',
      startTime: `${todayStr}T14:00:00.000Z`,
      endTime: `${todayStr}T15:30:00.000Z`,
      status: 'scheduled'
    },
    {
      id: 'slot-2',
      taskId: 'task-student-2',
      subtaskId: 'sub-s2-1',
      startTime: `${todayStr}T16:00:00.000Z`,
      endTime: `${todayStr}T16:45:00.000Z`,
      status: 'scheduled'
    }
  ];
};

const getSampleReminders = (): Reminder[] => {
  return [
    {
      id: 'rem-1',
      taskId: 'task-student-1',
      subtaskId: 'sub-s1-2',
      triggerTime: new Date(Date.now() + 600000).toISOString(),
      type: 'pre_task_nudge',
      message: 'Focus slot: "Prepare for Physics Final Exam" starts in 10 minutes! Assemble your textbook and practice sheets.',
      status: 'pending'
    }
  ];
};

const defaultChatHistory: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: "Welcome! I'm **FocusAI**, your personal AI Productivity Coach. 🧠✨\n\nI can help you prioritize your day, break down complex tasks into tiny manageable pieces, and give you motivation when you feel stuck.\n\nType **`help`** or ask me anything about your current workload to get started!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [apiKey, setApiKeyStore] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<'student' | 'work' | 'entrepreneur' | 'personal'>('student');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize global config (API key, session)
  useEffect(() => {
    const localApiKey = localStorage.getItem('focusai_apikey');
    const localCurrentUser = localStorage.getItem('focusai_current_user');
    const localPersona = localStorage.getItem('focusai_persona');

    if (localApiKey) {
      setApiKeyStore(localApiKey);
    }

    if (localCurrentUser) {
      setCurrentUser(JSON.parse(localCurrentUser));
    }

    if (localPersona) {
      setSelectedPersona(localPersona as any);
    }

    setLoading(false);
  }, []);

  // Load user-partitioned data whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setSchedule([]);
      setReminders([]);
      setHabits([]);
      setChatHistory(defaultChatHistory);
      return;
    }

    const localTasks = localStorage.getItem(`focusai_tasks_${currentUser.id}`);
    const localChat = localStorage.getItem(`focusai_chat_${currentUser.id}`);
    const localSchedule = localStorage.getItem(`focusai_schedule_${currentUser.id}`);
    const localReminders = localStorage.getItem(`focusai_reminders_${currentUser.id}`);
    const localHabits = localStorage.getItem(`focusai_habits_${currentUser.id}`);

    if (localTasks) {
      setTasks(JSON.parse(localTasks));
    } else {
      const initialTasks = getSampleTasks().filter(t => t.category === currentUser.persona);
      setTasks(initialTasks);
      localStorage.setItem(`focusai_tasks_${currentUser.id}`, JSON.stringify(initialTasks));
    }

    if (localChat) {
      setChatHistory(JSON.parse(localChat));
    } else {
      setChatHistory(defaultChatHistory);
      localStorage.setItem(`focusai_chat_${currentUser.id}`, JSON.stringify(defaultChatHistory));
    }

    if (localSchedule) {
      setSchedule(JSON.parse(localSchedule));
    } else {
      const initialSchedule = getSampleSchedule();
      setSchedule(initialSchedule);
      localStorage.setItem(`focusai_schedule_${currentUser.id}`, JSON.stringify(initialSchedule));
    }

    if (localReminders) {
      setReminders(JSON.parse(localReminders));
    } else {
      const initialReminders = getSampleReminders();
      setReminders(initialReminders);
      localStorage.setItem(`focusai_reminders_${currentUser.id}`, JSON.stringify(initialReminders));
    }

    if (localHabits) {
      setHabits(JSON.parse(localHabits));
    } else {
      const initialHabits = getSampleHabits().filter(h => h.category === currentUser.persona);
      setHabits(initialHabits);
      localStorage.setItem(`focusai_habits_${currentUser.id}`, JSON.stringify(initialHabits));
    }

  }, [currentUser]);

  // Save changes helpers writing to partitioned keys
  const saveTasks = (newTasks: Task[]) => {
    const updated = calculatePriorityHeuristic(newTasks);
    setTasks(updated);
    if (currentUser) {
      localStorage.setItem(`focusai_tasks_${currentUser.id}`, JSON.stringify(updated));
    }
  };

  const saveSchedule = (newSchedule: ScheduleSlot[]) => {
    setSchedule(newSchedule);
    if (currentUser) {
      localStorage.setItem(`focusai_schedule_${currentUser.id}`, JSON.stringify(newSchedule));
    }
  };

  const saveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
    if (currentUser) {
      localStorage.setItem(`focusai_reminders_${currentUser.id}`, JSON.stringify(newReminders));
    }
  };

  const saveHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    if (currentUser) {
      localStorage.setItem(`focusai_habits_${currentUser.id}`, JSON.stringify(newHabits));
    }
  };

  const setApiKey = (key: string) => {
    setApiKeyStore(key);
    localStorage.setItem('focusai_apikey', key);
  };

  const setSelectedPersonaAndSave = (persona: 'student' | 'work' | 'entrepreneur' | 'personal') => {
    setSelectedPersona(persona);
    localStorage.setItem('focusai_persona', persona);
  };

  // Authentication services
  const login = (email: string, passwordHash: string): boolean => {
    const usersStr = localStorage.getItem('focusai_users');
    const users: UserAccount[] = usersStr ? JSON.parse(usersStr) : [];
    const matched = users.find(u => u.email === email && u.passwordHash === passwordHash);
    
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('focusai_current_user', JSON.stringify(matched));
      setSelectedPersona(matched.persona);
      localStorage.setItem('focusai_persona', matched.persona);
      return true;
    }
    return false;
  };

  const register = (
    name: string, 
    email: string, 
    passwordHash: string, 
    persona: 'student' | 'work' | 'entrepreneur' | 'personal'
  ): boolean => {
    const usersStr = localStorage.getItem('focusai_users');
    const users: UserAccount[] = usersStr ? JSON.parse(usersStr) : [];
    
    if (users.some(u => u.email === email)) {
      return false; // Conflict
    }

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash,
      persona
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('focusai_users', JSON.stringify(updatedUsers));
    
    setCurrentUser(newUser);
    localStorage.setItem('focusai_current_user', JSON.stringify(newUser));
    setSelectedPersona(persona);
    localStorage.setItem('focusai_persona', persona);

    // Bootstrap local templates for user
    const defaultTasks = getSampleTasks().filter(t => t.category === persona);
    const defaultSchedule = getSampleSchedule().filter(s => {
      const t = getSampleTasks().find(task => task.id === s.taskId);
      return t?.category === persona;
    });
    const defaultHabits = getSampleHabits().filter(h => h.category === persona);
    const defaultReminders = getSampleReminders().filter(r => {
      const t = getSampleTasks().find(task => task.id === r.taskId);
      return t?.category === persona;
    });

    localStorage.setItem(`focusai_tasks_${newUser.id}`, JSON.stringify(defaultTasks));
    localStorage.setItem(`focusai_schedule_${newUser.id}`, JSON.stringify(defaultSchedule));
    localStorage.setItem(`focusai_habits_${newUser.id}`, JSON.stringify(defaultHabits));
    localStorage.setItem(`focusai_reminders_${newUser.id}`, JSON.stringify(defaultReminders));
    localStorage.setItem(`focusai_chat_${newUser.id}`, JSON.stringify(defaultChatHistory));

    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('focusai_current_user');
    setTasks([]);
    setSchedule([]);
    setReminders([]);
    setHabits([]);
    setChatHistory(defaultChatHistory);
  };

  // Add new task
  const addNewTask = async (
    title: string,
    description: string,
    deadline: string,
    estimatedHours: number,
    category: 'student' | 'work' | 'entrepreneur' | 'personal'
  ) => {
    setLoading(true);
    try {
      const generated = await decomposeTask(title, description, estimatedHours, apiKey);
      
      const newSubtasks: SubTask[] = generated.map((sub, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: sub.title,
        durationMinutes: sub.durationMinutes,
        completed: false,
      }));

      const newTask: Task = {
        id: `task-${Date.now()}`,
        title,
        description,
        deadline,
        priority: 'low',
        estimatedHours,
        completed: false,
        subtasks: newSubtasks,
        progress: 0,
        category,
        timeSpentMinutes: 0
      };

      saveTasks([...tasks, newTask]);
    } catch (e) {
      console.error('Failed to add task', e);
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = (id: string) => {
    const filtered = tasks.filter((t) => t.id !== id);
    saveTasks(filtered);
    saveSchedule(schedule.filter(s => s.taskId !== id));
  };

  // Toggle Subtask Completion
  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map((sub) => {
          if (sub.id === subtaskId) {
            return { ...sub, completed: !sub.completed };
          }
          return sub;
        });

        const completedCount = updatedSubtasks.filter((s) => s.completed).length;
        const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
        const completed = progress === 100;

        return {
          ...task,
          subtasks: updatedSubtasks,
          progress,
          completed,
          completedAt: completed ? new Date().toISOString() : null
        };
      }
      return task;
    });

    saveTasks(updated);
  };

  // Toggle full task completion
  const toggleTaskCompletion = (taskId: string) => {
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const completed = !task.completed;
        const updatedSubtasks = task.subtasks.map((sub) => ({
          ...sub,
          completed: completed,
        }));
        return {
          ...task,
          completed,
          progress: completed ? 100 : 0,
          subtasks: updatedSubtasks,
          completedAt: completed ? new Date().toISOString() : null
        };
      }
      return task;
    });
    saveTasks(updated);
  };

  // Scheduler actions
  const generateDaySchedule = async (dateStr: string) => {
    setLoading(true);
    try {
      const slots = await generateSchedule(tasks, "09:00", "18:00", dateStr, apiKey);
      const scheduleSlots: ScheduleSlot[] = slots.map((s, idx) => ({
        ...s,
        id: `slot-${Date.now()}-${idx}`
      }));
      const otherDaysSlots = schedule.filter(s => s.startTime.slice(0, 10) !== dateStr);
      saveSchedule([...otherDaysSlots, ...scheduleSlots]);

      // Generate corresponding reminders
      const newReminders: Reminder[] = scheduleSlots.map((slot, idx) => {
        const task = tasks.find(t => t.id === slot.taskId);
        const sub = task?.subtasks.find(st => st.id === slot.subtaskId);
        return {
          id: `rem-${Date.now()}-${idx}`,
          taskId: slot.taskId,
          subtaskId: slot.subtaskId,
          triggerTime: new Date(new Date(slot.startTime).getTime() - 10 * 60 * 1000).toISOString(),
          type: 'pre_task_nudge',
          message: `Focus slot: "${task?.title || 'Goal'}"${sub ? ` - Subtask: ${sub.title}` : ''} starting in 10 minutes!`,
          status: 'pending' as const
        };
      });
      saveReminders([...reminders, ...newReminders]);

    } catch (e) {
      console.error('Failed to generate schedule', e);
    } finally {
      setLoading(false);
    }
  };

  const completeSlot = (slotId: string) => {
    const slot = schedule.find(s => s.id === slotId);
    if (!slot) return;

    const updatedSchedule = schedule.map(s => s.id === slotId ? { ...s, status: 'completed' as const } : s);
    saveSchedule(updatedSchedule);

    if (slot.subtaskId) {
      toggleSubtask(slot.taskId, slot.subtaskId);
    } else {
      toggleTaskCompletion(slot.taskId);
    }
  };

  const skipSlot = (slotId: string) => {
    const slot = schedule.find(s => s.id === slotId);
    if (!slot) return;

    const updatedSchedule = schedule.map(s => s.id === slotId ? { ...s, status: 'skipped' as const } : s);
    saveSchedule(updatedSchedule);

    const task = tasks.find(t => t.id === slot.taskId);
    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      taskId: slot.taskId,
      subtaskId: slot.subtaskId,
      triggerTime: new Date(Date.now() + 2000).toISOString(),
      type: 'reschedule_suggestion',
      message: `I notice you skipped your slot for "${task?.title || 'task'}". Should we reschedule it for tomorrow?`,
      status: 'pending'
    };
    saveReminders([...reminders, newReminder]);
  };

  const deleteSlot = (slotId: string) => {
    saveSchedule(schedule.filter(s => s.id !== slotId));
  };

  // Habits actions
  const addHabit = (title: string, frequency: 'daily' | 'weekly') => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title,
      category: selectedPersona,
      frequency,
      streakCount: 0,
      lastCompletedDate: null,
      history: []
    };
    saveHabits([...habits, newHabit]);
  };

  const toggleHabitCompletion = (habitId: string, dateStr: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const completedIndex = h.history.indexOf(dateStr);
        let newHistory = [...h.history];
        let streak = h.streakCount;

        if (completedIndex > -1) {
          newHistory.splice(completedIndex, 1);
          streak = Math.max(0, streak - 1);
        } else {
          newHistory.push(dateStr);
          const yesterdayStr = new Date(new Date(dateStr).getTime() - 86400000).toISOString().slice(0, 10);
          if (h.lastCompletedDate === yesterdayStr || h.streakCount === 0) {
            streak += 1;
          } else {
            streak = 1;
          }
        }

        return {
          ...h,
          history: newHistory,
          lastCompletedDate: completedIndex > -1 ? (newHistory[newHistory.length - 1] || null) : dateStr,
          streakCount: streak
        };
      }
      return h;
    });
    saveHabits(updated);
  };

  const deleteHabit = (habitId: string) => {
    saveHabits(habits.filter(h => h.id !== habitId));
  };

  // Reminders actions
  const dismissReminder = (reminderId: string) => {
    const updated = reminders.map(r => r.id === reminderId ? { ...r, status: 'dismissed' as const } : r);
    saveReminders(updated);
  };

  // Focus Timer actions
  const timeSpentOnTask = (taskId: string, minutes: number) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          timeSpentMinutes: (t.timeSpentMinutes || 0) + minutes
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Send message to coach
  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    if (currentUser) {
      localStorage.setItem(`focusai_chat_${currentUser.id}`, JSON.stringify(newHistory));
    }

    setLoading(true);
    try {
      const responseText = await getAICoachResponse(newHistory, text, tasks, apiKey);
      
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Parse agentic action blocks
      const actionRegex = /```action\s*([\s\S]*?)\s*```/;
      const match = responseText.match(actionRegex);
      let actionResultMsg = '';

      if (match) {
        try {
          const actionObj = JSON.parse(match[1].trim());
          if (actionObj && actionObj.action) {
            console.log("Executing agentic action from coach response:", actionObj);
            switch (actionObj.action) {
              case 'CREATE_TASK': {
                const { title, description, deadline, estimatedHours } = actionObj.payload;
                await addNewTask(title, description || '', deadline, estimatedHours || 1, selectedPersona);
                actionResultMsg = `\n\n*(⚡ Action: Created task "${title}")*`;
                break;
              }
              case 'COMPLETE_TASK': {
                const { taskId } = actionObj.payload;
                toggleTaskCompletion(taskId);
                const taskObj = tasks.find(t => t.id === taskId);
                actionResultMsg = `\n\n*(⚡ Action: Marked task "${taskObj?.title || taskId}" as completed)*`;
                break;
              }
              case 'AUTOPILOT_SCHEDULE': {
                const { targetDate } = actionObj.payload;
                await generateDaySchedule(targetDate);
                actionResultMsg = `\n\n*(⚡ Action: Auto-scheduled focus slots for ${targetDate})*`;
                break;
              }
              default:
                break;
            }
          }
        } catch (jsonErr) {
          console.error("Failed to parse action JSON from coach response", jsonErr);
        }
      }

      if (actionResultMsg) {
        aiMsg.text = aiMsg.text.replace(actionRegex, '') + actionResultMsg;
      }
      
      const completeHistory = [...newHistory, aiMsg];
      setChatHistory(completeHistory);
      if (currentUser) {
        localStorage.setItem(`focusai_chat_${currentUser.id}`, JSON.stringify(completeHistory));
      }
    } catch (e) {
      console.error('Chat error', e);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory(defaultChatHistory);
    if (currentUser) {
      localStorage.setItem(`focusai_chat_${currentUser.id}`, JSON.stringify(defaultChatHistory));
    }
  };

  const resetToSampleData = () => {
    const samples = getSampleTasks().filter(t => t.category === selectedPersona);
    saveTasks(samples);
    saveSchedule(getSampleSchedule().filter(s => {
      const t = getSampleTasks().find(task => task.id === s.taskId);
      return t?.category === selectedPersona;
    }));
    saveReminders(getSampleReminders().filter(r => {
      const t = getSampleTasks().find(task => task.id === r.taskId);
      return t?.category === selectedPersona;
    }));
    saveHabits(getSampleHabits().filter(h => h.category === selectedPersona));
    setChatHistory(defaultChatHistory);
    if (currentUser) {
      localStorage.setItem(`focusai_chat_${currentUser.id}`, JSON.stringify(defaultChatHistory));
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        tasks,
        schedule,
        reminders,
        habits,
        apiKey,
        chatHistory,
        selectedPersona,
        loading,
        setApiKey,
        setSelectedPersona: setSelectedPersonaAndSave,
        addNewTask,
        deleteTask,
        toggleSubtask,
        toggleTaskCompletion,
        sendChatMessage,
        clearChat,
        resetToSampleData,
        login,
        register,
        logout,
        generateDaySchedule,
        completeSlot,
        skipSlot,
        deleteSlot,
        addHabit,
        toggleHabitCompletion,
        deleteHabit,
        dismissReminder,
        timeSpentOnTask
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
