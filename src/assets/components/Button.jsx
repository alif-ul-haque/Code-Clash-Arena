import './Button.css'
import play from '../icons/play-button-arrowhead.png'

export default function Button({
    text = "Tamim",
    backgroundColor = "#F1CA76",
    fontSize = "41px",
    height = "103px",
    width = "409px",
    icon = play,
    showIcon = false
}) {
    const buttonStyle = {
        backgroundColor: backgroundColor,
        fontSize: fontSize,
        height: height,
        width: width
    }

    return (
        <button className="glow-btn" style={buttonStyle}>
            <span>{text}</span>
            {showIcon && <span><img id="logo" src={icon} /></span>}
        </button>
    )
}