import '../style/Social.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import searchIcon from '../../assets/icons/magnifier.png';
import PlayerCard from './PlayerCard.jsx';
import MailCard from './MailCard.jsx';

export default function Social({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('friend');
    const [searchQuery, setSearchQuery] = useState('');
    const [friendRequests, setFriendRequests] = useState(new Set());

    const dummyPlayers = [
        { id: 1, name: "Alice_99", clanName: "Code Warriors", rating: 1800 },
        { id: 2, name: "Bob_Smith", clanName: "Bug Hunters", rating: 1650 },
        { id: 3, name: "Charlie_Dev", clanName: "Syntax Squad", rating: 1500 },
        { id: 4, name: "Diana_Code", clanName: "Debug Masters", rating: 1900 },
        { id: 5, name: "Eve_Hacker", clanName: "Code Ninjas", rating: 1400 },
    ];

    const dummyMails = [
        { id: 1, type: 'clan', from: "Code Warriors", message: "You have been invited to join Code Warriors clan!", time: "2h ago" },
        { id: 2, type: 'friend', from: "Alice_99", message: "Sent you a friend request", time: "5h ago" },
        { id: 3, type: 'friend', from: "Bob_Smith", message: "Sent you a friend request", time: "1d ago" },
        { id: 4, type: 'clan', from: "Debug Masters", message: "You have been invited to join Debug Masters clan!", time: "2d ago" },
    ];

    const toggleFriendRequest = (playerId) => {
        setFriendRequests(prev => {
            const newSet = new Set(prev);
            if (newSet.has(playerId)) {
                newSet.delete(playerId);
            } else {
                newSet.add(playerId);
            }
            return newSet;
        });
    };

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
        <div className="social-overlay" onClick={onClose}>
            <div
                className="social-menu"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="social-tabs">
                    <Button
                        text="Friend"
                        height="3.75rem"
                        width="12.5rem"
                        fontSize="1.75rem"
                        backgroundColor={activeTab === 'friend' ? '#08A24E' : '#F1CA76'}
                        onClick={() => setActiveTab('friend')}
                    />
                    <Button
                        text="Mail"
                        height="3.75rem"
                        width="12.5rem"
                        fontSize="1.75rem"
                        backgroundColor={activeTab === 'mail' ? '#08A24E' : '#F1CA76'}
                        onClick={() => setActiveTab('mail')}
                    />
                </div>

                <div className="social-content">
                    {activeTab === 'friend' ? (
                        <div className="friend-section">
                            <div className="search-section">
                                <div className="search-bar">
                                    <p>Search Players:</p>
                                    <input
                                        type="text"
                                        placeholder="Enter player name"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="icon-button">
                                    <Button
                                        text="Search"
                                        icon={searchIcon}
                                        showIcon={true}
                                        backgroundColor='#08A24E'
                                        height="3rem"
                                        width="10rem"
                                        fontSize='1.8rem'
                                        borderRadius='15px'
                                        onClick={() => console.log("Searching:", searchQuery)}
                                    />
                                </div>
                            </div>

                            <div className="players-list">
                                {dummyPlayers.map((player) => (
                                    <PlayerCard
                                        key={player.id}
                                        player={player}
                                        hasFriendRequest={friendRequests.has(player.id)}
                                        onToggleFriendRequest={() => toggleFriendRequest(player.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mail-section">
                            <h2 className="mail-header">Invitations & Requests</h2>
                            <div className="mail-feed">
                                {dummyMails.map((mail) => (
                                    <MailCard
                                        key={mail.id}
                                        mail={mail}
                                        onAccept={() => console.log("Accepted:", mail.from)}
                                        onDecline={() => console.log("Declined:", mail.from)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
