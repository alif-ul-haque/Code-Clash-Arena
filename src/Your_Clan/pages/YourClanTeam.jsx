import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/YourClanTeam.css';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';
import getUserData, { getClanMembers } from '../../mainpage_clan_battle/utilities/UserData';

export default function YourClanTeam() {
    const navigate = useNavigate();
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [availablePlayers, setAvailablePlayers] = useState([]);

    useEffect(() => {
        async function fetchMembers() {
            const { data: user } = await getUserData();
            if (user?.clan_id) {
                const { members } = await getClanMembers(user.clan_id);
                setAvailablePlayers(members.map((member, idx) => ({
                    ...member,
                    // fallback avatar if not present
                    avatar: characterImage,
                    // fallback role if not present
                    role: member.role || 'Member',
                    // fallback rating, wins, losses if not present
                    rating: member.rating || 1500,
                    wins: member.wins || 0,
                    losses: member.losses || 0,
                    name: member.name || member.username || member.cf_handle || member.email || member.id || 'Unknown'
                })));
            }
        }
        fetchMembers();
    }, []);

    const handlePlayerToggle = (playerId) => {
        if (selectedPlayers.includes(playerId)) {
            setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
        } else if (selectedPlayers.length < 2) {
            setSelectedPlayers([...selectedPlayers, playerId]);
        }
    };

    const handleStartBattle = () => {
        if (selectedPlayers.length === 2) {
            setIsSearching(true);
            setTimeout(() => {
                navigate('/your-clan/finding-opponent');
            }, 800);
        }
    };

    return (
        <div className="your-clan-team-page">
            {/* Header with Start Battle Button */}
            <div className="page-header">
                <button 
                    className={`start-battle-btn ${selectedPlayers.length === 2 ? 'ready' : 'disabled'} ${isSearching ? 'searching' : ''}`}
                    onClick={handleStartBattle}
                    disabled={selectedPlayers.length !== 2 || isSearching}
                >
                    {isSearching ? 'Finding Opponent...' : 'Start Battle'}
                </button>
                <div className="selection-counter">
                    <span className="counter-text">Selected: {selectedPlayers.length}/2</span>
                </div>
            </div>

            {/* Players List */}
            <div className="players-container">
                <h2 className="players-title">Select Your Warriors</h2>
                <div className="players-list">
                    {availablePlayers.map((player, index) => {
                        const playerId = player.id || `idx-${index}`;
                        const isSelected = selectedPlayers.includes(playerId);
                        return (
                            <div 
                                key={playerId}
                                className={`player-row ${isSelected ? 'selected' : ''} ${selectedPlayers.length >= 5 && !isSelected ? 'disabled' : ''}`}
                                onClick={() => handlePlayerToggle(playerId)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Selection Indicator */}
                                <div className="selection-indicator">
                                    {isSelected && <span className="check-icon">✓</span>}
                                </div>

                                {/* Player Avatar */}
                                <div className="player-avatar-box">
                                    <img src={player.avatar} alt={player.name} className="player-avatar" />
                                </div>

                                {/* Player Info */}
                                <div className="player-info-section">
                                    <h3 className="player-name">{player.name}</h3>
                                    <span className="player-role">{player.role}</span>
                                </div>

                                {/* Player Stats */}
                                <div className="player-stats">
                                    <div className="stat-box">
                                        <span className="stat-label">Rating</span>
                                        <span className="stat-value">{player.rating}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Wins</span>
                                        <span className="stat-value green">{player.wins}</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Losses</span>
                                        <span className="stat-value red">{player.losses}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
