const buildStrategy = ({ issueKey, issueText, jiraConfig, groqConfig }) => {
  const title = issueKey || 'Jira Issue';
  const featureName = issueText
    ? issueText.split('\n')[0].trim()
    : 'Login / Dashboard Feature';
  const trimmedText = issueText ? issueText.trim() : '';
  const description = trimmedText || `A dashboard and login flow for the application.`;

  const output = [];
  output.push(`# Test Strategy for ${title}`);
  output.push('');
  output.push('## Objective');
  output.push(`Validate the end-to-end functionality, security, usability, and performance of the feature described by ${title}. The strategy ensures the system meets business requirements and delivers a stable login/dashboard experience.`);
  output.push('');
  output.push('## Scope');
  output.push('In scope:');
  output.push('- Functional login workflows, password reset flows, account creation, and dashboard navigation.');
  output.push('- Form validation, authentication, session handling, and user role access.');
  output.push('- Data display, filters, widgets, and dashboard state management.');
  output.push('- Error handling, notifications, and integration with backend APIs.');
  output.push('- Cross-browser compatibility and mobile responsiveness for supported devices.');
  output.push('');
  output.push('Out of scope:');
  output.push('- Physical device compatibility beyond supported browsers.');
  output.push('- Third-party integration tests outside core authentication and dashboard display.');
  output.push('- Backend performance tuning that is not directly observable from the UI.');
  output.push('');
  output.push('## Focus Areas');
  output.push('- Functional correctness of login and dashboard behaviors.');
  output.push('- UI/navigation flows and accessibility compliance.');
  output.push('- Performance under nominal and peak load.');
  output.push('- Security controls for authentication and session management.');
  output.push('- Compatibility across major browsers and screen sizes.');
  output.push('');
  output.push('## Approach');
  output.push('- Black box and exploratory testing of the workflow from login through dashboard access.');
  output.push('- Automated test case generation for critical scenarios and regression coverage.');
  output.push('- Security checks for OWASP Top 10 related risks in login and session handling.');
  output.push('- Performance validation for page load and API response times.');
  output.push('');
  output.push('## Deliverables');
  output.push('- Functional test cases and detailed test execution reports.');
  output.push('- Regression test suite for login and dashboard workflows.');
  output.push('- Security vulnerability findings and risk mitigation recommendations.');
  output.push('- Compatibility validation across declared browsers and devices.');
  output.push('- Test summary and exit criteria documentation.');
  output.push('');
  output.push('## Team & Schedule');
  output.push('- Sprint 1: Functional test design and execution.');
  output.push('- Sprint 2: Regression automation and compatibility validation.');
  output.push('- Sprint 3: Performance validation and security review.');
  output.push('');
  output.push('## Entry & Exit Criteria');
  output.push('- Entry: Requirements are stable and test environment is available.');
  output.push('- Exit: All critical defects resolved and agreed-upon acceptance criteria met.');
  output.push('');
  output.push('## Risks');
  output.push('- Delay in environment availability.');
  output.push('- Insufficient detail in the Jira issue description.');
  output.push('- Third-party authentication or API dependencies unavailable during test execution.');
  output.push('');
  output.push('## Notes');
  output.push(`Jira Base URL: ${jiraConfig.jiraBaseUrl || 'Not provided'}`);
  output.push(`Jira Issue Source: ${title}`);
  output.push(`GROQ Model: ${groqConfig.model || 'Not configured'}`);
  output.push('');
  output.push('---');
  output.push('This document was generated from the provided Jira issue text and configuration settings.');

  return output.join('\n');
};

export default function generateStrategy(data) {
  return buildStrategy(data);
}
