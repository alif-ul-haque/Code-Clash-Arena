import { useEffect } from 'react';
import './AlertPage.css';

export default function AlertPage({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target.className === 'alert-overlay') {
            onClose();
        }
    };

    return (
        <div className="alert-overlay" onClick={handleBackdropClick}>
            <div className={`alert-popup ${type}`}>
                <div className="alert-icon">
                    {type === 'success' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>
                <div className="alert-content">
                    <h3 className="alert-title">
                        {type === 'success' ? 'Success!' : 'Error!'}
                    </h3>
                    <p className="alert-message">{message}</p>
                </div>
                <button className="alert-close-btn" onClick={onClose}>
                    ✕
                </button>
            </div>
        </div>
    );
}
