import { useNavigate } from 'react-router-dom';
import '../style/NoBattleOngoing.css';

export default function NoBattleOngoing() {
    const navigate = useNavigate();

    return (
        <div className="no-battle-page">
            <div className="no-battle-container">
                <div className="no-battle-icon">⚔️</div>
                <h1 className="no-battle-title">No Battle Ongoing</h1>
                <p className="no-battle-message">
                    There is currently no clan battle in progress.
                </p>
                <p className="no-battle-submessage">
                    Your clan leader can start a battle from the Clan Battle menu.
                </p>
                <button 
                    className="return-button"
                    onClick={() => navigate('/main')}
                >
                    Return to Main Menu
                </button>
            </div>
        </div>
    );
}
