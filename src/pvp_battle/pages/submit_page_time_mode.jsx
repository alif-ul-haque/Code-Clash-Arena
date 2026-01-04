import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/submit_page_time_mode.css';
import trophyIcon from '../../assets/icons/trophy.png';

const SubmitPageTimeMode = () => {
    const navigate = useNavigate();

    return (
        <div className="submit-time-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="result-card">
                    <div className="corner-circle"></div>
                    <h1 className="result-heading">OPPS<br/>YOU LOST! 😭</h1>
                    
                    <div className="problem-solved-box">
                        <span className="problem-text">Problem Solved : 1</span>
                    </div>
                    
                    <div className="penalty-box">
                        <img src={trophyIcon} alt="trophy" className="penalty-trophy-icon" />
                        <span className="penalty-text">-120</span>
                    </div>
                    
                    <button className="lobby-btn" onClick={() => navigate('/1v1-local')}>GET BACK TO LOBBY</button>
                </div>
            </div>
        </div>
    );
};

export default SubmitPageTimeMode;