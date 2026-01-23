import '../style/ClanDetails.css';
import Button from '../../assets/components/Button.jsx';
import { joinClan, fetchStatus } from '../utilities/JoinClans.js';
import { useState, useEffect } from 'react';

export default function ClanDetails({
    clanName,
    clanId,
    clanType,
    minRating,
    maxRating,
    location,
    totalMembers,
    maxMembers = 10,
    level
}) {
    const [buttonColor, setButtonColor] = useState("#5DADE2");
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        const pendingStatus = async () => {
            const { status, error } = await fetchStatus(clanId);
            if (error) {
                console.error("Error fetching join status:", error);
                return;
            }
            if (status === 'pending') {
                setButtonColor("#F4D03F"); 
                setIsPending(true);
            }
        };
        pendingStatus();
    }, [clanId]);
    return (
        <div className="clan-details-container">
            <div className="clan-details-main">
                <div className="clan-details-header">
                    <h2 className="clan-details-name">{clanName}</h2>
                    <p className="clan-details-level">Level: {level}</p>
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
                    backgroundColor={buttonColor}
                    borderRadius="10px"
                    onClick={async () => {
                        if (isPending) {
                            return; 
                        }
                        const result = await joinClan(clanId);
                        if (result.success) {
                            alert(`Join request sent to clan: ${clanName}`);
                            setButtonColor("#F4D03F");
                        } else {
                            alert(`Failed to send join request: ${result.error}`);
                        }
                    }}
                />
            </div>
        </div>
    );
}
