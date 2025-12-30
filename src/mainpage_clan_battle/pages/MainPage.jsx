import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import '../style/MainPage.css'
import XpBar from '../components/XpBar'
import xpImage from '../../assets/icons/xp.png'
import bgImage from '../../assets/images/10001.png'
import Button from '../../assets/components/Button.jsx'
import clanIcon from '../../assets/icons/clan.png'
import combat from '../../assets/icons/sss.png'
// import mail from '../../assets/icons/mail.png'
import history from '../../assets/icons/history.png'
import swords from '../../assets/icons/swords.png'
import IntroCard from '../components/IntroCard.jsx'
import gym from '../../assets/icons/dumbbell.png'
import HomePage from '../../homepage_login_signup/pages/HomePage.jsx'
import OverlayMenu from '../components/OverlayMenu.jsx'
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"



export default function MainPage() {
    let [open, setOpen] = useState(false);
    const navigate = useNavigate();
    let user_detail = {
        username: "rizvee_113",
        xp: 50,
        maxXp: 100,
        level: 10
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
                        value: ["function", "const", "let", "=>", "{}", "[]", "if", "else", "for", "while", "class", "return", "===", "!=", "&&", "||", "++", "--", "async", "await" , "labiba" , "rizvee" , "alif" , "sabit"],
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
                        />
                        <Button
                            text="Practice"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={gym}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => navigate('/practice')}
                        />
                        <Button
                            text="Clan Battle"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={swords}
                            showIcon={true}
                            justifyContent='space-around'
                        />
                        <Button
                            text="Attack"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={combat}
                            showIcon={true}
                            justifyContent='space-around'
                            onClick={() => setOpen(true)}
                        />
                        <Button
                            text="Battle History"
                            height="80px"
                            width="380px"
                            fontSize="36px"
                            icon={history}
                            showIcon={true}
                            justifyContent='space-around'
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
                        <div className="intro-card">
                            <IntroCard />
                        </div>
                    </div>
                </div>
                <OverlayMenu isOpen={open} onClose={() => { setOpen(false) }} />
            </div>
        </>
    )
}
