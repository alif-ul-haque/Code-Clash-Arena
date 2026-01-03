import '../style/PlayerCard.css';
import Button from '../../assets/components/Button.jsx';
import trophyIcon from '../../assets/icons/trophy.png';
import addFriend from '../../assets/icons/user.png';

export default function PlayerCard({
    player,
    hasFriendRequest = false,
    onToggleFriendRequest
}) {
    return (
        <div className="player-card">
            <div className="player-info">
                <h3 className="player-name">{player.name}</h3>
                <p className="player-clan">{player.clanName}</p>
            </div>
            <div className="player-rating">
                <span className="rating-value">{player.rating}</span>
                <img src={trophyIcon} alt="Trophy" className="trophy-icon" />
            </div>
            <div className="player-action">
                {!hasFriendRequest ? (
                    <Button
                        text=""
                        icon={addFriend}
                        showIcon={true}
                        backgroundColor='#3498db'
                        height="2.8rem"
                        width="3.1rem"
                        fontSize='1rem'
                        borderRadius='0.625rem'
                        onClick={onToggleFriendRequest}
                    />
                ) : (
                    <Button
                        text="Cancel Request"
                        backgroundColor='#e74c3c'
                        height="2.8rem"
                        width="10rem"
                        fontSize='1rem'
                        borderRadius='0.625rem'
                        onClick={onToggleFriendRequest}
                    />
                )}
            </div>
        </div>
    );
}
