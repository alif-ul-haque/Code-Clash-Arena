import React from "react";
import '../style/ExitConfirmationPage.css'

const ExitConfirmationPage = ({ onExit, onBack }) => {
  return (
    <div className="exit-confirmation-page">
      {/* Background blur / image space */}
      <div className="bg-overlay"></div>

      {/* Confirmation Card */}
      <div className="exit-card">
        <h1 className="exit-title">
          <span>ARE YOU SURE?</span>
          <span className="underline"></span>
        </h1>

        <h2 className="exit-subtitle">
          Do you want to leave
          <br />
          in the middle of problem solving?
        </h2>

        <div className="button-group">
          <button className="back-btn" onClick={onBack}>
            ← BACK
          </button>
          <button className="confirm-exit-btn" onClick={onExit}>
            EXIT →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmationPage;
