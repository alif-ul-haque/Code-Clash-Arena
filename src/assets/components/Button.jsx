import './Button.css'
import play from '../icons/play-button-arrowhead.png'

export default function Button({
    text = "Tamim",
    backgroundColor = "#F1CA76",
    fontSize = "41px",
    height = "103px",
    width = "409px",
    icon = play,
    color = "black",
    showIcon = false,
    justifyContent = "center",
    onClick
}) {
    const buttonStyle = {
        backgroundColor: backgroundColor,
        fontSize: fontSize,
        height: height,
        width: width,
        color: color,
        justifyContent: showIcon ? "space-between" : "center",
        margin: "0px"
    }

    const textStyle = {
        flex: 1,
        textAlign: showIcon ? "left" : "center"
    }

    const iconStyle = {
        marginLeft: "10px"
    }

    return (
        <button className="glow-btn" style={buttonStyle} onClick={onClick}>
            <span style={textStyle}>{text}</span>
            {showIcon && <span style={iconStyle}><img id="logo" src={icon} /></span>}
        </button>
    )
}