import { useEffect, useState } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'vwoTestPlanSettings';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5174';

function loadSavedSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function fieldUpdater(setState) {
  return (event) => {
    const { name, value } = event.target;
    setState((prev) => {
      const next = { ...prev, [name]: value };
      saveSettings(next);
      return next;
    });
  };
}

function App() {
  const [settings, setSettings] = useState(loadSavedSettings());
  const [issueKey, setIssueKey] = useState(settings.jiraIssueKey || 'VWO-48');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [generatedFilename, setGeneratedFilename] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSettings((prev) => ({ ...prev, jiraIssueKey: issueKey }));
  }, [issueKey]);

  const handleChange = fieldUpdater(setSettings);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResultMessage('');
    setGeneratedMarkdown('');
    setGeneratedFilename('');
    try {
      const payload = {
        jiraBaseUrl: settings.jiraBaseUrl,
        jiraEmail: settings.jiraEmail,
        jiraApiToken: settings.jiraApiToken,
        groqApiUrl: settings.groqApiUrl,
        groqApiKey: settings.groqApiKey,
        jiraIssueKey: issueKey,
      };
      const response = await axios.post(`${apiBaseUrl}/api/generate`, payload);
      const filename = response.data.filename || `${issueKey}-Test-Plan.md`;
      const markdown = response.data.markdown || '';
      setGeneratedFilename(filename);
      setGeneratedMarkdown(markdown);
      setResultMessage(`Generated ${filename}`);
      saveSettings({ ...settings, jiraIssueKey: issueKey });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedMarkdown || !generatedFilename) return;
    const blob = new Blob([generatedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = generatedFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header>
        <h1>VWO Test Plan Generator</h1>
        <p>Enter Jira and GROQ settings, then generate a test plan for a Jira issue.</p>
      </header>

      <section className="panel">
        <h2>Settings</h2>
        <div className="grid">
          <label>
            Jira Base URL
            <input name="jiraBaseUrl" value={settings.jiraBaseUrl || ''} onChange={handleChange} placeholder="https://your-domain.atlassian.net" />
          </label>
          <label>
            Jira Email
            <input name="jiraEmail" value={settings.jiraEmail || ''} onChange={handleChange} placeholder="you@example.com" />
          </label>
          <label>
            Jira API Token
            <input name="jiraApiToken" type="password" value={settings.jiraApiToken || ''} onChange={handleChange} placeholder="xxxxxxxxxxxx" />
          </label>
          <label>
            GROQ API URL
            <input name="groqApiUrl" value={settings.groqApiUrl || ''} onChange={handleChange} placeholder="https://api.groq.ai/v1/generate" />
          </label>
          <label>
            GROQ API Key
            <input name="groqApiKey" type="password" value={settings.groqApiKey || ''} onChange={handleChange} placeholder="groq-key" />
          </label>
          <label>
            Jira Issue Key
            <input value={issueKey} onChange={(event) => setIssueKey(event.target.value)} placeholder="VWO-48" />
          </label>
        </div>
      </section>

      <section className="panel actions">
        <button onClick={handleGenerate} disabled={loading || !issueKey}>Generate Test Plan</button>
        {loading && <span className="status">Generating...</span>}
      </section>

      {error && (
        <section className="panel error">
          <h2>Error</h2>
          <pre>{error}</pre>
        </section>
      )}

      {resultMessage && (
        <section className="panel result">
          <h2>Success</h2>
          <p>{resultMessage}</p>
          {generatedFilename && (
            <button onClick={handleDownload}>Download {generatedFilename}</button>
          )}
        </section>
      )}

      {generatedMarkdown && (
        <section className="panel result">
          <h2>Generated Markdown</h2>
          <pre>{generatedMarkdown}</pre>
        </section>
      )}
    </div>
  );
}

export default App;
