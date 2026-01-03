import '../style/FindClan.css';
import { useEffect , useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import searchIcon from '../../assets/icons/magnifier.png';

export default function FindClan({ isOpen, onClose }) {

    let [clanName, setClanName] = useState('');
    
    const handleInputChange = (event) => {
        setClanName(event.target.value);
    }

    const handleInputSubmit = (event) => {
        event.preventDefault();
        console.log("Searching for clan:", clanName);
        setClanName('');
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
        <div className="find-clan-overlay" onClick={onClose}>
            <div
                className="find-clan-menu"
                onClick={(e) => e.stopPropagation()} // prevent close on menu click
            >
                <div className="search-button">
                    <div className="search-bar">
                        <p>Search Clan:</p>
                        <input
                            type="text"
                            placeholder="Enter Clan Name or Code"
                            value={clanName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="icon-button">
                        <Button
                            text="Search"
                            icon={searchIcon}
                            showIcon={true}
                            backgroundColor='#08A24E'
                            height="3rem"
                            width="10rem"
                            fontSize='1.8rem'
                            borderRadius='15px'
                            onClick={handleInputSubmit}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}