# Task Manager UI

A React + Vite frontend for the [Task Manager API](../task-manager-api), styled as a minimal, dark, developer-tool-inspired task list.

## Features
- Add tasks via a terminal-prompt-style quick-add bar with inline priority selection
- Filter tasks by status (all / pending / in progress / completed)
- Click a task's status ring to cycle it through pending → in progress → completed
- Inline editing of title, description, and priority
- Delete tasks
- Live counts of tasks by status

## Tech Stack
- React 18
- Vite
- Plain CSS with a custom design token system (no UI framework)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file (see `.env.example`) pointing to your running backend:
   ```
   VITE_API_URL=http://localhost:5000/api/tasks
   ```

3. Run the dev server:
   ```
   npm run dev
   ```

4. Open the printed local URL (typically `http://localhost:5173`). Make sure the [Task Manager API](../task-manager-api) is running first.

## Build for production
```
npm run build
```
Outputs a static `dist/` folder that can be deployed to Vercel, Netlify, or any static host.
