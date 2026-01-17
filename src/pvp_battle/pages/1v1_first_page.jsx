import React, { useState, useEffect } from "react";
import "../style/1v1_first_page.css";
import logo from "../../assets/icons/cca.png";
import Button from '../../assets/components/Button';
import userIcon from "../../assets/icons/user_1.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseclient";

function FirstPage1v1() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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
          .select('cf_handle') // Get only username and rating columns
          .eq('cf_handle', loggedInUser) // Filter: WHERE username = logged-in user
          .single(); // Return single object (not array)
        
        // If there was an error, throw it to be caught below
        if (userError) throw userError;
        
        // If user data was found, update the state
        if (user) {
          setUserData({
            cf_handle: user.cf_handle
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

  const handleNavigateWithTransition = (path) => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(path);
    }, 1000);
  };

  return (
    <div className={`first-page-container ${isTransitioning ? 'page-transition-out' : ''}`}>
    <div className="first-page-container_inner">
      <img src={logo} alt="Code Clash Arena Logo" className="logo" />
      <div className="profile-section">
        <img src={userIcon} alt="User" className="user-icon" />
        <span className="username">
          <p>{isLoading ? "Loading..." : userData.cf_handle}</p>
        </span>
        {/* <span className="user-rating">
          <p>🏆 {isLoading ? "..." : userData.rating}</p>
        </span> */}
      </div>
      
      {/* Show error message if something went wrong */}
      {error && (
        <div style={{
          color: 'red',
          background: 'rgba(255, 0, 0, 0.1)',
          padding: '10px',
          borderRadius: '5px',
          margin: '10px 0'
        }}>
          Error loading data: {error}
        </div>
      )}
      
      <h1 className="main-heading">
        Battle programmers in 1v1 competitive coding challenges
      </h1>
      <div className="features-container">
        <div className="feature-card">
          <h2>Local & Global Challenge Friends or Find global opponents</h2>
        </div>

        <div className="feature-card">
          <h2>Two Game Modes Real Mode vs Time Rush competitions</h2>
        </div>

        <div className="feature-card">
          <h2>Real Problems Solve CodeForces problems head-to-head</h2>
        </div>
      </div>
      <button className="glow-btn" onClick={() => navigate("/playmode1v1")}>
        <span>▶</span>
        <span>GET STARTED</span>
      </button>
    </div>
    </div>
  );
}

export default FirstPage1v1;
