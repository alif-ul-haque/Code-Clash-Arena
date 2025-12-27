import { useState, useRef } from 'react'
import '../style/ProblemPage.css'
import ccaLogo from '../../assets/icons/cca.png'

const ProblemPage = ({ problem, timeLeft, onBack, onSubmit, onHelp }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('Python');
  const fileInputRef = useRef(null);

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
        const textarea = document.querySelector('.code-editor');
        if (textarea) {
          textarea.value = event.target.result;
        }
      };
      reader.readAsText(file);
    }
  };

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
        {/* Left Panel */}
        <section className="problem-panel">
          <h2>Problem Statement :</h2>
          <p>
            Given an array of integers nums and an integer target, return the
            indices of the two numbers that add up to target.
          </p>

          <h3>EXAMPLES :</h3>
          <div className="example-box">
            <p>
              <strong>Input:</strong> nums = [2,7,11,15], target = 9
            </p>
            <p>
              <strong>Output:</strong> [0,1]
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="divider">
          <span>▲</span>
          <span>▼</span>
        </div>

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
            </select>

            <button className="submit-btn" onClick={onSubmit}>SUBMIT</button>
          </div>

          <textarea
            className="code-editor"
            placeholder="### WRITE YOUR CODE FROM HERE"
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
    </div>
  );
};

export default ProblemPage;
