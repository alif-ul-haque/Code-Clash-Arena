import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/BattleArena.css';

import getUserData, { getClanMembers } from '../../mainpage_clan_battle/utilities/UserData';

export default function BattleArena() {
    const navigate = useNavigate();
    const [clanMembers, setClanMembers] = useState([]);

    useEffect(() => {
        async function fetchMembers() {
            const { data: user } = await getUserData();
            if (user?.clan_id) {
                const { members } = await getClanMembers(user.clan_id);
                setClanMembers(members);
            }
        }
        fetchMembers();
    }, []);
    
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
            {/* Clan Members List */}
            <div className="clan-members-list">
                <h2>All Members in Your Clan</h2>
                {clanMembers.length === 0 ? (
                    <p>No members found in your clan.</p>
                ) : (
                    <ul>
                        {clanMembers.map((member) => (
                            <li key={member.id}>{member.username || member.cf_handle || 'Unknown'}</li>
                        ))}
                    </ul>
                )}
            </div>
            {/* Team Scores */}
            <div className="scores-header">
                <div className="team-score your-team">
                    <h2 className="team-name">The Code Warriors</h2>
                    <div className="score-display">{teamScore.yourClan}</div>
                </div>
                <div className="vs-divider">VS</div>
                <div className="team-score enemy-team">
                    <h2 className="team-name">Shadow Ninjas</h2>
                    <div className="score-display">{teamScore.enemyClan}</div>
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
