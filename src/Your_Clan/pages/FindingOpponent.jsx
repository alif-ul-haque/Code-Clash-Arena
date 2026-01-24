import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/FindingOpponent.css';
import { findMatch, leaveBattleQueue, subscribeToMatchmaking } from '../utilities/ClanBattleMatchmaking';
import { createClanBattle } from '../utilities/ClanBattleManager';
import getUserData from '../../mainpage_clan_battle/utilities/UserData';
import { supabase } from '../../supabaseclient';

export default function FindingOpponent() {
    const navigate = useNavigate();
    const [dots, setDots] = useState('');
    const [isCreatingBattle, setIsCreatingBattle] = useState(false);

    useEffect(() => {
        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Poll for match every 2 seconds
        let pollInterval;
        async function pollForMatch() {
            if (isCreatingBattle) return; // Don't poll if already creating battle

            const { matched, opponentClanId, error } = await findMatch();
            
            if (error) {
                console.error('Error finding match:', error);
                return;
            }

            if (matched && opponentClanId) {
                setIsCreatingBattle(true);
                clearInterval(pollInterval);
                await handleMatchFound(opponentClanId);
            }
        }

        pollInterval = setInterval(pollForMatch, 2000);
        pollForMatch(); // Initial check

        // Subscribe to real-time matchmaking updates
        const channel = subscribeToMatchmaking(async (payload) => {
            console.log('Matchmaking update:', payload);
            if (payload.new?.status === 'matched') {
                const { data: user } = await getUserData();
                if (user && payload.new.clan_id === user.clan_id) {
                    setIsCreatingBattle(true);
                    clearInterval(pollInterval);
                    await handleMatchFound(payload.new.matched_with_clan_id);
                }
            }
        });

        // Cleanup on unmount
        return () => {
            clearInterval(dotsInterval);
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
            // Leave queue if user navigates away
            leaveBattleQueue();
        };
    }, [navigate, isCreatingBattle]);

    async function handleMatchFound(opponentClanId) {
        try {
            // Get current user and queue data
            const { data: user } = await getUserData();
            
            // Get both clans' queue data to get selected members
            const { data: myQueue } = await supabase
                .from('clan_battle_queue')
                .select('selected_members')
                .eq('clan_id', user.clan_id)
                .single();

            const { data: opponentQueue } = await supabase
                .from('clan_battle_queue')
                .select('selected_members')
                .eq('clan_id', opponentClanId)
                .single();

            if (!myQueue || !opponentQueue) {
                console.error('Queue data not found');
                navigate('/your-clan');
                return;
            }

            // Create the battle
            const { success, battleId, error } = await createClanBattle(
                user.clan_id,
                opponentClanId,
                myQueue.selected_members,
                opponentQueue.selected_members
            );

            if (success && battleId) {
                // Navigate to revealing warriors with battle data
                navigate('/your-clan/revealing-warriors', { 
                    state: { 
                        battleId,
                        opponentClanId 
                    } 
                });
            } else {
                console.error('Failed to create battle:', error);
                alert('Failed to create battle. Please try again.');
                navigate('/your-clan');
            }
        } catch (error) {
            console.error('Error in handleMatchFound:', error);
            navigate('/your-clan');
        }
    }

    return (
        <div className="finding-opponent-page">
            <div className="finding-overlay">
                <div className="magnifying-glass">
                    <div className="glass-lens"></div>
                    <div className="glass-handle"></div>
                    <div className="search-glow"></div>
                </div>

                <h1 className="finding-title">
                    {isCreatingBattle ? 'Match Found! Creating Battle' : `Finding Your Opponent${dots}`}
                </h1>
                <p className="finding-subtitle">
                    {isCreatingBattle ? 'Preparing the battlefield...' : 'Searching for worthy adversaries'}
                </p>

                <div className="scan-lines">
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                </div>
            </div>
        </div>
    );
}
