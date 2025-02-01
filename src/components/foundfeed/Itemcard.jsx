import React from 'react';
import './itemcard.css';
import { formatDistanceToNow } from 'date-fns';
import { FaMapMarkedAlt } from 'react-icons/fa'; // Importing map icon from react-icons
import { PersonCircle } from 'react-bootstrap-icons';
import { Card } from 'react-bootstrap';
import { useAuthState, useDbData } from '../../utilities/firebase';

const ItemCard = ({ item, user, onViewMap, onClaim = {}, onDispute = {}, showClaimButton = true, showUserWhoClaimed = true, showDisputeButton = false }) => {
  const [currUser] = useAuthState();
  const [allUsers, usersError] = useDbData(`users`);

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return <div>Error loading user details. Please try again later.</div>;
  }

  const handleViewMap = () => {
    onViewMap(item);
  };

  const handleClaim = () => {
    onClaim(item); // Call the onClaim function passed from the parent component
  };

  const handleDispute = () => {
    onDispute(); // Call the onClaim function passed from the parent component
  };

  // Calculate "found X hours ago"
  const foundTimeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  const claimedTimeAgo = item.isClaimed
    ? formatDistanceToNow(new Date(item.claimedAt), { addSuffix: true })
    : null;

  // console.log('currUser:', user);
  const isOwner = currUser?.uid === item.postedBy;

  const userWhoClaimed = (allUsers && item.isClaimed) ? allUsers[item.claimedBy] : null;

  return (

    <Card key={item.id} className="item-card">
      <Card.Header className="item-card-header">
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="poster-profile-picture" />
        ) : (
          <PersonCircle className="poster-profile-picture" />
        )}
        <div>
          <span className="poster-display-name">{user?.displayName || 'Anonymous'}</span>
          <p className="post-time text-muted">{foundTimeAgo}</p>
        </div>
      </Card.Header>
      <Card.Img variant="top" src={item.imageUrl} />
      <Card.Body>
        <Card.Title>{item.title}</Card.Title>
        <Card.Text>{item.description}</Card.Text>

        {showUserWhoClaimed && item.isClaimed && (
          <div className="claimed-info">
            <div className="claimed-by-text">
              Claimed By:
            </div>
            <div className="item-card-header">
              {userWhoClaimed?.photoURL ? (
                <img src={userWhoClaimed.photoURL} alt={userWhoClaimed.displayName} className="poster-profile-picture" />
              ) : (
                <PersonCircle className="poster-profile-picture" />
              )}
              <div>
                <span className="poster-display-name">{userWhoClaimed?.displayName || 'Anonymous'}</span>
                <p className="post-time text-muted">{claimedTimeAgo}</p>
              </div>
            </div>
          </div>
        )}
      </Card.Body>

      <Card.Footer className="item-actions">
        {showDisputeButton && !isOwner && (
          <button
            className="dispute-button"
            onClick={handleDispute}
          >
            Dispute
          </button>
        )}
        {showClaimButton && !isOwner && (
          <button className="claim-button" onClick={handleClaim}>
            Claim
          </button>
        )}
        <button className="view-map-button" onClick={handleViewMap}>
          <FaMapMarkedAlt className="map-icon" /> View in Map
        </button>
      </Card.Footer>
    </Card>
  );
};

export default ItemCard;