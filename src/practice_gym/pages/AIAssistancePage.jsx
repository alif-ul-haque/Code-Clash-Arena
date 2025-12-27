import React from "react";
import '../style/AIAssistancePage.css'

const AIAssistancePage = ({ problem, onBack }) => {
  return (
    <div className="ai-assistance-page">
      {/* Background blur / image space */}
      <div className="bg-overlay"></div>

      {/* AI Hint Card */}
      <div className="hint-card">
        <h1 className="hint-title">
          <span>AI HINT</span>
          <span className="underline"></span>
        </h1>

        <div className="hint-content">
          <p className="hint-text">
            💡 <strong>Hint for {problem?.title || 'this problem'}:</strong>
          </p>
          <p className="hint-description">
            Try breaking down the problem into smaller steps. Consider using a hash map 
            or dictionary to store values you've seen so far. This will allow you to 
            check in O(1) time if the complement of your current number exists.
          </p>
          <p className="hint-suggestion">
            Think about: What data structure can help you achieve constant-time lookups?
          </p>
        </div>

        <button className="return-btn" onClick={onBack}>
          ← Return to Problem
        </button>
      </div>
    </div>
  );
};

export default AIAssistancePage;
