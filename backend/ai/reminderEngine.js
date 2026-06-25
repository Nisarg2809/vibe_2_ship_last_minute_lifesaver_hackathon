import { callGemini } from './gemini.js';

export async function generateReminderMessage(task, type = 'progress', apiKey = '') {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const remainingHours = Number((task.estimatedDuration * (1 - (task.progress || 0) / 100)).toFixed(1));
  
  const prompt = `Generate a smart, highly actionable reminder for this task.
Task Title: "${task.title}"
Priority Level: ${task.priority}
Deadline: ${task.deadline}
Total Estimated Duration: ${task.estimatedDuration} hours
Current Progress: ${task.progress}%
Remaining Work Needed: ${remainingHours} hours
Current Time: ${currentTime}

Reminder Type requested: ${type} (options: 'deadline', 'progress', or 'urgency')

Instructions:
Instead of a generic template reminder like "Task due tomorrow", generate an intelligent AI reminder that uses the metrics context:
- For 'deadline': Warn about the imminent deadline and urgency.
- For 'progress': Highlight the remaining hours vs completion percentage. Make it actionable, e.g. "You still need ${remainingHours} hours to finish. Starting now will allow completion before 8 PM. Shall we start?"
- For 'urgency': Emphasize the critical nature of the task and suggest an immediate work block.

Keep the tone encouraging, productive, and conversational. Make it feel personalized. Keep it under 2 sentences.
Return a JSON object conforming strictly to this schema:
{
  "message": "The generated reminder text"
}`;

  const systemInstruction = 'You are a smart productivity assistant who generates highly contextual, actionable, encouraging reminder notifications based on exact task progress and durations.';

  try {
    const result = await callGemini(prompt, systemInstruction, true, apiKey);
    return result.message || `Reminder: "${task.title}" is ${task.progress}% complete. ${remainingHours} hours remain.`;
  } catch (error) {
    console.error('Error in AI reminder generator:', error);
    if (type === 'deadline') {
      return `Deadline alert: "${task.title}" is due soon. Let's make progress today!`;
    } else if (type === 'urgency') {
      return `Action required: "${task.title}" is marked as Critical. Let's start a focus block now.`;
    } else {
      return `Progress update: You have completed ${task.progress || 0}% of "${task.title}". You still need about ${remainingHours} hours to finish.`;
    }
  }
}
