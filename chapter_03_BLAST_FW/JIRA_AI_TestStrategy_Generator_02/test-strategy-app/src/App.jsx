import { useEffect, useMemo, useState } from 'react';
import generateStrategy from './generator';

const initialSettings = {
  jiraEmail: '',
  jiraApiToken: '',
  jiraBaseUrl: '',
  groqKey: '',
  groqModel: 'openai/gpt-oss-120b',
  issueKey: 'JIRA-1356',
};

function App() {
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState(initialSettings);
  const [sourceType, setSourceType] = useState('jira-key');
  const [issueText, setIssueText] = useState('Login page and user dashboard feature requirements.');
  const [fileName, setFileName] = useState('');
  const [notification, setNotification] = useState('');
  const [strategy, setStrategy] = useState('');

  const preview = useMemo(() => strategy, [strategy]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    if (!settings.issueKey && !issueText) {
      setNotification('Please provide a Jira issue key or issue text.');
      return;
    }
    setNotification('');
    const source = sourceType === 'jira-key' ? settings.issueKey : issueText;
    const markdown = generateStrategy({
      issueKey: sourceType === 'jira-key' ? settings.issueKey : 'Text Input',
      issueText: source,
      jiraConfig: {
        jiraEmail: settings.jiraEmail,
        jiraApiToken: settings.jiraApiToken,
        jiraBaseUrl: settings.jiraBaseUrl,
      },
      groqConfig: {
        groqKey: settings.groqKey,
        model: settings.groqModel,
      },
    });
    setStrategy(markdown);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setFileName(file.name);
    const text = await file.text();
    setIssueText(text);
    setSourceType('file');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([strategy], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${settings.issueKey || 'test-strategy'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Jira Test Strategy Generator</h1>
          <p>Enter Jira settings, upload a text file, and generate a formatted test strategy.</p>
        </div>
        <button className="theme-toggle" onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>

      <main>
        <section className="panel">
          <h2>Configuration</h2>
          <div className="field-grid">
            <label>
              Jira Email
              <input type="email" value={settings.jiraEmail} onChange={(e) => updateSetting('jiraEmail', e.target.value)} placeholder="jira@example.com" />
            </label>
            <label>
              Jira API Token
              <input type="password" value={settings.jiraApiToken} onChange={(e) => updateSetting('jiraApiToken', e.target.value)} placeholder="••••••••" />
            </label>
            <label>
              Jira Base URL
              <input type="text" value={settings.jiraBaseUrl} onChange={(e) => updateSetting('jiraBaseUrl', e.target.value)} placeholder="https://your-domain.atlassian.net" />
            </label>
            <label>
              GROQ Key
              <input type="text" value={settings.groqKey} onChange={(e) => updateSetting('groqKey', e.target.value)} placeholder="gsk_..." />
            </label>
            <label>
              GROQ Model
              <input type="text" value={settings.groqModel} onChange={(e) => updateSetting('groqModel', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Issue Source</h2>
          <div className="inline-controls">
            <label>
              <input type="radio" checked={sourceType === 'jira-key'} onChange={() => setSourceType('jira-key')} />
              Jira Issue Key
            </label>
            <label>
              <input type="radio" checked={sourceType === 'text'} onChange={() => setSourceType('text')} />
              Plain Text
            </label>
            <label>
              <input type="radio" checked={sourceType === 'file'} onChange={() => setSourceType('file')} />
              Upload File
            </label>
          </div>

          {sourceType === 'jira-key' && (
            <label className="full-width">
              Jira Issue Key
              <input type="text" value={settings.issueKey} onChange={(e) => updateSetting('issueKey', e.target.value)} placeholder="JIRA-1356" />
            </label>
          )}

          {(sourceType === 'text' || sourceType === 'file') && (
            <label className="full-width">
              Issue Description
              <textarea value={issueText} onChange={(e) => setIssueText(e.target.value)} rows="6" placeholder="Enter the Jira issue summary, acceptance criteria, or feature notes." />
            </label>
          )}

          {sourceType === 'file' && (
            <p className="hint">Uploaded file: {fileName || 'none selected'}</p>
          )}

          <label className="full-width file-input">
            <span>Upload .txt or .md file</span>
            <input type="file" accept=".txt,.md" onChange={handleFileUpload} />
          </label>
        </section>

        <section className="panel actions-panel">
          <button className="primary-button" onClick={handleGenerate}>Generate Strategy</button>
          <button className="secondary-button" onClick={downloadMarkdown} disabled={!strategy}>Download Markdown</button>
          {notification && <p className="notification">{notification}</p>}
        </section>

        <section className="panel preview-panel">
          <h2>Generated Test Strategy</h2>
          {preview ? (
            <pre>{preview}</pre>
          ) : (
            <p className="hint">Generate the strategy to preview the Markdown output here.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
