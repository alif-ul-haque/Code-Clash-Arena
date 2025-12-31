import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/1v1_local_page.css';
import logo from '../../assets/icons/cca.png';

const OneVOneLocalPage = () => {
    const navigate = useNavigate();

   

    return (
        <div className="local-battle-container">
            <img src={logo} alt="Code Clash Arena Logo" className="local-logo" />
            
            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => navigate('/playmode1v1')}>Exit</button>
            </div>

            <div className="user-info-banner">
                <div className="user-info-left">
                    <h2 className="username">alif19</h2>
                    <p className="tagline">Ready to Clash?</p>
                </div>

                <div className="user-info-right">
                    <h2 className="rating-number">1500</h2>
                    <p className="rating-label">rating</p>
                </div>
            </div>

            <div className="tabs-container">
                <button className="tab-btn active">Friends</button>
                <button className="tab-btn">History</button>
            </div>

            <div className="friends-list">
                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">mamn00B</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    <button className="challenge-btn">challenge</button>
                </div>

                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">THAFL007</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    <button className="challenge-btn">challenge</button>
                </div>

                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">TekiL096</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    <button className="challenge-btn">challenge</button>
                </div>

                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">Usama_Jeager</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    <button className="challenge-btn">challenge</button>
                </div>
            </div>
        </div>
    );
};

export default OneVOneLocalPage;
