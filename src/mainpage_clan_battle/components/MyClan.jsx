import '../style/MyClan.css';
import { useEffect } from 'react';
import bgimage from '../../assets/images/world_map.jpg';
import Button from '../../assets/components/Button';
import closeIcon from '../../assets/icons/x-mark.png';
import ClanMember from '../components/ClanMember.jsx';

export default function MyClan({ isOpen, onClose, clanDetails = {} }) {
    const {
        name = "",
        totalPoints = 0,
        members = '0/0',
        type = 'N/A',
        requiredRating = 'N/A',
        warFrequency = 'N/A',
        location = 'N/A',
        warWon = 0,
        participants = []
    } = clanDetails;

    // Sort participants by rating in descending order
    const sortedParticipants = [...participants].sort((a, b) => b.rating - a.rating);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="my-clan-overlay" onClick={onClose}>
            <div
                className="my-clan-menu"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="world-map"
                    style={{ backgroundImage: `url(${bgimage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="title-bar">
                        <p>{name}</p>
                        <div className="close-button">
                            <Button
                                text=''
                                height='2rem'
                                width='2rem'
                                fontSize='24px'
                                onClick={onClose}
                                backgroundColor='#DF4F16'
                                borderRadius='10px'
                                icon={closeIcon}
                                showIcon={true}
                            />
                        </div>
                    </div>
                    <div className="clan-details">
                        <div className="info-item">
                            <span className="info-label">Total Points</span>
                            <span className="info-value">{totalPoints}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Members</span>
                            <span className="info-value">{members}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Type</span>
                            <span className="info-value">{type}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Required Rating</span>
                            <span className="info-value">{requiredRating}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">War Frequency</span>
                            <span className="info-value">{warFrequency}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Clan Location</span>
                            <span className="info-value">{location}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">War Won</span>
                            <span className="info-value">{warWon}</span>
                        </div>
                    </div>
                </div>
                <div className="clan-menu-buttons">
                    <Button
                        text="War log"
                        height="2.5rem"
                        width="10rem"
                        fontSize="24px"
                        backgroundColor="#00B0FF"
                        borderRadius="12px"
                    />
                    <Button
                        text="Send Mail"
                        height="2.5rem"
                        width="10rem"
                        fontSize="24px"
                        backgroundColor="#08A24E"
                        borderRadius="12px"
                    />
                    <Button
                        text="Edit"
                        height="2.5rem"
                        width="10rem"
                        fontSize="24px"
                        backgroundColor="#08A24E"
                        borderRadius="12px"
                    />
                    <Button
                        text="Leave"
                        height="2.5rem"
                        width="10rem"
                        fontSize="24px"
                        backgroundColor="#C55021"
                        borderRadius="12px"
                    />
                </div>
                <div className="clan-participants">
                    {sortedParticipants.map((participant, index) => (
                        <ClanMember
                            key={participant.id || index}
                            position={index + 1}
                            name={participant.name}
                            role={participant.role}
                            warParticipated={participant.warParticipated}
                            problemsSolved={participant.problemsSolved}
                            rating={participant.rating}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
