import React from 'react';
import './itemcard.css';

const ItemCard = ({ item, onViewMap }) => {
  const handleViewMap = () => {
    onViewMap(item);
  };

  return (
    <div className="item-card">
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <img src={`/${item.image}`} alt={item.title} className="found-image" />
      <div className="item-actions">
        <button className="claim-button">Claim</button>
        <button className="view-map-button" onClick={handleViewMap}>View in Map</button>
      </div>
    </div>
  );
};

export default ItemCard;
