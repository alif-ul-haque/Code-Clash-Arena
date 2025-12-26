import React from 'react';

import logo from '../../assets/icons/cca.png';
import '../../assets/components/Button.css';
function FirstPage1v1() {
  return (
    <div className="page-container">
        <img src={logo} alt="Code Clash Arena Logo" className="logo" />
         <h1 className="main-heading">
            Battle programmers in 1v1 competitive coding challenges
        </h1>
             <div className="features-container">
          <div className="feature-card">
            <h2>Local & Global Challenge
            Friends or Find global opponents</h2>
          </div>
        
          <div className="feature-card">
            <h2>Two Game Modes
            Real Mode vs Time Rush competitions</h2>
          </div>
        
          <div className="feature-card">
            <h2>Real Problems Solve
            CodeForces problems head-to-head</h2>
          </div>
        </div>
        <button className="glow-btn">
              <span>▶</span>
              <span>GET STARTED</span>
       </button>
    </div>
  );
}

export default FirstPage1v1;