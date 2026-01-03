import { useState } from 'react';
import '../style/BattleHistory.css';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';

export default function BattleHistoryPage() {
    const [activeTab, setActiveTab] = useState('1v1');

    const mockBattles = {
        '1v1': [
            {
                id: '1',
                date: '03/01/2024',
                time: '20:30',
                player1: { username: 'jdsh.i', rating: 1847, avatar: characterImage, result: 'WIN', score: 1050 },
                player2: { username: 'Kobir2005', rating: 1821, avatar: characterImage, result: 'LOSS', score: 945 },
                duration: '3m 19s',
                ratingChange: '+18'
            },
            {
                id: '2',
                date: '02/01/2024',
                time: '10:15',
                player1: { username: 'jdsh.i', rating: 1847, avatar: characterImage, result: 'LOSS', score: 0 },
                player2: { username: 'Sayuki', rating: 1902, avatar: characterImage, result: 'WIN', score: 2450 },
                duration: '1h 0m',
                ratingChange: '-24'
            },
            {
                id: '3',
                date: '01/01/2024',
                time: '16:45',
                player1: { username: 'jdsh.i', rating: 1847, avatar: characterImage, result: 'WIN', score: 2150 },
                player2: { username: 'AlexCode', rating: 1750, avatar: characterImage, result: 'LOSS', score: 1850 },
                duration: '35m 45s',
                ratingChange: '+22'
            }
        ],
        'clan': [
            {
                id: '1',
                date: '03/01/2024',
                time: '18:00',
                clan1: { name: 'The Code Warriors', score: 14050, result: 'WIN', members: ['jdsh.i', 'mickykan', 'Tirakz2307'] },
                clan2: { name: 'Elite Coders', score: 11050, result: 'LOSS', members: ['player1', 'player2', 'player3'] },
                trophyChange: '+48'
            },
            {
                id: '2',
                date: '01/01/2024',
                time: '16:00',
                clan1: { name: 'The Code Warriors', score: 12150, result: 'WIN', members: ['jdsh.i', 'mickykan', 'Tirakz2307'] },
                clan2: { name: 'Bug Fixers', score: 9850, result: 'LOSS', members: ['player1', 'player2', 'player3'] },
                trophyChange: '+35'
            }
        ]
    };

    return (
        <div className="battle-history-page">
            {/* Header */}
            <div className="history-header">
                <h1>BATTLE HISTORY</h1>
                <p>Review your past battles and track your progress</p>
            </div>

            {/* Tab Section */}
            <div className="battle-tabs">
                <button 
                    className={`tab-btn ${activeTab === '1v1' ? 'active' : ''}`}
                    onClick={() => setActiveTab('1v1')}
                >
                    1v1 BATTLES
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'clan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('clan')}
                >
                    CLAN BATTLES
                </button>
            </div>

            {/* Battle List */}
            <div className="battles-container">
                {activeTab === '1v1' && (
                    <div className="battles-list">
                        {mockBattles['1v1'].map((battle) => (
                            <div key={battle.id} className="battle-row 1v1-row">
                                <div className="battle-date-info">
                                    <div className="date">{battle.date}</div>
                                    <div className="time">{battle.time}</div>
                                </div>

                                <div className="player-vs-player">
                                    {/* Player 1 */}
                                    <div className={`history-player-card ${battle.player1.result.toLowerCase()}`}>
                                        <img src={battle.player1.avatar} alt={battle.player1.username} className="history-player-avatar" />
                                        <div className="history-player-info">
                                            <div className="history-player-name">{battle.player1.username}</div>
                                            <div className="history-player-rating">{battle.player1.rating}</div>
                                        </div>
                                        <div className="history-player-score">{battle.player1.score}</div>
                                    </div>

                                    {/* VS */}
                                    <div className="history-vs-divider">VS</div>

                                    {/* Player 2 */}
                                    <div className={`history-player-card ${battle.player2.result.toLowerCase()}`}>
                                        <img src={battle.player2.avatar} alt={battle.player2.username} className="history-player-avatar" />
                                        <div className="history-player-info">
                                            <div className="history-player-name">{battle.player2.username}</div>
                                            <div className="history-player-rating">{battle.player2.rating}</div>
                                        </div>
                                        <div className="history-player-score">{battle.player2.score}</div>
                                    </div>
                                </div>

                                <div className="battle-stats-info">
                                    <div className="stat-item">
                                        <span className="stat-label">Duration</span>
                                        <span className="stat-value">{battle.duration}</span>
                                    </div>
                                    <div className={`stat-item rating-change ${battle.ratingChange.startsWith('+') ? 'gain' : 'loss'}`}>
                                        <span className="stat-label">Rating</span>
                                        <span className="stat-value">{battle.ratingChange}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'clan' && (
                    <div className="battles-list">
                        {mockBattles['clan'].map((battle) => (
                            <div key={battle.id} className="battle-row clan-row">
                                <div className="battle-date-info">
                                    <div className="date">{battle.date}</div>
                                    <div className="time">{battle.time}</div>
                                </div>

                                <div className="clan-vs-clan">
                                    {/* Clan 1 */}
                                    <div className={`clan-card ${battle.clan1.result.toLowerCase()}`}>
                                        <div className="clan-header">
                                            <div className="clan-name">{battle.clan1.name}</div>
                                            <div className="clan-score">{battle.clan1.score}</div>
                                        </div>
                                        <div className="clan-members">
                                            {battle.clan1.members.map((member, idx) => (
                                                <div key={idx} className="member-item">{member}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="history-vs-divider">VS</div>

                                    {/* Clan 2 */}
                                    <div className={`clan-card ${battle.clan2.result.toLowerCase()}`}>
                                        <div className="clan-header">
                                            <div className="clan-name">{battle.clan2.name}</div>
                                            <div className="clan-score">{battle.clan2.score}</div>
                                        </div>
                                        <div className="clan-members">
                                            {battle.clan2.members.map((member, idx) => (
                                                <div key={idx} className="member-item">{member}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="battle-stats-info">
                                    <div className={`stat-item trophy-change ${battle.trophyChange.startsWith('+') ? 'gain' : 'loss'}`}>
                                        <span className="stat-label">Trophy</span>
                                        <span className="stat-value">{battle.trophyChange}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
