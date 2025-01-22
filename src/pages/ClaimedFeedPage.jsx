import React, { useState, useEffect } from 'react';
import ItemCard from '../components/foundfeed/Itemcard';
import SearchBar from '../components/foundfeed/searchbar';
import { useDbData } from '../utilities/firebase';
import './ClaimedFeedPage.css';

const ClaimedPage = ({ currentUser }) => {
  const [claimedItems, setClaimedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, error] = useDbData('claimedItems');
  const [users, setUsers] = useState({});
  const [userData, userError] = useDbData('users');

  useEffect(() => {
    if (data) {
      const transformedItems = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setClaimedItems(transformedItems);
    }
  }, [data]);

  useEffect(() => {
    if (userData) {
      setUsers(userData);
    }
  }, [userData]);

  if (error || userError) {
    return <div>Error fetching data: {error?.message || userError?.message}</div>;
  }

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

  const filteredItems = claimedItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery) ||
    item.description.toLowerCase().includes(searchQuery)
  );

  const timeSince = (timestamp) => {
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);

    if (daysAgo > 0) return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    if (hoursAgo > 0) return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    if (minutesAgo > 0) return `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
    return `${secondsAgo} second${secondsAgo > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="claimed-page">
      <header className="claimed-page-header">
        <SearchBar onSearch={handleSearch} />
      </header>
      <main className="claimed-page-main">
        <div className="item-list">
          {filteredItems.map((item) => {
            const claimer = users[item.claimedBy];
            return (
              <div key={item.id} className="claimed-item-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="item-image" />}
                <p>
                  Claimed by: <strong>{claimer?.displayName || claimer?.email || 'Unknown User'}</strong>
                </p>
                <p>Claimed: {timeSince(item.claimedAt)}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ClaimedPage;
