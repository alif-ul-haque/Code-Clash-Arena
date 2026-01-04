import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/ProblemSolving.css';
import ccaLogo from '../../assets/icons/cca.png';
import bgImage from '../../assets/images/10002.png';

export default function ProblemSolving() {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE ##FROM HERE\n\n');
    const [splitPosition, setSplitPosition] = useState(45); // Percentage
    const [isDragging, setIsDragging] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
    const [initialTime] = useState(3600);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    const problemData = {
        1: {
            title: "Array Conquest",
            difficulty: "Medium",
            description: "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
            examples: [
                { 
                    title: "EXAMPLES:",
                    input: "nums = [2,7,11,15], target = 9", 
                    output: "[0,1]"
                }
            ],
            constraints: ["2 <= nums.length <= 104", "-109 <= nums[i] <= 109", "Only one valid answer exists."]
        }
    };

    const problem = problemData[problemId] || problemData[1];

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time as MM:SS
    const formatTime = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate time percentage and color
    const getTimePercentage = () => {
        return (timeLeft / initialTime) * 100;
    };

    const getTimeColor = () => {
        const percentage = getTimePercentage();
        if (percentage > 66) return '#00FF7F'; // Green
        if (percentage > 33) return '#FFD700'; // Yellow/Gold
        return '#FF4444'; // Red
    };

    const handleMouseDown = () => {
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

        if (newPosition >= 25 && newPosition <= 75) {
            setSplitPosition(newPosition);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSubmit = () => {
        console.log('Submitting code:', code);
        setShowSuccessPopup(true);
    };

    const handleClosePopup = () => {
        setShowSuccessPopup(false);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCode(e.target.result);
            };
            reader.readAsText(file);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleLanguageSelect = (language) => {
        setSelectedLanguage(language);
        setShowDropdown(false);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <div 
            className="problem-solving-page"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={containerRef}
        >
            {/* Top Navigation Bar */}
            <div className="top-nav-bar">
                <div className="nav-left">
                    <div className="game-logo">
                        <img src={ccaLogo} alt="Code Clash" className="logo-icon" />
                    </div>
                    <h1 className="problem-title-nav">{problem.title}</h1>
                    <div className="problem-progress">1/5</div>
                </div>
                <div className="nav-right">
                    <div className="score-display">
                        {formatTime()}
                    </div>
                    <button className="exit-btn" onClick={() => navigate('/your-clan/battle-arena')}>
                        EXIT
                    </button>
                </div>
            </div>

            {/* Resizable Split View */}
            <div className="split-container" style={{ cursor: isDragging ? 'col-resize' : 'default' }}>
                {/* Problem Statement Side */}
                <div 
                    className="problem-statement-side"
                    style={{ width: `${splitPosition}%` }}
                >
                    <div className="statement-content">
                        <div className="statement-header">
                            <h2 className="statement-title">Problem Statement :</h2>
                        </div>
                        
                        <p className="problem-description">{problem.description}</p>

                        <div className="examples-section">
                            <h3 className="examples-title">EXAMPLES :</h3>
                            {problem.examples.map((example, index) => (
                                <div key={index} className="example-box">
                                    <p className="example-text">
                                        <span className="example-label">Input:</span><br/>
                                        {example.input}
                                    </p>
                                    <p className="example-text">
                                        <span className="example-label">Output:</span> {example.output}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resizable Divider */}
                <div 
                    className="resize-divider"
                    onMouseDown={handleMouseDown}
                >
                    <div className="divider-handle">
                        <div className="handle-circle">
                            <div className="handle-icon">⬌</div>
                        </div>
                    </div>
                </div>

                {/* Code Editor Side */}
                <div 
                    className="code-editor-side"
                    style={{ 
                        width: `${100 - splitPosition}%`,
                        backgroundImage: `url(${bgImage})`
                    }}
                >
                    <div className="editor-top-bar">
                        <div className="language-selector">
                            <div className="language-dropdown">
                                <button className="dropdown-btn" onClick={toggleDropdown}>
                                    <span>{selectedLanguage}</span>
                                    <span className="dropdown-arrow">{showDropdown ? '▼' : '▲'}</span>
                                </button>
                                {showDropdown && (
                                    <div className="dropdown-options">
                                        <div className="option-item" onClick={() => handleLanguageSelect('PYTHON')}>PYTHON</div>
                                        <div className="option-item" onClick={() => handleLanguageSelect('JAVA')}>JAVA</div>
                                        <div className="option-item" onClick={() => handleLanguageSelect('C/C++')}>C/C++</div>
                                        <div className="option-item" onClick={() => handleLanguageSelect('ASSEMBLY')}>ASSEMBLY</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button className="submit-btn-top" onClick={handleSubmit}>
                            SUBMIT
                        </button>
                    </div>

                    <div className="code-editor-area">
                        <textarea
                            className="code-textarea"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck="false"
                        />
                    </div>

                    <div className="editor-bottom-bar">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".py,.java,.cpp,.c,.txt,.js"
                            style={{ display: 'none' }}
                        />
                        <button className="upload-btn" onClick={triggerFileUpload}>UPLOAD</button>
                        <div className="language-indicator">
                            LANGUAGE : {selectedLanguage}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="success-popup-overlay" onClick={handleClosePopup}>
                    <div className="success-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-glow"></div>
                        <div className="success-icon">✓</div>
                        <h2 className="success-title">CODE SUBMITTED!</h2>
                        <p className="success-message">
                            Your solution has been successfully submitted to the battlefield.
                            The Code Warriors await your victory!
                        </p>
                        <div className="success-details">
                            <div className="detail-item">
                                <span className="detail-label">Language:</span>
                                <span className="detail-value">{selectedLanguage}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Problem:</span>
                                <span className="detail-value">{problem.title}</span>
                            </div>
                        </div>
                        <button className="popup-close-btn" onClick={handleClosePopup}>
                            CONTINUE BATTLE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
