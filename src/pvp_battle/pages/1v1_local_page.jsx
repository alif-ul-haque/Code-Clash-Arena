import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/1v1_local_page.css';
import logo from '../../assets/icons/cca.png';
import trophyIcon from '../../assets/icons/trophy.png';
import { supabase } from '../../supabaseclient';


const OneVOneLocalPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('friends');

    // State to store user data fetched from database
    const [userData, setUserData] = useState({
        username: "Loading...",
        rating: 0
    });

    // State to store friends list fetched from database
    const [friendsList, setFriendsList] = useState([]);

    // State to track if data is still loading
    const [isLoading, setIsLoading] = useState(true);

    // State to store any errors that occur
    const [error, setError] = useState(null);

    // State for incoming battle requests
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Function to create a new battle when challenging a friend
    const handleChallenge = async (friend) => {
        try {
            // Get current user's ID
            const loggedInUser = localStorage.getItem('loggedInUser');
            const { data: currentUser } = await supabase
                .from('users')
                .select('id')
                .eq('cf_handle', loggedInUser)
                .single();

            const { data: opponentUser } = await supabase
                .from('users')
                .select('id')
                .eq('cf_handle', friend.cf_handle)
                .single();

            // Create a new battle entry
            const { data: newBattle, error: battleError } = await supabase
                .from('onevonebattles')
                .insert({
                    battlefield: 'local',
                    battle_mode: null, // Will be set when mode is selected
                    problem_count: 1,
                    status: 'waiting',
                    trophy_reward: 115,
                    start_time: new Date().toISOString(),
                    invited_player_id: opponentUser.id // Track who is being invited
                })
                .select()
                .single();

            if (battleError) throw battleError;

            // Add both participants to the battle
            const { error: participantsError } = await supabase
                .from('onevone_participants')
                .insert([
                    {
                        onevone_battle_id: newBattle.onevone_battle_id,
                        player_id: currentUser.id,
                        problem_solved: 0,
                        time_taken: 0
                    },
                    {
                        onevone_battle_id: newBattle.onevone_battle_id,
                        player_id: opponentUser.id,
                        problem_solved: 0,
                        time_taken: 0
                    }
                ]);

            if (participantsError) throw participantsError;

            // Navigate to battle mode selection with battle data
            navigate('/battle-mode', {
                state: {
                    battleId: newBattle.onevone_battle_id,
                    opponent: friend,
                    currentUser: loggedInUser
                }
            });

        } catch (err) {
            console.error('Error creating battle:', err);
            alert('Failed to create battle. Please try again.');
        }
    };

    // useEffect: Runs once when component loads to fetch data from database
    useEffect(() => {
        // Async function to fetch user data and friends from Supabase
        const fetchData = async () => {
            try {
                setIsLoading(true); // Set loading to true while fetching

                // Get logged-in user's cf_handle from localStorage
                const loggedInUser = localStorage.getItem('loggedInUser');
                
                if (!loggedInUser) {
                    setError('No user logged in');
                    setIsLoading(false);
                    return;
                }

                // FETCH USER DATA
                // Query the 'users' table in Supabase database
                const { data: user, error: userError } = await supabase
                    .from('users') // Access the 'users' table
                    .select('cf_handle, rating') // Get only username and rating columns
                    .eq('cf_handle', loggedInUser) // Filter: WHERE username = logged-in user
                    .single(); // Return single object (not array)

                // If there was an error fetching user, throw it
                if (userError) throw userError;

                // If user data was found, update the state
                if (user) {
                    setUserData({
                        cf_handle: user.cf_handle,
                        rating: user.rating || 0 // Use 0 if rating is null
                    });
                }

                // FETCH FRIENDS LIST
                // Step 1: Get logged-in user's id from users table
                const { data: currentUserData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('cf_handle', loggedInUser)
                    .single();

                const userId = currentUserData.id;
                setCurrentUserId(userId);

                // Step 2: Get friend IDs from friends table
                const { data: friendData } = await supabase
                    .from('friends')
                    .select('f_id')
                    .eq('u_id', userId);

                // Step 3: Get detailed friend information from users table
                const friendIds = friendData.map(f => f.f_id);

                const { data: friendsInfo } = await supabase
                    .from('users')
                    .select('cf_handle, email, xp, rating, id')
                    .in('id', friendIds);

                // Store friends info in state
                if (friendsInfo) {
                    setFriendsList(friendsInfo);
                }

                // Check for existing incoming battle requests
                await checkIncomingRequests(userId);

            } catch (err) {
                // Handle any errors that occurred
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                // Always set loading to false when done (success or error)
                setIsLoading(false);
            }
        };

        // Call the function to fetch data
        fetchData();
    }, []); // Empty array means run only once when component mounts

    // Subscribe to incoming battle requests in real-time
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel('incoming-battle-requests')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'onevone_participants',
                    filter: `player_id=eq.${currentUserId}`
                },
                async (payload) => {
                    // New battle participant entry - check if it's a request
                    await checkIncomingRequests(currentUserId);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'onevonebattles'
                },
                async (payload) => {
                    // Battle status changed - refresh requests
                    await checkIncomingRequests(currentUserId);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    // Function to check for incoming battle requests
    const checkIncomingRequests = async (userId) => {
        try {
            // Get battles where current user is the INVITED player (not the sender)
            const { data: pendingBattles } = await supabase
                .from('onevonebattles')
                .select('*')
                .eq('invited_player_id', userId)
                .eq('status', 'request_sent');

            if (!pendingBattles || pendingBattles.length === 0) {
                setIncomingRequests([]);
                return;
            }

            // For each pending battle, get the challenger's info
            const requestsWithDetails = await Promise.all(
                pendingBattles.map(async (battle) => {
                    // Get both participants
                    const { data: participants } = await supabase
                        .from('onevone_participants')
                        .select('player_id')
                        .eq('onevone_battle_id', battle.onevone_battle_id);

                    // Find the sender (the one who is NOT current user)
                    const senderId = participants.find(p => p.player_id !== userId)?.player_id;

                    if (!senderId) return null;

                    // Get sender's details
                    const { data: senderInfo } = await supabase
                        .from('users')
                        .select('cf_handle, rating')
                        .eq('id', senderId)
                        .single();

                    return {
                        battleId: battle.onevone_battle_id,
                        mode: battle.battle_mode,
                        opponent: senderInfo,
                        timestamp: battle.start_time
                    };
                })
            );

            setIncomingRequests(requestsWithDetails.filter(r => r !== null));

        } catch (err) {
            console.error('Error checking incoming requests:', err);
        }
    };

    // Function to accept battle request
    const handleAcceptRequest = async (battleId, opponent) => {
        try {
            // Update battle status to 'active'
            const { error } = await supabase
                .from('onevonebattles')
                .update({ status: 'active' })
                .eq('onevone_battle_id', battleId);

            if (error) throw error;

            // Navigate to battle page
            const loggedInUser = localStorage.getItem('loggedInUser');
            const { data: battle } = await supabase
                .from('onevonebattles')
                .select('battle_mode, problem_count')
                .eq('onevone_battle_id', battleId)
                .single();

            // Navigate to appropriate page based on battle mode
            if (battle.battle_mode === 'TIME RUSH MODE') {
                navigate('/1v1-coding-timeRush-mode', {
                    state: {
                        battleId,
                        opponent,
                        currentUser: loggedInUser,
                        mode: battle.battle_mode,
                        problemCount: battle.problem_count
                    }
                });
            } else {
                // Real Mode
                navigate('/1v1-coding-battle', {
                    state: {
                        battleId,
                        opponent,
                        currentUser: loggedInUser,
                        mode: battle.battle_mode
                    }
                });
            }

        } catch (err) {
            console.error('Error accepting request:', err);
            alert('Failed to accept battle request.');
        }
    };

    // Function to decline battle request
    const handleDeclineRequest = async (battleId) => {
        try {
            // Update battle status to 'declined'
            const { error } = await supabase
                .from('onevonebattles')
                .update({ status: 'declined' })
                .eq('onevone_battle_id', battleId);

            if (error) throw error;

            // Remove from incoming requests
            setIncomingRequests(prev => prev.filter(r => r.battleId !== battleId));

        } catch (err) {
            console.error('Error declining request:', err);
            alert('Failed to decline battle request.');
        }
    };

    // History data
    const historyData = [
        { id: 1, username: 'MATIN008', mode: 'REAL MODE', status: 'WON', trophy: '+150' },
        { id: 2, username: 'Than_007', mode: 'REAL MODE', status: 'WON', trophy: '+150' },
        { id: 3, username: 'TakiL_096', mode: 'REAL MODE', status: 'LOST', trophy: '-50' },
        { id: 4, username: 'Usama_Jeager', mode: 'REAL MODE', status: 'WON', trophy: '+150' }
    ];

    return (
        <div className="local-battle-container">
            <img src={logo} alt="Code Clash Arena Logo" className="local-logo" />

            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => navigate('/playmode1v1')}>Exit</button>
            </div>

            {/* Incoming Battle Requests Notification */}
            {incomingRequests.length > 0 && (
                <div className="battle-request-overlay">
                    <div className="battle-request-modal">
                        <h2 className="request-title">INCOMING BATTLE REQUEST!</h2>
                        {incomingRequests.map((request, index) => (
                            <div key={index} className="request-card">
                                <p className="request-from">
                                    <strong>{request.opponent.cf_handle}</strong> challenges you!
                                </p>
                                <p className="request-mode">Mode: {request.mode}</p>
                                <p className="request-rating">Rating: {request.opponent.rating}</p>
                                <div className="request-actions">
                                    <button 
                                        className="accept-btn"
                                        onClick={() => handleAcceptRequest(request.battleId, request.opponent)}
                                    >
                                        ACCEPT
                                    </button>
                                    <button 
                                        className="decline-btn"
                                        onClick={() => handleDeclineRequest(request.battleId)}
                                    >
                                        DECLINE
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="user-info-banner">
                <div className="user-info-left">
                    <h2 className="username">{isLoading ? "Loading..." : userData.cf_handle}</h2>
                    <p className="tagline">Ready to Clash?</p>
                </div>

                <div className="user-info-right">
                    <h2 className="rating-number">{isLoading ? "..." : userData.rating}</h2>
                    <p className="rating-label">rating</p>
                </div>
            </div>

            {/* Show error message if something went wrong */}
            {error && (
                <div style={{
                    color: 'red',
                    background: 'rgba(255, 0, 0, 0.1)',
                    padding: '10px',
                    borderRadius: '5px',
                    margin: '10px 0',
                    textAlign: 'center'
                }}>
                    Error loading data: {error}
                </div>
            )}

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    Friends
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            {activeTab === 'friends' && (
                <div className="friends-list">
                    {/* Show loading message while fetching friends */}
                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                            Loading friends...
                        </div>
                    )}

                    {/* Show message if no friends found */}
                    {!isLoading && friendsList.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
                            No friends found. Add some friends to start battling!
                        </div>
                    )}

                    {/* Display each friend from database */}
                    {!isLoading && friendsList.map((friend, index) => (
                        <div key={index} className="friend-card">
                            <span className="friend-bullet">•</span>
                            <span className="friend-name">{friend.cf_handle}</span>
                            <button className="view-details-btn">VIEW DETAILS</button>

                            <div className="details-overlay"></div>

                            <div className="details-popup">
                                <p className="popup-text">XP Earned:</p>
                                <p className="popup-value">{friend.xp || 0}</p>
                                <p className="popup-text">Trophy: {friend.trophy || 0}</p>
                            </div>
                            <div className="status-container">
                                <div className="status-indicator"></div>
                                <span className="status-text">active</span>
                            </div>
                            <button className="challenge-btn" onClick={() => handleChallenge(friend)}>challenge!</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="history-list">
                    {historyData.map((match) => (
                        <div key={match.id} className={`history-card ${match.status.toLowerCase()}`}>
                            <span className="history-username">{match.username}</span>
                            <span className="history-mode">{match.mode}</span>
                            <span className="history-status">{match.status}</span>
                            <span className="history-trophy">
                                {match.trophy} <img src={trophyIcon} alt="trophy" className="trophy-icon" />
                            </span>
                        </div>
                    ))}
                </div>
            )}



        </div>
    );
};

export default OneVOneLocalPage;
