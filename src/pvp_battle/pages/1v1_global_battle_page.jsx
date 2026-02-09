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
import { codeforcesAPI, calculateUserStats } from '../../practice_gym/utilities/codeforcesAPI';

const OneVOneGlobalBattlePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser } = location.state || {};
    
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
    const [isEditorMinimized, setIsEditorMinimized] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    
    // Custom modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [resultModalData, setResultModalData] = useState({ title: '', message: '', emoji: '' });
    const [popupWindow, setPopupWindow] = useState(null);
    const [submissionTimestamp, setSubmissionTimestamp] = useState(null);

    // Fetch problem based on average rating and unsolved by both players
    useEffect(() => {
        const loadProblem = async () => {
            try {
                setLoadingProblem(true);
                setProblemError(null);
                
                console.log('🔍 Fetching problem for global battle...');
                console.log('Players:', currentUser, 'vs', opponent?.cf_handle);
                
                // Get both players' ratings and submission history
                const [player1Rating, player2Rating, player1Submissions, player2Submissions, allProblems] = await Promise.all([
                    supabase.from('users').select('rating').eq('cf_handle', currentUser).single().then(res => res.data?.rating || 1200),
                    supabase.from('users').select('rating').eq('cf_handle', opponent?.cf_handle).single().then(res => res.data?.rating || 1200),
                    codeforcesAPI.getUserStatus(currentUser).catch(() => []),
                    codeforcesAPI.getUserStatus(opponent?.cf_handle).catch(() => []),
                    codeforcesAPI.getProblems().catch(() => ({ problems: [], problemStatistics: [] }))
                ]);
                
                const averageRating = Math.round((player1Rating + player2Rating) / 2);
                console.log(`📊 Player ratings: ${player1Rating}, ${player2Rating} | Average: ${averageRating}`);
                
                // Get solved problems for both players
                const player1Solved = calculateUserStats(player1Submissions).solvedSet;
                const player2Solved = calculateUserStats(player2Submissions).solvedSet;
                console.log(`✓ Player 1 solved: ${player1Solved.size} problems`);
                console.log(`✓ Player 2 solved: ${player2Solved.size} problems`);
                
                // Determine difficulty range based on average rating
                const targetRating = Math.max(800, Math.min(2400, averageRating));
                const minRating = targetRating - 200;
                const maxRating = targetRating + 200;
                console.log(`🎯 Target difficulty: ${minRating} - ${maxRating}`);
                
                // Filter problems that neither player has solved
                const { problems } = allProblems;
                const availableProblems = problems.filter(p => {
                    const problemId = `${p.contestId}-${p.index}`;
                    const notSolvedByEither = !player1Solved.has(problemId) && !player2Solved.has(problemId);
                    const hasRating = p.rating && p.rating >= minRating && p.rating <= maxRating;
                    const isProgramming = p.type === 'PROGRAMMING';
                    return notSolvedByEither && hasRating && isProgramming;
                });
                
                console.log(`📝 Found ${availableProblems.length} unsolved problems in difficulty range`);
                
                if (availableProblems.length === 0) {
                    console.warn('No unsolved problems found, expanding search...');
                    // Fallback: just use rating range, ignore solved status
                    const fallbackProblems = problems.filter(p => 
                        p.rating && p.rating >= minRating && p.rating <= maxRating && p.type === 'PROGRAMMING'
                    );
                    if (fallbackProblems.length > 0) {
                        const randomProblem = fallbackProblems[Math.floor(Math.random() * fallbackProblems.length)];
                        const problemData = await fetchCodeforcesProblem(randomProblem.contestId, randomProblem.index);
                        setProblem(problemData);
                    } else {
                        throw new Error('No problems found in rating range');
                    }
                } else {
                    // Select random problem from available unsolved problems
                    const randomProblem = availableProblems[Math.floor(Math.random() * availableProblems.length)];
                    console.log(`🎲 Selected: ${randomProblem.contestId}${randomProblem.index} - ${randomProblem.name} (${randomProblem.rating})`);
                    
                    const problemData = await fetchCodeforcesProblem(randomProblem.contestId, randomProblem.index);
                    if (problemData) {
                        setProblem(problemData);
                    } else {
                        setProblemError('Failed to load problem details');
                    }
                }
            } catch (error) {
                console.error('Error loading problem:', error);
                setProblemError('Failed to load problem from Codeforces');
                
                // Fallback problem
                setProblem({
                    name: 'Sum of Two Numbers',
                    contestId: 0,
                    index: 'A',
                    rating: 800,
                    tags: ['math'],
                    statement: 'Given two integers a and b, find their sum.',
                    inputSpec: 'Two integers a and b',
                    outputSpec: 'Output a single integer - the sum of a and b',
                    examples: [{
                        input: '2 3',
                        output: '5'
                    }],
                    constraints: '-1000 ≤ a, b ≤ 1000',
                    timeLimit: '1 second',
                    memoryLimit: '256 megabytes'
                });
            } finally {
                setLoadingProblem(false);
            }
        };

        loadProblem();
    }, []);

    // Setup battle and real-time updates
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
                    .select('id, cf_handle, rating')
                    .eq('cf_handle', opponent.cf_handle)
                    .single();

                setOpponentId(opponentData?.id);

                // Subscribe to real-time battle updates
                const channel = supabase
                    .channel('global-battle-updates')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'onevone_participants',
                            filter: `onevone_battle_id=eq.${battleId}`
                        },
                        (payload) => {
                            console.log('Battle update:', payload);
                            checkBattleStatus();
                        }
                    )
                    .subscribe();

                // Initial status check
                checkBattleStatus();

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

    // Check current battle status
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
                        navigate('/battle-result', {
                            state: {
                                winner: myData?.problem_solved > 0 ? 'you' : 'opponent',
                                yourTime: myData?.time_taken,
                                opponentTime: opponentData?.time_taken,
                                opponent: opponent
                            }
                        });
                    }, 2000);
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
            
            const isLoggedIn = await checkCodeforcesLogin(currentUser);
            
            if (!isLoggedIn) {
                setSubmitMessage('❌ Not logged into Codeforces!');
                setResultModalData({
                    emoji: '⚠️',
                    title: 'Codeforces Login Required',
                    message: 'You must be logged into Codeforces first!\n\nSteps:\n1. Open Codeforces.com in a new tab\n2. Log in with your account\n3. Come back here and try again'
                });
                setShowResultModal(true);
                setIsSubmitting(false);
                return;
            }
            
            setShowConfirmModal(true);
            return;
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
    
    const proceedWithSubmission = async () => {
        try {
            setShowConfirmModal(false);
            
            const timestamp = Math.floor(Date.now() / 1000);
            setSubmissionTimestamp(timestamp);
            
            setSubmitMessage('');
            
            try {
                const result = await submitCodeWithSession(
                    problem.contestId,
                    problem.index,
                    code,
                    selectedLanguage
                );
                
                setPopupWindow(result.popupWindow);
                
                setResultModalData({
                    emoji: '✅',
                    title: 'Opening Codeforces',
                    message: `Code copied to clipboard!\n\nProblem: ${problem.contestId}${problem.index}\nLanguage: ${selectedLanguage}\nCode: ${code.length} characters\n\nPaste your code (Ctrl+V) in the textarea and submit.\n\nWindow will close automatically after submission.`
                });
                setShowResultModal(true);
                setSubmitMessage('');
                
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
    
    const startPopupMonitoring = (popup, timestamp) => {
        if (!popup) return;
        
        let checkCount = 0;
        const maxChecks = 120;
        
        const initialPath = "/submit";
        
        const monitorInterval = setInterval(() => {
            try {
                checkCount++;
                
                if (popup.closed) {
                    clearInterval(monitorInterval);
                    console.log('✓ Popup closed manually');
                    handleCheckVerdict(timestamp);
                    return;
                }
                
                try {
                    const currentUrl = popup.location.href;
                    const currentPath = new URL(currentUrl).pathname;
                    
                    const isNoLongerOnSubmitPage = !currentPath.includes(initialPath);
                    const isOnMySubmissions = currentPath.includes('/my');
                    const isOnStatus = currentPath.includes('/status');
                    
                    if (isNoLongerOnSubmitPage && (isOnMySubmissions || isOnStatus)) {
                        console.log('✓ Detected submission - closing popup');
                        setTimeout(() => {
                            if (!popup.closed) {
                                popup.close();
                            }
                        }, 3000);
                        
                        clearInterval(monitorInterval);
                        handleCheckVerdict(timestamp);
                        return;
                    }
                } catch (err) {
                    // Cross-origin access blocked - expected
                }
                
                if (checkCount >= maxChecks) {
                    clearInterval(monitorInterval);
                    console.log('⏱ Monitoring timeout');
                }
                
            } catch (err) {
                console.error('Monitor error:', err);
                clearInterval(monitorInterval);
            }
        }, 1000);
    };
    
    const handleCheckVerdict = async (timestamp = null) => {
        try {
            setShowResultModal(false);
            const submissionTimestamp = timestamp || (Math.floor(Date.now() / 1000) - 30);
            
            setSubmitMessage('⏳ Checking verdict...');
            
            try {
                console.log('Starting verdict polling...');
                const submission = await pollForVerdict(
                    currentUser,
                    problem.contestId,
                    problem.index,
                    40,
                    3000,
                    submissionTimestamp
                );
                
                const accepted = isVerdictAccepted(submission.verdict);
                const verdictMsg = getVerdictMessage(submission.verdict);
                
                if (accepted) {
                    // Update database
                    const timeTaken = Math.floor((Date.now() - submissionTimestamp * 1000) / 1000);
                    
                    await supabase
                        .from('onevone_participants')
                        .update({
                            problem_solved: 1,
                            time_taken: timeTaken
                        })
                        .eq('onevone_battle_id', battleId)
                        .eq('player_id', currentUserId);
                    
                    setSubmitMessage('✅ Accepted!');
                    setResultModalData({
                        emoji: '🎉',
                        title: 'Accepted!',
                        message: `Congratulations! Your solution was accepted!\n\nVerdict: ${verdictMsg}\nTime: ${timeTaken}s\n\nWaiting for opponent...`
                    });
                    setShowResultModal(true);
                } else {
                    setSubmitMessage(`❌ ${verdictMsg}`);
                    setResultModalData({
                        emoji: '❌',
                        title: 'Wrong Answer',
                        message: `Verdict: ${verdictMsg}\n\nTry again!`
                    });
                    setShowResultModal(true);
                }
                
                setIsSubmitting(false);
                
            } catch (verdictError) {
                console.error('Verdict check error:', verdictError);
                setSubmitMessage('⚠️ Could not verify submission');
                setResultModalData({
                    emoji: '⚠️',
                    title: 'Verification Failed',
                    message: 'Could not check verdict. Please check Codeforces manually.'
                });
                setShowResultModal(true);
                setIsSubmitting(false);
            }

        } catch (err) {
            console.error('Error checking verdict:', err);
            setSubmitMessage('❌ Verification failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="coding-battle-container">
            {/* Header */}
            <div className="battle-header">
                <img src={logo} alt="Logo" className="battle-logo" />
                
                <div className="battle-title-section">
                    <h1 className="battle-title">
                        GLOBAL BATTLE: {currentUser?.toUpperCase()} VS {opponent?.cf_handle?.toUpperCase()}
                    </h1>
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
                {/* Problem Section */}
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

                {/* Code Editor Section */}
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
            
            {/* Modals */}
            {showConfirmModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <div className="modal-header">
                            <span className="modal-emoji">🚀</span>
                            <h2 className="modal-title">Ready to Submit?</h2>
                        </div>
                        <div className="modal-body">
                            <p className="modal-text">Your code will be submitted to Codeforces.</p>
                            <div className="modal-info">
                                <p><strong>Problem:</strong> {problem?.name}</p>
                                <p><strong>Language:</strong> {selectedLanguage}</p>
                                <p><strong>Lines of code:</strong> {code.split('\n').length}</p>
                            </div>
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
                                onClick={() => setShowResultModal(false)}
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

export default OneVOneGlobalBattlePage;
