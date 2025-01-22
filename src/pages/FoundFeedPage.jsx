import React, { useState, useEffect } from 'react';
import ItemCard from '../components/foundfeed/Itemcard';
import Modal from '../components/foundfeed/modal';
import MapView from '../components/foundfeed/mapview';
import SearchBar from '../components/foundfeed/searchbar';
import { database, useDbData } from '../utilities/firebase';
import { ref, set, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './FoundFeedPage.css';

const FoundFeedPage = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [data, error] = useDbData('foundItems');
  const [users, setUsers] = useState({});
  const [userData, userError] = useDbData('users');
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      const transformedItems = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setItems(transformedItems);
    }
  }, [data]);

  useEffect(() => {
    if (userData) {
      setUsers(userData); // Store user profile data
    }
  }, [userData]);

  if (error || userError) {
    return <div>Error fetching data: {error?.message || userError?.message}</div>;
  }

  const openModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

const handleClaim = async (item) => {
  const posterId = item.postedBy; // Assuming `postedBy` contains the ID of the user who posted the item.

  if (posterId && posterId !== currentUser.uid) {
    const conversationId = [currentUser.uid, posterId].sort().join('_');
    navigate(`/messages/${conversationId}`);
  } else {
    try {
      // Mark the item as claimed and move it to the claimed feed
      const claimedItem = {
        ...item,
        claimedBy: currentUser.uid, // Add the ID of the claimer
        claimedAt: Date.now(), // Add timestamp for when it was claimed
      };

      const foundItemPath = `foundItems/${item.id}`;
      const claimedItemPath = `claimedItems/${item.id}`;

      // Remove the item from the "Found Feed" and add it to the "Claimed Feed"
      await Promise.all([
        remove(ref(database, foundItemPath)), // Remove from "foundItems"
        set(ref(database, claimedItemPath), claimedItem), // Add to "claimedItems"
      ]);

      alert('You claimed your own item, and it has been moved to the Claimed Feed.');
    } catch (error) {
      console.error('Error claiming item:', error);
      alert('Failed to claim the item. Please try again.');
    }
  }
};



  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery) ||
    item.description.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="found-feed">
      <header className="found-feed-header">
        <SearchBar onSearch={handleSearch} />
        <div className="view-mode-buttons">
          <button
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('list')}
          >
            List
          </button>
          <button
            className={`view-button ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('map')}
          >
            Map
          </button>
        </div>
      </header>
      <main className="found-feed-main">
        {viewMode === 'list' ? (
          <div className="item-list">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                user={users[item.postedBy]}
                onViewMap={openModal}
                onClaim={handleClaim} // Pass handleClaim to ItemCard.
              />
            ))}
          </div>
        ) : (
          <MapView items={filteredItems} />
        )}
      </main>
      {isModalOpen && selectedItem && (
        <Modal onClose={closeModal}>
          <MapView
            items={[selectedItem]}
            center={[selectedItem.latitude, selectedItem.longitude]}
            zoom={15}
          />
        </Modal>
      )}
    </div>
  );
};

export default FoundFeedPage;
