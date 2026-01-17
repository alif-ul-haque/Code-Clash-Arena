import '../style/CreateClan.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button.jsx';
import createIcon from '../../assets/icons/play-button-arrowhead.png';
import { createClan } from '../utilities/CreateClan.js';

export default function CreateClan({ isOpen, onClose }) {

    const [clanData, setClanData] = useState({
        clanName: '',
        type: 'anyone',
        location: '',
        warFrequency: '',
        minTrophy: '',
        maxTrophy: ''
    });

    const handleInputChange = (field) => (event) => {
        setClanData({
            ...clanData,
            [field]: event.target.value
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Creating clan with data:", clanData);

        // Validate required fields
        if (!clanData.clanName || !clanData.location || !clanData.warFrequency) {
            alert("Please fill in all required fields");
            return;
        }

        // Validate trophy ranges
        if (clanData.minTrophy && clanData.maxTrophy) {
            if (parseInt(clanData.minTrophy) > parseInt(clanData.maxTrophy)) {
                alert("Minimum trophy cannot be greater than maximum trophy");
                return;
            }
        }

        const addClan = async () => {
            const response = await createClan({
                clanName: clanData.clanName,
                type: clanData.type,
                location: clanData.location,
                warFrequency: clanData.warFrequency,
                minTrophy: clanData.minTrophy ? parseInt(clanData.minTrophy) : null,
                maxTrophy: clanData.maxTrophy ? parseInt(clanData.maxTrophy) : null
            });
            return response;
        }
        addClan().then(() => {
            alert("Clan created successfully!");
        }).catch((error) => {
            alert("Error creating clan: " + error.message);
        });
        // Reset form after successful submission
        setClanData({
            clanName: '',
            type: 'anyone',
            location: '',
            warFrequency: '',
            minTrophy: '',
            maxTrophy: ''
        });

        onClose();
    };

    const handleCancel = () => {
        setClanData({
            clanName: '',
            type: 'anyone',
            location: '',
            warFrequency: '',
            minTrophy: '',
            maxTrophy: ''
        });
        onClose();
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
        <div className="create-clan-overlay" onClick={onClose}>
            <div
                className="create-clan-menu"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="create-clan-title">Create Your Clan</h2>

                <form className="create-clan-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="clanName">Clan Name<span className="required">*</span></label>
                        <input
                            type="text"
                            id="clanName"
                            placeholder="Enter Clan Name"
                            value={clanData.clanName}
                            onChange={handleInputChange('clanName')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="type">Clan Type<span className="required">*</span></label>
                        <select
                            id="type"
                            value={clanData.type}
                            onChange={handleInputChange('type')}
                            required
                        >
                            <option value="anyone">Anyone Can Join</option>
                            <option value="invite">Invite Only</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Location<span className="required">*</span></label>
                        <input
                            type="text"
                            id="location"
                            placeholder="Enter Location"
                            value={clanData.location}
                            onChange={handleInputChange('location')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="warFrequency">War Frequency<span className="required">*</span></label>
                        <select
                            id="warFrequency"
                            value={clanData.warFrequency}
                            onChange={handleInputChange('warFrequency')}
                            required
                        >
                            <option value="">Select Frequency</option>
                            <option value="daily">Daily</option>
                            <option value="twice-weekly">Twice a Week</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label htmlFor="minTrophy">Minimum Trophy</label>
                            <input
                                type="number"
                                id="minTrophy"
                                placeholder="Min"
                                value={clanData.minTrophy}
                                onChange={handleInputChange('minTrophy')}
                                min="0"
                            />
                        </div>

                        <div className="form-group half-width">
                            <label htmlFor="maxTrophy">Maximum Trophy</label>
                            <input
                                type="number"
                                id="maxTrophy"
                                placeholder="Max"
                                value={clanData.maxTrophy}
                                onChange={handleInputChange('maxTrophy')}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="button-group">
                        <Button
                            text="Create Clan"
                            icon={createIcon}
                            showIcon={true}
                            backgroundColor='#08A24E'
                            height="3.5rem"
                            width="12rem"
                            fontSize='1.6rem'
                            borderRadius='15px'
                            onClick={handleSubmit}
                        />
                        <Button
                            text="Cancel"
                            showIcon={false}
                            backgroundColor='#d63031'
                            height="3.5rem"
                            width="10rem"
                            fontSize='1.6rem'
                            borderRadius='15px'
                            onClick={handleCancel}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
