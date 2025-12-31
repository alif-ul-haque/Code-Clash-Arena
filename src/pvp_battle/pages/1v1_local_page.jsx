import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/1v1_local_page.css';
import logo from '../../assets/icons/cca.png';

const OneVOneLocalPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('friends');

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
                    <h2 className="username">alif19</h2>
                    <p className="tagline">Ready to Clash?</p>
                </div>

                <div className="user-info-right">
                    <h2 className="rating-number">1500</h2>
                    <p className="rating-label">rating</p>
                </div>
            </div>

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
                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">MATIN008</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-container">
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    </div>
                    <button className="challenge-btn">challenge!</button>
                </div>

                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">THAN_007</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-container">
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    </div>
                    <button className="challenge-btn">challenge!</button>
                </div>

                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">TakiL096</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-container">
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    </div>
                    <button className="challenge-btn">challenge!</button>
                </div>

                <div className="friend-card">
                    <span className="friend-bullet">•</span>
                    <span className="friend-name">Usama_Jeager</span>
                    <button className="view-details-btn">VIEW DETAILS</button>
                    <div className="status-container">
                    <div className="status-indicator"></div>
                    <span className="status-text">active</span>
                    </div>
                    <button className="challenge-btn">challenge!</button>
                </div>
            </div>
            )}

            {activeTab === 'history' && (
                <div className="history-list">
                    {historyData.map((match) => (
                        <div key={match.id} className={`history-card ${match.status.toLowerCase()}`}>
                            <span className="history-username">{match.username}</span>
                            <span className="history-mode">{match.mode}</span>
                            <span className="history-status">{match.status}</span>
                            <span className="history-trophy">{match.trophy} 🏆</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OneVOneLocalPage;
