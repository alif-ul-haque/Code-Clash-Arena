import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseclient';
import getUserData from '../../mainpage_clan_battle/utilities/UserData';
import '../style/FindingOpponent.css';

export default function FindingOpponent() {
    const navigate = useNavigate();
    const [dots, setDots] = useState('');
    const [opponentClan, setOpponentClan] = useState(null);

    useEffect(() => {
        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Poll for opponent clan
        let pollInterval;
        async function pollForOpponent() {
            const { data: user } = await getUserData();
            const myClanId = user.clan_id;
            const { data: opponents } = await supabase
                .from('users')
                .select('clan_id')
                .eq('is_searching_for_battle', true)
                .neq('clan_id', myClanId);
            if (opponents && opponents.length > 0) {
                setOpponentClan(opponents[0].clan_id);
            }
        }
        pollInterval = setInterval(pollForOpponent, 2000);

        return () => {
            clearInterval(dotsInterval);
            clearInterval(pollInterval);
        };
    }, [navigate]);

    useEffect(() => {
        if (opponentClan) {
            // Navigate to revealing warriors, pass opponentClan as state
            navigate('/your-clan/revealing-warriors', { state: { opponentClan } });
        }
    }, [opponentClan, navigate]);

    return (
        <div className="finding-opponent-page">
            <div className="finding-overlay">
                <div className="magnifying-glass">
                    <div className="glass-lens"></div>
                    <div className="glass-handle"></div>
                    <div className="search-glow"></div>
                </div>

                <h1 className="finding-title">Finding Your Opponent{dots}</h1>
                <p className="finding-subtitle">Searching for worthy adversaries</p>

                <div className="scan-lines">
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                </div>
            </div>
        </div>
    );
}
