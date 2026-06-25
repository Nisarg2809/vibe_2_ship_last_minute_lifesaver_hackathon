import express from 'express';
import { db } from '../database/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculatePriority } from '../ai/priorityEngine.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await db.find('tasks', t => t.userId === userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, deadline, estimatedDuration, importance, subtasks } = req.body;
    
    if (!title || !deadline || !estimatedDuration || !importance) {
      return res.status(400).json({ error: 'Title, deadline, estimatedDuration, and importance are required.' });
    }

    const priority = calculatePriority(deadline, importance, estimatedDuration);

    const newTask = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      title,
      description: description || '',
      deadline,
      estimatedDuration: Number(estimatedDuration),
      importance: Number(importance),
      priority,
      status: 'not_started',
      progress: 0,
      subtasks: subtasks || [],
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    await db.insert('tasks', newTask);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, deadline, estimatedDuration, importance, status, progress, subtasks } = req.body;

    const task = await db.findOne('tasks', t => t.id === id && t.userId === userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;
    if (deadline !== undefined) updatedData.deadline = deadline;
    if (estimatedDuration !== undefined) updatedData.estimatedDuration = Number(estimatedDuration);
    if (importance !== undefined) updatedData.importance = Number(importance);
    if (status !== undefined) {
      updatedData.status = status;
      if (status === 'completed') {
        updatedData.progress = 100;
        updatedData.completedAt = new Date().toISOString();
      } else if (status === 'not_started') {
        updatedData.progress = 0;
        updatedData.completedAt = null;
      }
    }
    if (progress !== undefined) {
      updatedData.progress = Number(progress);
      if (Number(progress) === 100) {
        updatedData.status = 'completed';
        updatedData.completedAt = new Date().toISOString();
      } else if (Number(progress) > 0) {
        updatedData.status = 'in_progress';
        updatedData.completedAt = null;
      } else {
        updatedData.status = 'not_started';
        updatedData.completedAt = null;
      }
    }
    if (subtasks !== undefined) {
      updatedData.subtasks = subtasks;
      if (subtasks.length > 0) {
        const completedCount = subtasks.filter(st => st.completed).length;
        const newProgress = Math.round((completedCount / subtasks.length) * 100);
        updatedData.progress = newProgress;
        if (newProgress === 100) {
          updatedData.status = 'completed';
          updatedData.completedAt = new Date().toISOString();
        } else if (newProgress > 0) {
          updatedData.status = 'in_progress';
          updatedData.completedAt = null;
        } else {
          updatedData.status = 'not_started';
          updatedData.completedAt = null;
        }
      }
    }

    const finalDeadline = deadline !== undefined ? deadline : task.deadline;
    const finalImportance = importance !== undefined ? importance : task.importance;
    const finalDuration = estimatedDuration !== undefined ? estimatedDuration : task.estimatedDuration;
    updatedData.priority = calculatePriority(finalDeadline, finalImportance, finalDuration);

    const updatedTasks = await db.update('tasks', t => t.id === id && t.userId === userId, updatedData);
    
    res.json(updatedTasks[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Error updating task' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const task = await db.findOne('tasks', t => t.id === id && t.userId === userId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.delete('tasks', t => t.id === id && t.userId === userId);
    await db.delete('slots', s => s.taskId === id && s.userId === userId);
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

export default router;
