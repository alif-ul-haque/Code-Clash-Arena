import '../style/MailCard.css';
import Button from '../../assets/components/Button.jsx';
import clanIcon from '../../assets/icons/clan1.png';
import friendIcon from '../../assets/icons/friends.png';

export default function MailCard({
    mail,
    onAccept,
    onDecline
}) {
    return (
        <div className={`mail-card ${mail.type}`}>
            <div className="mail-icon">
                <img src={mail.type === 'clan' ? clanIcon : friendIcon} alt="Mail Icon" className="mail-icon-img" />
            </div>
            <div className="mail-content">
                <h3 className="mail-from">{mail.from}</h3>
                <p className="mail-message">{mail.message}</p>
                <span className="mail-time">{mail.time}</span>
            </div>
            <div className="mail-actions">
                <Button
                    text="Accept"
                    height="2.5rem"
                    width="6.25rem"
                    fontSize="1.125rem"
                    backgroundColor='#08A24E'
                    borderRadius='0.625rem'
                    onClick={onAccept}
                />
                <Button
                    text="Decline"
                    height="2.5rem"
                    width="6.25rem"
                    fontSize="1.125rem"
                    backgroundColor='#DC7922'
                    borderRadius='0.625rem'
                    onClick={onDecline}
                />
            </div>
        </div>
    );
}
