import { useState, useEffect } from "react";
import '../style/AIAssistancePage.css';
import { getSmartHint } from '../utilities/aiHintAPI';
import { canAffordHint, deductXP, HINT_COSTS } from '../utilities/xpManager';

const AIAssistancePage = ({ problem, userCode, userData, onBack, onXPUpdate }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [hints, setHints] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userXP, setUserXP] = useState(userData?.xp || 0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingHintLevel, setPendingHintLevel] = useState(null);

  // Load first hint on mount
  useEffect(() => {
    loadHint(1);
  }, []);

  // Handle hint request (shows confirmation if needed)
  const requestHint = async (level) => {
    // If hint already loaded, just show it
    if (hints[level]) {
      setCurrentLevel(level);
      setError(null);
      return;
    }

    // Level 1 is always free, load directly
    if (level === 1) {
      loadHint(level);
      return;
    }

    // For level 2 and 3, check if it will cost XP
    // We need to know if it's pre-generated or not
    // For now, show confirmation for all level 2/3 hints
    setPendingHintLevel(level);
    setShowConfirmModal(true);
  };

  // Proceed with hint generation after confirmation
  const confirmHintRequest = () => {
    setShowConfirmModal(false);
    if (pendingHintLevel) {
      loadHint(pendingHintLevel);
      setPendingHintLevel(null);
    }
  };

  // Cancel hint request
  const cancelHintRequest = () => {
    setShowConfirmModal(false);
    setPendingHintLevel(null);
  };

  const loadHint = async (level) => {
    // If hint already loaded, just show it
    if (hints[level]) {
      setCurrentLevel(level);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate hint from AI
      const result = await getSmartHint(problem, level, userCode);

      if (result.success) {
        // Check if this is a pre-generated hint (free) or AI-generated (costs XP)
        if (!result.isPreGenerated && level > 1) {
          // Check if user has enough XP
          if (!canAffordHint(userXP, level)) {
            setError(`Not enough XP! You need ${HINT_COSTS[level]} XP for this hint. You have ${userXP} XP.`);
            setLoading(false);
            return;
          }

          // Deduct XP
          const xpResult = await deductXP(userData.id, HINT_COSTS[level]);
          if (xpResult.success) {
            setUserXP(xpResult.newXP);
            // Notify parent to update XP display
            if (onXPUpdate) {
              onXPUpdate(xpResult.newXP);
            }
          } else {
            setError('Failed to deduct XP. Please try again.');
            setLoading(false);
            return;
          }
        }

        // Store and display hint
        setHints({
          ...hints,
          [level]: {
            text: result.hint,
            cost: result.isPreGenerated ? 0 : HINT_COSTS[level],
            isPreGenerated: result.isPreGenerated
          }
        });
        setCurrentLevel(level);
      } else {
        setError(result.error || 'Failed to generate hint');
      }
    } catch (err) {
      console.error('Error loading hint:', err);
      setError('An error occurred while generating the hint');
    } finally {
      setLoading(false);
    }
  };

  const currentHint = hints[currentLevel];

  return (
    <div className="ai-assistance-page">
      {/* Background blur / image space */}
      <div className="bg-overlay"></div>

      {/* AI Hint Card */}
      <div className="hint-card">
        <h1 className="hint-title">
          <span>🤖 AI HINT</span>
          <span className="underline"></span>
        </h1>

        {/* XP Display */}
        <div className="xp-display">
          <span className="xp-label">Your XP:</span>
          <span className="xp-value">{userXP}</span>
        </div>

        {/* Hint Level Selector */}
        <div className="hint-level-selector">
          <button 
            className={`level-btn ${currentLevel === 1 ? 'active' : ''}`}
            onClick={() => requestHint(1)}
            disabled={loading}
          >
            <div className="level-icon">💡</div>
            <div className="level-text">
              <div>Subtle Hint</div>
              <div className="level-cost">{hints[1]?.isPreGenerated ? 'FREE' : 'FREE'}</div>
            </div>
          </button>
          
          <button 
            className={`level-btn ${currentLevel === 2 ? 'active' : ''}`}
            onClick={() => requestHint(2)}
            disabled={loading}
          >
            <div className="level-icon">🔍</div>
            <div className="level-text">
              <div>Detailed Hint</div>
              <div className="level-cost">
                {hints[2]?.isPreGenerated ? 'FREE' : `${HINT_COSTS[2]} XP`}
              </div>
            </div>
          </button>
          
          <button 
            className={`level-btn ${currentLevel === 3 ? 'active' : ''}`}
            onClick={() => requestHint(3)}
            disabled={loading}
          >
            <div className="level-icon">📝</div>
            <div className="level-text">
              <div>Algorithm Steps</div>
              <div className="level-cost">
                {hints[3]?.isPreGenerated ? 'FREE' : `${HINT_COSTS[3]} XP`}
              </div>
            </div>
          </button>
        </div>

        {/* Hint Content */}
        <div className="hint-content">
          {loading && (
            <div className="loading-hint">
              <div className="loading-spinner-small"></div>
              <p>🤔 AI is thinking...</p>
            </div>
          )}
          
          {error && (
            <div className="hint-error">
              <p>❌ {error}</p>
            </div>
          )}
          
          {!loading && !error && currentHint && (
            <>
              <div className="hint-badge">
                {currentHint.isPreGenerated ? (
                  <span className="badge-free">⚡ Instant Hint (Free)</span>
                ) : (
                  <span className="badge-ai">🤖 AI Generated {currentHint.cost > 0 && `(-${currentHint.cost} XP)`}</span>
                )}
              </div>
              
              <p className="hint-text" style={{ whiteSpace: 'pre-line' }}>
                {currentHint.text}
              </p>
            </>
          )}

          {!loading && !error && !currentHint && (
            <p className="hint-placeholder">
              💡 Select a hint level above to get started!
            </p>
          )}
        </div>

        <div className="hint-footer">
          <div className="hint-info">
            ℹ️ First hint is always free! Additional hints may cost XP.
          </div>
          <button className="return-btn" onClick={onBack}>
            ← Return to Problem
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingHintLevel && (
        <div className="confirmation-modal-overlay" onClick={cancelHintRequest}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h2 className="modal-title">Get AI Hint?</h2>
            
            <div className="modal-content">
              <p className="modal-message">
                {pendingHintLevel === 2 && (
                  <>
                    You're about to request a <strong>Detailed Hint (Level 2)</strong>.
                  </>
                )}
                {pendingHintLevel === 3 && (
                  <>
                    You're about to request <strong>Algorithm Steps (Level 3)</strong>.
                  </>
                )}
              </p>
              
              <div className="xp-warning">
                <div className="warning-box">
                  <div className="warning-icon">💰</div>
                  <div className="warning-text">
                    <strong>XP Cost: {HINT_COSTS[pendingHintLevel]} XP</strong>
                    <p>Your XP will be deducted if this hint is AI-generated.</p>
                    <p className="xp-after">After: <strong>{userXP - HINT_COSTS[pendingHintLevel]} XP</strong></p>
                  </div>
                </div>
                
                {hints[1] && !hints[1].isPreGenerated && (
                  <div className="hint-note">
                    ℹ️ This problem doesn't have pre-generated hints, so AI will generate one.
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="confirm-btn" onClick={confirmHintRequest}>
                ✓ Yes, Get Hint
              </button>
              <button className="cancel-btn" onClick={cancelHintRequest}>
                ✗ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistancePage;
