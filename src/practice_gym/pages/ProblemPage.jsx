import { useState, useRef } from 'react'
import '../style/ProblemPage.css'
import ccaLogo from '../../assets/icons/cca.png'
import { pistonAPI, getVerdict } from '../utilities/pistonAPI.js'
import VerdictModal from './VerdictModal.jsx'
import { 
  checkCodeforcesLogin,
  submitCodeWithSession,
  pollForVerdict, 
  isVerdictAccepted,
  getVerdictMessage 
} from '../../pvp_battle/utilities/codeforcesSubmission'

const ProblemPage = ({ problem, timeLeft, onBack, onSubmit, onHelp, code = '', onCodeChange, cfHandle }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('Python');
  const fileInputRef = useRef(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [verdictResult, setVerdictResult] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);
  
  // Codeforces submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState({ title: '', message: '', emoji: '' });
  const [popupWindow, setPopupWindow] = useState(null);
  const [submissionTimestamp, setSubmissionTimestamp] = useState(null);

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

    try {
      setIsSubmitting(true);
      
      // Check if user is logged into Codeforces
      const isLoggedIn = await checkCodeforcesLogin(cfHandle);
      
      if (!isLoggedIn) {
        setResultModalData({
          emoji: '⚠️',
          title: 'Codeforces Login Required',
          message: 'You must be logged into Codeforces first!\n\nSteps:\n1. Open Codeforces.com in a new tab\n2. Log in with your account\n3. Come back here and try again\n\nWe use your browser session.'
        });
        setShowResultModal(true);
        setIsSubmitting(false);
        return;
      }
      
      // Ask for confirmation before submitting
      setShowConfirmModal(true);
    } catch (err) {
      console.error('Error submitting solution:', err);
      setResultModalData({
        emoji: '❌',
        title: 'Submission Failed',
        message: 'Failed to submit. Please try again.'
      });
      setShowResultModal(true);
      setIsSubmitting(false);
    }
  };
  
  // Handle actual submission after confirmation
  const proceedWithSubmission = async () => {
    try {
      setShowConfirmModal(false);
      
      // Capture timestamp before submission
      const timestamp = Math.floor(Date.now() / 1000);
      setSubmissionTimestamp(timestamp);
      console.log(`Submission timestamp: ${timestamp}`);
      
      // Map language to Codeforces format
      const languageMap = {
        'Python': 'PYTHON',
        'Python 3': 'PYTHON',
        'C++': 'C++',
        'Java': 'JAVA',
        'JavaScript': 'JAVASCRIPT'
      };
      const cfLanguage = languageMap[selectedLanguage] || 'PYTHON';
      
      // Submit code (opens Codeforces with pre-filled form)
      const result = await submitCodeWithSession(
        problem.contestId,
        problem.index,
        code,
        cfLanguage
      );
      
      // Store popup reference for monitoring
      setPopupWindow(result.popupWindow);
      
      // Show instructions to user
      setResultModalData({
        emoji: '🚀',
        title: 'Auto-Filling Code!',
        message: `Opening Codeforces with automatic code transfer...\n\n✅ Problem: ${problem.contestId}${problem.index}\n✅ Language: ${cfLanguage}\n✅ Code: ${code.length} characters\n\n⚡ Your code will auto-fill in the form!\n\nJust verify and click Submit in the popup.\n\nPopup auto-closes 3s after submission.`
      });
      setShowResultModal(true);
      
      // Start monitoring the popup
      startPopupMonitoring(result.popupWindow, timestamp);
      
    } catch (err) {
      console.error('Error submitting solution:', err);
      setResultModalData({
        emoji: '❌',
        title: 'Submission Failed',
        message: 'Failed to submit. Please try again.'
      });
      setShowResultModal(true);
      setIsSubmitting(false);
    }
  };
  
  // Monitor popup for submission
  const startPopupMonitoring = (popup, timestamp) => {
    if (!popup) return;
    
    let checkCount = 0;
    const maxChecks = 120;
    const initialPath = "/submit";
    
    const monitorInterval = setInterval(() => {
      try {
        checkCount++;
        
        if (popup.closed) {
          console.log('Popup was closed');
          clearInterval(monitorInterval);
          setShowResultModal(false);
          handleCheckVerdict(timestamp);
          return;
        }
        
        const currentUrl = popup.location.href;
        
        if (!currentUrl.includes(initialPath)) {
          console.log('Submit detected! URL changed to:', currentUrl);
          clearInterval(monitorInterval);
          
          setTimeout(() => {
            if (!popup.closed) popup.close();
            setPopupWindow(null);
            setShowResultModal(false);
            handleCheckVerdict(timestamp);
          }, 3000);
          
          return;
        }
        
        if (checkCount > maxChecks) {
          clearInterval(monitorInterval);
          if (!popup.closed) popup.close();
          setShowResultModal(false);
          handleCheckVerdict(timestamp);
        }
        
      } catch (err) {
        // CORS error - expected
      }
    }, 1000);
  };
  
  // Check verdict from Codeforces
  const handleCheckVerdict = async (timestamp) => {
    try {
      setResultModalData({
        emoji: '⏳',
        title: 'Checking Verdict',
        message: 'Waiting for Codeforces to judge your submission...\n\nThis may take a few seconds.'
      });
      setShowResultModal(true);
      
      // Poll for verdict
      const verdictData = await pollForVerdict(
        cfHandle,
        problem.contestId,
        problem.index,
        timestamp,
        30000 // 30 second timeout
      );
      
      if (verdictData && verdictData.verdict) {
        const accepted = isVerdictAccepted(verdictData.verdict);
        const verdictMsg = getVerdictMessage(verdictData.verdict);
        
        setResultModalData({
          emoji: accepted ? '✅' : '❌',
          title: accepted ? 'Accepted!' : verdictMsg,
          message: accepted 
            ? `Congratulations! Your solution was accepted!\n\nTime: ${verdictData.timeConsumedMillis}ms\nMemory: ${Math.floor(verdictData.memoryConsumedBytes / 1024)}KB`
            : `Verdict: ${verdictMsg}\n\nTest: #${verdictData.passedTestCount + 1}\n\nKeep trying! You can do it!`
        });
        setShowResultModal(true);
        
        // If accepted, mark as solved
        if (accepted && onSubmit) {
          setTimeout(() => {
            setShowResultModal(false);
            onSubmit();
          }, 3000);
        }
      } else {
        setResultModalData({
          emoji: '⚠️',
          title: 'Verdict Not Found',
          message: 'Could not find your submission verdict.\n\nPlease check your Codeforces submissions page manually.'
        });
        setShowResultModal(true);
      }
    } catch (err) {
      console.error('Error checking verdict:', err);
      setResultModalData({
        emoji: '⚠️',
        title: 'Verdict Check Failed',
        message: 'Could not check verdict.\n\nPlease verify your submission on Codeforces.com'
      });
      setShowResultModal(true);
    } finally {
      setIsSubmitting(false);
    }
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
                disabled={isSubmitting || isExecuting}
              >
                {isSubmitting ? '⏳ Submitting...' : 'SUBMIT'}
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
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🚀 Submit to Codeforces?</h2>
            <p>This will open Codeforces and submit your code.</p>
            <p><strong>Problem:</strong> {problem?.contestId}{problem?.index} - {problem?.name}</p>
            <p><strong>Language:</strong> {selectedLanguage}</p>
            <div className="modal-actions">
              <button onClick={proceedWithSubmission} className="btn-primary">Yes, Submit</button>
              <button onClick={() => { setShowConfirmModal(false); setIsSubmitting(false); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Result Modal */}
      {showResultModal && (
        <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">{resultModalData.emoji}</div>
            <h2>{resultModalData.title}</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{resultModalData.message}</p>
            <button onClick={() => setShowResultModal(false)} className="btn-primary">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;
