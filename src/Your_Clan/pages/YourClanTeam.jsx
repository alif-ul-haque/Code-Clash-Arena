import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/YourClanTeam.css';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';

export default function YourClanTeam() {
    const navigate = useNavigate();
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const availablePlayers = [
        { id: 1, name: "rizvee_113", role: "Leader", avatar: characterImage, rating: 1850, wins: 45, losses: 12 },
        { id: 2, name: "alif_019", role: "Co-Leader", avatar: characterImage, rating: 1720, wins: 38, losses: 15 },
        { id: 3, name: "Matin005", role: "Member", avatar: characterImage, rating: 1650, wins: 32, losses: 18 },
        { id: 4, name: "sabit_pro", role: "Member", avatar: characterImage, rating: 1580, wins: 28, losses: 22 },
        { id: 5, name: "ninja_007", role: "Member", avatar: characterImage, rating: 1520, wins: 25, losses: 20 },
        { id: 6, name: "code_master", role: "Member", avatar: characterImage, rating: 1480, wins: 22, losses: 25 },
        { id: 7, name: "bug_crusher", role: "Elder", avatar: characterImage, rating: 1450, wins: 20, losses: 23 },
        { id: 8, name: "algo_wizard", role: "Member", avatar: characterImage, rating: 1420, wins: 18, losses: 27 },
    ];

    const handlePlayerToggle = (playerId) => {
        if (selectedPlayers.includes(playerId)) {
            setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
        } else if (selectedPlayers.length < 5) {
            setSelectedPlayers([...selectedPlayers, playerId]);
        }
    };

    const handleStartBattle = () => {
        if (selectedPlayers.length === 5) {
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
                    className={`start-battle-btn ${selectedPlayers.length === 5 ? 'ready' : 'disabled'} ${isSearching ? 'searching' : ''}`}
                    onClick={handleStartBattle}
                    disabled={selectedPlayers.length !== 5 || isSearching}
                >
                    {isSearching ? 'Finding Opponent...' : 'Start Battle'}
                </button>
                <div className="selection-counter">
                    <span className="counter-text">Selected: {selectedPlayers.length}/5</span>
                </div>
            </div>

            {/* Players List */}
            <div className="players-container">
                <h2 className="players-title">Select Your Warriors</h2>
                <div className="players-list">
                    {availablePlayers.map((player, index) => {
                        const isSelected = selectedPlayers.includes(player.id);
                        return (
                            <div 
                                key={player.id}
                                className={`player-row ${isSelected ? 'selected' : ''} ${selectedPlayers.length >= 5 && !isSelected ? 'disabled' : ''}`}
                                onClick={() => handlePlayerToggle(player.id)}
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
