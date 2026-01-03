import '../style/BattleHistoryContent.css';

export default function BattleHistoryContent({ battles, type, currentUser }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="battle-history-content">
            {battles.length === 0 ? (
                <div className="no-battles">No battles found</div>
            ) : (
                <div className="battles-list">
                    {type === '1v1' ? (
                        battles.map((battle) => (
                            <div key={battle.id} className={`battle-card ${battle.result}`}>
                                <div className="card-shine"></div>
                                
                                <div className="battle-header">
                                    <span className={`result-badge ${battle.result}`}>
                                        {battle.result.toUpperCase()}
                                    </span>
                                    <span className="battle-date">{formatDate(battle.date)}</span>
                                </div>

                                <div className="battle-content">
                                    {/* User Side */}
                                    <div className="player-section player-1">
                                        <div className="player-info">
                                            <img src={battle.opponent.avatar} alt={currentUser} className="player-avatar" />
                                            <div className="player-details">
                                                <span className="player-name">{currentUser}</span>
                                                <span className="player-rating">Rating: {1847}</span>
                                            </div>
                                        </div>
                                        <div className="player-stats">
                                            <div className="stat">
                                                <span className="stat-label">Solved</span>
                                                <span className="stat-value">{battle.problems.solved}/{battle.problems.total}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Time</span>
                                                <span className="stat-value">{formatTime(battle.time)}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Penalty</span>
                                                <span className="stat-value">{battle.penalties}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="vs-divider">
                                        <span>VS</span>
                                    </div>

                                    {/* Opponent Side */}
                                    <div className="player-section player-2">
                                        <div className="player-info">
                                            <img src={battle.opponent.avatar} alt={battle.opponent.username} className="player-avatar" />
                                            <div className="player-details">
                                                <span className="player-name">{battle.opponent.username}</span>
                                                <span className="player-rating">Rating: {battle.opponent.rating}</span>
                                            </div>
                                        </div>
                                        <div className="player-stats">
                                            <div className="stat">
                                                <span className="stat-label">Score</span>
                                                <span className="stat-value">{battle.score.opponent}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Time</span>
                                                <span className="stat-value">{formatTime(battle.time + 600)}</span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Status</span>
                                                <span className="stat-value">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="battle-footer">
                                    <div className={`rating-change ${battle.ratingChange >= 0 ? 'gain' : 'loss'}`}>
                                        {battle.ratingChange >= 0 ? '+' : ''}{battle.ratingChange}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Clan Battles
                        battles.map((battle) => (
                            <div key={battle.id} className={`clan-battle-card ${battle.result}`}>
                                <div className="card-shine"></div>
                                
                                <div className="battle-header">
                                    <span className={`result-badge ${battle.result}`}>
                                        {battle.result.toUpperCase()}
                                    </span>
                                    <span className="battle-date">{formatDate(battle.date)}</span>
                                </div>

                                <div className="clan-battle-content">
                                    <div className="clan-section">
                                        <div className="clan-name">Your Clan</div>
                                        <div className="clan-score">{battle.score.clan}</div>
                                    </div>

                                    <div className="vs-divider">
                                        <span>VS</span>
                                    </div>

                                    <div className="clan-section opponent">
                                        <div className="clan-name">{battle.opponentClan.name}</div>
                                        <div className="clan-score">{battle.score.opponent}</div>
                                    </div>
                                </div>

                                <div className="clan-members">
                                    <div className="members-title">Members</div>
                                    {battle.members.map((member, idx) => (
                                        <div key={idx} className="member-row">
                                            <span className="member-name">{member.username}</span>
                                            <div className="member-stats">
                                                <span className="member-stat">{member.problems} Problems</span>
                                                <span className="member-stat">{formatTime(member.time)}</span>
                                                <span className="member-contribution">{member.contribution} pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="battle-footer">
                                    <div className={`trophy-change ${battle.trophyChange >= 0 ? 'gain' : 'loss'}`}>
                                        {battle.trophyChange >= 0 ? '+' : ''}{battle.trophyChange} Trophies
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
