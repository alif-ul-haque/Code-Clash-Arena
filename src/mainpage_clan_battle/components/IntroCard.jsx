import '../style/IntroCard.css';
import boyImage from '../../assets/images/Lovepik_com-450060883-cartoon character image of a gaming boy.png';
import clanLogo from '../../assets/icons/cca.png';

export default function IntroCard() {
    return (
        <div className="intro-card">
            <div className="first-side-card">
                <img src={clanLogo}
                    style={{ width: '100%', height: 'auto', maxWidth: '150px', marginTop: '20px' }}
                />
            </div>
            <div className="maincard">
                <p className="welcome-title">Welcome!</p>
                <p className="welcome-description">
                    Coding while Gaming<br></br>
                    OR<br></br>
                    Gaming while Coding</p>
                <img src={boyImage}
                    style={{ width: '100%', height: 'auto', maxWidth: '300px', marginBottom: '0px' }}
                />
            </div>
            <div className="second-side-card">
                <img src={clanLogo}
                    style={{ width: '100%', height: 'auto', maxWidth: '150px', marginTop: '20px' }}
                />
            </div>
        </div>
    )
}