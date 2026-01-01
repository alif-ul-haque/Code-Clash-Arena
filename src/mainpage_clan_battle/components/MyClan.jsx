import '../style/MyClan.css';
import { useEffect } from 'react';

export default function MyClan({ isOpen, onClose }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="my-clan-overlay" onClick={onClose}>
            <div
                className="my-clan-menu"
                onClick={(e) => e.stopPropagation()}
            >
            </div>
        </div>
    );
}
