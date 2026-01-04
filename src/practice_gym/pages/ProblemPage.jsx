import { useState, useRef } from 'react'
import '../style/ProblemPage.css'
import ccaLogo from '../../assets/icons/cca.png'
import { pistonAPI, getVerdict } from '../utilities/pistonAPI.js'
import VerdictModal from './VerdictModal.jsx'

const ProblemPage = ({ problem, timeLeft, onBack, onSubmit, onHelp, code = '', onCodeChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('Python');
  const fileInputRef = useRef(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [verdictResult, setVerdictResult] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);

  // Generate Codeforces problem URL
  const getProblemUrl = () => {
    if (problem?.contestId && problem?.index) {
      return `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
    }
    return null;
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (onCodeChange) {
          onCodeChange(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

    setIsExecuting(true);
    setVerdictResult(null);

    try {
      // Execute the code
      const result = await pistonAPI.executeCode(selectedLanguage, code);
      const verdict = getVerdict(result);
      
      setVerdictResult(verdict);
      setShowVerdict(true);
    } catch (error) {
      setVerdictResult({
        status: 'Error',
        statusClass: 'error',
        message: error.message || 'Failed to execute code',
        error: error.toString()
      });
      setShowVerdict(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

    // For now, just run the code
    // In the future, you can add test cases here
    await handleRunCode();
    
    // If you want to mark it as solved after successful execution
    // You can check the verdict and call onSubmit if needed
  };

  const closeVerdict = () => {
    setShowVerdict(false);
  };

  const handleRunAgain = () => {
    setShowVerdict(false);
    setVerdictResult(null);
  };

  const problemUrl = getProblemUrl();

  return (
    <div className="problem-page">
      {/* Header */}
      <header className="header">
        <div className="logo-box"><img src={ccaLogo} alt="Code Clash Arena Logo" className="logo" /></div>

        <h1 className="problem-title">{problem?.title || 'Theatre Square'}</h1>

        <div className="header-actions">
          <div className="timer">{formatTime(timeLeft)}</div>
          <button className="exit-btn" onClick={onBack}>EXIT</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="content">
        {/* Left Panel - Codeforces Problem */}
        <section className="problem-panel">
          {problemUrl ? (
            <div className="problem-content">
              <div className="problem-header">
                <h2>{problem.title}</h2>
                <div className="problem-badges">
                  <span className="badge rating-badge">⭐ {problem.rating}</span>
                  <span className="badge tag-badge">🏷️ {problem.tag}</span>
                  <span className="badge solved-badge">👥 {problem.solved}</span>
                </div>
              </div>

              <div className="problem-note">
                <p>💡 <strong>Note:</strong> This is a Codeforces problem. Click the button below to view the full problem statement, examples, input/output format, and test cases.</p>
              </div>

              <div className="problem-details">
                <div className="detail-card">
                  <h3>🎯 Contest Information</h3>
                  <p><strong>Contest ID:</strong> {problem.contestId}</p>
                  <p><strong>Problem Index:</strong> {problem.index}</p>
                  <p><strong>Difficulty:</strong> {problem.rating}</p>
                </div>

                <div className="detail-card">
                  <h3>📚 Categories</h3>
                  <div className="tags-list">
                    {problem.tags && problem.tags.map((tag, idx) => (
                      <span key={idx} className="tag-chip">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <a 
                href={problemUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="view-problem-btn"
              >
                📖 View Problem on Codeforces
              </a>

              <div className="problem-tip">
                <p>💡 <strong>Tip:</strong> The problem will open in a new tab. Read it carefully and come back here to write your solution!</p>
              </div>
            </div>
          ) : (
            <div className="no-problem">
              <p>Problem information not available</p>
            </div>
          )}
        </section>

        {/* Right Panel */}
        <section className="editor-panel">
          <div className="editor-header">
            <select 
              className="language-select"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              <option>Python</option>
              <option>C++</option>
              <option>Java</option>
              <option>JavaScript</option>
              <option>C</option>
              <option>C#</option>
              <option>Go</option>
              <option>Rust</option>
              <option>Ruby</option>
              <option>PHP</option>
            </select>

            <div className="header-buttons">
              <button 
                className="run-btn" 
                onClick={handleRunCode}
                disabled={isExecuting}
              >
                {isExecuting ? '⏳ Running...' : '▶️ RUN'}
              </button>
              <button 
                className="submit-btn" 
                onClick={handleSubmitCode}
                disabled={isExecuting}
              >
                {isExecuting ? '⏳ Submitting...' : 'SUBMIT'}
              </button>
            </div>
          </div>

          <textarea
            className="code-editor"
            placeholder="### WRITE YOUR CODE FROM HERE"
            value={code}
            onChange={(e) => onCodeChange && onCodeChange(e.target.value)}
          ></textarea>

          <div className="editor-footer">
            <button className="upload-btn" onClick={handleFileUpload}>UPLOAD FILE</button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".py,.cpp,.java,.js,.txt"
              style={{ display: 'none' }}
            />
            <span className="language-info">LANGUAGE : {selectedLanguage.toUpperCase()}</span>
          </div>

          <button className="help-btn" onClick={onHelp}>Too Hard to Solve?</button>
        </section>
      </div>

      {/* Verdict Modal */}
      {showVerdict && verdictResult && (
        <VerdictModal 
          result={verdictResult}
          onClose={closeVerdict}
          onRunAgain={handleRunAgain}
        />
      )}
    </div>
  );
};

export default ProblemPage;
