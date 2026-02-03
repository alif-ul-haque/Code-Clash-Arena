import '../style/Social.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import searchIcon from '../../assets/icons/magnifier.png';
import closeIcon from '../../assets/icons/x-mark.png';
import PlayerCard from './PlayerCard.jsx';
import MailCard from './MailCard.jsx';
import { loadMailBox } from '../utilities/LoadMailBox.js';
import { acceptRequest, rejectRequest } from '../utilities/ClanAdd.js';
import AlertPage from '../../assets/components/AlertPage.jsx';
import { supabase } from '../../supabaseclient.js';
import { viewNonFriends } from '../utilities/Friend_request.js';

export default function Social({ isOpen, onClose, hasNewMails, onMailsRead }) {
    const [activeTab, setActiveTab] = useState('friend');
    const [searchQuery, setSearchQuery] = useState('');
    const [friendRequests, setFriendRequests] = useState(new Set());
    const [mails, setMails] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');

    const dummyPlayers = [
        { id: 1, name: "Alice_99", clanName: "Code Warriors", rating: 1800 },
        { id: 2, name: "Bob_Smith", clanName: "Bug Hunters", rating: 1650 },
        { id: 3, name: "Charlie_Dev", clanName: "Syntax Squad", rating: 1500 },
        { id: 4, name: "Diana_Code", clanName: "Debug Masters", rating: 1900 },
        { id: 5, name: "Eve_Hacker", clanName: "Code Ninjas", rating: 1400 },
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

    // Fetch mails on mount and when modal opens
    useEffect(() => {
        const fetchMails = async () => {
            try {
                const { mails: loadedMails, error } = await loadMailBox();
                if (!error && loadedMails) {
                    setMails(loadedMails);
                } else {
                    setMails([]);
                }
            } catch (error) {
                console.error('Error fetching mails:', error);
                setMails([]);
            }
        };

        const fetchNonFriends = async () => {
            const { data, error } = await viewNonFriends();
            if (error) {
                console.error("Error fetching non-friends:", error.message);
                return;
            }
            console.log("Non-friends data:", data);
        }

        if (isOpen) {
            fetchMails();
            fetchNonFriends();
        }
    }, [isOpen]);

    useEffect(() => {
        const channel = supabase
            .channel('clan_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'clan_join_requests'
                },
                async (payload) => {
                    console.log('Clan request changed:', payload);
                    try {
                        const { mails: loadedMails, error } = await loadMailBox();
                        if (!error && loadedMails) {
                            setMails(loadedMails);
                        } else {
                            setMails([]);
                        }
                    } catch (error) {
                        console.error('Error refetching mails:', error);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAccept = async (mail) => {
        try {
            await acceptRequest({ id: mail.id, userId: mail.userId, clanId: mail.clanId });
            setAlertMessage('Request accepted successfully!');
            setShowAlert(true);
            const { mails: loadedMails, error } = await loadMailBox();
            if (!error) {
                setMails(loadedMails);
            }
        } catch (error) {
            setAlertType('error');
            setAlertMessage('Failed to accept request');
            setShowAlert(true);
        }
    };

    const handleDecline = async (mailId) => {
        try {
            await rejectRequest(mailId);
            setAlertMessage('Request declined');
            setShowAlert(true);
            const { mails: loadedMails, error } = await loadMailBox();
            if (!error) {
                setMails(loadedMails);
            }
        } catch (error) {
            setAlertType('error');
            setAlertMessage('Failed to decline request');
            setShowAlert(true);
        }
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
        <>
            {showAlert && (
                <AlertPage
                    message={alertMessage}
                    isVisible={showAlert}
                    onClose={() => setShowAlert(false)}
                    type={alertType}
                />
            )}
            <div className="social-overlay" onClick={onClose}>
                <div
                    className="social-menu"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="social-header">
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
                            onClick={() => {
                                setActiveTab('mail');
                                if (onMailsRead && hasNewMails) {
                                    onMailsRead();
                                }
                            }}
                            showNotification={hasNewMails && activeTab !== 'mail'}
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
                                    {mails.map((mail, index) => (
                                        <MailCard
                                            key={index}
                                            mail={mail}
                                            onAccept={() => handleAccept(mail)}
                                            onDecline={() => handleDecline(mail.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
