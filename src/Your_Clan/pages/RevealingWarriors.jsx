import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/RevealingWarriors.css';
import { supabase } from '../../supabaseclient';
import { hasOngoingClanBattle } from '../utilities/ClanBattleUtils';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';
import getUserData, { getClanMembers, getClanData } from '../../mainpage_clan_battle/utilities/UserData';

export default function RevealingWarriors() {
    const navigate = useNavigate();
    const location = useLocation();
    const [revealed, setRevealed] = useState(false);
    const [myClan, setMyClan] = useState({ name: '', members: [] });
    const [opponentClan, setOpponentClan] = useState({ name: '', members: [] });

    useEffect(() => {
        let watchChannel = null;
        async function fetchClans(battleId, providedOpponentId) {
            try {
                const { data: user } = await getUserData();
                const myClanId = user.clan_id;
                let opponentClanId = providedOpponentId || location.state?.opponentClanId;

                // If we don't have an opponentClanId yet, try to resolve from the battle record
                if (!opponentClanId && battleId) {
                    const { data: battle } = await supabase
                        .from('clan_battles')
                        .select('clan1_id, clan2_id')
                        .eq('battle_id', battleId)
                        .single();
                    if (battle) {
                        opponentClanId = (battle.clan1_id === myClanId) ? battle.clan2_id : battle.clan1_id;
                    }
                }

                // If still missing clan ids, try to find an ongoing battle for the user's clan
                if (!opponentClanId) {
                    const ongoing = await hasOngoingClanBattle();
                    if (ongoing && ongoing.battleId) {
                        const { data: battle } = await supabase
                            .from('clan_battles')
                            .select('battle_id, clan1_id, clan2_id')
                            .eq('battle_id', ongoing.battleId)
                            .single();
                        if (battle) opponentClanId = (battle.clan1_id === myClanId) ? battle.clan2_id : battle.clan1_id;
                    }
                }

                if (!myClanId || !opponentClanId) {
                    console.warn('Missing clan IDs in RevealingWarriors — entering wait state and subscribing for battle creation.');
                    // Subscribe to clan_battles and wait for the battle involving this clan
                    try {
                        watchChannel = supabase
                            .channel('revealing_warriors_watch')
                            .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_battles' }, async (payload) => {
                                try {
                                    const newBattle = payload?.new;
                                    if (!newBattle) return;
                                    const { data: user } = await getUserData();
                                    const myId = user?.clan_id;
                                    if (!myId) return;
                                    if (newBattle.clan1_id === myId || newBattle.clan2_id === myId) {
                                        const oppId = newBattle.clan1_id === myId ? newBattle.clan2_id : newBattle.clan1_id;
                                        // Re-run fetch with discovered battle
                                        fetchClans(newBattle.battle_id, oppId);
                                    }
                                } catch (e) {
                                    console.error('Error in clan_battles subscription for RevealingWarriors', e);
                                }
                            })
                            .subscribe();
                    } catch (e) {
                        console.warn('Failed to subscribe to clan_battles from RevealingWarriors', e);
                    }
                    return;
                }

                // Fetch my clan data and members
                const { data: myClanData } = await getClanData(myClanId);
                const { members: myMembers } = await getClanMembers(myClanId);
                setMyClan({
                    name: myClanData?.clan_name || 'Your Clan',
                    members: myMembers.map((m, idx) => ({
                        id: m.id || m.user_id || idx,
                        name: m.name || m.username || m.cf_handle || m.email || m.id || 'Unknown',
                        avatar: characterImage,
                        rating: m.rating || 1500
                    }))
                });

                // Fetch opponent clan data and members
                const { data: oppClanData } = await getClanData(opponentClanId);
                const { members: oppMembers } = await getClanMembers(opponentClanId);
                setOpponentClan({
                    name: oppClanData?.clan_name || 'Opponent Clan',
                    members: oppMembers.map((m, idx) => ({
                        id: m.id || m.user_id || idx,
                        name: m.name || m.username || m.cf_handle || m.email || m.id || 'Unknown',
                        avatar: characterImage,
                        rating: m.rating || 1500
                    }))
                });
            } catch (err) {
                console.error('Error fetching clan data in RevealingWarriors', err);
            }
        }

        // If a battleId was passed via location.state, prefer that; otherwise attempt to resolve
        const initialBattleId = location.state?.battleId;
        fetchClans(initialBattleId, location.state?.opponentClanId);

        return () => {
            try { if (watchChannel) supabase.removeChannel(watchChannel); } catch (e) {}
        };
    }, [location.state, navigate]);

    useEffect(() => {
        // Reveal animation after 1 second
        const revealTimer = setTimeout(() => {
            setRevealed(true);
        }, 1000);

        // Navigate to battle arena after 4 seconds with battle data
        const navigationTimer = setTimeout(() => {
            const battleId = location.state?.battleId;
            navigate('/your-clan/battle-arena', {
                state: {
                    battleId,
                    fromRevealing: true
                }
            });
        }, 4500);

        return () => {
            clearTimeout(revealTimer);
            clearTimeout(navigationTimer);
        };
    }, [navigate, location.state?.battleId]);

    return (
        <div className="revealing-warriors-page">
            <div className="revealing-content">
                <h1 className="revealing-title">Revealing Warriors</h1>
                <div className={`warriors-container ${revealed ? 'revealed' : ''}`}>
                    <div className="clan-box my-box">
                        <h2 className="clan-name">{myClan.name}</h2>
                        <div className="warriors-grid">
                            {myClan.members.map((member, index) => (
                                <div
                                    key={member.id}
                                    className="warrior-card"
                                    style={{ animationDelay: `${index * 0.2}s` }}
                                >
                                    <div className="warrior-silhouette"></div>
                                    <div className="warrior-reveal">
                                        <img src={member.avatar} alt={member.name} className="warrior-avatar" />
                                        <h3 className="warrior-name">{member.name}</h3>
                                        <p className="warrior-rating">{member.rating}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="clan-box opponent-box">
                        <h2 className="clan-name">{opponentClan.name}</h2>
                        <div className="warriors-grid">
                            {opponentClan.members.map((member, index) => (
                                <div
                                    key={member.id}
                                    className="warrior-card"
                                    style={{ animationDelay: `${index * 0.2}s` }}
                                >
                                    <div className="warrior-silhouette"></div>
                                    <div className="warrior-reveal">
                                        <img src={member.avatar} alt={member.name} className="warrior-avatar" />
                                        <h3 className="warrior-name">{member.name}</h3>
                                        <p className="warrior-rating">{member.rating}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="vs-indicator">VS</div>
            </div>
        </div>
    );
}
