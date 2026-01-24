import '../style/NoClanMenu.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import FindClan from '../components/FindClan.jsx';
import CreateClan from './CreateClan.jsx';

export default function NoClanMenu({ isOpen, onClose }) {
    let [open, setOpen] = useState({
        findClan: false,
        createClan: false
    });

    const handleOpenFindClan = () => {
        setOpen((prev) => ({
            ...prev,
            findClan: true
        }));
    };

    const handleOpenCreateClan = () => {
        setOpen((prev) => ({
            ...prev,
            createClan: true
        }));
    };

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
                        onClick={handleOpenFindClan}
                    />
                    <Button
                        text="create clan"
                        backgroundColor='#00B0FF'
                        height="52px"
                        width="200px"
                        fontSize="32px"
                        borderRadius="15px"
                        onClick={handleOpenCreateClan}
                    />
                </div>
            </div>
            <FindClan isOpen={open.findClan} onClose={() => setOpen({ findClan: false, createClan: false })} />
            <CreateClan isOpen={open.createClan} onClose={() => setOpen({ findClan: false, createClan: false })} />
        </div>
    );
}