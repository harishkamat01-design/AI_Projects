# VWO-48 Test Plan Generator - Task Plan

## Objective
Build a lightweight React application that accepts Jira and GROQ settings, fetches a Jira issue via Atlassian MCP, and generates a formal test plan automatically.

## Phase 0: Initialization
- [x] Create project memory artifacts:
  - `task_plan.md`
  - `findings.md`
  - `progress.md`
  - `gemini.md`
- [x] Capture discovery answers from the user.
- [ ] Confirm input/output shape before any code is written.

## Phase 1: Blueprint
- Define the data schema for Jira issue input and Markdown output.
- Confirm the expected VWO template structure.
- Identify the exact source of truth and deliverable path.
- Specify integration requirements for Atlassian MCP (Jira read-only).
- Confirm output filename pattern: `VWO-48-Test-Plan.md`.
- Confirm required Markdown sections: all standard test plan sections.

## Phase 2: Build (Approved)
- Implement Jira issue fetch from Atlassian MCP for issue `VWO-48`.
- Create a lightweight React UI to capture Jira and GROQ settings.
- Build a backend API to generate the test plan and save Markdown locally.
- Save output to `generated/VWO-48-Test-Plan.md` from the app.
- Created generator script `generate_test_plan.py` and React app scaffold.

## Phase 2: Implementation Plan
1. Create the React app in `chapter_03_BLAST_FW/test-plan-app`.
2. Build a Node backend at `chapter_03_BLAST_FW/test-plan-app/server/index.js`.
3. Authenticate to Atlassian MCP and retrieve the Jira issue data.
4. Map Jira issue fields into the test plan structure.
5. Render the Markdown template and write it to `generated/`.
6. Add UI settings persistence and a result preview.

## Checklist
- [x] Project memory initialized
- [x] Discovery questions answered
- [ ] Data schema defined in `gemini.md`
- [ ] VWO template sample located
- [ ] Delivery payload format confirmed
- [ ] Implementation plan approved
