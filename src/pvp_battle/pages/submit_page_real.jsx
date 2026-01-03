import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/submit_page_real.css';
import trophyIcon from '../../assets/icons/trophy.png';

const SubmitPageReal = () => {
    const navigate = useNavigate();

    return (
        <div className="submit-page-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="result-card">
                    <div className="corner-circle"></div>
                    <h1 className="result-heading">CONGRATULATIONS<br/>YOU WON!</h1>
                    
                    <div className="trophy-box">
                        <img src={trophyIcon} alt="trophy" className="trophy-icon-real" />
                        <span className="points-text">+115</span>
                    </div>
                    
                    <button className="lobby-btn" onClick={() => navigate('/1v1-local')}>GET BACK TO LOBBY</button>
                </div>
            </div>
        </div>
    );
};

export default SubmitPageReal;