import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/1v1_coding_battle_page.css';
import logo from '../../assets/icons/cca.png';
import { supabase } from '../../supabaseclient';
import { fetchCodeforcesProblem } from '../utilities/codeforcesProblemFetcher';
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

    // Fetch user IDs and set up real-time subscription
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
                .select('rating, xp')
                .eq('id', currentUserId)
                .single();

            await supabase
                .from('users')
                .update({
                    rating: (currentUserData.rating || 0) + 115,
                    xp: (currentUserData.xp || 0) + 5
                })
                .eq('id', currentUserId);

        } catch (err) {
            console.error('Error submitting solution:', err);
            alert('Failed to submit. Please try again.');
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
                                    <p className="statement-text">
                                        <MathRenderer text={problem.constraints} />
                                    </p>
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
                            >
                                <option value="PYTHON">PYTHON</option>
                                <option value="JAVASCRIPT">JAVASCRIPT</option>
                                <option value="JAVA">JAVA</option>
                                <option value="C++">C++</option>
                            </select>
                            
                            <button className="submit-btn" onClick={handleSubmit}>SUBMIT</button>
                            
                            <button 
                                className="minimize-btn" 
                                onClick={() => setIsEditorMinimized(true)}
                                title="Minimize Editor"
                            >
                                ▼
                            </button>
                        </div>
                        
                        <textarea 
                            className="code-editor"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={`## WRITE YOUR ${selectedLanguage} CODE\n##FROM HERE`}
                        ></textarea>
                        
                        <div className="editor-footer">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".py,.js,.java,.cpp,.c"
                                style={{ display: 'none' }}
                            />
                            <button className="upload-btn" onClick={handleUploadClick}>UPLOAD</button>
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
        </div>
    );
};

export default OneVOneCodingBattlePage;