# Task Plan

## Goal
Build a lightweight React-based Jira test strategy generator with dark/light mode and file upload support.

## Phases
1. Blueprint
   - Confirm required inputs and output format
   - Define UI and data schema
2. Build
   - Create React app under `test-strategy-app`
   - Implement settings panel and issue source input
   - Add dark/light mode support
   - Add local Markdown generation for Jira issue/feature prompts
3. Document
   - Save findings, progress, and schema files
   - Include instructions for deployment
4. Deploy
   - Prepare app for Vercel deployment
   - Optionally commit files to GitHub

## Deliverables
- `test-strategy-app` React application
- `LLM.md` schema and behavior rules
- `task_plan.md`, `findings.md`, `progress.md`
- A generated test strategy UX for Jira issue key or plain text upload
