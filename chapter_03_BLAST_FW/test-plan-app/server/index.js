import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5174;
const GENERATED_DIR = path.join(__dirname, '..', 'generated');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

fs.mkdirSync(GENERATED_DIR, { recursive: true });

function buildAuthHeader(email, token) {
  const raw = `${email}:${token}`;
  return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
}

function normalizeValue(value) {
  if (!value && value !== 0) return '';
  if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean);
  if (typeof value === 'object') {
    if (value.name) return normalizeValue(value.name);
    if (value.displayName) return normalizeValue(value.displayName);
    if (value.value) return normalizeValue(value.value);
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function extractTextFromDescription(description) {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (description.content) {
    return description.content.map((block) => extractTextFromDescription(block)).join('\n');
  }
  if (Array.isArray(description)) {
    return description.map((item) => extractTextFromDescription(item)).join('\n');
  }
  return description.text || '';
}

function parseAcceptanceCriteria(description) {
  const text = extractTextFromDescription(description);
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const criteria = [];
  let inBlock = false;

  for (const line of lines) {
    if (!line) continue;
    if (/^acceptance criteria[:\-]?/i.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^[\-\*\u2022]\s+/.test(line) || /^\d+[\)\.]/.test(line)) {
        criteria.push(line.replace(/^[\-\*\u2022]\s+/, '').replace(/^\d+[\)\.]/, '').trim());
      } else if (criteria.length && !/^#{1,6}\s/.test(line)) {
        criteria[criteria.length - 1] += ' ' + line;
      } else if (criteria.length) {
        break;
      }
    }
  }

  return criteria.filter(Boolean);
}

function buildMarkdown(issue, fields, criteria, comments) {
  const summary = normalizeValue(fields.summary);
  const issueType = normalizeValue(fields.issuetype?.name);
  const priority = normalizeValue(fields.priority?.name);
  const labels = normalizeValue(fields.labels);
  const components = normalizeValue(fields.components);
  const description = extractTextFromDescription(fields.description || fields.renderedFields?.description || '');
  const reporter = normalizeValue(fields.reporter?.displayName || fields.reporter?.name);
  const assignee = normalizeValue(fields.assignee?.displayName || fields.assignee?.name);
  const status = normalizeValue(fields.status?.name);
  const bulletList = (value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return 'None';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const testCases = criteria.length
    ? criteria.map((criterion, idx) => ({
        title: `TC-${idx + 1}: ${criterion.slice(0, 78)}`,
        steps: [
          `Review acceptance criterion: ${criterion}`,
          'Exercise the feature or behavior described in the Jira issue.',
          'Verify actual results against the expected outcome.',
        ],
        expected: [`The feature satisfies: ${criterion}`],
      }))
    : [{
        title: 'TC-01: Validate Jira issue behavior',
        steps: [
          'Review the Jira issue summary and description.',
          'Execute the expected behavior described by the issue.',
          'Verify the actual behavior matches expectations.',
        ],
        expected: ['The system behaves according to the Jira issue requirements.'],
      }];

  const markdown = [
    `# Test Plan for ${issue.key}`,
    '',
    '## Issue Reference',
    `- Jira: ${issue.key}`,
    `- Summary: ${summary || 'N/A'}`,
    `- Issue Type: ${issueType || 'N/A'}`,
    `- Priority: ${priority || 'N/A'}`,
    `- Status: ${status || 'N/A'}`,
    `- Reporter: ${reporter || 'N/A'}`,
    `- Assignee: ${assignee || 'Unassigned'}`,
    `- Labels: ${bulletList(labels)}`,
    `- Components: ${bulletList(components)}`,
    '',
    '## Objective',
    summary ? `Create a formal test plan for the Jira issue \/ ${summary}.` : 'Create a formal test plan for the Jira issue.',
    '',
    '## Scope',
    '- In scope: Validate the feature described in this Jira issue.',
    '- Out of scope: Anything not referenced in the Jira issue.',
    '',
    '## Preconditions',
    '- Jira issue is available and accessible via the configured Jira connection.',
    '- Test environment is prepared for the associated feature changes.',
    '',
    '## Test Scenarios',
  ];

  testCases.forEach((testCase, index) => {
    markdown.push(`${index + 1}. ${testCase.title}`);
    markdown.push('   - Description: Validate the acceptance criterion within the described scenario.');
  });
  markdown.push('', '## Test Cases');

  testCases.forEach((testCase) => {
    markdown.push(`### ${testCase.title}`);
    markdown.push('- Steps:');
    testCase.steps.forEach((step) => markdown.push(`  1. ${step}`));
    markdown.push('- Expected result:');
    testCase.expected.forEach((expectation) => markdown.push(`  - ${expectation}`));
    markdown.push('');
  });

  markdown.push('## Expected Results');
  if (criteria.length) {
    criteria.forEach((criterion) => markdown.push(`- ${criterion}`));
  } else {
    markdown.push('- The feature behaves according to the Jira issue expectations.');
  }
  markdown.push('', '## Acceptance Criteria');
  if (criteria.length) {
    criteria.forEach((criterion) => markdown.push(`- ${criterion}`));
  } else {
    markdown.push('- Acceptance criteria are sourced from the Jira issue description or GROQ helper.');
  }
  markdown.push('', '## Notes');
  if (description) {
    markdown.push('- Jira description summary:');
    description.split(/\r?\n/).slice(0, 5).forEach((line) => {
      if (line.trim()) markdown.push(`  - ${line.trim()}`);
    });
  } else {
    markdown.push('- No description provided in Jira.');
  }
  if (comments.length) {
    markdown.push('- Comments:');
    comments.slice(0, 3).forEach((comment) => {
      markdown.push(`  - ${comment.author}: ${comment.body.slice(0, 120)}${comment.body.length > 120 ? '...' : ''}`);
    });
  }

  markdown.push('', '## Risks / Dependencies', '- Ensure Jira credentials and network access are valid.', '- Verify the GROQ API if used for acceptance criteria extraction.');

  return markdown.join('\n');
}

function captureComments(fields) {
  const comments = fields.comment?.comments || [];
  return comments.map((comment) => ({
    author: normalizeValue(comment.author?.displayName || comment.author?.name || 'Unknown'),
    body: normalizeValue(comment.body),
  })).filter((item) => item.body);
}

function extractLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\-\*\u2022]\s*/, '').trim())
    .filter(Boolean);
}

async function fetchGroqCriteria(groqApiUrl, groqApiKey, description) {
  if (!groqApiUrl || !groqApiKey || !description) return [];
  try {
    const prompt = `Extract acceptance criteria from this Jira description as a bullet list:\n\n${description}`;
    const response = await axios.post(
      groqApiUrl,
      { input: prompt },
      {
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    const outputText = data?.output || data?.result || data?.choices?.[0]?.text || data?.text || '';
    return extractLines(String(outputText));
  } catch (error) {
    console.warn('GROQ request failed:', error.message);
    return [];
  }
}

app.post('/api/generate', async (req, res) => {
  const {
    jiraBaseUrl,
    jiraEmail,
    jiraApiToken,
    jiraIssueKey,
    groqApiUrl,
    groqApiKey,
  } = req.body;

  if (!jiraBaseUrl || !jiraEmail || !jiraApiToken || !jiraIssueKey) {
    return res.status(400).json({ error: 'jiraBaseUrl, jiraEmail, jiraApiToken and jiraIssueKey are required.' });
  }

  try {
    const cleanedBase = jiraBaseUrl.replace(/\/$/, '');
    const authHeader = buildAuthHeader(jiraEmail, jiraApiToken);
    const issueUrl = `${cleanedBase}/rest/api/3/issue/${encodeURIComponent(jiraIssueKey)}?expand=renderedFields`;

    const issueResponse = await axios.get(issueUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    });

    const issue = issueResponse.data;
    const fields = issue.fields || {};
    const description = fields.description || fields.renderedFields?.description || '';
    const commentData = captureComments(fields);

    let criteria = parseAcceptanceCriteria(description);
    if (!criteria.length) {
      const groqCriteria = await fetchGroqCriteria(groqApiUrl, groqApiKey, description);
      criteria = groqCriteria.length ? groqCriteria : criteria;
    }

    const markdown = buildMarkdown(issue, fields, criteria, commentData);
    const filename = `${jiraIssueKey}-Test-Plan.md`;
    const filePath = path.join(GENERATED_DIR, filename);

    fs.writeFileSync(filePath, markdown, 'utf8');

    return res.json({ filename, path: filePath, markdown });
  } catch (error) {
    console.error('Generate endpoint error:', {
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      stack: error.stack,
    });
    const message = error.response?.data || error.message || 'Unknown error';
    return res.status(500).json({ error: typeof message === 'object' ? JSON.stringify(message) : String(message) });
  }
});

app.listen(PORT, () => {
  console.log(`VWO Test Plan backend running on http://localhost:${PORT}`);
});
