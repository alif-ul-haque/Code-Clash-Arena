import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import '../style/MainPage.css'
import XpBar from '../components/XpBar'
import xpImage from '../../assets/icons/xp.png'
import bgImage from '../../assets/images/10001.png'
import Button from '../../assets/components/Button.jsx'
import clanIcon from '../../assets/icons/clan.png'
import combat from '../../assets/icons/sss.png'
import history from '../../assets/icons/history.png'
import swords from '../../assets/icons/swords.png'
import gym from '../../assets/icons/dumbbell.png'
import HomePage from '../../homepage_login_signup/pages/HomePage.jsx'
import OverlayMenu from '../components/OverlayMenu.jsx'
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import NoClanMenu from '../components/NoClanMenu.jsx'
import MyClan from '../components/MyClan.jsx'
import CardCarousel from '../components/CardCarousel.jsx'
import IntroCard from '../components/IntroCard.jsx'
import characterImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png'



export default function MainPage() {
    let [open, setOpen] = useState({
        overlayMenu: false,
        noclan: false,
        myclan: false,
    });

    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [showCarousel, setShowCarousel] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const carouselCards = [
        {
            title: 'Your Clan',
            description: 'Your clan is your team. Work together, practice attacks, and fight clan battles to climb the rankings.',
            image: characterImage
        },
        {
            title: 'Practice Gym',
            description: 'Train on selected problems to improve your coding skills and prepare for battles.',
            image: characterImage
        },
        {
            title: 'Clan Battle',
            description: 'Engage in epic clan battles! Coordinate with your team, execute strategies, and dominate the battlefield.',
            image: characterImage
        },
        {
            title: 'Attack',
            description: 'Launch strategic attacks on enemy bases. Plan your approach, deploy your troops, and claim victory!',
            image: characterImage
        },
        {
            title: 'Battle History',
            description: 'Review your past battles, analyze strategies, and learn from victories and defeats to improve your skills.',
            image: characterImage
        }
    ];

    const handleMenuToggle = (menuName, value) => {
        setOpen(prev => ({ ...prev, [menuName]: value }));
    };

    const handleCardClick = (index) => {
        setShowCarousel(true);
        setCurrentCardIndex(index);
        
        // For Attack button (index 3), show overlay menu instead of navigating
        if (index === 3) {
            setTimeout(() => {
                handleMenuToggle('overlayMenu', true);
                setShowCarousel(false); // Hide carousel after animation
            }, 800);
            return;
        }
        
        // Navigate after animation completes (800ms)
        setTimeout(() => {
            setIsTransitioning(true);
            
            // Additional fade out time (800ms) before navigation
            setTimeout(() => {
                const routes = [
                    '/main',           // Your Clan (index 0)
                    '/practice',       // Practice Gym (index 1)
                    '/main',           // Clan Battle (index 2)
                    '/1v1',            // Attack (index 3)
                    '/main'            // Battle History (index 4)
                ];
                navigate(routes[index]);
            }, 800);
        }, 800);
    };

    const navigate = useNavigate();
    let user_detail = {
        username: "rizvee_113",
        xp: 50,
        maxXp: 100,
        level: 10,
        haveClan: false,
        clanDetails: {
            name: "The Code Warriors",
            totalPoints: 12500,
            members: '25/50',
            type: 'Open',
            requiredRating: '1200',
            warFrequency: 'Always',
            location: 'Global',
            warWon: 15,
            participants: [
                { id: 1, name: "Alice_99", role: "Leader", warParticipated: 10, problemsSolved: 95, rating: 1800 },
                { id: 2, name: "Bob_Smith", role: "Co-Leader", warParticipated: 12, problemsSolved: 88, rating: 1650 },
                { id: 3, name: "Charlie_Dev", role: "Member", warParticipated: 8, problemsSolved: 75, rating: 1500 },
                { id: 4, name: "Diana_Code", role: "Member", warParticipated: 15, problemsSolved: 102, rating: 1900 },
                { id: 5, name: "Eve_Hacker", role: "Elder", warParticipated: 6, problemsSolved: 67, rating: 1400 }
            ]
        }
    }

    const particlesInit = useCallback(async engine => {
        await loadSlim(engine);
    }, []);

    const particlesOptions = {
        background: {
            color: {
                value: "transparent",
            },
        },
        fpsLimit: 60,
        interactivity: {
            events: {
                onHover: {
                    enable: true,
                    mode: "bubble",
                },
            },
            modes: {
                bubble: {
                    distance: 150,
                    size: 20,
                    duration: 2,
                    opacity: 1,
                },
            },
        },
        particles: {
            color: {
                value: ["#61dafb", "#f9ca24", "#6c5ce7", "#00b894", "#fd79a8"],
            },
            links: {
                enable: false,
            },
            move: {
                direction: "bottom",
                enable: true,
                outModes: {
                    default: "out",
                },
                random: false,
                speed: 2,
                straight: true,
            },
            number: {
                density: {
                    enable: true,
                    area: 800,
                },
                value: 80,
            },
            opacity: {
                value: 0.7,
                random: true,
                anim: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.3,
                    sync: false,
                },
            },
            shape: {
                type: "char",
                options: {
                    char: {
                        value: ["function", "const", "let", "=>", "{}", "[]", "if", "else", "for", "while", "class", "return", "===", "!=", "&&", "||", "++", "--", "async", "await", "labiba", "rizvee", "alif", "sabit"],
                        font: "playMeGame",
                        style: "",
                        weight: "600",
                        fill: true,
                    },
                },
            },
            size: {
                value: 12,
                random: {
                    enable: true,
                    minimumValue: 8,
                },
            },
        },
        detectRetina: true,
    };

    return (
        <>
            <div id="maindiv"
                className={isTransitioning ? 'transitioning' : ''}
                className={isTransitioning ? 'transitioning' : ''}
                style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
            >
                <Particles
                    id="tsparticles"
                    init={particlesInit}
                    options={particlesOptions}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                    }}
                />
                <div className="menubar">
                    <div className="xpbar">
                        <div className="img-xp">
                            <p className="level">{user_detail.level}</p>
                            <img src={xpImage} alt="XP" className="xp-image" />
                            <XpBar xp={50} maxXp={100} username={user_detail.username} />
                        </div>
                    </div>
                    <div className="menubuttons">
                        <Button
                            text="Your Clan"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={clanIcon}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => handleCardClick(0)}
                        />
                        <Button
                            text="Practice"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={gym}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => handleCardClick(1)}
                        />
                        <Button
                            text="Clan Battle"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={swords}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => handleCardClick(2)}
                        />
                        <Button
                            text="Attack"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={combat}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => handleCardClick(3)}
                        />
                        <Button
                            text="Battle History"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={history}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => handleCardClick(4)}
                        />
                        <Button
                            text="Log Out"
                            height="80px"
                            width="230px"
                            fontSize="36px"
                            backgroundColor='#DC7922'
                            onClick={() => navigate('/HomePage')}
                        />

                    </div>
                </div>
                <div className="intropage">
                    <div className="welcome-message" >
                        <p className="welcome-text">Forge your legacy</p>
                        <p className="welcome-subtext">Experience competitive programming like never before. Every feature designed for the ultimate coding warfare experience.</p>
                        {!showCarousel ? (
                            <IntroCard />
                        ) : (
                            <CardCarousel 
                                cards={carouselCards}
                                currentIndex={currentCardIndex}
                                onCardChange={handleCardClick}
                            />
                        )}
                    </div>
                </div>
                <OverlayMenu isOpen={open.overlayMenu} onClose={() => handleMenuToggle('overlayMenu', false)} />
                <NoClanMenu isOpen={open.noclan} onClose={() => handleMenuToggle('noclan', false)} />
                <MyClan isOpen={open.myclan} onClose={() => handleMenuToggle('myclan', false)} clanDetails={user_detail.clanDetails} />
            </div>
        </>
    )
}
