# Gemini - Project Constitution

## Purpose
Define the input/output schema and behavioral rules for the VWO-48 Test Plan Generator.

## Input Schema
The generator will consume a single Jira issue record fetched directly from Atlassian MCP with the following shape:

```json
{
  "jiraIssueKey": "VWO-48",
  "summary": "Short issue summary",
  "description": "Full Jira issue description",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
  "components": ["Component A"],
  "priority": "Medium",
  "labels": ["regression", "ui"],
  "reporter": "username",
  "assignee": "username",
  "issueType": "Story",
  "status": "Open",
  "customFields": {
    "businessValue": "...",
    "releaseArea": "..."
  },
  "comments": [
    {
      "author": "user",
      "body": "comment text"
    }
  ]
}
```

### Notes
- This schema is intentionally broad to preserve Jira detail.
- The implementation will fetch data directly from Atlassian MCP rather than rely on manual payload input.

## Output Schema
The generator must produce a local Markdown file with the following structure:

```json
{
  "outputFilename": "VWO-48-Test-Plan.md",
  "outputMarkdown": "# Test Plan for VWO-48\n..."
}
```

### Expected Markdown Sections
- Test Plan Title
- Issue Reference
- Objective
- Scope
- Preconditions
- Test Scenarios / Test Cases
- Steps
- Expected Results
- Acceptance Criteria
- Notes
- Risks / Dependencies (optional)

### Template Example
```md
# Test Plan for VWO-48

## Issue Reference
- Jira: VWO-48
- Summary: <issue summary>
- Issue Type: <Story/Bug>
- Priority: <priority>

## Objective
Describe the purpose of the test plan.

## Scope
Define what is in scope and out of scope.

## Preconditions
List the environment, data, and setup requirements.

## Test Scenarios
1. Scenario name
   - Description
   - Test cases

## Test Cases
### TC-01: <name>
- Steps:
  1. Step one
  2. Step two
- Expected result:
  - <expected outcome>

## Expected Results
Summarize the expected behavior for each scenario.

## Acceptance Criteria
- <criterion 1>
- <criterion 2>

## Notes
Additional context, assumptions, or references.
```

## Behavioral Rules
- Reuse the agent’s formal QA test plan structure.
- Use formal QA language throughout.
- Do not invent Jira IDs or unsupported details.
- Preserve the Jira issue key and summary clearly in the document.
- Keep the output concise but complete.

## Architectural Invariants
- Input is a single Jira issue fetched directly from Atlassian MCP.
- Output is a single Markdown file saved locally as `VWO-48-Test-Plan.md`.
- No automation code is written before schema confirmation.
- The generator may be implemented as a script or small tool after this blueprint is approved.
