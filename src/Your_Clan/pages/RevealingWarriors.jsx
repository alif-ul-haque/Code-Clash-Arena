import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/RevealingWarriors.css';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';
import getUserData, { getClanMembers, getClanData } from '../../mainpage_clan_battle/utilities/UserData';

export default function RevealingWarriors() {
    const navigate = useNavigate();
    const location = useLocation();
    const [revealed, setRevealed] = useState(false);
    const [myClan, setMyClan] = useState({ name: '', members: [] });
    const [opponentClan, setOpponentClan] = useState({ name: '', members: [] });

    useEffect(() => {
        async function fetchClans() {
            const { data: user } = await getUserData();
            const myClanId = user.clan_id;
            const opponentClanId = location.state?.opponentClan;
            if (!myClanId || !opponentClanId) return;

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
        }
        fetchClans();
    }, [location.state]);

    useEffect(() => {
        // Reveal animation after 1 second
        const revealTimer = setTimeout(() => {
            setRevealed(true);
        }, 1000);

        // Navigate to battle arena after 4 seconds
        const navigationTimer = setTimeout(() => {
            navigate('/your-clan/battle-arena');
        }, 4500);

        return () => {
            clearTimeout(revealTimer);
            clearTimeout(navigationTimer);
        };
    }, [navigate]);

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
