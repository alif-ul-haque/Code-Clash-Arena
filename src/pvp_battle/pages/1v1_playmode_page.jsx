import React from 'react';
import '../style/1v1_playmode_page.css';
import logo from '../../assets/icons/cca.png';
import '../../assets/components/Button.css';

function PlayModePage() {
  return (
    <div className="playmode-container">
          <img src={logo} alt="Code Clash Arena Logo" className="playmode-logo" />
          <button className="glow-btn exit-btn">Exit</button>
    </div>
  );
}

export default PlayModePage;