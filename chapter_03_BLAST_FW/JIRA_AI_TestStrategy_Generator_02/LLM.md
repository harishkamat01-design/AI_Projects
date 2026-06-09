# Project Schema and Rules

## Input Schema

- jiraConfig
  - jiraEmail: string
  - jiraApiToken: string
  - jiraBaseUrl: string
- groqConfig
  - groqKey: string
  - model: string
- issueSource
  - sourceType: "jira-key" | "text" | "file"
  - issueKey: string
  - issueText: string
  - fileName: string

## Output Schema

- strategyMarkdown: string
- previewHtml: string (optional)

## Behavior Rules

1. The app must accept Jira config, GROQ details, and a Jira issue source.
2. File upload inputs must support `.txt` and `.md` files.
3. The generated output must follow the provided test strategy format, including objective, scope, focus areas, approach, deliverables, schedule, and risks.
4. Dark/light mode must be available and persist during the current session.
5. The app should not expose secrets in the UI beyond the user-entered settings.
6. If the issue content is empty, show a validation warning instead of generating output.
