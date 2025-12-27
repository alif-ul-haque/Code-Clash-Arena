import React from 'react';
import '../style/1v1_playmode_page.css';
import logo from '../../assets/icons/cca.png';
import '../../assets/components/Button.css';

function PlayModePage() {
  return (
    <div className="playmode-container">
          <img src={logo} alt="Code Clash Arena Logo" className="playmode-logo" />
          <button className="glow-btn exit-btn">Exit</button>
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
    </div>
  );
}

export default PlayModePage;