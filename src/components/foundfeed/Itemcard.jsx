import React from 'react';
import './itemcard.css';
import { formatDistanceToNow } from 'date-fns';
import { FaMapMarkedAlt } from 'react-icons/fa'; // Importing map icon from react-icons
import { PersonCircle } from 'react-bootstrap-icons';
import { Card } from 'react-bootstrap';
import { useAuthState } from '../../utilities/firebase';

const ItemCard = ({ item, user, onViewMap, onClaim = {}, showClaimButton = true }) => {
  const [currUser] = useAuthState(); 

  const handleViewMap = () => {
    onViewMap(item);
  };

  const handleClaim = () => {
    onClaim(item); // Call the onClaim function passed from the parent component
  };

  // Calculate "found X hours ago"
  const foundTimeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  // console.log('currUser:', user);
  const isOwner = currUser?.uid === item.postedBy;

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
      </Card.Body>

      <Card.Footer className="item-actions">
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
