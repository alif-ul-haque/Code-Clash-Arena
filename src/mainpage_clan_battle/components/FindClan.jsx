import '../style/FindClan.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import searchIcon from '../../assets/icons/magnifier.png';
import ClanDetails from './ClanDetails.jsx';
import FindClans from '../utilities/FindClans.js';
import { searchClan } from '../utilities/SearchFeature.js';

export default function FindClan({ isOpen, onClose }) {

    let [clanName, setClanName] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const handleInputChange = (event) => {
        setClanName(event.target.value);
        if (event.target.value === '') {
            setSearchResults(null);
            setSearchError(null);
        }
    }

    const handleInputSubmit = async (event) => {
        event.preventDefault();
        if (!clanName.trim()) {
            setSearchResults(null);
            setSearchError(null);
            return;
        }

        console.log("Searching for clan:", clanName);
        setIsSearching(true);
        setSearchError(null);

        const { data, error } = await searchClan(clanName.trim());

        if (error) {
            setSearchError(error);
            setSearchResults(null);
        } else {
            const formattedClans = data.map(clan => ({
                clanId: clan.id,
                name: clan.clan_name,
                type: clan.type,
                minRating: clan.min_rating,
                maxRating: clan.max_rating,
                location: clan.location,
                totalMembers: clan.total_members,
                maxMembers: clan.max_members,
                level: clan.level
            }));
            setSearchResults(formattedClans);
        }

        setIsSearching(false);
    }

    const handleClose = () => {
        setClanName('');
        setSearchResults(null);
        setSearchError(null);
        onClose();
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

    const [fetchedClans, setFetchedClans] = useState([]);

    useEffect(() => {
        async function fetchClans() {
            const { clans, error } = await FindClans();
            if (error) {
                console.error("Error fetching clans:", error);
            }
            else {
                setFetchedClans(clans);
            }
        }
        fetchClans();
    }, []);

    if (!isOpen) return null;

    return (
        <div className="find-clan-overlay" onClick={handleClose}>
            <div
                className="find-clan-menu"
                onClick={(e) => e.stopPropagation()} // prevent close on menu click
            >
                <button className="find-clan-close-btn" onClick={handleClose}>
                    ✕
                </button>
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
                <div className="fewclan">
                    <p className="few_clan_text">
                        {searchResults !== null ? `Search Results (${searchResults.length})` : 'Few Clans:'}
                    </p>
                    {isSearching && (
                        <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>
                            Searching...
                        </p>
                    )}
                    {searchError && (
                        <p style={{ textAlign: 'center', color: '#ff4444', marginTop: '2rem' }}>
                            {searchError}
                        </p>
                    )}
                    {!isSearching && !searchError && (searchResults !== null ? searchResults : fetchedClans).length === 0 && (
                        <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>
                            {searchResults !== null ? 'No clans found matching your search.' : 'No clans available.'}
                        </p>
                    )}
                    {!isSearching && !searchError && (searchResults !== null ? searchResults : fetchedClans).map((clan, index) => {
                        return (
                            <ClanDetails
                                key={index}
                                clanName={clan.name}
                                clanType={clan.type}
                                minRating={clan.minRating}
                                maxRating={clan.maxRating}
                                location={clan.location}
                                totalMembers={clan.totalMembers}
                                maxMembers={clan.maxMembers}
                                level={clan.level}
                                clanId={clan.clanId}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    );
}