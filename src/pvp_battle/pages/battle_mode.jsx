import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/battle_mode.css';
import { supabase } from '../../supabaseclient';

const BattleMode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser } = location.state || {};
    const [requestSent, setRequestSent] = useState(false);
    const [battleStatus, setBattleStatus] = useState('pending');

    // Subscribe to battle status changes
    useEffect(() => {
        if (!battleId) return;

        const channel = supabase
            .channel('battle-request-response')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'onevonebattles',
                    filter: `onevone_battle_id=eq.${battleId}`
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    setBattleStatus(newStatus);

                    // If opponent accepted, navigate to battle
                    if (newStatus === 'active') {
                        navigate('/1v1-coding-battle', {
                            state: {
                                battleId,
                                opponent,
                                currentUser,
                                mode: payload.new.battle_mode
                            }
                        });
                    } else if (newStatus === 'declined') {
                        alert('Opponent declined the battle request.');
                        navigate('/1v1-local');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [battleId]);

    const handleModeSelection = async (mode) => {
        try {
            if (mode === 'TIME RUSH MODE') {
                // For Time Rush, navigate to problem count selection first
                navigate('/time-rush-problem-count', {
                    state: {
                        battleId,
                        opponent,
                        currentUser,
                        mode
                    }
                });
                return;
            }

            // For Real Mode, send request immediately
            const { error } = await supabase
                .from('onevonebattles')
                .update({
                    battle_mode: mode,
                    status: 'request_sent'
                })
                .eq('onevone_battle_id', battleId);

            if (error) throw error;

            setRequestSent(true);
            setBattleStatus('request_sent');

        } catch (err) {
            console.error('Error sending battle request:', err);
            alert('Failed to send battle request. Please try again.');
        }
    };

    if (requestSent) {
        return (
            <div className="battle-mode-container">
                <div className="blur-background"></div>
                
                <div className="content-wrapper">
                    <div className="mode-selection-card">
                        <h1 className="mode-heading">WAITING FOR OPPONENT...</h1>
                        <p style={{ textAlign: 'center', color: '#fff', fontSize: '20px', marginTop: '20px' }}>
                            Battle request sent to {opponent?.cf_handle}
                        </p>
                        <p style={{ textAlign: 'center', color: '#aaa', fontSize: '16px', marginTop: '10px' }}>
                            Waiting for them to accept or decline...
                        </p>
                        <button 
                            className="lobby-btn" 
                            style={{ marginTop: '30px' }}
                            onClick={async () => {
                                // Cancel the battle by updating status to 'cancelled'
                                await supabase
                                    .from('onevonebattles')
                                    .update({ status: 'cancelled' })
                                    .eq('onevone_battle_id', battleId);
                                navigate('/1v1-local');
                            }}
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="battle-mode-container">
            <div className="blur-background"></div>
            
            <div className="content-wrapper">
                <div className="mode-selection-card">
                    <h1 className="mode-heading">SELECT BATTLE MODE</h1>
                    
                    <div className="modes-container">
                        <div className="mode-card" onClick={() => handleModeSelection('REAL MODE')}>
                            <h2 className="mode-title">REAL MODE</h2>
                            <p className="mode-description">No time limit. First to solve wins!</p>
                        </div>
                        
                        <div className="mode-card" onClick={() => handleModeSelection('TIME RUSH MODE')}>
                            <h2 className="mode-title">TIME RUSH MODE</h2>
                            <p className="mode-description">Race against the clock!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleMode;