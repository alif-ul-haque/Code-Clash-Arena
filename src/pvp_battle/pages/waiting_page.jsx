import React from 'react';
import '../style/waiting_page.css';
import swordsIcon from '../../assets/icons/battle_sword.png';

const WaitingPage = () => {
    return (
        <div className="waiting-page-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="waiting-card">
                    <h1 className="waiting-heading">WAITING FOR OPPONENT TO ACCEPT</h1>
                    <p className="waiting-dots">••••••••••••••••••••••••</p>
                    <div className="swords-icon-container">
                        <img src={swordsIcon} alt="swords" className="swords-icon" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingPage;