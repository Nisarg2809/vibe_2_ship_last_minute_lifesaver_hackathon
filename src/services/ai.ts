import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SubTask {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
}

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date string
  priority: PriorityLevel;
  estimatedHours: number;
  completed: boolean;
  subtasks: SubTask[];
  progress: number; // 0 to 100
  category: 'student' | 'work' | 'entrepreneur' | 'personal';
  timeSpentMinutes?: number;
  completedAt?: string | null;
}


export interface ScheduleSlot {
  id: string;
  taskId: string;
  subtaskId: string | null;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: 'scheduled' | 'active' | 'completed' | 'skipped' | 'postponed';
  actualDurationMinutes?: number;
}

export interface Reminder {
  id: string;
  taskId: string;
  subtaskId: string | null;
  triggerTime: string; // ISO string
  type: 'pre_task_nudge' | 'deadline_warning' | 'inactivity_check' | 'reschedule_suggestion';
  message: string;
  status: 'pending' | 'sent' | 'dismissed' | 'acted_upon';
}

export interface Habit {
  id: string;
  title: string;
  category: 'student' | 'work' | 'entrepreneur' | 'personal';
  frequency: 'daily' | 'weekly';
  streakCount: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  history: string[]; // YYYY-MM-DD strings
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  persona: 'student' | 'work' | 'entrepreneur' | 'personal';
}


export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}


// Helper to get GoogleGenerativeAI client
const getGeminiClient = (apiKey: string | null): GoogleGenerativeAI | null => {
  if (!apiKey || apiKey.trim() === '') return null;
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error('Failed to initialize Gemini API client:', error);
    return null;
  }
};

/**
 * Decomposes a task into 3-5 structured subtasks.
 * Supports online Gemini decomposition and local smart fallback heuristics.
 */
export async function decomposeTask(
  title: string,
  description: string,
  estimatedHours: number,
  apiKey: string | null
): Promise<{ title: string; durationMinutes: number }[]> {
  const client = getGeminiClient(apiKey);

  if (client) {
    try {
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `
        You are FocusAI, an expert productivity coach. 
        Decompose the following task into 3 to 5 actionable, sequential subtasks with estimated durations.
        The overall task is estimated to take ${estimatedHours} hours. Make sure the sum of subtask durations is reasonable relative to the total estimated hours (around ${estimatedHours * 60} minutes).
        
        Task Title: "${title}"
        Task Description: "${description}"
        
        Respond with a JSON array of objects, where each object has:
        - "title": (string) a concise, actionable subtask name
        - "durationMinutes": (number) estimated duration in minutes
        
        Do not include markdown wrappers, just the raw JSON array.
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          title: String(item.title || 'Action Item'),
          durationMinutes: Number(item.durationMinutes || 30),
        }));
      }
    } catch (error) {
      console.warn('Gemini API call failed, falling back to heuristics:', error);
    }
  }

  // Resilient Heuristic Fallback
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const totalMinutes = Math.max(30, estimatedHours * 60);

  // 1. Research/Writing tasks
  if (
    lowerTitle.includes('write') ||
    lowerTitle.includes('paper') ||
    lowerTitle.includes('report') ||
    lowerTitle.includes('essay') ||
    lowerTitle.includes('thesis') ||
    lowerDesc.includes('draft')
  ) {
    return [
      { title: 'Information Gathering & Outline', durationMinutes: Math.round(totalMinutes * 0.25) },
      { title: 'Drafting Core Content', durationMinutes: Math.round(totalMinutes * 0.5) },
      { title: 'Reviewing, Proofreading & Formatting', durationMinutes: Math.round(totalMinutes * 0.25) },
    ];
  }

  // 2. Study/Preparation tasks
  if (
    lowerTitle.includes('study') ||
    lowerTitle.includes('exam') ||
    lowerTitle.includes('test') ||
    lowerTitle.includes('quiz') ||
    lowerTitle.includes('review') ||
    lowerTitle.includes('learn')
  ) {
    return [
      { title: 'Review Slides & Lecture Material', durationMinutes: Math.round(totalMinutes * 0.35) },
      { title: 'Create Summary Notes / Flashcards', durationMinutes: Math.round(totalMinutes * 0.3) },
      { title: 'Practice Problems & Active Recall Self-Test', durationMinutes: Math.round(totalMinutes * 0.35) },
    ];
  }

  // 3. Meeting/Discussion tasks
  if (
    lowerTitle.includes('meeting') ||
    lowerTitle.includes('call') ||
    lowerTitle.includes('discuss') ||
    lowerTitle.includes('interview') ||
    lowerTitle.includes('sync')
  ) {
    return [
      { title: 'Prepare Objectives & Agenda', durationMinutes: Math.round(totalMinutes * 0.2) },
      { title: 'Attend Session & Take Notes', durationMinutes: Math.round(totalMinutes * 0.6) },
      { title: 'Review Minutes & Send Follow-ups', durationMinutes: Math.round(totalMinutes * 0.2) },
    ];
  }

  // 4. Default Heuristic breakdown
  return [
    { title: 'Initial Planning & Setup', durationMinutes: Math.round(totalMinutes * 0.2) },
    { title: 'Core Implementation Focus', durationMinutes: Math.round(totalMinutes * 0.6) },
    { title: 'Review, Polish & Final Checks', durationMinutes: Math.round(totalMinutes * 0.2) },
  ];
}

/**
 * Calculates a dynamic priority score for a list of tasks.
 * Sorts them based on score, and tags priority level dynamically.
 */
export function calculatePriorityHeuristic(tasks: Task[]): Task[] {
  const now = new Date();
  
  return tasks.map((task) => {
    if (task.completed) {
      return { ...task, progress: 100 };
    }

    const deadlineDate = new Date(task.deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysRemaining = timeDiff / (1000 * 60 * 60 * 24);

    let priority: PriorityLevel = 'low';
    
    if (daysRemaining <= 1) {
      priority = 'urgent';
    } else if (daysRemaining <= 3) {
      priority = 'high';
    } else if (daysRemaining <= 7) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Calculate progress based on subtasks if they exist
    let progress = task.progress;
    if (task.subtasks && task.subtasks.length > 0) {
      const completedCount = task.subtasks.filter((s) => s.completed).length;
      progress = Math.round((completedCount / task.subtasks.length) * 100);
    }

    return {
      ...task,
      priority,
      progress,
    };
  });
}

/**
 * Generates chat feedback from the FocusAI Coach.
 * Integrates Gemini chat session or offline rule-based dialogue.
 */
export async function getAICoachResponse(
  chatHistory: ChatMessage[],
  userMessage: string,
  activeTasks: Task[],
  apiKey: string | null
): Promise<string> {
  const client = getGeminiClient(apiKey);

  if (client) {
    try {
      const formattedTasks = activeTasks
        .filter((t) => !t.completed)
        .map((t) => `- "${t.title}" (ID: ${t.id}, Due: ${t.deadline.split('T')[0]}, Progress: ${t.progress}%, Category: ${t.category})`)
        .join('\n');

      const systemPrompt = `
        You are FocusAI, a premium, highly encouraging, and empathetic AI Productivity Coach.
        Your goal is to help the user beat procrastination, organize their workload, and focus on immediate actionable steps.
        
        Currently, the user's active tasks are:
        ${formattedTasks || 'No active tasks at the moment.'}
        
        Format your response nicely with markdown. Keep it concise, friendly, and actionable. Refer to their actual tasks to make the coaching relevant.

        AGENTIC ACTIONS CAPABILITY:
        If the user asks you to perform an action (like creating a task, completing a task, or running the scheduler), you can command the frontend to execute it.
        To execute an action, append a special JSON block at the very end of your response inside a code block tagged with \`\`\`action. Do NOT reference this action block in your main text.
        
        Supported actions:
        1. Create Task:
        \`\`\`action
        {
          "action": "CREATE_TASK",
          "payload": {
            "title": "Task title",
            "description": "Task description",
            "deadline": "${new Date(Date.now() + 86400000).toISOString().slice(0, 16)}",
            "estimatedHours": 2
          }
        }
        \`\`\`
        2. Complete Task:
        \`\`\`action
        {
          "action": "COMPLETE_TASK",
          "payload": {
            "taskId": "task-student-1"
          }
        }
        \`\`\`
        3. Autopilot Schedule:
        \`\`\`action
        {
          "action": "AUTOPILOT_SCHEDULE",
          "payload": {
            "targetDate": "${new Date().toISOString().slice(0, 10)}"
          }
        }
        \`\`\`
        
        Make sure you use the exact task ID (e.g. "task-student-1") when outputting a COMPLETE_TASK action block.
      `;

      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
      });

      const chatSession = model.startChat({
        history: chatHistory.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
      });

      const result = await chatSession.sendMessage(userMessage);
      return result.response.text();
    } catch (error) {
      console.warn('Gemini chat failed, using local dialogue coach:', error);
    }
  }

  // Offline Dialog Coach (Rules engine)
  const lowerMsg = userMessage.toLowerCase();
  const activeCount = activeTasks.filter((t) => !t.completed).length;

  if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg.includes('hey')) {
    return `Hello! I am your **FocusAI Coach** (Running in Offline Mode). 🧠\n\nYou currently have **${activeCount} active tasks** to manage. What are we aiming to accomplish today? I can help you plan, break down tasks, or provide a boost of motivation!`;
  }

  if (lowerMsg.includes('procrastinat') || lowerMsg.includes('lazy') || lowerMsg.includes('stuck') || lowerMsg.includes('start')) {
    return `Procrastination is often just our brain feeling overwhelmed by the *size* of a task, not the task itself. 🎯\n\n**Here is my advice:**\n1. Select your most urgent task (e.g., "${activeTasks[0]?.title || 'your first task'}").\n2. Open its subtask list.\n3. Set a timer for just **10 minutes** and tell yourself you will stop after that. *Starting is 80% of the battle!*`;
  }

  if (lowerMsg.includes('task') || lowerMsg.includes('todo') || lowerMsg.includes('schedule')) {
    if (activeCount === 0) {
      return `Your schedule is completely clear! 🌟 This is a great time to set some goals or habits. What's on your mind?`;
    }
    const urgent = activeTasks.find((t) => t.priority === 'urgent' && !t.completed);
    return `Let's look at your schedule. You have **${activeCount} outstanding tasks**.\n\n${
      urgent
        ? `⚠️ **Urgent Focus**: Your task **"${urgent.title}"** needs attention immediately since its deadline is very close.`
        : `👍 No immediate emergencies! You can focus on steady progress on **"${activeTasks[0]?.title}"**.`
    }\n\nWould you like me to suggest how to break down one of your current tasks?`;
  }

  if (lowerMsg.includes('thank') || lowerMsg.includes('awesome') || lowerMsg.includes('cool')) {
    return `You're very welcome! I'm here to keep you focused. Let's make today productive. What subtask are you tackling next? 🚀`;
  }

  // Default response with encouraging productivity nuggets
  const tips = [
    "Try the **Pomodoro Technique**: work for 25 minutes, then take a 5-minute break. It keeps the mind sharp!",
    "Remember: *'Done is better than perfect.'* Focus on pushing things across the finish line today.",
    "Try to group similar tasks together (batching) to minimize the cost of context switching.",
    "A clean workspace leads to a clear mind. Take 2 minutes to clear your desk before your next focus block.",
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return `I hear you! As your productivity companion, I recommend taking a small, focused step right now.\n\n💡 **Focus Tip**: ${randomTip}\n\nTell me more about what you're working on, or ask me how to get started on your tasks!`;
}

/**
 * Automatically plans daily schedule slots based on active tasks and availability.
 * Supports online Gemini planning and local fallback heuristics.
 */
export async function generateSchedule(
  tasks: Task[],
  workingHoursStart: string, // e.g. "09:00"
  workingHoursEnd: string,   // e.g. "18:00"
  targetDateStr: string,     // YYYY-MM-DD
  apiKey: string | null
): Promise<Omit<ScheduleSlot, 'id'>[]> {
  const client = getGeminiClient(apiKey);
  const activeTasks = tasks.filter(t => !t.completed);

  if (client && activeTasks.length > 0) {
    try {
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      // Prepare tasks data context for LLM
      const inputTasks = activeTasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        deadline: t.deadline,
        subtasks: t.subtasks.filter(s => !s.completed).map(s => ({
          id: s.id,
          title: s.title,
          durationMinutes: s.durationMinutes
        }))
      }));

      const prompt = `
        You are an AI Scheduling Assistant. Create an optimal daily schedule for the date ${targetDateStr}.
        User working hours: ${workingHoursStart} to ${workingHoursEnd}.
        Active tasks and subtasks context:
        ${JSON.stringify(inputTasks)}

        Instructions:
        1. Schedule focus slots for the target date ${targetDateStr} during working hours.
        2. Give priority to urgent tasks first, then high, then medium, then low.
        3. Make sure the scheduled start and end times do not overlap.
        4. Focus slots should be created based on the task's subtasks (if any exist, schedule individual subtasks) or schedule the main task itself.
        5. Include a 10-15 minute break (buffer) between consecutive focus slots.
        6. Return strictly a JSON array of objects, conforming to this structure:
           Array<{
             taskId: string,
             subtaskId: string | null, // null if scheduling the main task directly
             startTime: string,       // ISO string format (e.g. "${targetDateStr}T09:00:00.000Z" or Local Time equivalent)
             endTime: string          // ISO string format
           }>

        Output only the raw JSON.
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          taskId: String(item.taskId),
          subtaskId: item.subtaskId ? String(item.subtaskId) : null,
          startTime: String(item.startTime),
          endTime: String(item.endTime),
          status: 'scheduled' as const
        }));
      }
    } catch (error) {
      console.warn('Gemini Scheduler failed, falling back to local heuristic:', error);
    }
  }

  // Local Offline Heuristic Scheduler
  const slots: Omit<ScheduleSlot, 'id'>[] = [];
  if (activeTasks.length === 0) return slots;

  // Sort tasks by priority: urgent (0) -> high (1) -> medium (2) -> low (3)
  const priorityMap: Record<PriorityLevel, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...activeTasks].sort((a, b) => {
    return (priorityMap[a.priority] ?? 3) - (priorityMap[b.priority] ?? 3);
  });

  const [startHour, startMin] = workingHoursStart.split(':').map(Number);
  const [endHour, endMin] = workingHoursEnd.split(':').map(Number);

  const currentDate = new Date(targetDateStr);
  const startTimeObj = new Date(currentDate);
  startTimeObj.setHours(startHour, startMin, 0, 0);

  const endTimeLimitObj = new Date(currentDate);
  endTimeLimitObj.setHours(endHour, endMin, 0, 0);

  let currentSlotTime = new Date(startTimeObj);

  for (const task of sortedTasks) {
    if (currentSlotTime >= endTimeLimitObj) break;

    // Check if there are subtasks to schedule
    const incompleteSubtasks = task.subtasks.filter(s => !s.completed);

    if (incompleteSubtasks.length > 0) {
      for (const sub of incompleteSubtasks) {
        if (currentSlotTime >= endTimeLimitObj) break;

        const duration = sub.durationMinutes || 45;
        const slotEnd = new Date(currentSlotTime.getTime() + duration * 60 * 1000);

        if (slotEnd > endTimeLimitObj) break;

        slots.push({
          taskId: task.id,
          subtaskId: sub.id,
          startTime: currentSlotTime.toISOString(),
          endTime: slotEnd.toISOString(),
          status: 'scheduled' as const
        });

        // Add 15 mins break buffer
        currentSlotTime = new Date(slotEnd.getTime() + 15 * 60 * 1000);
      }
    } else {
      // Schedule main task directly in 60 min blocks
      const duration = Math.min(60, Math.max(30, task.estimatedHours * 60));
      const slotEnd = new Date(currentSlotTime.getTime() + duration * 60 * 1000);

      if (slotEnd > endTimeLimitObj) break;

      slots.push({
        taskId: task.id,
        subtaskId: null,
        startTime: currentSlotTime.toISOString(),
        endTime: slotEnd.toISOString(),
        status: 'scheduled' as const
      });

      currentSlotTime = new Date(slotEnd.getTime() + 15 * 60 * 1000);
    }
  }

  return slots;
}

