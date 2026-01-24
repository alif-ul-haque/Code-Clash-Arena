import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/1v1_coding_timeRush_mode.css';
import logo from '../../assets/icons/cca.png';
import clockIcon from '../../assets/icons/clock.png';
import { supabase } from '../../supabaseclient';

const OneVOneCodingTimeRushMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser, problemCount: initialProblemCount } = location.state || {};
    
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE\n##FROM HERE');
    const [currentProblem, setCurrentProblem] = useState(1);
    const totalProblems = initialProblemCount || 3;
    
    // Timer state (starting from 30:00 = 1800 seconds)
    const [timeLeft, setTimeLeft] = useState(1800);
    const fileInputRef = useRef(null);
    const [startTime] = useState(Date.now());
    const [currentUserId, setCurrentUserId] = useState(null);
    const [opponentId, setOpponentId] = useState(null);

    // Fetch user IDs from database
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
            
            // Update language based on file extension
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
            
            // Read file content
            const reader = new FileReader();
            reader.onload = (event) => {
                setCode(event.target.result);
            };
            reader.readAsText(file);
        }
    };
    
    // Reset timer when problem changes
    useEffect(() => {
        setTimeLeft(1800); // Reset to 30 minutes for each new problem
    }, [currentProblem]);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);
    
    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const problems = [
        {
            id: 1,
            title: 'TWO SUM',
            statement: 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.',
            examples: [
                {
                    input: 'nums = [2,7,11,15], target = 9',
                    output: '[0,1]'
                }
            ]
        },
        {
            id: 2,
            title: 'REVERSE STRING',
            statement: 'Write a function that reverses a string. The input string is given as an array of characters.',
            examples: [
                {
                    input: 's = ["h","e","l","l","o"]',
                    output: '["o","l","l","e","h"]'
                }
            ]
        },
        {
            id: 3,
            title: 'LONGEST SUBSTRING WITHOUT REPEATING CHARACTERS',
            statement: 'Given a string s, find the length of the longest substring without repeating characters.',
            examples: [
                {
                    input: 's = "abcabcbb"',
                    output: '3'
                }
            ]
        }
    ];

    const currentProblemData = problems[currentProblem - 1];

    return (
        <div className="coding-battle-container">
            {/* Header Section */}
            <div className="battle-header">
                <img src={logo} alt="Logo" className="battle-logo" />
                
                <div className="battle-title-section">
                    <h1 className="battle-title">
                        {currentUser?.toUpperCase() || 'ALIF19'} VS {opponent?.cf_handle?.toUpperCase() || '_RIZVEE'}
                    </h1>
                    <div className="player-labels">
                        <span className="player-label">YOU</span>
                        <span className="player-label opponent-label">OPPONENT</span>
                    </div>
                </div>
                
                <div className="header-info">
                    <div className="problem-counter">{currentProblem}/{totalProblems}</div>
                    <img src={clockIcon} alt="clock" className="clock-icon" />
                    <div className="timer-display">
                        {formatTime(timeLeft)}
                    </div>
                </div>
                
                <button className="exit-btn" onClick={() => navigate('/1v1-local')}>EXIT</button>
            </div>

            {/* Main Content */}
            <div className="battle-content">
                {/* Left Section - Problem */}
                <div className="problem-section">
                    <h2 className="problem-title">{currentProblemData.title}</h2>
                    
                    <div className="problem-statement">
                        <h3 className="statement-heading">Problem Statement :</h3>
                        <p className="statement-text">
                            {currentProblemData.statement}
                        </p>
                    </div>
                    
                    <div className="examples-section">
                        <h3 className="examples-heading">EXAMPLES :</h3>
                        {currentProblemData.examples.map((example, index) => (
                            <div key={index} className="example-box">
                                <p className="example-text">Input:</p>
                                <p className="example-text">{example.input}</p>
                                <p className="example-text">Output: {example.output}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vertical Separator */}
                <div className="vertical-separator"></div>

                {/* Right Section - Code Editor */}
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
                        
                        <button className="submit-btn" onClick={async () => {
                            try {
                                // Calculate time taken
                                const timeTaken = Math.floor((Date.now() - startTime) / 1000);

                                if (currentProblem < totalProblems) {
                                    // Update progress for current problem
                                    await supabase
                                        .from('onevone_participants')
                                        .update({
                                            problem_solved: currentProblem,
                                            time_taken: timeTaken
                                        })
                                        .eq('onevone_battle_id', battleId)
                                        .eq('player_id', currentUserId);

                                    setCurrentProblem(currentProblem + 1);
                                } else {
                                    // Final submission - mark all problems solved
                                    await supabase
                                        .from('onevone_participants')
                                        .update({
                                            problem_solved: totalProblems,
                                            time_taken: timeTaken
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

                                    // Update user stats
                                    const { data: userData } = await supabase
                                        .from('users')
                                        .select('rating, xp')
                                        .eq('id', currentUserId)
                                        .single();

                                    await supabase
                                        .from('users')
                                        .update({
                                            rating: (userData.rating || 0) + 150,
                                            xp: (userData.xp || 0) + 8
                                        })
                                        .eq('id', currentUserId);

                                    navigate('/submit-page-time-mode', {
                                        state: {
                                            battleId,
                                            won: true,
                                            opponent: opponent?.cf_handle,
                                            trophyChange: '+150'
                                        }
                                    });
                                }
                            } catch (err) {
                                console.error('Error submitting:', err);
                            }
                        }}>
                            SUBMIT
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
            </div>
        </div>
    );
};

export default OneVOneCodingTimeRushMode;