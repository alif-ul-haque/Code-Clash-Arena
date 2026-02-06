import '../style/PlayerCard.css';
import Button from '../../assets/components/Button.jsx';
import trophyIcon from '../../assets/icons/trophy.png';
import addFriend from '../../assets/icons/user.png';
import { sendFriendRequest , cancelFriendRequest} from '../utilities/Friend_request.js';

export default function PlayerCard({
    player,
    hasFriendRequest = false,
    onToggleFriendRequest
}) {
    return (
        <div className="player-card-friend">
            <div className="player-info-friend">
                <h3 className="player-name-friend">{player.cf_handle}</h3>
                <p className="player-clan">{player.clan_name ? player.clan_name : "Not in a clan"}</p>
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
                        onClick={async () => {
                            onToggleFriendRequest();
                            const { error } = await sendFriendRequest(player.id);
                            if (error) {
                                console.error("Error sending friend request:", error.message);
                            }
                            else {
                                console.log("Friend request sent successfully");
                            }
                        }}
                    />
                ) : (
                    <Button
                        text="Cancel Request"
                        backgroundColor='#e74c3c'
                        height="2.8rem"
                        width="10rem"
                        fontSize='1rem'
                        borderRadius='0.625rem'
                        onClick={async () => {
                            const { error } = await cancelFriendRequest(player.id);
                            if (error) {
                                console.error("Error canceling friend request:", error.message);
                            }
                            else {
                                onToggleFriendRequest();
                                console.log("Friend request canceled successfully");
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
