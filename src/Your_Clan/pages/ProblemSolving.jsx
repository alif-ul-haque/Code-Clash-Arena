
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/ProblemSolving.css';
import ccaLogo from '../../assets/icons/cca.png';
import bgImage from '../../assets/images/10002.png';
import { submitSolution, getBattle, completeBattle } from '../utilities/ClanBattleManager';
import { hasOngoingClanBattle } from '../utilities/ClanBattleUtils';


// Helper to fetch problems from backend using handles1 and handles2
async function fetchClanWarProblems(handles1, handles2) {
    const res = await fetch('/api/clanwar/problems', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ handles1, handles2 })
    });
    if (!res.ok) throw new Error('Failed to fetch problems');
    return await res.json();
}

export default function ProblemSolving() {
    const { problemId } = useParams();
    const navigate = useNavigate();

    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE ##FROM HERE\n\n');
    const [splitPosition, setSplitPosition] = useState(45); // Percentage
    const [isDragging, setIsDragging] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [initialTime] = useState(600);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Removed unused submitError
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [battleId, setBattleId] = useState(null);
    const [battleStartTime, setBattleStartTime] = useState(null);
    const [battleDuration, setBattleDuration] = useState(600);
    const [battleEnded, setBattleEnded] = useState(false);
    const [problems, setProblems] = useState([]);
    const [problemsLoading, setProblemsLoading] = useState(true);
    const [problemsError, setProblemsError] = useState(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Get current problem from dynamic set
    let problem = null;
    if (problems && problems.length > 0) {
        const idx = parseInt(problemId, 10) - 1;
        problem = problems[idx] || problems[0];
    }


    // Fetch battle ID, participants, and problems on mount
    useEffect(() => {
        async function fetchBattleIdAndProblems() {
            const { hasOngoingBattle, battleId: activeBattleId } = await hasOngoingClanBattle();
            if (hasOngoingBattle && activeBattleId) {
                setBattleId(activeBattleId);
                // Get battle details for synchronized timer
                const { battle } = await getBattle(activeBattleId);
                if (battle && battle.start_time) {
                    const startTime = new Date(battle.start_time);
                    setBattleStartTime(startTime);
                    setBattleDuration(battle.duration_seconds);
                    // Calculate initial time left
                    const currentTime = new Date();
                    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                    const remainingSeconds = Math.max(0, battle.duration_seconds - elapsedSeconds);
                    setTimeLeft(remainingSeconds);
                }
                // Fetch participants to get handles1 and handles2
                setProblemsLoading(true);
                setProblemsError(null);
                try {
                    const { participants } = await import('../utilities/ClanBattleManager').then(mod => mod.getBattleParticipants(activeBattleId));
                    if (!participants || participants.length === 0) throw new Error('No participants found');
                    // Group handles by clan_id
                    const clanMap = {};
                    participants.forEach(p => {
                        if (!clanMap[p.clan_id]) clanMap[p.clan_id] = [];
                        clanMap[p.clan_id].push(p.users?.cf_handle);
                    });
                    const clanIds = Object.keys(clanMap);
                    const handles1 = clanMap[clanIds[0]] || [];
                    const handles2 = clanMap[clanIds[1]] || [];
                    const fetchedProblems = await fetchClanWarProblems(handles1, handles2);
                    setProblems(fetchedProblems);
                } catch (error) {
                    setProblemsError('Failed to load problems. Please try again.');
                } finally {
                    setProblemsLoading(false);
                }
            }
        }
        fetchBattleIdAndProblems();
    }, []);

    // Timer countdown - synchronized across tabs
    useEffect(() => {
        if (!battleStartTime || timeLeft <= 0) return;
        const timer = setInterval(() => {
            const now = new Date();
            const elapsedSeconds = Math.floor((now - battleStartTime) / 1000);
            const remaining = Math.max(0, battleDuration - elapsedSeconds);
            setTimeLeft(remaining);
            if (remaining <= 0) {
                setBattleEnded(true);
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [battleStartTime, battleDuration, timeLeft]);

    // Complete battle when timer ends
    useEffect(() => {
        const handleBattleEnd = async () => {
            if (!battleEnded || !battleId) return;

            try {
                console.log('Battle ended, completing battle...');
                
                // Call completeBattle function
                const { winnerId, error } = await completeBattle(battleId);

                if (error) {
                    console.error('Error completing battle:', error);
                } else {
                    console.log('Battle completed successfully. Winner:', winnerId || 'Draw');
                }

                // Navigate to main page after a short delay
                setTimeout(() => {
                    navigate('/main');
                }, 3000);
            } catch (error) {
                console.error('Error in handleBattleEnd:', error);
            }
        };

        handleBattleEnd();
    }, [battleEnded, battleId, navigate]);

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

    // Removed unused getTimeColor

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

    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (!battleId) {
                setSubmitError('No active battle found');
                setIsSubmitting(false);
                return;
            }

            // Problem IDs are 1-based in URL, convert to 0-based index
            const problemIndex = parseInt(problemId) - 1;

            const { success, points, error } = await submitSolution(
                battleId,
                problemIndex,
                code,
                selectedLanguage
            );

            if (success) {
                setEarnedPoints(points);
                setShowSuccessPopup(true);
            } else {
                setSubmitError(error || 'Failed to submit solution');
                alert(error || 'Failed to submit solution');
            }
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitError('An error occurred during submission');
            alert('An error occurred during submission');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClosePopup = () => {
        setShowSuccessPopup(false);
        navigate('/your-clan/battle-arena');
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

    // Loading and error states for problems
    if (problemsLoading) {
        return (
            <div className="problem-solving-page loading-state">
                <div className="loader">Loading problems...</div>
            </div>
        );
    }
    if (problemsError || !problem) {
        return (
            <div className="problem-solving-page error-state">
                <div className="error-message">{problemsError || 'Problem not found.'}</div>
            </div>
        );
    }

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
                    <div className="problem-progress">{problemId}/5</div>
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
                        {problem.constraints && problem.constraints.length > 0 && (
                            <div className="constraints-section">
                                <h4>Constraints:</h4>
                                <ul>
                                    {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="examples-section">
                            <h3 className="examples-title">EXAMPLES :</h3>
                            {problem.examples && problem.examples.length > 0 ? problem.examples.map((example, index) => (
                                <div key={index} className="example-box">
                                    <p className="example-text">
                                        <span className="example-label">Input:</span><br/>
                                        {example.input}
                                    </p>
                                    <p className="example-text">
                                        <span className="example-label">Output:</span> {example.output}
                                    </p>
                                </div>
                            )) : <div>No examples available.</div>}
                        </div>
                        {/* Tags removed: Only show problem name/title, not tags or type */}
                        {problem.link && (
                            <div className="problem-link">
                                <a href={problem.link} target="_blank" rel="noopener noreferrer">View on Codeforces</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resizable Divider */}
                <div 
                    className="resize-divider"
                    onMouseDown={handleMouseDown} disabled={isSubmitting}>
                            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
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
                                <span className="detail-label">Points Earned:</span>
                                <span className="detail-value">{earnedPoints}</span>
                            </div>
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

            {/* Battle Ended Overlay */}
            {battleEnded && (
                <div className="success-popup-overlay">
                    <div className="success-popup">
                        <div className="popup-glow"></div>
                        <h2 className="success-title">Battle Ended!</h2>
                        <p className="success-message">
                            Time's up! The battle has concluded.
                            Calculating results and determining the victor...
                        </p>
                        <div className="success-details">
                            <div className="detail-item">
                                <span className="detail-label">Redirecting to Main Page</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
