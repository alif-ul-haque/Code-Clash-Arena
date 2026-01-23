import '../style/LeaveClan.css';
import { useEffect, useState } from 'react';
import Button from '../../assets/components/Button';
import { supabase } from '../../supabaseclient.js';
import getUserData from '../utilities/UserData.js';
import AlertPage from '../../assets/components/AlertPage.jsx';

export default function LeaveClan({ isOpen, onClose, onLeave }) {
    const [message, setMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('success');

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

    const handleLeaveClan = async () => {
        const { data, error } = await getUserData();
        if (error) {
            console.error("Error getting user data:", error);
            return;
        }
        const userId = data.id;
        const clanId = data.clan_id;
        const { error: leaveError } = await supabase
            .from('clan_members')
            .delete()
            .eq('user_id', userId)
            .eq('clan_id', clanId);
        if (leaveError) {
            console.error('Error leaving the clan', leaveError);
            return;
        }

        const { error: profileError } = await supabase
            .from('users')
            .update({ clan_id: null })
            .eq('id', userId);
        if (profileError) {
            console.error("Error updating user's profile:", profileError);
            return;
        }

        setAlertType('success');
        setMessage('You have successfully left the clan.');
        setShowAlert(true);

        // Close the modal and notify parent after a short delay
        setTimeout(() => {
            setShowAlert(false);
            if (onLeave) {
                onLeave();
            }
            onClose();
        }, 1500);
    }
    return (
        <>
            {showAlert && (
                <AlertPage
                    isVisible={showAlert}
                    onClose={() => setShowAlert(false)}
                    type={alertType}
                    message={message}
                />
            )}
            <div className="leave-clan-overlay" onClick={onClose}>
                <div
                    className="leave-clan-menu"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="leave-clan-content">
                        <p>Are you sure you want to leave the clan?</p>
                        <div className="leave-clan-actions">
                            <Button
                                text='Cancel'
                                height='3rem'
                                width='7rem'
                                fontSize='1.5rem'
                                backgroundColor='#7D7D7D'
                                borderRadius='10px'
                                onClick={onClose}
                            />
                            <Button
                                text='Leave'
                                height='3rem'
                                width='7rem'
                                fontSize='1.5rem'
                                backgroundColor='#DF4F16'
                                borderRadius='10px'
                                onClick={() => {
                                    handleLeaveClan();
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}