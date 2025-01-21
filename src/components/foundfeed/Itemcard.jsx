import React from 'react';
import './itemcard.css';
import { formatDistanceToNow } from 'date-fns';
import { FaMapMarkedAlt } from 'react-icons/fa'; // Importing map icon from react-icons
import { PersonCircle } from 'react-bootstrap-icons';

const ItemCard = ({ item, user, onViewMap }) => {
  const handleViewMap = () => {
    onViewMap(item);
  };

  // Calculate "found X hours ago"
  const foundTimeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  return (
    <div className="item-card">
      <div className="item-header">
        {user?.photoURL ? (
          <div className='profile-icon'>
            <img
              src={user.photoURL}
              className="profile-icon"
            />
          </div>
        ) : (
          <PersonCircle className="profile-icon" />
        )}
        <p className="display-name">{user?.displayName || 'Anonymous'}</p>
      </div>
      <h2>{item.title}</h2>
      <small className="found-time">Found {foundTimeAgo}</small>
      <div className="image-container">
        <img src={item.imageUrl} alt={item.title} className="found-image" />
      </div>
      <p>{item.description}</p>
      <div className="item-actions">
        <button className="claim-button">Claim</button>
        <button className="view-map-button" onClick={handleViewMap}>
          <FaMapMarkedAlt className="map-icon" /> View in Map
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
