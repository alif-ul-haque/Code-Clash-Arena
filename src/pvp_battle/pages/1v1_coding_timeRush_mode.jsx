import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/1v1_coding_timeRush_mode.css';
import logo from '../../assets/icons/cca.png';
import clockIcon from '../../assets/icons/clock.png';
import { supabase } from '../../supabaseclient';
import { fetchCodeforcesProblem } from '../utilities/codeforcesProblemFetcher';
import { 
    checkCodeforcesLogin,
    submitCodeWithSession,
    pollForVerdict, 
    isVerdictAccepted,
    getVerdictMessage 
} from '../utilities/codeforcesSubmission';
import MathRenderer from '../components/MathRenderer';
import { processMatchOutcome } from '../utilities/ratingSystem';

const OneVOneCodingTimeRushMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser, problemCount: initialProblemCount } = location.state || {};
    
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE\n##FROM HERE');
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const totalProblems = initialProblemCount || 3;
    
    // Timer state (30 minutes total for all problems)
    const [timeLeft, setTimeLeft] = useState(1800);
    const fileInputRef = useRef(null);
    const [startTime] = useState(() => Date.now());
    const [currentUserId, setCurrentUserId] = useState(null);
    const [opponentId, setOpponentId] = useState(null);
    
    // Problem state
    const [problems, setProblems] = useState([]);
    const [loadingProblems, setLoadingProblems] = useState(true);
    const [problemError, setProblemError] = useState(null);
    
    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultModalData, setResultModalData] = useState({ title: '', message: '', emoji: '' });
    const [popupWindow, setPopupWindow] = useState(null);
    
    // Track per-problem rating/XP changes
    const [perProblemRatings, setPerProblemRatings] = useState([]);
    const [solvedProblems, setSolvedProblems] = useState(0);

    // Fetch problems from database
    useEffect(() => {
        const loadProblems = async () => {
            try {
                setLoadingProblems(true);
                console.log('🔍 Fetching TIME RUSH problems from database...');
                
                const { data: battleData, error } = await supabase
                    .from('onevonebattles')
                    .select('problem_tags')
                    .eq('onevone_battle_id', battleId)
                    .single();
                
                if (error) throw error;
                
                if (!battleData.problem_tags) {
                    throw new Error('No problems assigned to this battle');
                }
                
                const problemList = JSON.parse(battleData.problem_tags);
                console.log(`✓ Loaded ${problemList.length} problems from DB`);
                
                // Fetch full problem details from Codeforces
                const detailedProblems = await Promise.all(
                    problemList.map(async (p) => {
                        try {
                            const details = await fetchCodeforcesProblem(p.contestId, p.index);
                            return details || p;
                        } catch (err) {
                            console.error(`Failed to fetch ${p.contestId}${p.index}:`, err);
                            return p; // Fallback to basic info
                        }
                    })
                );
                
                setProblems(detailedProblems);
                console.log('✅ All problems loaded successfully');
            } catch (error) {
                console.error('❌ Error loading problems:', error);
                setProblemError(error.message);
            } finally {
                setLoadingProblems(false);
            }
        };

        if (battleId) {
            loadProblems();
        }
    }, [battleId]);

    // Fetch user IDs
    useEffect(() => {
        const fetchUserIds = async () => {
            try {
                if (currentUser) {
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('cf_handle', currentUser)
                        .single();
                    setCurrentUserId(userData?.id);
                }

                if (opponent?.cf_handle) {
                    const { data: opponentData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('cf_handle', opponent.cf_handle)
                        .single();
                    setOpponentId(opponentData?.id);
                }
            } catch (err) {
                console.error('Error fetching user IDs:', err);
            }
        };

        fetchUserIds();
    }, [currentUser, opponent]);
    
    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timeLeft]);
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleTimeOut = async () => {
        console.log('⏰ Time is up!');
        await finalizeBattle(false); // Lost due to timeout
    };

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setSelectedLanguage(newLanguage);
        setCode(`## WRITE YOUR ${newLanguage} CODE\n##FROM HERE`);
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const languageMap = {
                'py': 'PYTHON',
                'js': 'JAVASCRIPT',
                'java': 'JAVA',
                'cpp': 'C++',
                'c': 'C++'
            };
            
            if (languageMap[fileExtension]) {
                setSelectedLanguage(languageMap[fileExtension]);
            }
            
            const reader = new FileReader();
            reader.onload = (event) => setCode(event.target.result);
            reader.readAsText(file);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setSubmitMessage('🔍 Checking Codeforces login...');
            
            const isLoggedIn = await checkCodeforcesLogin(currentUser);
            
            if (!isLoggedIn) {
                setResultModalData({
                    emoji: '⚠️',
                    title: 'Codeforces Login Required',
                    message: 'Please log into Codeforces first and try again.'
                });
                setShowResultModal(true);
                setIsSubmitting(false);
                return;
            }
            
            setShowConfirmModal(true);
        } catch (err) {
            console.error('Error:', err);
            setIsSubmitting(false);
        }
    };

    const proceedWithSubmission = async () => {
        try {
            setShowConfirmModal(false);
            const currentProblem = problems[currentProblemIndex];
            const timestamp = Math.floor(Date.now() / 1000);
            
            setSubmitMessage('📤 Opening Codeforces...');
            
            const result = await submitCodeWithSession(
                currentProblem.contestId,
                currentProblem.index,
                code,
                selectedLanguage
            );
            
            setPopupWindow(result.popupWindow);
            
            setResultModalData({
                emoji: '📋',
                title: 'Code Copied!',
                message: `Problem: ${currentProblem.contestId}${currentProblem.index}\nPaste code and submit in popup.\nPopup auto-closes after 1 minute.`
            });
            setShowResultModal(true);
            
            startPopupMonitoring(result.popupWindow, timestamp, currentProblem);
        } catch (err) {
            console.error('Submission error:', err);
            setIsSubmitting(false);
        }
    };

    const startPopupMonitoring = (popup, timestamp, problem) => {
        if (!popup) return;
        
        let checkCount = 0;
        const maxChecks = 120;
        
        const monitorInterval = setInterval(() => {
            try {
                checkCount++;
                
                if (popup.closed) {
                    clearInterval(monitorInterval);
                    setShowResultModal(false);
                    handleCheckVerdict(timestamp, problem);
                    return;
                }
                
                try {
                    const currentUrl = popup.location.href;
                    if (!currentUrl.includes('/submit')) {
                        clearInterval(monitorInterval);
                        setSubmitMessage('✅ Submitted! Closing in 60s...');
                        
                        setTimeout(() => {
                            if (!popup.closed) popup.close();
                            setPopupWindow(null);
                            setShowResultModal(false);
                            handleCheckVerdict(timestamp, problem);
                        }, 60000); // 60 seconds
                        return;
                    }
                } catch {}
                
                if (checkCount > maxChecks) {
                    clearInterval(monitorInterval);
                    if (!popup.closed) popup.close();
                    setShowResultModal(false);
                    handleCheckVerdict(timestamp, problem);
                }
            } catch {}
        }, 1000);
    };

    const handleCheckVerdict = async (timestamp, problem) => {
        try {
            setShowResultModal(false);
            setSubmitMessage('⏳ Checking verdict...');
            
            const submission = await pollForVerdict(
                currentUser,
                problem.contestId,
                problem.index,
                40,
                3000,
                timestamp
            );
            
            const verdict = submission.verdict;
            const accepted = isVerdictAccepted(verdict);
            const verdictMsg = getVerdictMessage(verdict);
            
            if (accepted) {
                console.log(`✅ Problem ${currentProblemIndex + 1} accepted!`);
                
                // Calculate per-problem rating change
                const matchResult = await processMatchOutcome(currentUserId, opponentId);
                
                // Store per-problem rating
                setPerProblemRatings(prev => [...prev, {
                    problemIndex: currentProblemIndex,
                    ratingChange: matchResult.ratings.winner.change,
                    xpChange: matchResult.xp.winner.change
                }]);
                
                setSolvedProblems(prev => prev + 1);
                
                // Move to next problem or finish
                if (currentProblemIndex < problems.length - 1) {
                    setResultModalData({
                        emoji: '🎉',
                        title: 'Accepted!',
                        message: `Problem ${currentProblemIndex + 1} solved!\n\nRating: +${matchResult.ratings.winner.change}\nXP: +${matchResult.xp.winner.change.toFixed(2)}\n\nMoving to next problem...`
                    });
                    setShowResultModal(true);
                    
                    setTimeout(() => {
                        setShowResultModal(false);
                        setCurrentProblemIndex(prev => prev + 1);
                        setCode('## WRITE YOUR CODE\n##FROM HERE');
                        setIsSubmitting(false);
                    }, 2000);
                } else {
                    // All problems solved!
                    await finalizeBattle(true);
                }
            } else {
                setResultModalData({
                    emoji: '❌',
                    title: verdictMsg,
                    message: 'Try again!'
                });
                setShowResultModal(true);
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error('Verdict error:', err);
            setIsSubmitting(false);
        }
    };

    const finalizeBattle = async (won) => {
        try {
            console.log('🏁 Finalizing battle...');
            
            // Calculate total rating/XP changes
            const totalRatingChange = perProblemRatings.reduce((sum, p) => sum + p.ratingChange, 0);
            const totalXPChange = perProblemRatings.reduce((sum, p) => sum + p.xpChange, 0);
            
            console.log(`Total rating: ${totalRatingChange}, Total XP: ${totalXPChange}`);
            
            // Update participants table
            await supabase
                .from('onevone_participants')
                .update({
                    problem_solved: solvedProblems,
                    time_taken: Math.floor((Date.now() - startTime) / 1000),
                    rating_change: won ? totalRatingChange : -Math.abs(totalRatingChange),
                    xp_change: totalXPChange
                })
                .eq('onevone_battle_id', battleId)
                .eq('player_id', currentUserId);
            
            // Update battle status
            await supabase
                .from('onevonebattles')
                .update({
                    status: 'completed',
                    end_time: new Date().toISOString()
                })
                .eq('onevone_battle_id', battleId);
            
            // Navigate to results
            navigate('/submit-page-time-mode', {
                state: {
                    battleId,
                    won,
                    opponent: opponent?.cf_handle,
                    currentUserId,
                    opponentId,
                    problemsSolved: solvedProblems,
                    totalProblems: problems.length
                }
            });
        } catch (err) {
            console.error('Error finalizing battle:', err);
        }
    };

    const currentProblem = problems[currentProblemIndex];

    if (loadingProblems) {
        return (
            <div className="coding-battle-container">
                <div className="battle-header">
                    <img src={logo} alt="Logo" className="battle-logo" />
                    <h1 className="battle-title">LOADING PROBLEMS...</h1>
                </div>
            </div>
        );
    }

    if (problemError || problems.length === 0) {
        return (
            <div className="coding-battle-container">
                <div className="battle-header">
                    <img src={logo} alt="Logo" className="battle-logo" />
                    <h1 className="battle-title">ERROR: {problemError || 'No problems found'}</h1>
                    <button className="exit-btn" onClick={() => navigate('/1v1-local')}>EXIT</button>
                </div>
            </div>
        );
    }

    return (
        <div className="coding-battle-container">
            {/* Header */}
            <div className="battle-header">
                <img src={logo} alt="Logo" className="battle-logo" />
                
                <div className="battle-title-section">
                    <h1 className="battle-title">
                        {currentUser?.toUpperCase()} VS {opponent?.cf_handle?.toUpperCase()}
                    </h1>
                </div>
                
                <div className="header-info">
                    <div className="problem-counter">{currentProblemIndex + 1}/{totalProblems}</div>
                    <img src={clockIcon} alt="clock" className="clock-icon" />
                    <div className="timer-display">{formatTime(timeLeft)}</div>
                </div>
                
                <button className="exit-btn" onClick={() => navigate('/1v1-local')}>EXIT</button>
            </div>

            {/* Main Content */}
            <div className="battle-content">
                {/* Problem Section */}
                <div className="problem-section">
                    <h2 className="problem-title">{currentProblem?.name?.toUpperCase() || 'PROBLEM'}</h2>
                    
                    {currentProblem?.timeLimit && currentProblem?.memoryLimit && (
                        <div className="problem-limits">
                            <span>Time: {currentProblem.timeLimit}</span>
                            <span>Memory: {currentProblem.memoryLimit}</span>
                        </div>
                    )}
                    
                    <div className="problem-statement">
                        <h3 className="statement-heading">Problem Statement:</h3>
                        <p className="statement-text">
                            <MathRenderer text={currentProblem?.statement || 'Loading...'} />
                        </p>
                    </div>
                    
                    {currentProblem?.examples && currentProblem.examples.length > 0 && (
                        <div className="examples-section">
                            <h3 className="examples-heading">EXAMPLES:</h3>
                            {currentProblem.examples.map((ex, i) => (
                                <div key={i} className="example-box">
                                    <p className="example-text">Input:</p>
                                    <pre className="example-code">{ex.input}</pre>
                                    <p className="example-text">Output:</p>
                                    <pre className="example-code">{ex.output}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Editor Section */}
                <div className="editor-section">
                    <div className="editor-controls">
                        <select 
                            className="language-selector"
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                            disabled={isSubmitting}
                        >
                            <option value="PYTHON">PYTHON</option>
                            <option value="JAVASCRIPT">JAVASCRIPT</option>
                            <option value="JAVA">JAVA</option>
                            <option value="C++">C++</option>
                        </select>
                        
                        <button 
                            className="submit-btn" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
                        </button>
                    </div>
                    
                    {submitMessage && (
                        <div className="submit-status-message">{submitMessage}</div>
                    )}
                    
                    <textarea 
                        className="code-editor"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={`## WRITE YOUR ${selectedLanguage} CODE\n##FROM HERE`}
                        disabled={isSubmitting}
                    />
                    
                    <div className="editor-footer">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".py,.js,.java,.cpp,.c"
                            style={{ display: 'none' }}
                        />
                        <button 
                            className="upload-btn" 
                            onClick={handleUploadClick}
                            disabled={isSubmitting}
                        >
                            UPLOAD
                        </button>
                        <span className="language-display">LANGUAGE: {selectedLanguage}</span>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showConfirmModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <div className="modal-header">
                            <span className="modal-emoji">🚀</span>
                            <h2 className="modal-title">Ready to Submit?</h2>
                        </div>
                        <div className="modal-body">
                            <p>Problem: {currentProblem?.name}</p>
                            <p>Language: {selectedLanguage}</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="modal-btn modal-btn-cancel"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setIsSubmitting(false);
                                }}
                            >
                                CANCEL
                            </button>
                            <button 
                                className="modal-btn modal-btn-submit"
                                onClick={proceedWithSubmission}
                            >
                                SUBMIT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showResultModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <div className="modal-header">
                            <span className="modal-emoji">{resultModalData.emoji}</span>
                            <h2 className="modal-title">{resultModalData.title}</h2>
                        </div>
                        <div className="modal-body">
                            <p style={{ whiteSpace: 'pre-line' }}>{resultModalData.message}</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="modal-btn modal-btn-submit"
                                onClick={() => {
                                    if (popupWindow && !popupWindow.closed) {
                                        popupWindow.close();
                                    }
                                    setShowResultModal(false);
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OneVOneCodingTimeRushMode;
