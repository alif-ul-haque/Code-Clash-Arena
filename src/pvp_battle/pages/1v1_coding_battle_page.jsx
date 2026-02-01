import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/1v1_coding_battle_page.css';
import logo from '../../assets/icons/cca.png';
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

const OneVOneCodingBattlePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser, mode } = location.state || {};
    
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE\n##FROM HERE');
    const fileInputRef = useRef(null);
    
    // Problem state
    const [problem, setProblem] = useState(null);
    const [loadingProblem, setLoadingProblem] = useState(true);
    const [problemError, setProblemError] = useState(null);
    
    // Battle state tracking
    const [battleState, setBattleState] = useState({
        myProgress: 0,
        opponentProgress: 0,
        myStatus: 'coding',
        opponentStatus: 'coding',
        winner: null
    });
    const [currentUserId, setCurrentUserId] = useState(null);
    const [opponentId, setOpponentId] = useState(null);
    const [startTime] = useState(Date.now());
    const [isEditorMinimized, setIsEditorMinimized] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    
    // Custom modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultModalData, setResultModalData] = useState({ title: '', message: '', emoji: '' });
    const [popupWindow, setPopupWindow] = useState(null);
    const [submissionTimestamp, setSubmissionTimestamp] = useState(null);

    // Fetch problem from Codeforces
    useEffect(() => {
        const loadProblem = async () => {
            try {
                setLoadingProblem(true);
                setProblemError(null);
                
                console.log('Starting problem fetch...');
                // Fetch problem 2185A from Codeforces
                const problemData = await fetchCodeforcesProblem(2185, 'A');
                
                if (problemData) {
                    console.log('Problem loaded successfully:', problemData.name);
                    setProblem(problemData);
                } else {
                    throw new Error('No problem data returned');
                }
            } catch (error) {
                console.error('Error loading problem:', error);
                
                // Show user-friendly error message
                const errorMessage = error.message.includes('aborted') 
                    ? 'Connection timeout. Using fallback problem.'
                    : 'Failed to load problem from Codeforces. Using fallback.';
                
                setProblemError(errorMessage);
                
                // Fallback to a working default problem
                setProblem({
                    name: 'Two Sum',
                    contestId: 0,
                    index: 'A',
                    rating: 800,
                    tags: ['arrays', 'hash table'],
                    statement: 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
                    inputSpec: 'An array of integers nums and an integer target',
                    outputSpec: 'Return the indices of the two numbers that add up to target',
                    examples: [{
                        input: 'nums = [2,7,11,15], target = 9',
                        output: '[0,1]'
                    }, {
                        input: 'nums = [3,2,4], target = 6',
                        output: '[1,2]'
                    }],
                    constraints: 'The answer is guaranteed to exist.',
                    timeLimit: '1 second',
                    memoryLimit: '256 megabytes'
                });
            } finally {
                setLoadingProblem(false);
            }
        };

        loadProblem();
    }, []);

    // Check Codeforces session on mount
    useEffect(() => {
        const setupBattle = async () => {
            try {
                // Get current user's ID
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('cf_handle', currentUser)
                    .single();

                setCurrentUserId(userData?.id);

                // Get opponent's ID
                const { data: opponentData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('cf_handle', opponent.cf_handle)
                    .single();

                setOpponentId(opponentData?.id);

                // Subscribe to real-time changes on participants table
                const channel = supabase
                    .channel('battle-updates')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'onevone_participants',
                            filter: `onevone_battle_id=eq.${battleId}`
                        },
                        (payload) => {
                            // Update battle state when any participant's status changes
                            checkBattleStatus();
                        }
                    )
                    .subscribe();

                // Initial status check
                checkBattleStatus();

                // Cleanup subscription on unmount
                return () => {
                    supabase.removeChannel(channel);
                };

            } catch (err) {
                console.error('Error setting up battle:', err);
            }
        };

        if (battleId && currentUser && opponent) {
            setupBattle();
        }
    }, [battleId, currentUser, opponent]);

    // Function to check current battle status
    const checkBattleStatus = async () => {
        try {
            const { data: participants } = await supabase
                .from('onevone_participants')
                .select('player_id, problem_solved, time_taken')
                .eq('onevone_battle_id', battleId);

            if (participants) {
                const myData = participants.find(p => p.player_id === currentUserId);
                const opponentData = participants.find(p => p.player_id === opponentId);

                setBattleState({
                    myProgress: myData?.problem_solved || 0,
                    opponentProgress: opponentData?.problem_solved || 0,
                    myStatus: myData?.problem_solved > 0 ? 'solved' : 'coding',
                    opponentStatus: opponentData?.problem_solved > 0 ? 'solved' : 'coding',
                    winner: myData?.problem_solved > 0 ? 'you' : 
                            opponentData?.problem_solved > 0 ? 'opponent' : null
                });

                // If someone won, navigate to result page
                if (myData?.problem_solved > 0 || opponentData?.problem_solved > 0) {
                    setTimeout(() => {
                        navigate('/submit-page-real', {
                            state: {
                                battleId,
                                won: myData?.problem_solved > 0,
                                opponent: opponent.cf_handle,
                                trophyChange: myData?.problem_solved > 0 ? '+115' : '-50'
                            }
                        });
                    }, 1000);
                }
            }
        } catch (err) {
            console.error('Error checking battle status:', err);
        }
    };

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setSelectedLanguage(newLanguage);
        setCode(`## WRITE YOUR ${newLanguage} CODE\n##FROM HERE`);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

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
            reader.onload = (event) => {
                setCode(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setSubmitMessage('🔍 Checking Codeforces login...');
            
            // Check if user is logged into Codeforces (via browser session)
            const isLoggedIn = await checkCodeforcesLogin(currentUser);
            
            if (!isLoggedIn) {
                setSubmitMessage('❌ Not logged into Codeforces!');
                setResultModalData({
                    emoji: '⚠️',
                    title: 'Codeforces Login Required',
                    message: 'You must be logged into Codeforces first!\n\nSteps:\n1. Open Codeforces.com in a new tab\n2. Log in with your account\n3. Come back here and try again\n\nWe use your browser session (like vjudge).'
                });
                setShowResultModal(true);
                setIsSubmitting(false);
                return;
            }
            
            // Ask for confirmation before submitting
            setShowConfirmModal(true);
            return; // Wait for modal response
        } catch (err) {
            console.error('Error submitting solution:', err);
            setSubmitMessage('❌ Submission failed');
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
            
            // Capture the current timestamp (in seconds) before submission
            const timestamp = Math.floor(Date.now() / 1000);
            setSubmissionTimestamp(timestamp);
            console.log(`Submission timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
            
            setSubmitMessage('📤 Opening Codeforces...');
            
            // Submit code (opens Codeforces with pre-filled form)
            try {
                const result = await submitCodeWithSession(
                    problem.contestId,
                    problem.index,
                    code,
                    selectedLanguage
                );
                
                // Store popup reference for monitoring
                setPopupWindow(result.popupWindow);
                
                // Show simplified instructions to user
                setResultModalData({
                    emoji: '�',
                    title: 'Code Copied to Clipboard!',
                    message: `Codeforces popup opened!\n\n✅ Your code is copied to clipboard\n✅ Problem: ${problem.contestId}${problem.index}\n✅ Language: ${selectedLanguage}\n\n📌 Steps:\n1. Select language in popup\n2. Paste your code (Ctrl+V)\n3. Click Submit\n\nThe popup will auto-close 3s after submission!`
                });
                setShowResultModal(true);
                setSubmitMessage('⏳ Waiting for you to paste and submit...');
                
                // Start monitoring the popup for submission
                startPopupMonitoring(result.popupWindow, timestamp);
                
            } catch (submitError) {
                setSubmitMessage('❌ Submission failed!');
                setResultModalData({
                    emoji: '❌',
                    title: 'Submission Failed',
                    message: 'Failed to open Codeforces:\n\n' + submitError.message
                });
                setShowResultModal(true);
                setIsSubmitting(false);
                return;
            }

        } catch (err) {
            console.error('Error submitting solution:', err);
            setSubmitMessage('❌ Submission failed');
            setResultModalData({
                emoji: '❌',
                title: 'Submission Failed',
                message: 'Failed to submit. Please try again.'
            });
            setShowResultModal(true);
            setIsSubmitting(false);
        }
    };
    
    // Monitor popup for submission and auto-close
    const startPopupMonitoring = (popup, timestamp) => {
        if (!popup) return;
        
        let checkCount = 0;
        const maxChecks = 120; // Monitor for up to 2 minutes (120 * 1 second)
        
        const initialPath = "/submit"; // Submit page keyword
        
        const monitorInterval = setInterval(() => {
            try {
                checkCount++;
                
                // Check if popup is manually closed
                if (popup.closed) {
                    console.log('Popup was closed manually');
                    clearInterval(monitorInterval);
                    setShowResultModal(false);
                    setSubmitMessage('✅ Checking verdict...');
                    handleCheckVerdict(timestamp);
                    return;
                }
                
                // Try reading URL to detect submission
                const currentUrl = popup.location.href;
                
                // If user clicked Submit → Codeforces redirects away from submit page
                if (!currentUrl.includes(initialPath)) {
                    console.log('Submit detected! URL changed to:', currentUrl);
                    console.log('Closing popup in 3 seconds...');
                    
                    clearInterval(monitorInterval);
                    
                    setSubmitMessage('✅ Submitted! Closing popup in 3s...');
                    
                    setTimeout(() => {
                        if (!popup.closed) popup.close();
                        setPopupWindow(null);
                        
                        setShowResultModal(false);
                        setSubmitMessage('✅ Checking verdict...');
                        handleCheckVerdict(timestamp);
                    }, 3000); // 3 seconds delay after Submit
                    
                    return;
                }
                
                // Safety timeout after max checks
                if (checkCount > maxChecks) {
                    console.log('Popup monitoring timeout - closing popup');
                    clearInterval(monitorInterval);
                    if (!popup.closed) popup.close();
                    setShowResultModal(false);
                    handleCheckVerdict(timestamp);
                }
                
            } catch (err) {
                // Cross-origin reading fails due to CORS - this is expected
                // Just wait and try again on next interval
                console.log('Waiting for submission... (CORS blocked URL check)');
            }
        }, 1000); // Check every second
    };
    
    // Handle verdict check after manual submission
    const handleCheckVerdict = async (timestamp = null) => {
        try {
            setShowResultModal(false);
            // Use provided timestamp or calculate from 30 seconds ago
            const submissionTimestamp = timestamp || (Math.floor(Date.now() / 1000) - 30);
            
            setSubmitMessage('⏳ Checking verdict...');
            
            // Poll for verdict - only check submissions created after submissionTimestamp
            try {
                console.log('Starting verdict polling...');
                const submission = await pollForVerdict(
                    currentUser,
                    problem.contestId,
                    problem.index,
                    40, // 40 attempts
                    3000, // 3 seconds interval
                    submissionTimestamp // Only check submissions after this timestamp
                );
                
                console.log('Verdict received:', submission);
                const verdict = submission.verdict;
                const accepted = isVerdictAccepted(verdict);
                const verdictMsg = getVerdictMessage(verdict);
                
                setSubmitMessage(`Verdict: ${verdictMsg}`);
                
                if (accepted) {
                    // Calculate time taken (in seconds)
                    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

                    // Update participant status - mark problem as solved
                    const { error } = await supabase
                        .from('onevone_participants')
                        .update({
                            problem_solved: 1,
                            time_taken: timeTaken
                        })
                        .eq('onevone_battle_id', battleId)
                        .eq('player_id', currentUserId);

                    if (error) throw error;

                    // Update battle status to completed
                    await supabase
                        .from('onevonebattles')
                        .update({
                            status: 'completed',
                            end_time: new Date().toISOString()
                        })
                        .eq('onevone_battle_id', battleId);

                    // Update user's trophy count
                    const { data: currentUserData } = await supabase
                        .from('users')
                        .select('rating, xp, problem_solved')
                        .eq('id', currentUserId)
                        .single();

                    await supabase
                        .from('users')
                        .update({
                            rating: (currentUserData.rating || 0) + 115,
                            xp: (currentUserData.xp || 0) + 5,
                            problem_solved: (currentUserData.problem_solved || 0) + 1
                        })
                        .eq('id', currentUserId);
                    
                    setResultModalData({
                        emoji: '🎉',
                        title: 'Accepted! You Won!',
                        message: `Congratulations! You won the battle!\n\nTime: ${submission.timeConsumedMillis}ms\nMemory: ${Math.round(submission.memoryConsumedBytes / 1024)}KB`
                    });
                    setShowResultModal(true);
                    
                    // Navigate to result page after short delay
                    setTimeout(() => {
                        navigate('/submit-page-real', {
                            state: {
                                battleId,
                                won: true,
                                opponent: opponent.cf_handle,
                                trophyChange: '+115',
                                verdict: verdictMsg
                            }
                        });
                    }, 2000);
                } else {
                    setResultModalData({
                        emoji: '❌',
                        title: verdictMsg,
                        message: 'Your solution was not accepted. Keep trying!'
                    });
                    setShowResultModal(true);
                    setIsSubmitting(false);
                }
            } catch (verdictError) {
                console.error('Error getting verdict:', verdictError);
                setSubmitMessage('⚠️ Could not verify submission. Please check Codeforces.');
                setResultModalData({
                    emoji: '⚠️',
                    title: 'Verification Failed',
                    message: 'Could not automatically verify your submission.\n\nPlease check your submission status on Codeforces and try again if needed.'
                });
                setShowResultModal(true);
                setIsSubmitting(false);
            }

        } catch (err) {
            console.error('Error submitting solution:', err);
            setSubmitMessage('❌ Submission failed');
            setResultModalData({
                emoji: '❌',
                title: 'Submission Failed',
                message: 'Failed to submit. Please try again.'
            });
            setShowResultModal(true);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="coding-battle-container">
            {/* Header Section */}
            <div className="battle-header">
                <img src={logo} alt="Logo" className="battle-logo" />
                
                <div className="battle-title-section">
                    <h1 className="battle-title">{currentUser?.toUpperCase()} VS {opponent?.cf_handle?.toUpperCase()}</h1>
                    <div className="player-labels">
                        <span className="player-label">
                            YOU {battleState.myStatus === 'solved' && '✓'}
                        </span>
                        <span className="player-label opponent-label">
                            OPPONENT {battleState.opponentStatus === 'solved' && '✓'}
                        </span>
                    </div>
                </div>
                
                <button className="exit-btn" onClick={() => navigate('/playmode1v1')}>EXIT</button>
            </div>

            {/* Main Content */}
            <div className="battle-content">
                {/* Left Section - Problem */}
                <div className={`problem-section ${isEditorMinimized ? 'full-width' : ''}`}>
                    {loadingProblem ? (
                        <div className="loading-problem">
                            <h2 className="problem-title">LOADING PROBLEM...</h2>
                        </div>
                    ) : problemError ? (
                        <div className="problem-error">
                            <h2 className="problem-title">ERROR</h2>
                            <p className="statement-text">{problemError}</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="problem-title">{problem?.name?.toUpperCase() || 'PROBLEM'}</h2>
                            
                            {problem?.timeLimit && problem?.memoryLimit && (
                                <div className="problem-limits">
                                    <span className="limit-text">Time Limit: {problem.timeLimit}</span>
                                    <span className="limit-text">Memory Limit: {problem.memoryLimit}</span>
                                </div>
                            )}
                            
                            <div className="problem-statement">
                                <h3 className="statement-heading">Problem Statement :</h3>
                                <p className="statement-text">
                                    <MathRenderer text={problem?.statement || 'Loading...'} />
                                </p>
                            </div>
                            
                            {problem?.inputSpec && (
                                <div className="problem-statement">
                                    <h3 className="statement-heading">Input :</h3>
                                    <p className="statement-text">
                                        <MathRenderer text={problem.inputSpec} />
                                    </p>
                                </div>
                            )}
                            
                            {problem?.outputSpec && (
                                <div className="problem-statement">
                                    <h3 className="statement-heading">Output :</h3>
                                    <p className="statement-text">
                                        <MathRenderer text={problem.outputSpec} />
                                    </p>
                                </div>
                            )}
                            
                            {problem?.examples && problem.examples.length > 0 && (
                                <div className="examples-section">
                                    <h3 className="examples-heading">EXAMPLES :</h3>
                                    {problem.examples.map((example, index) => (
                                        <div key={index} className="example-box">
                                            <p className="example-text">Input:</p>
                                            <pre className="example-code">{example.input}</pre>
                                            <p className="example-text">Output:</p>
                                            <pre className="example-code">{example.output}</pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {problem?.constraints && (
                                <div className="problem-statement">
                                    <h3 className="statement-heading">Note :</h3>
                                    <div className="statement-text constraints-text">
                                        <MathRenderer text={problem.constraints} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right Section - Code Editor */}
                {!isEditorMinimized ? (
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
                            
                            <button 
                                className="minimize-btn" 
                                onClick={() => setIsEditorMinimized(true)}
                                title="Minimize Editor"
                                disabled={isSubmitting}
                            >
                                ▼
                            </button>
                        </div>
                        
                        {submitMessage && (
                            <div className="submit-status-message">
                                {submitMessage}
                            </div>
                        )}
                        
                        <textarea 
                            className="code-editor"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Write your code here..."
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
                            <span className="language-display">LANGUAGE : {selectedLanguage}</span>
                        </div>
                    </div>
                ) : (
                    <button 
                        className="expand-editor-btn" 
                        onClick={() => setIsEditorMinimized(false)}
                        title="Expand Editor"
                    >
                        ▲
                    </button>
                )}
            </div>
            
            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <div className="modal-header">
                            <span className="modal-emoji">🚀</span>
                            <h2 className="modal-title">Ready to Submit?</h2>
                        </div>
                        <div className="modal-body">
                            <p className="modal-text">Your code will be submitted to Codeforces automatically.</p>
                            <div className="modal-info">
                                <p><strong>Problem:</strong> {problem?.name}</p>
                                <p><strong>Language:</strong> {selectedLanguage}</p>
                                <p><strong>Lines of code:</strong> {code.split('\n').length}</p>
                            </div>
                            <p className="modal-text-small">Click SUBMIT to proceed!</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="modal-btn modal-btn-cancel"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setIsSubmitting(false);
                                    setSubmitMessage('');
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
            
            {/* Custom Result Modal */}
            {showResultModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <div className="modal-header">
                            <span className="modal-emoji">{resultModalData.emoji}</span>
                            <h2 className="modal-title">{resultModalData.title}</h2>
                        </div>
                        <div className="modal-body">
                            <p className="modal-text" style={{ whiteSpace: 'pre-line' }}>{resultModalData.message}</p>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="modal-btn modal-btn-submit"
                                onClick={() => {
                                    // If this is the popup modal and user manually closes it
                                    if (resultModalData.title === 'Code Copied to Clipboard!') {
                                        // Close popup if still open
                                        if (popupWindow && !popupWindow.closed) {
                                            popupWindow.close();
                                        }
                                        setShowResultModal(false);
                                        // Let the monitoring handle verdict check
                                    } else {
                                        setShowResultModal(false);
                                    }
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

export default OneVOneCodingBattlePage;