import { useState } from 'react'
import '../style/VerdictModal.css'

const VerdictModal = ({ result, onClose, onRunAgain }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  const getStatusColor = (statusClass) => {
    switch (statusClass) {
      case 'ac':
      case 'success':
        return '#7ad957';
      case 'wa':
        return '#ff6b6b';
      case 'tle':
        return '#ffa500';
      case 'ce':
      case 're':
      case 'error':
        return '#ff4444';
      default:
        return '#6db5ff';
    }
  };

  const getStatusIcon = (statusClass) => {
    switch (statusClass) {
      case 'ac':
      case 'success':
        return '✅';
      case 'wa':
        return '❌';
      case 'tle':
        return '⏱️';
      case 'ce':
        return '⚠️';
      case 're':
        return '💥';
      default:
        return 'ℹ️';
    }
  };

  // For single execution result
  if (!result.testResults) {
    return (
      <div className="verdict-overlay" onClick={onClose}>
        <div className="verdict-modal" onClick={(e) => e.stopPropagation()}>
          <div className="verdict-header" style={{ borderColor: getStatusColor(result.statusClass) }}>
            <h2>
              <span className="status-icon">{getStatusIcon(result.statusClass)}</span>
              {result.status}
            </h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="verdict-body">
            {result.message && (
              <div className="verdict-section">
                <h3>Message:</h3>
                <p className="message-text">{result.message}</p>
              </div>
            )}

            {result.output && (
              <div className="verdict-section">
                <h3>Output:</h3>
                <pre className="output-box">{result.output}</pre>
              </div>
            )}

            {result.error && (
              <div className="verdict-section error-section">
                <h3>Error:</h3>
                <pre className="error-box">{result.error}</pre>
              </div>
            )}

            {result.expected && result.actual && (
              <div className="comparison-section">
                <div className="verdict-section">
                  <h3>Expected Output:</h3>
                  <pre className="output-box expected">{result.expected}</pre>
                </div>
                <div className="verdict-section">
                  <h3>Your Output:</h3>
                  <pre className="output-box actual">{result.actual}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="verdict-footer">
            <button className="btn secondary" onClick={onRunAgain}>Run Again</button>
            <button className="btn primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // For test case results
  const totalTests = result.testResults.length;
  const passedTests = result.testResults.filter(t => t.passed).length;
  const allPassed = passedTests === totalTests;

  return (
    <div className="verdict-overlay" onClick={onClose}>
      <div className="verdict-modal large" onClick={(e) => e.stopPropagation()}>
        <div className="verdict-header" style={{ borderColor: allPassed ? '#7ad957' : '#ff6b6b' }}>
          <h2>
            <span className="status-icon">{allPassed ? '✅' : '❌'}</span>
            Test Results: {passedTests}/{totalTests} Passed
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="verdict-body">
          <div className="test-summary">
            <div className={`summary-card ${allPassed ? 'passed' : 'failed'}`}>
              <h3>{allPassed ? 'All Tests Passed! 🎉' : 'Some Tests Failed'}</h3>
              <p className="summary-stats">
                <span className="stat passed">✓ {passedTests} Passed</span>
                <span className="stat failed">✗ {totalTests - passedTests} Failed</span>
              </p>
            </div>
          </div>

          <div className="test-cases-list">
            {result.testResults.map((testResult, index) => (
              <div key={index} className={`test-case-item ${testResult.passed ? 'passed' : 'failed'}`}>
                <div className="test-case-header" onClick={() => setShowDetails(showDetails === index ? null : index)}>
                  <span className="test-number">
                    {testResult.passed ? '✅' : '❌'} Test Case #{testResult.testCaseNumber}
                  </span>
                  <span className="test-status">{testResult.status}</span>
                  <span className="toggle-icon">{showDetails === index ? '▼' : '▶'}</span>
                </div>

                {showDetails === index && (
                  <div className="test-case-details">
                    {testResult.input && (
                      <div className="detail-block">
                        <h4>Input:</h4>
                        <pre>{testResult.input}</pre>
                      </div>
                    )}

                    {testResult.expectedOutput && (
                      <div className="detail-block">
                        <h4>Expected Output:</h4>
                        <pre className="expected">{testResult.expectedOutput}</pre>
                      </div>
                    )}

                    {testResult.actualOutput && (
                      <div className="detail-block">
                        <h4>Your Output:</h4>
                        <pre className={testResult.passed ? 'actual passed' : 'actual failed'}>{testResult.actualOutput}</pre>
                      </div>
                    )}

                    {testResult.message && (
                      <div className="detail-block error">
                        <h4>Error Message:</h4>
                        <pre>{testResult.message}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="verdict-footer">
          <button className="btn secondary" onClick={onRunAgain}>Run Again</button>
          {allPassed && (
            <button className="btn success" onClick={onClose}>Continue Practicing!</button>
          )}
          <button className="btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default VerdictModal;
