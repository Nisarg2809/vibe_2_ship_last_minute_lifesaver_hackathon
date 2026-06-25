import { callGemini } from './gemini.js';

export async function generateSchedule(tasks, slots, workingHoursStart = '09:00', workingHoursEnd = '18:00', targetDate, apiKey = '') {
  const prompt = `You are an AI Scheduling Assistant. Create an optimal daily schedule for the date: ${targetDate}.
Working hours: ${workingHoursStart} to ${workingHoursEnd}.
Active Tasks to Schedule (with subtasks if any):
${JSON.stringify(tasks, null, 2)}

Existing Schedule Slots / Commitments:
${JSON.stringify(slots, null, 2)}

Create schedule slots for today. Place the tasks and subtasks into open hours during the user's working hours.
Guidelines:
1. Prioritize tasks by their priority levels (Critical first, then High, Medium, Low).
2. Schedule task or subtask blocks. Each block must have a startTime and endTime.
3. Keep blocks reasonable (between 0.5 to 2 hours). If a task/subtask is longer, schedule a portion or divide it.
4. Add 15-minute breaks between consecutive work blocks.
5. Do not schedule during existing commitments.
6. The dates in startTime and endTime must match the target date: ${targetDate}.
7. Return a JSON array of scheduled slots, conforming strictly to this schema:
[
  {
    "taskId": "string",
    "subtaskId": "string | null",
    "startTime": "ISO DateTime String",
    "endTime": "ISO DateTime String"
  }
]`;

  const systemInstruction = 'You are an AI Scheduler. You schedule tasks and subtasks into a vertical timeline for a user, avoiding overlapping events and including necessary breaks.';

  try {
    const scheduledSlots = await callGemini(prompt, systemInstruction, true, apiKey);
    return scheduledSlots.map(s => ({
      id: Math.random().toString(36).substring(2, 11),
      status: 'scheduled',
      ...s
    }));
  } catch (error) {
    console.error('Error generating schedule with Gemini:', error);
    
    // Algorithmic Fallback:
    const fallbackSlots = [];
    let currentHour = parseInt(workingHoursStart.split(':')[0]) || 9;
    let currentMin = parseInt(workingHoursStart.split(':')[1]) || 0;
    const endHour = parseInt(workingHoursEnd.split(':')[0]) || 18;
    const endMin = parseInt(workingHoursEnd.split(':')[1]) || 0;
    const limitMin = endHour * 60 + endMin;
    
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const sortedTasks = [...tasks].sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    
    for (const task of sortedTasks) {
      if (task.status === 'completed') continue;
      
      const itemsToSchedule = task.subtasks && task.subtasks.length > 0 
        ? task.subtasks.filter(st => !st.completed).map(st => ({ subtaskId: st.id, duration: st.estimatedDuration }))
        : [{ subtaskId: null, duration: task.estimatedDuration || 1 }];
        
      for (const item of itemsToSchedule) {
        const currentTotalMin = currentHour * 60 + currentMin;
        const durationMin = Math.round(item.duration * 60);
        
        if (currentTotalMin + durationMin > limitMin) {
          break; // Day is full
        }
        
        const start = new Date(targetDate);
        start.setHours(currentHour, currentMin, 0, 0);
        
        const end = new Date(start.getTime() + durationMin * 60 * 1000);
        
        fallbackSlots.push({
          id: Math.random().toString(36).substring(2, 11),
          taskId: task.id,
          subtaskId: item.subtaskId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: 'scheduled'
        });
        
        const nextTime = new Date(end.getTime() + 15 * 60 * 1000);
        currentHour = nextTime.getHours();
        currentMin = nextTime.getMinutes();
      }
    }
    
    return fallbackSlots;
  }
}
