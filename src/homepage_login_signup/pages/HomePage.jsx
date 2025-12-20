import ccaLogo from '../../assets/icons/cca.png'
import '../style/HomePage.css'
import Button from '../../assets/components/Button.jsx'
import Play from '../../assets/icons/play-button-arrowhead.png'

export default function HomePage() {
    return (
        <div id="homePage">
            <div id="titleBar">
                <div id="imageName">
                    <img src={ccaLogo} alt="logo" id="mainlogo" />
                    <p>Code Clash Arena</p>
                </div>
                <div id="extraInfo">
                    <p>About Us</p>
                    <p>Learn More</p>
                </div>
            </div>
            <hr />
            <div id="hello">
                <p>Hello Coders,<br></br>Welcome!</p>
                <Button height='103px' width='409px' text='Get Started' backgroundColor='#F1CA76' icon={Play} showIcon={true} />
            </div>
        </div>
    )
}