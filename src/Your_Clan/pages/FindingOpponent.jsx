import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/FindingOpponent.css';

export default function FindingOpponent() {
    const navigate = useNavigate();
    const [dots, setDots] = useState('');

    useEffect(() => {
        // Animated dots
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Navigate to revealing warriors after 4 seconds
        const timer = setTimeout(() => {
            navigate('/your-clan/revealing-warriors');
        }, 4000);

        return () => {
            clearInterval(dotsInterval);
            clearTimeout(timer);
        };
    }, [navigate]);

    return (
        <div className="finding-opponent-page">
            <div className="finding-overlay">
                <div className="magnifying-glass">
                    <div className="glass-lens"></div>
                    <div className="glass-handle"></div>
                    <div className="search-glow"></div>
                </div>

                <h1 className="finding-title">Finding Your Opponent{dots}</h1>
                <p className="finding-subtitle">Searching for worthy adversaries</p>

                <div className="scan-lines">
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                    <div className="scan-line"></div>
                </div>
            </div>
        </div>
    );
}
