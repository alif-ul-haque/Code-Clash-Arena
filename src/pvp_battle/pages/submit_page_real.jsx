import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/submit_page_real.css';
import trophyIcon from '../../assets/icons/trophy.png';

const SubmitPageReal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { won, opponent, trophyChange } = location.state || { won: true, opponent: 'Unknown', trophyChange: '+115' };

    return (
        <div className="submit-page-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="result-card">
                    <div className="corner-circle"></div>
                    <h1 className="result-heading">
                        {won ? 'CONGRATULATIONS' : 'BETTER LUCK'}<br/>
                        {won ? 'YOU WON!' : 'NEXT TIME!'}
                    </h1>
                    
                    <p className="opponent-text">Against: {opponent}</p>
                    
                    <div className="trophy-box">
                        <img src={trophyIcon} alt="trophy" className="trophy-icon-real" />
                        <span className="points-text" style={{ color: won ? '#FFD700' : '#ff4444' }}>
                            {trophyChange}
                        </span>
                    </div>
                    
                    <button className="lobby-btn" onClick={() => navigate('/playmode1v1')}>GET BACK TO LOBBY</button>
                </div>
            </div>
        </div>
    );
};

export default SubmitPageReal;