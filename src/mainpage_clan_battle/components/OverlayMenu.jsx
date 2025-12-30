import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OverlayMenu.css';
import Button from '../../assets/components/Button';
import closeIcon from '../../assets/icons/x-mark.png';
import pvpImage from '../../assets/images/sword.png';
import practiceImage from '../../assets/images/brain-training.png';

export default function OverlayMenu({ isOpen, onClose }) {
    const [isClosing, setIsClosing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsClosing(() => false);
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!isOpen) return null;
    return (
        <div className="overlay" onClick={handleClose}>
            <div
                className={`menu ${isClosing ? 'slideOut' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="menu-header">
                    <p>Code Clash <br></br>Zone</p>
                    <div className="close-button">
                        <Button
                            text=''
                            height='3rem'
                            width='3rem'
                            fontSize='24px'
                            onClick={handleClose}
                            backgroundColor='#DF4F16'
                            borderRadius='10px'
                            icon={closeIcon}
                            showIcon={true}
                            id="cross-button"
                        />
                    </div>
                </div>
                <div className="menu_pictures">
                    <div className="pvp">
                        <img src={pvpImage} alt="PvP" className="menu-image" />
                        <h1>1v1 Battle</h1>
                        <Button
                            backgroundColor='#E64E4E'
                            text='Enter'
                            height='60px'
                            width='200px'
                            color='black'
                            fontSize='24px'
                            onClick={() => navigate('/1v1')}
                        />
                    </div>
                    <div className="pvp">
                        <img src={practiceImage} alt="PvP" className="menu-image" />
                        <h1>Practice Gym</h1>
                        <Button
                            backgroundColor='#E64E4E'
                            text='Enter'
                            height='60px'
                            width='200px'
                            color='black'
                            fontSize='24px'
                            onClick={() => navigate('/practice')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
