
import { useState, useRef, useEffect } from 'react';
// For closing dropdown on outside click
import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCodeforcesProblem } from '../../pvp_battle/utilities/codeforcesProblemFetcher';
import '../Styles/ProblemSolving.css';
import ccaLogo from '../../assets/icons/cca.png';
import { hasOngoingClanBattle } from '../utilities/ClanBattleUtils';
import { supabase } from '../../supabaseclient';
import {
    getBattle,
    completeBattle,
    submitSolution
} from '../utilities/ClanBattleManager';
import { generateClanWarProblems } from '../utilities/clanWarProblemSelector';
// import bgImage from '../../assets/images/10002.png';
export default function ProblemSolving() {
        // Remove unused problems state and all references to setProblems, setProblemsLoading, setProblemsError.
    // All hooks must be called at the top, before any return or conditional logic
    const [code, setCode] = useState('## WRITE YOUR PYTHON CODE ##FROM HERE\n\n');
    const [isDragging, setIsDragging] = useState(false);
    const [splitPosition, setSplitPosition] = useState(45); // Percentage
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { contestId, index } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState(null);
    const [problemLoading, setProblemLoading] = useState(true);
    const [problemError, setProblemError] = useState(null);
    const [battleId, setBattleId] = useState(null);
    const [waitingForBattle, setWaitingForBattle] = useState(false);
    const [battleStartTime, setBattleStartTime] = useState(null);
    const [battleDuration, setBattleDuration] = useState(600);
    const [timeLeft, setTimeLeft] = useState(600);
    const [battleEnded, setBattleEnded] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('PYTHON');
    const [showDropdown, setShowDropdown] = useState(false);
    // Removed unused submitError state and all references
    const dropdownRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // All useEffect and useCallback hooks must be called here, before any return or conditional logic
    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    }, []);

    useEffect(() => {
        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown, handleClickOutside]);

    useEffect(() => {
        async function loadProblem() {
            setProblemLoading(true);
            setProblemError(null);
            try {
                const prob = await fetchCodeforcesProblem(Number(contestId), index);
                setProblem(prob);
            } catch {
                setProblemError('Failed to load problem');
            } finally {
                setProblemLoading(false);
            }
        }
        if (contestId && index) loadProblem();
    }, [contestId, index]);

    useEffect(() => {
        async function fetchBattleIdAndProblems() {
            let attempts = 0;
            const maxAttempts = 30; // wait up to 30s
            let hasOngoingBattle = false;
            let activeBattleId = null;
            while (attempts < maxAttempts && !hasOngoingBattle) {
                const res = await hasOngoingClanBattle();
                hasOngoingBattle = res.hasOngoingBattle;
                activeBattleId = res.battleId;
                if (!hasOngoingBattle) {
                    await new Promise(r => setTimeout(r, 1000));
                    attempts++;
                }
            }
            if (hasOngoingBattle && activeBattleId) {
                setBattleId(activeBattleId);
                setWaitingForBattle(false);
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
                    await generateClanWarProblems(handles1, handles2);
                } catch {
                    setProblemError('Failed to load problems. Please try again.');
                }
            } else {
                // Enter waiting state and listen for new battles via realtime
                setWaitingForBattle(true);
            }
        }
        fetchBattleIdAndProblems();

        // Subscribe to clan_battles so this page picks up new battles for the user's clan
        let watchChannel = null;
        try {
            watchChannel = supabase
                .channel('problem_page_clan_battles_watch')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_battles' }, async () => {
                    try {
                        const res = await hasOngoingClanBattle();
                        if (res.hasOngoingBattle && res.battleId) {
                            setWaitingForBattle(false);
                            setBattleId(res.battleId);
                            // Re-run the problem fetch flow
                            const { participants } = await import('../utilities/ClanBattleManager').then(mod => mod.getBattleParticipants(res.battleId));
                            if (participants && participants.length > 0) {
                                const clanMap = {};
                                participants.forEach(p => {
                                    if (!clanMap[p.clan_id]) clanMap[p.clan_id] = [];
                                    clanMap[p.clan_id].push(p.users?.cf_handle);
                                });
                                const clanIds = Object.keys(clanMap);
                                const handles1 = clanMap[clanIds[0]] || [];
                                const handles2 = clanMap[clanIds[1]] || [];
                                await generateClanWarProblems(handles1, handles2);
                            }
                        }
                    } catch (e) {
                        console.error('Error handling clan_battles realtime for ProblemSolving page', e);
                    }
                })
                .subscribe();
        } catch (e) {
            console.warn('Failed to subscribe to clan_battles for ProblemSolving:', e);
        }

        return () => {
            if (watchChannel) supabase.removeChannel(watchChannel);
        };
    }, []);

    useEffect(() => {
        if (!battleId) return;

        const ch = supabase
            .channel(`problem_status_${battleId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clan_battles', filter: `battle_id=eq.${battleId}` }, (payload) => {
                try {
                    const newStatus = payload?.new?.status;
                    if (newStatus === 'completed') {
                        setBattleEnded(true);
                    }
                } catch (e) {
                    console.error('Error handling battle status change', e);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ch);
        };
    }, [battleId]);

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

    // Always show a fallback if statement is missing or too short
    const hasStatement = (problem && ((problem.description && problem.description.length > 20) || (problem.statement && problem.statement.length > 20)));



    useEffect(() => {
        async function loadProblem() {
            setProblemLoading(true);
            setProblemError(null);
            try {
                const prob = await fetchCodeforcesProblem(Number(contestId), index);
                setProblem(prob);
            } catch {
                setProblemError('Failed to load problem');
            } finally {
                setProblemLoading(false);
            }
        }
        if (contestId && index) loadProblem();
    }, [contestId, index]);


    // Fetch battle ID, participants, and problems on mount
    useEffect(() => {
        async function fetchBattleIdAndProblems() {
            // Retry to wait for battle record to appear (synchronization)
            let attempts = 0;
            const maxAttempts = 30; // wait up to 30s
            let hasOngoingBattle = false;
            let activeBattleId = null;
            while (attempts < maxAttempts && !hasOngoingBattle) {
                const res = await hasOngoingClanBattle();
                hasOngoingBattle = res.hasOngoingBattle;
                activeBattleId = res.battleId;
                if (!hasOngoingBattle) {
                    await new Promise(r => setTimeout(r, 1000));
                    attempts++;
                }
            }
            if (hasOngoingBattle && activeBattleId) {
                setBattleId(activeBattleId);
                setWaitingForBattle(false);
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
                // No-op: removed problems loading/error state
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
                    await generateClanWarProblems(handles1, handles2);
                    // No-op: removed problems state
                } catch {
                    setProblemError('Failed to load problems. Please try again.');
                } finally {
                    // No-op: removed problems loading state
                }
            } else {
                // Enter waiting state and listen for new battles via realtime
                setWaitingForBattle(true);
            }
        }
        fetchBattleIdAndProblems();

        // Subscribe to clan_battles so this page picks up new battles for the user's clan
        let watchChannel = null;
        try {
            watchChannel = supabase
                .channel('problem_page_clan_battles_watch')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_battles' }, async () => {
                    try {
                        const res = await hasOngoingClanBattle();
                        if (res.hasOngoingBattle && res.battleId) {
                            setWaitingForBattle(false);
                            setBattleId(res.battleId);
                            // Re-run the problem fetch flow
                            const { participants } = await import('../utilities/ClanBattleManager').then(mod => mod.getBattleParticipants(res.battleId));
                            if (participants && participants.length > 0) {
                                const clanMap = {};
                                participants.forEach(p => {
                                    if (!clanMap[p.clan_id]) clanMap[p.clan_id] = [];
                                    clanMap[p.clan_id].push(p.users?.cf_handle);
                                });
                                const clanIds = Object.keys(clanMap);
                                const handles1 = clanMap[clanIds[0]] || [];
                                const handles2 = clanMap[clanIds[1]] || [];
                                // No-op: removed problems loading state
                                try {
                                    await generateClanWarProblems(handles1, handles2);
                                    // No-op: removed problems state
                                } catch {
                                    setProblemError('Failed to load problems after battle appeared.');
                                } finally {
                                    // No-op: removed problems loading state
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error handling clan_battles realtime for ProblemSolving page', e);
                    }
                })
                .subscribe();
        } catch (e) {
            console.warn('Failed to subscribe to clan_battles for ProblemSolving:', e);
        }

        return () => {
            if (watchChannel) supabase.removeChannel(watchChannel);
        };
    }, []);

    // Subscribe to battle status changes to detect completion
    useEffect(() => {
        if (!battleId) return;
        const ch = supabase
            .channel(`problem_status_${battleId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clan_battles', filter: `battle_id=eq.${battleId}` }, (payload) => {
                try {
                    const newStatus = payload?.new?.status;
                    if (newStatus === 'completed') {
                        setBattleEnded(true);
                    }
                } catch (e) {
                    console.error('Error handling battle status change', e);
                }
            })
            .subscribe();
        return () => {
            supabase.removeChannel(ch);
        };
    }, [battleId]);

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
    // const getTimePercentage = () => {
    //     return (timeLeft / initialTime) * 100;
    // };

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
        // removed setSubmitError

        try {

            if (!battleId) {
                setIsSubmitting(false);
                return;
            }

            // Use index from useParams (should be problem index, e.g. 'A', 'B', ...)
            const problemIndex = index;

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
                alert(error || 'Failed to submit solution');
            }
        } catch (err) {
            console.error('Submission error:', err);
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
        setShowDropdown((prev) => !prev);
    };

    // ...existing code...

    // Loading and waiting states for problems
    if (waitingForBattle) {
        return (
            <div className="problem-solving-page waiting-state">
                <div className="loader">Waiting for a battle to be created for your clan...</div>
                <div style={{ marginTop: 12 }}>
                    <button className="exit-btn" onClick={() => navigate('/your-clan')}>Return to Your Clan</button>
                </div>
            </div>
        );
    }
    if (problemLoading) {
        return (
            <div className="problem-solving-page loading-state">
                <div className="loader">Loading problem...</div>
            </div>
        );
    }

    // Defensive: If problem is missing or malformed, show a user-friendly error
    if (problemError || !problem || typeof problem !== 'object' || (!problem.title && !problem.description && !problem.statement)) {
        return (
            <div className="problem-solving-page error-state">
                <div className="error-message">
                    {problemError || 'Problem not found or could not be loaded.'}
                </div>
            </div>
        );
    }

    return (
        <div className="problem-solving-page" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} ref={containerRef}>
            {/* Top Navigation Bar */}
            <div className="top-nav-bar">
                <div className="nav-left">
                    <div className="game-logo">
                        <img src={ccaLogo} alt="Code Clash" className="logo-icon" />
                    </div>
                    <h1 className="problem-title-nav">{problem.title}</h1>
                    <div className="problem-progress">{index}/5</div>
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
                <div className="problem-statement-side" style={{ width: `${splitPosition}%` }}>
                    <div className="statement-content">
                        <div className="statement-header">
                            <h2 className="statement-title">Problem Statement :</h2>
                        </div>
                        {hasStatement ? (
                            (() => {
                                const raw = problem.description || problem.statement || problem.body || '';
                                // Basic sanitization: remove <script> tags
                                const sanitized = raw.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
                                const isHtml = /<[^>]+>/.test(sanitized);
                                if (isHtml) {
                                    return <div className="problem-description" dangerouslySetInnerHTML={{ __html: sanitized }} />;
                                }
                                return <div className="problem-description">{sanitized.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</div>;
                            })()
                        ) : (
                            <div className="no-statement-notice">
                                <p>Problem statement is not available from the OJ API. You can view the full statement and test cases on Codeforces:</p>
                                <a
                                    href={problem.link || (problem.contestId && problem.index ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}` : '#')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="external-link"
                                >
                                    View on Codeforces ↗
                                </a>
                            </div>
                        )}
                        {Array.isArray(problem.constraints) && problem.constraints.length > 0 && (
                            <div className="constraints-section">
                                <h4>Constraints:</h4>
                                <ul>
                                    {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="examples-section">
                            <h3 className="examples-title">EXAMPLES :</h3>
                            {problem.examples && problem.examples.length > 0 ? (
                                problem.examples.map((example, index) => {
                                    // Example may be object {input, output} or string
                                    if (typeof example === 'string') {
                                        return (
                                            <div key={index} className="example-box">
                                                <p className="example-text">{example}</p>
                                            </div>
                                        );
                                    }
                                    const input = example.input || example.in || example.input_text || '';
                                    const output = example.output || example.out || example.output_text || '';
                                    return (
                                        <div key={index} className="example-box">
                                            <p className="example-text">
                                                <span className="example-label">Input:</span><br/>
                                                {input}
                                            </p>
                                            <p className="example-text">
                                                <span className="example-label">Output:</span> {output}
                                            </p>
                                        </div>
                                    );
                                })
                            ) : <div>No examples available.</div>}
                        </div>
                    </div>
                </div>

                {/* Resizable Divider */}
                <div className="resize-divider" onMouseDown={handleMouseDown} disabled={isSubmitting}>
                    <div className="divider-handle">
                        <div className="handle-circle">
                            <div className="handle-icon">⬌</div>
                        </div>
                    </div>
                </div>

                {/* Code Editor Side */}
                <div className="code-editor-side" style={{ width: `${100 - splitPosition}%` }}>
                    <div className="editor-top-bar">
                        <div className="language-selector" ref={dropdownRef}>
                            <div className="language-dropdown">
                                <button className="dropdown-btn" type="button" onClick={toggleDropdown} aria-haspopup="listbox" aria-expanded={showDropdown}>
                                    <span>{selectedLanguage}</span>
                                    <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
                                </button>
                                {showDropdown && (
                                    <div className="dropdown-options" role="listbox">
                                        <div className="option-item" role="option" tabIndex={0} onClick={() => handleLanguageSelect('PYTHON')}>PYTHON</div>
                                        <div className="option-item" role="option" tabIndex={0} onClick={() => handleLanguageSelect('JAVA')}>JAVA</div>
                                        <div className="option-item" role="option" tabIndex={0} onClick={() => handleLanguageSelect('C/C++')}>C/C++</div>
                                        <div className="option-item" role="option" tabIndex={0} onClick={() => handleLanguageSelect('ASSEMBLY')}>ASSEMBLY</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button className="submit-btn-top" type="button" onClick={handleSubmit}>
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
