#!/usr/bin/env python3
"""
Generate a local Markdown test plan for a Jira issue from Atlassian MCP.

Usage:
  python generate_test_plan.py VWO-48

Required environment variables:
  JIRA_BASE_URL        Atlassian site URL, e.g. https://myorg.atlassian.net
  JIRA_EMAIL           Jira account email for API authentication
  JIRA_API_TOKEN       Atlassian API token
Optional environment variables:
  JIRA_ACCEPTANCE_CRITERIA_FIELD  Jira custom field name or ID for acceptance criteria
  OUTPUT_FILENAME      Output Markdown filename
"""

import base64
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def get_env(name, default=None, required=False):
    value = os.environ.get(name, default)
    if required and not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def http_get(url, headers):
    request = Request(url, headers=headers)
    try:
        with urlopen(request) as response:
            return json.load(response)
    except HTTPError as exc:
        body = exc.read().decode(errors="ignore")
        raise SystemExit(f"Jira API request failed: {exc.code} {exc.reason}\n{body}")
    except URLError as exc:
        raise SystemExit(f"Failed to reach Jira API: {exc}")


def build_auth_header(email, token):
    token_bytes = f"{email}:{token}".encode("utf-8")
    auth = base64.b64encode(token_bytes).decode("ascii")
    return {"Authorization": f"Basic {auth}", "Accept": "application/json"}


def extract_plain_text(node):
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "".join(extract_plain_text(item) for item in node)
    text = node.get("text", "")
    for child in node.get("content", []):
        text += extract_plain_text(child)
    if node.get("type") in {"paragraph", "heading", "listItem"}:
        text += "\n"
    return text


def normalize_value(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return [normalize_value(item) for item in value if normalize_value(item)]
    if isinstance(value, dict):
        if "value" in value:
            return normalize_value(value["value"])
        if "name" in value:
            return normalize_value(value["name"])
        if "displayName" in value:
            return normalize_value(value["displayName"])
        return json.dumps(value, ensure_ascii=False)
    return str(value).strip()


def to_lines(text):
    if not text:
        return []
    return [line.strip() for line in text.splitlines() if line.strip()]


def parse_acceptance_criteria(fields, custom_field_name=None):
    if custom_field_name:
        custom_value = fields.get(custom_field_name)
        if custom_value:
            normalized = normalize_value(custom_value)
            if isinstance(normalized, list):
                return [str(item) for item in normalized if item]
            return [str(normalized)]

    candidates = []
    for key, value in fields.items():
        if key.lower().startswith("customfield"):
            normalized = normalize_value(value)
            if isinstance(normalized, list) and normalized:
                candidates.extend(str(item) for item in normalized if item)
            elif normalized:
                candidates.append(str(normalized))

    description_text = get_description(fields)
    candidates.extend(parse_acceptance_criteria_from_text(description_text))

    return [line for line in candidates if line]


def parse_acceptance_criteria_from_text(text):
    if not text:
        return []
    match = re.search(r"acceptance criteria[:\-]?\s*(.*)$", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    block = match.group(1).strip()
    lines = []
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r"^[\-\*\u2022]\s+", stripped):
            lines.append(re.sub(r"^[\-\*\u2022]\s+", "", stripped))
        elif re.match(r"^\d+[\.\)]\s+", stripped):
            lines.append(re.sub(r"^\d+[\.\)]\s+", "", stripped))
        elif lines:
            break
    return lines


def get_description(fields):
    description = fields.get("description")
    if isinstance(description, dict):
        return extract_plain_text(description)
    if isinstance(description, str):
        return description
    rendered = fields.get("renderedFields", {}).get("description")
    if isinstance(rendered, str):
        return rendered
    return ""


def get_comments(fields):
    comments = fields.get("comment", {}).get("comments", [])
    result = []
    for comment in comments:
        author = normalize_value(comment.get("author", {}).get("displayName") or comment.get("author", {}).get("name"))
        body = normalize_value(comment.get("body"))
        if body:
            result.append({"author": author or "Unknown", "body": body})
    return result


def build_test_cases(criteria):
    if not criteria:
        return [{
            "title": "Validate the Jira issue acceptance criteria",
            "steps": [
                "Review the Jira issue description and acceptance criteria.",
                "Execute the expected behavior described by the issue.",
                "Verify the system matches the expected results."
            ],
            "expected": ["The system behaves according to the Jira issue summary and acceptance criteria."]
        }]

    cases = []
    for index, criterion in enumerate(criteria, start=1):
        title = f"TC-{index:02d}: {criterion[:80]}"
        cases.append({
            "title": title,
            "steps": [
                f"Review acceptance criterion: {criterion}",
                "Exercise the feature or behavior described by the criterion.",
                "Compare actual results to the expected outcome."
            ],
            "expected": [f"The behavior satisfies: {criterion}"]
        })
    return cases


def render_markdown(issue, fields, criteria, comments):
    summary = normalize_value(fields.get("summary"))
    issue_type = normalize_value(fields.get("issuetype", {}).get("name"))
    priority = normalize_value(fields.get("priority", {}).get("name"))
    labels = normalize_value(fields.get("labels"))
    components = normalize_value(fields.get("components"))
    description = get_description(fields)
    reporter = normalize_value(fields.get("reporter", {}).get("displayName") or fields.get("reporter", {}).get("name"))
    assignee = normalize_value(fields.get("assignee", {}).get("displayName") or fields.get("assignee", {}).get("name"))
    status = normalize_value(fields.get("status", {}).get("name"))
    test_cases = build_test_cases(criteria)

    def format_list(value):
        if not value:
            return "None"
        if isinstance(value, list):
            return ", ".join(str(item) for item in value)
        return str(value)

    md = [f"# Test Plan for {issue['key']}", "", "## Issue Reference", f"- Jira: {issue['key']}", f"- Summary: {summary}", f"- Issue Type: {issue_type or 'N/A'}", f"- Priority: {priority or 'N/A'}", f"- Status: {status or 'N/A'}", f"- Reporter: {reporter or 'N/A'}", f"- Assignee: {assignee or 'Unassigned'}", f"- Labels: {format_list(labels)}", f"- Components: {format_list(components)}", ""]

    md.extend(["## Objective", description.splitlines()[0] if description else "Generate a formal QA test plan for the Jira issue.", "", "## Scope", "- In scope: Validate the feature described in the Jira issue.", "- Out of scope: Changes outside the stated Jira issue.", "", "## Preconditions", "- Jira issue is available in the QA environment.", "- Test data and environment are set up according to the project requirements.", ""])

    md.append("## Test Scenarios")
    for idx, case in enumerate(test_cases, start=1):
        md.append(f"{idx}. {case['title']}")
        md.append("   - Description: Validate the acceptance criterion in a user-facing scenario.")
    md.append("")

    md.append("## Test Cases")
    for case in test_cases:
        md.append(f"### {case['title']}")
        md.append("- Steps:")
        for step in case["steps"]:
            md.append(f"  1. {step}")
        md.append("- Expected result:")
        for expected in case["expected"]:
            md.append(f"  - {expected}")
        md.append("")

    md.append("## Expected Results")
    if criteria:
        for criterion in criteria:
            md.append(f"- {criterion}")
    else:
        md.append("- The feature meets the Jira issue summary and acceptance criteria.")
    md.append("")

    md.append("## Acceptance Criteria")
    if criteria:
        for criterion in criteria:
            md.append(f"- {criterion}")
    else:
        md.append("- Acceptance criteria to be defined in Jira.")
    md.append("")

    md.append("## Notes")
    if description:
        md.append("- Jira description summary:")
        for line in to_lines(description)[:5]:
            md.append(f"  - {line}")
    else:
        md.append("- No Jira description provided.")
    if comments:
        md.append("- Comments:")
        for comment in comments[:3]:
            md.append(f"  - {comment['author']}: {comment['body'][:120]}{'...' if len(comment['body']) > 120 else ''}")
    md.append("")
    md.append("## Risks / Dependencies")
    md.append("- Ensure the Jira environment and test environment are aligned.")
    md.append("- Verify any custom fields required for acceptance criteria are accessible.")
    md.append("")
    return "\n".join(md).strip() + "\n"


def main():
    issue_key = sys.argv[1] if len(sys.argv) > 1 else get_env("JIRA_ISSUE_KEY", "VWO-48")
    base_url = get_env("JIRA_BASE_URL", required=True).rstrip("/")
    email = get_env("JIRA_EMAIL", required=True)
    token = get_env("JIRA_API_TOKEN", required=True)
    custom_field = get_env("JIRA_ACCEPTANCE_CRITERIA_FIELD")
    output_filename = get_env("OUTPUT_FILENAME", f"{issue_key}-Test-Plan.md")

    headers = build_auth_header(email, token)
    issue_url = f"{base_url}/rest/api/3/issue/{issue_key}?expand=renderedFields"
    issue = http_get(issue_url, headers)
    fields = issue.get("fields", {})
    criteria = parse_acceptance_criteria(fields, custom_field)
    comments = get_comments(fields)
    markdown = render_markdown(issue, fields, criteria, comments)

    with open(output_filename, "w", encoding="utf-8") as output_file:
        output_file.write(markdown)

    print(f"Generated test plan: {output_filename}")


if __name__ == "__main__":
    main()
