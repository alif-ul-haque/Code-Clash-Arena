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
                    .select('cf_handle, trophy') // Get only username and rating columns
                    .eq('cf_handle', loggedInUser) // Filter: WHERE username = logged-in user
                    .single(); // Return single object (not array)

                // If there was an error fetching user, throw it
                if (userError) throw userError;

                // If user data was found, update the state
                if (user) {
                    setUserData({
                        cf_handle: user.cf_handle,
                        trophy: user.trophy || 0 // Use 0 if rating is null
                    });
                }

                // FETCH FRIENDS LIST
                // Step 1: Get logged-in user's id from users table
                const { data: currentUserData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('cf_handle', loggedInUser)
                    .single();

                const alifId = currentUserData.id;

                // Step 2: Get friend IDs from friends table
                const { data: friendData } = await supabase
                    .from('friends')
                    .select('f_id')
                    .eq('u_id', alifId);

                // Step 3: Get detailed friend information from users table
                const friendIds = friendData.map(f => f.f_id);

                const { data: friendsInfo } = await supabase
                    .from('users')
                    .select('cf_handle, email, xp, trophy')
                    .in('id', friendIds);

                // Store friends info in state
                if (friendsInfo) {
                    setFriendsList(friendsInfo);
                }

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

            <div className="user-info-banner">
                <div className="user-info-left">
                    <h2 className="username">{isLoading ? "Loading..." : userData.cf_handle}</h2>
                    <p className="tagline">Ready to Clash?</p>
                </div>

                <div className="user-info-right">
                    <h2 className="rating-number">{isLoading ? "..." : userData.trophy}</h2>
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
                            <button className="challenge-btn" onClick={() => navigate('/battle-mode')}>challenge!</button>
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
