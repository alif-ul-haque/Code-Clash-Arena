import '../style/ClanDetails.css';
import Button from '../../assets/components/Button.jsx';

export default function ClanDetails({
    clanName = 'Clan Name',
    clanType = 'Anyone can Join',
    minRating = 1000,
    maxRating = 1600,
    location = 'Location',
    totalMembers = 0,
    maxMembers = 10,
    onJoinClick
}) {
    return (
        <div className="clan-details-container">
            <div className="clan-details-main">
                <div className="clan-details-header">
                    <h2 className="clan-details-name">{clanName}</h2>
                    <p className="clan-details-level">Level : 10</p>
                </div>
            </div>
            <div className="clan-details-info-section">
                <div className="clan-details-info">
                    <p className="clan-details-type">{clanType}</p>
                    <div className="clan-details-rating">
                        <p className="rating-text">Min Rating: {minRating}</p>
                        <p className="rating-text">Max Rating: {maxRating}</p>
                    </div>
                </div>
            </div>
            <div className="clan-details-location-section">
                <h3 className="clan-details-location">{location}</h3>
                <p className="clan-details-members">
                    Total Members: {totalMembers}/{maxMembers}
                </p>
            </div>
            <div className="clan-details-button">
                <Button
                    text="Join"
                    height="60px"
                    width="150px"
                    fontSize="32px"
                    backgroundColor="#5DADE2"
                    borderRadius="10px"
                    onClick={onJoinClick}
                />
            </div>
        </div>
    );
}
