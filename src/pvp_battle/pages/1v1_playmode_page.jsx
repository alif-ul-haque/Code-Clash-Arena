import React from "react";
import { useNavigate } from 'react-router-dom';
import "../style/1v1_playmode_page.css";
import logo from "../../assets/icons/cca.png";

function PlayModePage() {
    const navigate = useNavigate();
    
    return (
        <div className="playmode-container">
            <img src={logo} alt="Code Clash Arena Logo" className="playmode-logo" />
            <div className="exit-btn-wrapper">
                <button className="exit-btn" onClick={() => navigate('/main')}>Exit</button>
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
            <div className="battle-options-container">
                <div className="battle-card" onClick={() => navigate('/1v1-local')} style={{cursor: 'pointer'}}>
                    <h2 className="battle-title">LOCAL BATTLE</h2>
                    <p className="battle-description">challenge a local opponent</p>
                </div>

                <div className="battle-card" onClick={() => navigate('/1v1-global')} style={{cursor: 'pointer'}}>
                    <h2 className="battle-title">GLOBAL BATTLE</h2>
                    <p className="battle-description">Find a worthy opponent worldwide</p>
                </div>
            </div>
        </div>
    );
}

export default PlayModePage;
