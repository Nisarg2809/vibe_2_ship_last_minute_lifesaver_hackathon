# vibe_2_ship_last_minute_lifesaver_hackathon

FocusAI: Active AI-Guided Productivity Companion

FocusAI is an active, AI-guided productivity workspace that transforms passive check-lists into an active, schedule-driven autopilot system. It provides users with automated task breakdowns, daily calendars, habits tracking, and interactive AI coaching.

🚀 Core Development & AI Tools
FocusAI was designed, built, and optimized using a specialized suite of generative AI tools and LLMs:

> Google AI Studio: Used for prototype prompting, tuning system instructions, and testing AI parameters.
> Antigravity: The primary AI agent and coding assistant driving codebase creation, TypeScript refactoring, CSS styling, and build verification.
> ChatGPT: Used for generating helper scripts, outlining initial specs, and drafting documentation.
> Gemini 3.1 Pro: Utilized for complex reasoning tasks, strategic planning analysis, and deep-context multi-agent simulation prompts.
> Gemini Flash 3.5: Integrated as the live, high-speed model powering the runtime features (Autopilot schedule compilation, task decomposition, and responsive coach chat).

🛠️ Technology Stack & Architecture
FocusAI is structured as a client-side progressive web application with a Node.js/Express companion backend for authentication and mock service integration.

> Frontend: React 19, TypeScript 6, Vite Build System.
> Styling: Modern, responsive Glassmorphic theme built using Vanilla CSS custom properties, backdrop filters, and CSS keyframe animations.
> Backend API: Express.js running on Node.js to handle local sessions and mock integrations.
> Visual Assets: Custom SVG rendering for responsive progress charts, activity grids, and Lucide icons.

✨ Key Features
> Onboarding & Persona Selection: Redirects new users to select a tailored persona (Rahul - Student, Priya - Developer, Arjun - Founder) and seeds default tasks, habits, and schedules.
> Focus Cockpit & Timer: A Pomodoro timer attached to active tasks that updates elapsed time and logs focus sessions.
> AI Task Decomposer: Automatically splits tasks longer than 2 hours into 3-5 subtasks with estimated durations.
> AI Autopilot Scheduler: Generates a non-overlapping daily agenda tailored to the user's active tasks and working hours.
> Analytics Dashboard: Tracks habits streaks, a 21-day activity heatmap grid, and weekly progress using SVG trend lines.
> Agentic AI Companion Chat: A chat interface that accepts text prompts and can run actions (e.g. CREATE_TASK, COMPLETE_TASK) directly inside the app state.
> Active Reminders Scanner: Triggers browser notifications 10 minutes prior to scheduled slots.
> Multi-User Data Sandbox: Uses local storage keys prefixed by user ID (focusai_[table]_${userId}) to support switching between personas on the same browser.

⚡ Getting Started (Local Development)
1. Prerequisites
> Node.js (v18 or higher)
> npm or yarn

2. Frontend Setup
  1. From the project root, install the dependencies:
     bash
     npm install
  2. Start the local development server:
     bash
     npm run dev
  3. Open http://localhost:5173 in your browser.
    
3. Backend Setup
  1. Navigate to the backend folder:
     bash
     cd backend
  2. Install the backend dependencies:
     bash
     npm install
  3. Copy the .env.example file to .env and fill in your Gemini API key:
     bash
     cp .env.example .env
  4. Start the backend server:
     bash
     npm run dev

📊 Client-Side Database Schema
Table Name	                  Key Attributes	                                           Description / Purpose

UserAccount	                  id, name, email, passwordHash, persona	                   Stores registered users and chosen workspace personas.

Task	                        id, title, description, deadline, priority,                Stores tasks, subtasks, priorities, and completion state.
                              estimatedHours, completed, progress, category, 
                              timeSpentMinutes, subtasks
                              
ScheduleSlot	                id, taskId, subtaskId, startTime, endTime,                 Stores daily schedule slots and completion statuses.
                              status, actualDurationMinutes	

Reminder	                    id, taskId, subtaskId, triggerTime, type,                  Stores alert notifications.
                              message, status	

Habit	                        id, title, category, frequency, streakCount,              Logs habits streaks and daily/weekly completion status.
                              lastCompletedDate, history	

ChatMessage	                  id, sender, text, timestamp	                              Stores coach conversation history.
