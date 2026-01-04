import '../style/ClanMember.css';
import trophyIcon from '../../assets/icons/trophy.png';

export default function ClanMember({
    position = 1,
    name = 'Player',
    role = 'Member',
    warParticipated = 0,
    problemsSolved = 0,
    rating = 0
}) {
    return (
        <div className="clan-member-container">
            <div className="clan-member-position">
                <span>{position}.</span>
            </div>
            <div className="clan-member-info">
                <h3 className="clan-member-name">{name}</h3>
                <p className="clan-member-role">{role}</p>
            </div>
            <div className="clan-member-stats">
                <div className="stat-item-clan">
                    <p className="stat-label-clan">War Participated:</p>
                    <p className="stat-value-clan">{warParticipated}</p>
                </div>
                <div className="stat-item-clan">
                    <p className="stat-label-clan">Problem Solved:</p>
                    <p className="stat-value-clan">{problemsSolved}</p>
                </div>
            </div>
            <div className="clan-member-rating">
                <span className="rating-value">{rating}</span>
                <img src={trophyIcon} alt="Trophy" className="trophy-icon" />
            </div>
        </div>
    );
}