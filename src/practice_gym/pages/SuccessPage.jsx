import React from "react";
import '../style/SuccessPage.css'

const SuccessPage = ({ onBack }) => {
  return (
    <div className="success-page">
      {/* Background blur / image space */}
      <div className="bg-overlay"></div>

      {/* Success Card */}
      <div className="success-card">
        <h1 className="success-title">
          <span>CONGRATULATIONS</span>
          <span className="underline"></span>
        </h1>

        <h2 className="success-subtitle">
          YOU SOLVED IT WITHIN
          <br />
          <span className="time">TIME!</span>
          <span className="underline small"></span>
        </h2>

        <button className="lobby-btn" onClick={onBack}>Go Back to Lobby</button>
      </div>
    </div>
  );
};

export default SuccessPage;
