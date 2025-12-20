import ccaLogo from '../../assets/icons/cca.png'
import '../style/HomePage.css'
import Button from '../../assets/components/Button.jsx'
import Play from '../../assets/icons/play-button-arrowhead.png'
import { useCallback } from "react"
import Particles from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

export default function HomePage() {
    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
    }, []);

    const particlesConfig = {
        fullScreen: false,
        fpsLimit: 60,
        particles: {
            number: {
                value: 200,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: ["#00e5ff", "#00d4ff", "#00c4ff"]
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: 1,
                random: true,
                anim: {
                    enable: true,
                    speed: 1.5,
                    opacity_min: 0.4,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: true,
                    speed: 3,
                    size_min: 1,
                    sync: false
                }
            },
            links: {
                enable: false
            },
            move: {
                enable: true,
                speed: 1,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: {
                    enable: false
                },
                resize: true
            }
        },
        retina_detect: true
    };

    return (
        <div id="homePage">
            {/* Scan lines effect */}
            <div className="scanline"></div>
            <div className="scanline-overlay"></div>

            {/* Particles */}
            <Particles
                id="particles"
                init={particlesInit}
                options={particlesConfig}
            />
            <div id="titleBar">
                <div id="imageName">
                    <img src={ccaLogo} alt="logo" id="mainlogo" />
                    <p>CODE CLASH ARENA</p>
                </div>
                <div id="extraInfo">
                    <p>About us</p>
                    <p>Learn More</p>
                </div>
            </div>
            <hr />
            <div id="hello">
                <div className="title-container">
                    <p className="title-line-1">
                        <span className="word-1">HELLO</span>{' '}
                        <span className="word-2">CODERS,</span>
                    </p>
                    <p className="title-line-2">
                        <span className="word-3">WELCOME!</span>
                    </p>
                </div>
                <Button 
                    height='103px' 
                    width='409px' 
                    text='GET STARTED' 
                    backgroundColor='#F1CA76' 
                    icon={Play} 
                    showIcon={true} 
                />
            </div>
        </div>
    )
}