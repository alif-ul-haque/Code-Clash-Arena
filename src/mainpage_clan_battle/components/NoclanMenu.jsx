import '../style/NoclanMenu.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import FindClan from '../components/FindClan.jsx';

export default function NoClanMenu({ isOpen, onClose }) {
    let [open, setOpen] = useState(false);
    const handleChange = () => {
        setOpen(true);
        onclose();
    }

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
        <div className="no-clan-overlay" onClick={onClose}>
            <div
                className="no-clan-menu"
                onClick={(e) => e.stopPropagation()} // prevent close on menu click
            >
                <div>
                    <p>Oops!You are not in a clan</p>
                </div>
                <div className="button-div">
                    <Button
                        text="Find a clan"
                        backgroundColor='#00B0FF'
                        height="52px"
                        width="200px"
                        fontSize="32px"
                        borderRadius="15px"
                        onClick={handleChange}
                    />
                    <Button
                        text="create clan"
                        backgroundColor='#00B0FF'
                        height="52px"
                        width="200px"
                        fontSize="32px"
                        borderRadius="15px"
                    />
                </div>
            </div>
            <FindClan isOpen={open} onClose={() => setOpen(false)} />
        </div>
    );
}