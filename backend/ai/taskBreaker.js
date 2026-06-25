import { callGemini } from './gemini.js';

export async function decomposeTask(title, description, estimatedDuration, deadline, apiKey = '') {
  const prompt = `Decompose the task: "${title}"
Description: "${description || 'None'}"
Total Estimated Duration: ${estimatedDuration} hours
Deadline: ${deadline}

Split this task into 3 to 6 logical, sequential subtasks. The sum of subtask durations must equal ${estimatedDuration} hours.
Return a JSON array of subtasks, where each subtask has:
- "title": string (actionable subtask description)
- "estimatedDuration": number (in hours)

Ensure the response is valid JSON and matches the schema:
[
  { "title": "Subtask Name", "estimatedDuration": 1.5 }
]`;

  const systemInstruction = 'You are an expert project manager. You help break down tasks into sequential, manageable subtasks.';
  
  try {
    const subtasks = await callGemini(prompt, systemInstruction, true, apiKey);
    return subtasks;
  } catch (error) {
    console.error('Error decomposing task:', error);
    const share = Number((estimatedDuration / 3).toFixed(1));
    return [
      { title: `Setup & Research for: ${title}`, estimatedDuration: share },
      { title: `Core Implementation for: ${title}`, estimatedDuration: share },
      { title: `Review & Polish for: ${title}`, estimatedDuration: Number((estimatedDuration - share * 2).toFixed(1)) }
    ];
  }
}
