import '../style/Participant.css';
import trophyIcon from '../../assets/icons/trophy.png';

export default function Participant({
    position = 1,
    name = 'Player',
    role = 'Member',
    warParticipated = 0,
    problemsSolved = 0,
    rating = 0
}) {
    return (
        <div className="participant-container">
            <div className="participant-position">
                <span>{position}.</span>
            </div>
            <div className="participant-info">
                <h3 className="participant-name">{name}</h3>
                <p className="participant-role">{role}</p>
            </div>
            <div className="participant-stats">
                <div className="stat-item">
                    <p className="stat-label">War Participated:</p>
                    <p className="stat-value">{warParticipated}</p>
                </div>
                <div className="stat-item">
                    <p className="stat-label">Problem Solved:</p>
                    <p className="stat-value">{problemsSolved}</p>
                </div>
            </div>
            <div className="participant-rating">
                <span className="rating-value">{rating}</span>
                <img src={trophyIcon} alt="Trophy" className="trophy-icon" />
            </div>
        </div>
    );
}