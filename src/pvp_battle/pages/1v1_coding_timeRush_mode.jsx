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
    const [battleStartTime, setBattleStartTime] = useState(null);
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
    
    // Track if component is fully mounted to prevent premature timeout
    const isMountedRef = useRef(false);

    // Fetch problems and battle data from database
    useEffect(() => {
        const loadBattleData = async () => {
            try {
                setLoadingProblems(true);
                console.log('🔍 Fetching TIME RUSH battle data from database...');
                
                const { data: battleData, error } = await supabase
                    .from('onevonebattles')
                    .select('problem_tags, start_time')
                    .eq('onevone_battle_id', battleId)
                    .single();
                
                if (error) throw error;
                
                if (!battleData.problem_tags) {
                    throw new Error('No problems assigned to this battle');
                }
                
                // Calculate timer based on actual start time
                if (battleData.start_time) {
                    // Parse the timestamp - handle both ISO string and PostgreSQL timestamp
                    let startTime;
                    if (typeof battleData.start_time === 'string') {
                        // PostgreSQL timestamp without timezone - treat as local time
                        startTime = new Date(battleData.start_time + 'Z').getTime(); // Add 'Z' to treat as UTC
                    } else {
                        startTime = new Date(battleData.start_time).getTime();
                    }
                    
                    setBattleStartTime(startTime);
                    
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    const remainingTime = Math.max(0, 1800 - elapsedSeconds); // 30 minutes = 1800 seconds
                    
                    console.log('═══════════════════════════════════════');
                    console.log('⏰ TIMER CALCULATION DEBUG:');
                    console.log('Start time from DB (raw):', battleData.start_time);
                    console.log('Start time type:', typeof battleData.start_time);
                    console.log('Start time parsed (ms):', startTime);
                    console.log('Start time as date:', new Date(startTime).toISOString());
                    console.log('Current time (ms):', now);
                    console.log('Current time as date:', new Date(now).toISOString());
                    console.log('Elapsed seconds:', elapsedSeconds);
                    console.log('Remaining time (seconds):', remainingTime);
                    console.log('Remaining time (minutes):', Math.floor(remainingTime / 60));
                    console.log('═══════════════════════════════════════');
                    
                    // CRITICAL FIX: If elapsed time is negative or way too large, reset
                    if (elapsedSeconds < 0) {
                        console.error('❌ Elapsed time is negative! Clock skew or timezone issue.');
                        console.error('Resetting timer to 30 minutes and using current time as start');
                        setTimeLeft(1800);
                        setBattleStartTime(Date.now());
                    } else if (elapsedSeconds > 1800) {
                        console.error('❌ Battle time genuinely expired! Elapsed:', elapsedSeconds, 'seconds');
                        console.error('⚠️ This should only happen if battle started more than 30 minutes ago');
                        setTimeLeft(0);
                    } else if (elapsedSeconds > 60 && remainingTime < 60) {
                        // More than 1 minute elapsed but less than 1 minute remaining - likely timezone issue
                        console.warn('⚠️ WARNING: Possible timestamp issue - elapsed > 60s but remaining < 60s');
                        console.warn('Resetting to full 30 minutes');
                        setTimeLeft(1800);
                        setBattleStartTime(Date.now());
                    } else {
                        // Normal case - set the calculated remaining time
                        console.log('✅ Timer set to', remainingTime, 'seconds =', Math.floor(remainingTime / 60), 'minutes');
                        setTimeLeft(remainingTime);
                    }
                } else {
                    console.warn('⚠️ No start_time found in database, using default 30 minutes');
                    setTimeLeft(1800);
                    setBattleStartTime(Date.now());
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
                console.log('✅ All battle data loaded successfully');
                
                // Mark component as fully mounted after problems are loaded
                setTimeout(() => {
                    isMountedRef.current = true;
                    console.log('✅ Component fully mounted and ready');
                }, 500);
            } catch (error) {
                console.error('❌ Error loading battle data:', error);
                setProblemError(error.message);
            } finally {
                setLoadingProblems(false);
            }
        };

        if (battleId) {
            loadBattleData();
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
        // Only trigger timeout if component is mounted and timer ran down
        if (timeLeft <= 0 && isMountedRef.current) {
            console.log('⏰ Timer reached 0, calling handleTimeOut');
            handleTimeOut();
            return;
        }
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0; // Don't call handleTimeOut here, let the effect above handle it
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
        console.log('⏰ handleTimeOut called');
        console.log('Component mounted:', isMountedRef.current);
        console.log('Problems loaded:', problems.length);
        console.log('Current user ID:', currentUserId);
        console.log('Opponent ID:', opponentId);
        
        // Only finalize if component is fully ready
        if (!isMountedRef.current) {
            console.warn('⚠️ Component not fully mounted yet, ignoring timeout');
            return;
        }
        
        if (!currentUserId || !opponentId) {
            console.warn('⚠️ User IDs not loaded yet, ignoring timeout');
            return;
        }
        
        console.log('⏰ Time is up! Finalizing battle...');
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
            
            let totalRatingChange = 0;
            let totalXPChange = 0;
            
            // If problems were solved, sum their ratings
            if (perProblemRatings.length > 0) {
                totalRatingChange = perProblemRatings.reduce((sum, p) => sum + p.ratingChange, 0);
                totalXPChange = perProblemRatings.reduce((sum, p) => sum + p.xpChange, 0);
                console.log(`Calculated from solved problems - Rating: ${totalRatingChange}, XP: ${totalXPChange}`);
            } else {
                // No problems solved - calculate base win/loss rating (like REAL MODE)
                console.log('No problems solved, calculating base ELO rating for', won ? 'WIN' : 'LOSS');
                
                if (won) {
                    // Winner gets rating/XP based on ELO calculation
                    const matchResult = await processMatchOutcome(currentUserId, opponentId);
                    totalRatingChange = matchResult.ratings.winner.change;
                    totalXPChange = matchResult.xp.winner.change;
                    console.log(`Winner (no solves) - Rating: +${totalRatingChange}, XP: +${totalXPChange}`);
                } else {
                    // Loser gets negative rating
                    const matchResult = await processMatchOutcome(opponentId, currentUserId);
                    totalRatingChange = matchResult.ratings.loser.change;
                    totalXPChange = matchResult.xp.loser.change;
                    console.log(`Loser (no solves) - Rating: ${totalRatingChange}, XP: ${totalXPChange}`);
                }
            }
            
            console.log(`Final totals - Rating: ${totalRatingChange}, XP: ${totalXPChange}`);
            
            // Calculate time taken from battle start
            const timeTaken = battleStartTime 
                ? Math.floor((Date.now() - battleStartTime) / 1000)
                : 0;
            
            // Update participants table
            await supabase
                .from('onevone_participants')
                .update({
                    problem_solved: solvedProblems,
                    time_taken: timeTaken,
                    rating_change: parseInt(totalRatingChange),
                    xp_change: parseFloat(totalXPChange)
                })
                .eq('onevone_battle_id', battleId)
                .eq('player_id', currentUserId);
            
            console.log('✅ Rating and XP changes stored in participants table');
            
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
