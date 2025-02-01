import React, { useState, useEffect, use } from 'react';
import { useParams } from 'react-router-dom';
import { database, useDbData } from '../utilities/firebase'; // Use your DB hook to fetch item data
import './DisputePage.css';
import { ref, get, push, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

const DisputePage = ({ user }) => {
    const { itemId } = useParams(); // Get the item ID from the URL
    const [item, setItem] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeStep, setDisputeStep] = useState(1);
    const navigate = useNavigate();

    const onClose = () => {
        navigate(`/`); // Navigate to the dispute page with the item ID
    };

    useEffect(() => {
        console.log(itemId);
        const itemRef = ref(database, `foundItems/${itemId}`);
        get(itemRef).then((snapshot) => {
            const itemData = snapshot.val();
            console.log(snapshot.val());
            setItem(itemData);
        });

    }, [itemId]);

    const submitDispute = async () => {
        if (!disputeReason.trim()) {
            alert('Please enter a reason for the dispute.');
            return;
        }

        const disputeRef = ref(database, `disputes/${itemId}`);

        const newDispute = {
            itemId: itemId,
            itemTitle: item.title,
            disputedBy: user.uid,
            reason: disputeReason,
            timestamp: Date.now(),
            status: 'Pending',
        };

        try {
            const snapshot = await get(disputeRef);
            let disputeData = snapshot.val();

            if (disputeData) {
                // If the dispute already exists, update it
                await update(disputeRef, {
                    reason: disputeReason,
                    timestamp: Date.now(),
                    status: 'Pending', // You can adjust the status if needed
                });
            } else {
                // If no dispute exists, set the new dispute data
                await push(disputeRef, newDispute);
            }

            setDisputeStep(2); // Proceed to the "Dispute Submitted" step
        } catch (error) {
            console.error('Error submitting dispute:', error);
            alert('Failed to submit dispute. Please try again.');
        }
    };

    if (!item) {
        return <div className="loading-spinner"></div>;
    }

    return (
        <div className="dispute-page">
            {disputeStep === 1 ? (
                <>
                    <h2>Submit a Dispute for {item.title}</h2>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Explain why you are disputing this claim..."
                    />
                    <div className="button-container">
                        <button className="dispute-buttons" onClick={submitDispute}>Submit</button>
                        <button className="dispute-buttons" onClick={onClose}>Cancel</button></div>
                </>
            ) : (
                <>
                    <h2>Dispute Submitted</h2>
                    <p>An admin will review your dispute and follow up shortly.</p>
                    <button className="dispute-buttons" onClick={onClose}>Close</button>
                </>
            )}
        </div>
    );
};

export default DisputePage;
