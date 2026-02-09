import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../style/1v1_playmode_page.css";
import logo from "../../assets/icons/cca.png";
import { supabase } from "../../supabaseclient";

function PlayModePage() {
    const navigate = useNavigate();
    
    // State to store user data fetched from database
    const [userData, setUserData] = useState({
        username: "Loading...",
        rating: 0
    });
    
    // State to track if data is still loading
    const [isLoading, setIsLoading] = useState(true);
    
    // State to store any errors that occur
    const [error, setError] = useState(null);
    
    // useEffect: Runs once when component loads to fetch data from database
    useEffect(() => {
        // Async function to fetch user data from Supabase
        const fetchUserData = async () => {
            try {
                setIsLoading(true); // Set loading to true while fetching
                
                // Get logged-in user's cf_handle from localStorage
                const loggedInUser = localStorage.getItem('loggedInUser');
                
                if (!loggedInUser) {
                    setError('No user logged in');
                    setIsLoading(false);
                    return;
                }
                
                // Query the 'users' table in Supabase database
                const { data: user, error: userError } = await supabase
                    .from('users') // Access the 'users' table
                    .select('cf_handle, rating') // Get only username and rating columns
                    .eq('cf_handle', loggedInUser) // Filter: WHERE username = logged-in user
                    .single(); // Return single object (not array)
                
                // If there was an error, throw it to be caught below
                if (userError) throw userError;
                
                // If user data was found, update the state
                if (user) {
                    setUserData({
                        cf_handle: user.cf_handle,
                        rating: user.rating || 0 // Use 0 if rating is null
                    });
                }
                
            } catch (err) {
                // Handle any errors that occurred
                console.error('Error fetching user data:', err);
                setError(err.message);
            } finally {
                // Always set loading to false when done (success or error)
                setIsLoading(false);
            }
        };
        
        // Call the function to fetch data
        fetchUserData();
    }, []); // Empty array means run only once when component mounts
    
    return (
        <div className="playmode-container">
            <img src={logo} alt="Code Clash Arena Logo" className="playmode-logo" />
            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => navigate('/main')}>Exit</button>
            </div>
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
            <div className="battle-options-container">
                <div className="battle-card" onClick={() => navigate('/1v1-local')} style={{cursor: 'pointer'}}>
                    <h2 className="battle-title">LOCAL BATTLE</h2>
                    <p className="battle-description">challenge a local opponent</p>
                </div>

                <div className="battle-card" onClick={() => {
                    const currentUser = localStorage.getItem('loggedInUser');
                    if (!currentUser) {
                        alert('Please log in first');
                        navigate('/login');
                        return;
                    }
                    // Store in localStorage for global page to access
                    localStorage.setItem('currentUser', currentUser);
                    // Navigate with state
                    navigate('/1v1-global', {
                        state: {
                            currentUser: currentUser,
                            playerRating: userData.rating
                        }
                    });
                }} style={{cursor: 'pointer'}}>
                    <h2 className="battle-title">GLOBAL BATTLE</h2>
                    <p className="battle-description">Find a worthy opponent worldwide</p>
                </div>
            </div>
        </div>
    );
}

export default PlayModePage;
