import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/waiting_page.css';
import swordsIcon from '../../assets/icons/battle_sword.png';
import { supabase } from '../../supabaseclient';

const WaitingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { battleId, opponent, currentUser, mode, problemCount } = location.state || {};

    useEffect(() => {
        if (!battleId) {
            // Fallback to old behavior if no battle data
            const timer = setTimeout(() => {
                navigate('/1v1-coding-timeRush-mode');
            }, 6000);
            return () => clearTimeout(timer);
        }

        // Subscribe to battle status changes
        const channel = supabase
            .channel('waiting-for-opponent')
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

                    // If opponent accepted, navigate to battle
                    if (newStatus === 'active') {
                        navigate('/1v1-coding-timeRush-mode', {
                            state: {
                                battleId,
                                opponent,
                                currentUser,
                                mode,
                                problemCount: payload.new.problem_count
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
    }, [battleId, navigate]);

    return (
        <div className="waiting-page-container">
            <div className="blur-background"></div>
            
            <div className="cancel-btn-wrapper">
                <button 
                    className="cancel-waiting-btn" 
                    onClick={() => navigate('/1v1-local')}
                >
                    CANCEL
                </button>
            </div>
            
            <div className="content-wrapper">
                <div className="waiting-card">
                    <h1 className="waiting-heading">WAITING FOR OPPONENT TO ACCEPT</h1>
                    <p className="waiting-subtext">
                        {opponent?.cf_handle ? `Sent to ${opponent.cf_handle}` : ''}
                    </p>
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