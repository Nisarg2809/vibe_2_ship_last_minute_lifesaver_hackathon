import express from 'express';
import { db } from '../database/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculatePriority } from '../ai/priorityEngine.js';
import { decomposeTask } from '../ai/taskBreaker.js';
import { generateSchedule } from '../ai/scheduler.js';
import { generateReminderMessage } from '../ai/reminderEngine.js';
import { callGemini } from '../ai/gemini.js';

const router = express.Router();

router.post('/prioritize', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await db.find('tasks', t => t.userId === userId);
    
    const updatedTasks = [];
    for (const task of tasks) {
      const priority = calculatePriority(task.deadline, task.importance, task.estimatedDuration);
      if (priority !== task.priority) {
        const updated = await db.update('tasks', t => t.id === task.id && t.userId === userId, { priority });
        if (updated.length > 0) updatedTasks.push(updated[0]);
      }
    }
    
    res.json({ 
      message: 'Priorities updated successfully', 
      updatedCount: updatedTasks.length, 
      tasks: await db.find('tasks', t => t.userId === userId) 
    });
  } catch (error) {
    console.error('Error prioritizing tasks:', error);
    res.status(500).json({ error: 'Error prioritizing tasks' });
  }
});

router.post('/tasks/:id/decompose', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const fallbackKey = req.headers['x-gemini-api-key'] || '';

    const task = await db.findOne('tasks', t => t.id === id && t.userId === userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const subtasks = await decomposeTask(task.title, task.description, task.estimatedDuration, task.deadline, fallbackKey);
    
    const subtasksWithId = subtasks.map(st => ({
      id: Math.random().toString(36).substring(2, 11),
      title: st.title,
      estimatedDuration: Number(st.estimatedDuration),
      completed: false
    }));

    const updatedTasks = await db.update('tasks', t => t.id === id && t.userId === userId, { subtasks: subtasksWithId });
    res.json(updatedTasks[0]);
  } catch (error) {
    console.error('Error decomposing task:', error);
    res.status(500).json({ error: 'Error decomposing task' });
  }
});

router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.body;
    const fallbackKey = req.headers['x-gemini-api-key'] || '';
    
    if (!date) {
      return res.status(400).json({ error: 'Date (YYYY-MM-DD) is required.' });
    }

    const user = await db.findOne('users', u => u.id === userId);
    const tasks = await db.find('tasks', t => t.userId === userId && t.status !== 'completed');
    const existingSlots = await db.find('slots', s => s.userId === userId && s.startTime.startsWith(date));

    await db.delete('slots', s => s.userId === userId && s.startTime.startsWith(date) && s.status !== 'completed');

    const scheduled = await generateSchedule(
      tasks,
      existingSlots.filter(s => s.status === 'completed'),
      user.preferences?.workingHoursStart || '09:00',
      user.preferences?.workingHoursEnd || '18:00',
      date,
      fallbackKey
    );

    const finalSlots = [];
    for (const slot of scheduled) {
      const newSlot = {
        id: slot.id || Math.random().toString(36).substring(2, 11),
        userId,
        taskId: slot.taskId,
        subtaskId: slot.subtaskId || null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status || 'scheduled'
      };
      await db.insert('slots', newSlot);
      finalSlots.push(newSlot);
    }

    res.json(finalSlots);
  } catch (error) {
    console.error('Scheduling error:', error);
    res.status(500).json({ error: 'Error scheduling tasks' });
  }
});

router.get('/schedule', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const slots = await db.find('slots', s => s.userId === userId);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Error fetching schedules' });
  }
});

router.delete('/schedule/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await db.delete('slots', s => s.id === id && s.userId === userId);
    res.json({ success: true, message: 'Schedule slot removed.' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Error deleting slot' });
  }
});

router.post('/recommend', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const fallbackKey = req.headers['x-gemini-api-key'] || '';

    const tasks = await db.find('tasks', t => t.userId === userId && t.status !== 'completed');
    if (tasks.length === 0) {
      return res.json({ reminder: 'No tasks pending! You are all caught up.', recommendations: [] });
    }

    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const sorted = [...tasks].sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const primaryTask = sorted[0];
    
    let type = 'progress';
    if (primaryTask.priority === 'critical') type = 'urgency';
    else if (new Date(primaryTask.deadline) - new Date() < 24 * 60 * 60 * 1000) type = 'deadline';

    const reminderMessage = await generateReminderMessage(primaryTask, type, fallbackKey);

    res.json({
      reminder: reminderMessage,
      recommendations: sorted.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        progress: t.progress,
        deadline: t.deadline
      }))
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
});

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;
    const fallbackKey = req.headers['x-gemini-api-key'] || '';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const user = await db.findOne('users', u => u.id === userId);
    const tasks = await db.find('tasks', t => t.userId === userId);
    const slots = await db.find('slots', s => s.userId === userId);

    const currentTimeStr = new Date().toISOString();
    const formattedTime = new Date().toLocaleString();

    const prompt = `User message: "${message}"

Current State Context:
- Current Time: ${formattedTime} (${currentTimeStr})
- User profile: Name="${user.name}", WorkHours="${user.preferences?.workingHoursStart || '09:00'}-${user.preferences?.workingHoursEnd || '18:00'}"
- Tasks database:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, duration: t.estimatedDuration, importance: t.importance, priority: t.priority, status: t.status, progress: t.progress, subtasks: t.subtasks })), null, 2)}
- Schedule Timeline slots:
${JSON.stringify(slots.map(s => ({ id: s.id, taskId: s.taskId, startTime: s.startTime, endTime: s.endTime, status: s.status })), null, 2)}

Provide a direct, helpful, encouraging productivity response.
If the user's message indicates they want to execute an action in the database, you can return a list of commands in the "commands" field.
Actions you can trigger:
1. CREATE_TASK: Create a task. Payload fields: title (string), deadline (ISO string, tomorrow if unspecified), estimatedDuration (number in hours, 1 if unspecified), importance (1-5, 3 if unspecified), description (string).
2. COMPLETE_TASK: Mark a task complete. Payload fields: taskId (string).
3. RESCHEDULE_DAY: Triggers a schedule regeneration request. Payload fields: date (string, YYYY-MM-DD, defaults to today).
4. DECOMPOSE_TASK: Triggers task breakdown. Payload fields: taskId (string).

Return strictly a JSON object matching this schema:
{
  "reply": "Your markdown-formatted message answering the user.",
  "commands": [
    {
      "action": "CREATE_TASK" | "COMPLETE_TASK" | "RESCHEDULE_DAY" | "DECOMPOSE_TASK",
      "payload": { ... }
    }
  ]
}`;

    const systemInstruction = 'You are the AI Productivity Companion, an optimistic and proactive development guide who answers user questions and triggers database operations directly through JSON commands.';

    const aiRes = await callGemini(prompt, systemInstruction, true, fallbackKey);

    const executedCommands = [];
    if (aiRes.commands && Array.isArray(aiRes.commands)) {
      for (const cmd of aiRes.commands) {
        if (cmd.action === 'CREATE_TASK' && cmd.payload?.title) {
          const { title, deadline, estimatedDuration, importance, description } = cmd.payload;
          const dl = deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          const dur = estimatedDuration || 1;
          const imp = importance || 3;
          const priority = calculatePriority(dl, imp, dur);
          
          const created = await db.insert('tasks', {
            id: Math.random().toString(36).substring(2, 11),
            userId,
            title,
            description: description || '',
            deadline: dl,
            estimatedDuration: Number(dur),
            importance: Number(imp),
            priority,
            status: 'not_started',
            progress: 0,
            subtasks: [],
            createdAt: new Date().toISOString(),
            completedAt: null
          });
          executedCommands.push({ action: 'CREATE_TASK', result: created });
        } else if (cmd.action === 'COMPLETE_TASK' && cmd.payload?.taskId) {
          const taskId = cmd.payload.taskId;
          const updated = await db.update('tasks', t => t.id === taskId && t.userId === userId, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString()
          });
          if (updated.length > 0) executedCommands.push({ action: 'COMPLETE_TASK', result: updated[0] });
        } else if (cmd.action === 'DECOMPOSE_TASK' && cmd.payload?.taskId) {
          const taskId = cmd.payload.taskId;
          const task = await db.findOne('tasks', t => t.id === taskId && t.userId === userId);
          if (task) {
            const subtasks = await decomposeTask(task.title, task.description, task.estimatedDuration, task.deadline, fallbackKey);
            const subtasksWithId = subtasks.map(st => ({
              id: Math.random().toString(36).substring(2, 11),
              title: st.title,
              estimatedDuration: Number(st.estimatedDuration),
              completed: false
            }));
            const updated = await db.update('tasks', t => t.id === taskId && t.userId === userId, { subtasks: subtasksWithId });
            executedCommands.push({ action: 'DECOMPOSE_TASK', result: updated[0] });
          }
        }
      }
    }

    res.json({
      reply: aiRes.reply,
      commands: aiRes.commands,
      executed: executedCommands
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Error in chat handler' });
  }
});

export default router;
