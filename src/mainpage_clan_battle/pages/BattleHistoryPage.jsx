import { useState, useEffect, useCallback } from 'react';
import '../style/BattleHistory.css';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';
import get1v1History from '../utilities/Get1v1history';
import { supabase } from '../../supabaseclient';
import getUserData from '../utilities/UserData';

// Helper function to format duration (moved outside component)
const formatDuration = (durationMs) => {
    if (!durationMs) return '0m 0s';

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

export default function BattleHistoryPage() {
    const [activeTab, setActiveTab] = useState('1v1');
    const [battles1v1, setBattles1v1] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    // Fetch battle history function (useCallback to prevent recreation)
    const fetchBattleHistory = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await get1v1History();

            if (fetchError) {
                throw fetchError;
            }

            if (data && data.length > 0) {
                // Transform data to match UI structure
                const transformedBattles = data.map((battle, index) => ({
                    id: battle.battle_id || index,
                    date: new Date(battle.battle_date).toLocaleDateString('en-US'),
                    time: new Date(battle.battle_date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    player1: {
                        username: battle.currentUser.cf_handle,
                        rating: battle.currentUser.rating,
                        avatar: characterImage,
                        result: battle.result,
                        score: battle.currentUser.score,
                    },
                    player2: {
                        username: battle.opponent.cf_handle,
                        rating: battle.opponent.rating,
                        avatar: characterImage,
                        result: battle.result === 'WIN' ? 'LOSS' : battle.result === 'LOSS' ? 'WIN' : 'DRAW',
                        score: battle.opponent.score,
                    },
                    duration: formatDuration(battle.duration),
                    ratingChange: battle.rating_change >= 0 ? `+${battle.rating_change}` : `${battle.rating_change}`,
                }));

                setBattles1v1(transformedBattles);
            } else {
                setBattles1v1([]);
            }
        } catch (err) {
            console.error('Error fetching battle history:', err);
            setError(err.message || 'Failed to load battle history');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user data and initial battle history on component mount
    useEffect(() => {
        const initialize = async () => {
            const { data: userData } = await getUserData();
            if (userData) {
                setUserId(userData.id);
            }
            await fetchBattleHistory();
        };

        initialize();
    }, [fetchBattleHistory]);

    // Setup real-time subscription for battle updates
    useEffect(() => {
        if (!userId) return;

        console.log('🔔 Setting up real-time subscription for battle history updates...');

        const channel = supabase
            .channel('battle-history-updates')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'onevone_participants',
                    filter: `player_id=eq.${userId}`
                },
                (payload) => {
                    console.log('🔔 Battle history update received:', payload);
                    // Refetch battle history when changes are detected
                    fetchBattleHistory();
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            console.log('🔕 Cleaning up real-time subscription...');
            supabase.removeChannel(channel);
        };
    }, [userId, fetchBattleHistory]);

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
                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#00FF7F', fontSize: '1.2rem' }}>
                        Loading battle history...
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#FF4444', fontSize: '1.2rem' }}>
                        Error: {error}
                    </div>
                )}

                {!loading && !error && activeTab === '1v1' && (
                    <div className="battles-list">
                        {battles1v1.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#FFD700', fontSize: '1.2rem' }}>
                                No 1v1 battle history yet. Start your first battle!
                            </div>
                        ) : (
                            battles1v1.map((battle) => (
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
                            ))
                        )}
                    </div>
                )}

                {!loading && !error && activeTab === 'clan' && (
                    <div className="battles-list">
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#FFD700', fontSize: '1.2rem' }}>
                            Clan battle history coming soon!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
