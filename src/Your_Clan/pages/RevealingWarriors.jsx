import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/RevealingWarriors.css';
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';

export default function RevealingWarriors() {
    const navigate = useNavigate();
    const [revealed, setRevealed] = useState(false);

    const opponentClan = {
        name: "Shadow Ninjas",
        members: [
            { id: 1, name: "ninja_007", avatar: characterImage, rating: 1820 },
            { id: 2, name: "code_master", avatar: characterImage, rating: 1750 },
            { id: 3, name: "bug_crusher", avatar: characterImage, rating: 1680 },
            { id: 4, name: "algo_wizard", avatar: characterImage, rating: 1600 },
        ]
    };

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
