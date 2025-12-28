import { useNavigate } from 'react-router-dom'
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

export default function MainPage() {
    const navigate = useNavigate();
    let user_detail = {
        username: "rizvee_113",
        xp: 50,
        maxXp: 100,
        level: 10
    }

    return (
        <>
            <div id="maindiv"
                style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
            >
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
                            onClick={() => navigate('/1v1')}
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
            </div>
        </>
    )
}
