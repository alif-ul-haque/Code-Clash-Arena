import { useState, useEffect } from 'react';
import '../style/IntroCard.css';
import ccaIcon from '../../assets/icons/cca.png';

export default function CardCarousel({ cards, currentIndex, onCardChange }) {
    const [displayIndex, setDisplayIndex] = useState(currentIndex);
    const [isFlipping, setIsFlipping] = useState(false);
    const [direction, setDirection] = useState('forward');
    const [isInitial, setIsInitial] = useState(true);

    useEffect(() => {
        // Skip animation on initial render
        if (isInitial) {
            setDisplayIndex(currentIndex);
            setIsInitial(false);
            return;
        }

        // Determine direction based on card order
        setDirection(currentIndex > displayIndex ? 'forward' : 'backward');
        setIsFlipping(true);

        // Update content and reset flip at same time - 350ms
        const timeout = setTimeout(() => {
            setDisplayIndex(currentIndex);
            setIsFlipping(false);
        }, 350);

        return () => clearTimeout(timeout);
    }, [currentIndex]);

    return (
        <div className={`intro-card ${isFlipping ? `flipping ${direction}` : ''}`}>
            {/* Left Side Card */}
            <div className="first-side-card">
                <img src={ccaIcon} alt="card indicator" style={{ width: '100%', height: 'auto', maxWidth: '150px', marginTop: '20px' }} />
            </div>

            {/* Main Center Card */}
            <div className="maincard">
                <p className="welcome-description">{cards[displayIndex].description}</p>
                {cards[displayIndex].image && (
                    <img src={cards[displayIndex].image} alt={cards[displayIndex].title} style={{ width: '100%', height: 'auto', maxWidth: '300px', marginBottom: '0px' }} />
                )}
            </div>

            {/* Right Side Card */}
            <div className="second-side-card">
                <img src={ccaIcon} alt="card indicator" style={{ width: '100%', height: 'auto', maxWidth: '150px', marginTop: '20px' }} />
            </div>
        </div>
    );
}
