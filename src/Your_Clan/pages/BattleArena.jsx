import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/BattleArena.css';

import getUserData from '../../mainpage_clan_battle/utilities/UserData';
import { hasOngoingClanBattle } from '../utilities/ClanBattleUtils';
import { startBattle, getBattle, getBattleParticipants } from '../utilities/ClanBattleManager';
import { supabase } from '../../supabaseclient';
import clockIcon from '../../assets/icons/clock.png';

export default function BattleArena() {
    const navigate = useNavigate();
    const [participants, setParticipants] = useState([]);
    const [battleId, setBattleId] = useState(null);
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
    const [battleEnded, setBattleEnded] = useState(false);
    const [myClanName, setMyClanName] = useState('Your Clan');
    const [opponentClanName, setOpponentClanName] = useState('Opponent Clan');
    const [myClanScore, setMyClanScore] = useState(0);
    const [opponentClanScore, setOpponentClanScore] = useState(0);

    // Fetch battle participants and start battle
    useEffect(() => {
        async function initiateBattle() {
            try {
                const { hasOngoingBattle, battleId: activeBattleId } = await hasOngoingClanBattle();
                
                if (hasOngoingBattle && activeBattleId) {
                    setBattleId(activeBattleId);
                    
                    // Get battle details for start time
                    const { battle } = await getBattle(activeBattleId);
                    
                    // Calculate time left
                    if (battle) {
                        const startTime = new Date(battle.start_time);
                        const currentTime = new Date();
                        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
                        const remainingSeconds = Math.max(0, battle.duration_seconds - elapsedSeconds);
                        setTimeLeft(remainingSeconds);
                        
                        // Check if battle already ended
                        if (remainingSeconds <= 0) {
                            setBattleEnded(true);
                        }

                        // Get user's clan ID to determine which clan is theirs
                        const { data: user } = await getUserData();
                        const userClanId = user?.clan_id;

                        // Fetch both clan names
                        const { data: clan1Data } = await supabase
                            .from('clans')
                            .select('clan_name')
                            .eq('clan_id', battle.clan1_id)
                            .single();

                        const { data: clan2Data } = await supabase
                            .from('clans')
                            .select('clan_name')
                            .eq('clan_id', battle.clan2_id)
                            .single();

                        // Determine which is user's clan and which is opponent
                        if (userClanId === battle.clan1_id) {
                            setMyClanName(clan1Data?.clan_name || 'Your Clan');
                            setOpponentClanName(clan2Data?.clan_name || 'Opponent Clan');
                        } else {
                            setMyClanName(clan2Data?.clan_name || 'Your Clan');
                            setOpponentClanName(clan1Data?.clan_name || 'Opponent Clan');
                        }
                    }
                    
                    // Get participating members only
                    const { participants: battleParticipants } = await getBattleParticipants(activeBattleId);
                    setParticipants(battleParticipants || []);

                    // Calculate scores for each clan
                    if (battleParticipants && battleParticipants.length > 0) {
                        const { data: user } = await getUserData();
                        const userClanId = user?.clan_id;

                        let myScore = 0;
                        let opponentScore = 0;

                        battleParticipants.forEach(participant => {
                            const score = participant.problems_solved * 100; // 100 points per problem
                            if (participant.clan_id === userClanId) {
                                myScore += score;
                            } else {
                                opponentScore += score;
                            }
                        });

                        setMyClanScore(myScore);
                        setOpponentClanScore(opponentScore);
                    }
                    
                    // Start the battle (update status to in_progress)
                    const { success, error } = await startBattle(activeBattleId);
                    if (success) {
                        console.log('Battle status updated to in_progress');
                    } else {
                        console.error('Failed to start battle:', error);
                    }
                } else {
                    console.warn('No ongoing battle found');
                }
            } catch (error) {
                console.error('Error initiating battle:', error);
            }
        }
        
        initiateBattle();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (battleEnded || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    setBattleEnded(true);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, battleEnded]);

    // Complete battle when timer ends
    useEffect(() => {
        async function completeBattle() {
            if (!battleEnded || !battleId) return;

            try {
                // Call the SQL function to complete the battle
                const { error } = await supabase.rpc('complete_clan_battle', {
                    p_battle_id: battleId
                });

                if (error) {
                    console.error('Error completing battle:', error);
                } else {
                    console.log('Battle completed successfully');
                    // Navigate to results page after a short delay
                    setTimeout(() => {
                        navigate('/main-page');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error in completeBattle:', error);
            }
        }

        completeBattle();
    }, [battleEnded, battleId, navigate]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    const problems = [
        {
            id: 1,
            title: "Array Conquest",
            difficulty: "Medium",
            points: 100,
            solved: false,
            solvedBy: [],
            solvingBy: ["alif_dev"]
        },
        {
            id: 2,
            title: "String Warrior",
            difficulty: "Easy",
            points: 50,
            solved: true,
            solvedBy: ["rizvee_113"],
            solvingBy: []
        },
        {
            id: 3,
            title: "Tree Domination",
            difficulty: "Hard",
            points: 150,
            solved: false,
            solvedBy: [],
            solvingBy: []
        },
        {
            id: 4,
            title: "Graph Siege",
            difficulty: "Hard",
            points: 150,
            solved: false,
            solvedBy: [],
            solvingBy: ["sabit_pro"]
        },
        {
            id: 5,
            title: "DP Battle",
            difficulty: "Medium",
            points: 100,
            solved: false,
            solvedBy: [],
            solvingBy: []
        }
    ];

    const teamScore = {
        yourClan: 50,
        enemyClan: 0
    };

    const handleProblemClick = (problemId) => {
        navigate(`/your-clan/problem/${problemId}`);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return '#00FF7F';
            case 'Medium': return '#FFD700';
            case 'Hard': return '#FF6644';
            default: return '#00FF7F';
        }
    };

    return (
        <div className="battle-arena-page">
            {/* Timer Display */}
            <div className="timer-container">
                <img src={clockIcon} alt="clock" className="clock-icon" />
                <div className="timer-display">
                    {formatTime(timeLeft)}
                </div>
                {battleEnded && (
                    <div className="battle-ended-overlay">
                        <h1>Battle Ended!</h1>
                        <p>Calculating results...</p>
                    </div>
                )}
            </div>

            {/* Participating Members List */}
            <div className="clan-members-list">
                <h2>Warriors in Battle</h2>
                {participants.length === 0 ? (
                    <p>Loading participants...</p>
                ) : (
                    <ul>
                        {participants.map((participant, idx) => (
                            <li key={participant.participant_id || idx}>
                                {participant.users?.cf_handle || 'Unknown'}
                                <span className="participant-stats">
                                    {participant.problems_solved} solved
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/* Team Scores */}
            <div className="scores-header">
                <div className="team-score your-team">
                    <h2 className="team-name">{myClanName}</h2>
                    <div className="score-display">{myClanScore}</div>
                </div>
                <div className="vs-divider">VS</div>
                <div className="team-score enemy-team">
                    <h2 className="team-name">{opponentClanName}</h2>
                    <div className="score-display">{opponentClanScore}</div>
                </div>
            </div>

            {/* Problems List */}
            <div className="problems-container">
                <h1 className="arena-title">Battle Arena</h1>
                <div className="problems-list">
                    {problems.map((problem, index) => (
                        <div 
                            key={problem.id} 
                            className={`problem-card ${problem.solved ? 'solved' : ''}`}
                            onClick={() => handleProblemClick(problem.id)}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="problem-header">
                                <h3 className="problem-title">{problem.title}</h3>
                                <span 
                                    className="problem-difficulty"
                                    style={{ color: getDifficultyColor(problem.difficulty) }}
                                >
                                    {problem.difficulty}
                                </span>
                            </div>

                            <div className="problem-info">
                                <div className="problem-points">
                                    <span className="points-label">Points:</span>
                                    <span className="points-value">{problem.points}</span>
                                </div>
                                
                                {problem.solved && (
                                    <div className="solved-indicator">
                                        <span className="checkmark">✓</span>
                                        Solved
                                    </div>
                                )}
                            </div>

                            {/* Teammate indicators */}
                            {(problem.solvedBy.length > 0 || problem.solvingBy.length > 0) && (
                                <div className="teammate-status">
                                    {problem.solvedBy.map((name, i) => (
                                        <span key={i} className="teammate-badge solved-badge">
                                            {name} ✓
                                        </span>
                                    ))}
                                    {problem.solvingBy.map((name, i) => (
                                        <span key={i} className="teammate-badge solving-badge">
                                            {name} 🔨
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="problem-glow"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
