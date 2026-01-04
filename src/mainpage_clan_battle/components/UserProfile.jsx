import '../style/UserProfile.css';

export default function UserProfile({ user }) {
    return (
        <div className="user-profile">
            <div className="profile-header">
                <div className="profile-avatar">
                    <img src={user.avatar} alt={user.username} />
                    <div className="rank-badge">{user.rank}</div>
                </div>
                
                <div className="profile-info">
                    <h1 className="username">{user.username}</h1>
                    <div className="rating-display">
                        <span className="rating-value">{user.rating}</span>
                        <span className="rating-label">Rating</span>
                    </div>
                </div>

                <div className="clan-info">
                    <div className="clan-detail">
                        <span className="label">Clan</span>
                        <span className="value">{user.clan.name}</span>
                    </div>
                    <div className="clan-detail">
                        <span className="label">Role</span>
                        <span className="value">{user.clan.role}</span>
                    </div>
                    <div className="clan-detail">
                        <span className="label">Trophies</span>
                        <span className="value trophy">{user.clan.trophies}</span>
                    </div>
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-card">
                    <div className="stat-value">{user.totalBattles}</div>
                    <div className="stat-label">Total Battles</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{user.wins}</div>
                    <div className="stat-label">Wins</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{user.losses}</div>
                    <div className="stat-label">Losses</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{user.winRate.toFixed(1)}%</div>
                    <div className="stat-label">Win Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{user.bestStreak}</div>
                    <div className="stat-label">Best Streak</div>
                </div>
            </div>
        </div>
    );
}
