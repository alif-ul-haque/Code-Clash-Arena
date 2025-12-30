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
    borderRadius = "15px",
    justifyContent = "center",
    onClick
}) {
    const buttonStyle = {
        backgroundColor: backgroundColor,
        fontSize: fontSize,
        height: height,
        borderRadius: borderRadius,
        width: width,
        color: color,
        justifyContent: showIcon && text !== '' ? "space-between" : "center",
        margin: "0px",
        '--main-border-radius': borderRadius
    }

    const textStyle = {
        flex: 1,
        textAlign: showIcon ? "left" : "center"
    }

    const iconStyle = {
        marginLeft: text !== '' ? "10px" : "0"
    }

    return (
        <button className="glow-btn" style={buttonStyle} onClick={onClick}>
            {text && <span style={textStyle}>{text}</span>}
            {showIcon && <span style={iconStyle}><img id="logo" src={icon} /></span>}
        </button>
    )
}