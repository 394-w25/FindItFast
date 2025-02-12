import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../utilities/firebase';
import './DisputePage.css';
import { ref, get, push, update } from 'firebase/database';

const DisputePage = ({ user }) => {
  const { itemId } = useParams(); // Get the item ID from the URL
  const [item, setItem] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeStep, setDisputeStep] = useState(1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onClose = () => {
    navigate(`/`);
  };

  useEffect(() => {
    const itemRef = ref(database, `foundItems/${itemId}`);
    get(itemRef).then((snapshot) => {
      const itemData = snapshot.val();
      setItem(itemData);
    });
  }, [itemId]);

  const submitDispute = async () => {
    // Clear any previous error message.
    setError('');

    if (!disputeReason.trim()) {
      setError('Please enter a reason for the dispute.');
      return;
    }

    // STEP 1: Check if the current user already has two (or more) disputes.
    try {
      const disputesRef = ref(database, `disputes`);
      const disputesSnapshot = await get(disputesRef);
      let userDisputeCount = 0;
      console.log("this is the disputes", disputesSnapshot);
      if (disputesSnapshot.exists()) {
        const disputesData = disputesSnapshot.val();
        // Loop through each item’s disputes.
        Object.keys(disputesData).forEach((itemKey) => {
          const disputeList = disputesData[itemKey];
          Object.keys(disputeList).forEach((disputeKey) => {
            const dispute = disputeList[disputeKey];
            if (dispute.disputedBy === user.uid) {
              userDisputeCount++;
            }
          });
        });
      }

      // If the user is involved in 2 or more disputes, block the submission.
      if (userDisputeCount >= 2) {
        setError('You have reached the maximum number of disputes allowed.');
        return;
      }
    } catch (err) {
      console.error('Error checking user disputes:', err);
      setError('Error verifying your dispute count. Please try again.');
      return;
    }

    // STEP 2: Proceed with submitting (or updating) the dispute for the current item.
    const currentDisputeRef = ref(database, `disputes/${itemId}`);
    const newDispute = {
      itemId: itemId,
      itemTitle: item.title,
      disputedBy: user.uid,
      reason: disputeReason,
      timestamp: Date.now(),
      status: 'Pending',
    };

    try {
      const snapshot = await get(currentDisputeRef);
      const disputeData = snapshot.val();

      if (disputeData) {
        // If a dispute already exists for this item, update it.
        await update(currentDisputeRef, {
          reason: disputeReason,
          timestamp: Date.now(),
          status: 'Pending',
        });
      } else {
        // If no dispute exists, push the new dispute.
        await push(currentDisputeRef, newDispute);
      }

      setDisputeStep(2); // Move to the "Dispute Submitted" step.
    } catch (err) {
      console.error('Error submitting dispute:', err);
      setError('Failed to submit dispute. Please try again.');
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
          {/* Render the error message if one exists */}
          {error && <p className="error-message">{error}</p>}
          <div className="button-container">
            <button className="dispute-buttons" onClick={submitDispute}>
              Submit
            </button>
            <button className="dispute-buttons" onClick={onClose}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>Dispute Submitted</h2>
          <p>An admin will review your dispute and follow up shortly.</p>
          <button className="dispute-buttons" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </div>
  );
};

export default DisputePage;
