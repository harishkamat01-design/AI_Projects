# VWO Test Plan Generator App

This lightweight React application provides a settings UI for Jira and GROQ credentials, accepts a Jira issue key, and generates a formal test plan automatically.

## Features
- Jira configuration and credentials input
- Jira issue key entry
- Optional GROQ API settings for acceptance criteria extraction
- Generates `VWO-<issue>-Test-Plan.md` in the `generated/` folder
- Shows generated markdown preview

## Setup

1. Open a terminal in `chapter_03_BLAST_FW/test-plan-app`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open the URL shown by Vite (default `http://localhost:5173`)

## Notes
- The backend server listens on `http://localhost:5174`.
- The frontend sends credentials and Jira issue key to `/api/generate`.
- Generated files are written to `chapter_03_BLAST_FW/test-plan-app/generated/`.

## Environment
Use `.env.example` as a starting point for configuration. The app saves settings locally in browser storage.
