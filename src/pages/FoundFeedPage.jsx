import React, { useState, useEffect } from 'react';
import ItemCard from '../components/foundfeed/Itemcard';
import Modal from '../components/foundfeed/modal';
import MapView from '../components/foundfeed/mapview';
import HamburgerMenu from '../components/foundfeed/hamburgermenu';
import SearchBar from '../components/foundfeed/searchbar';
import Logo from '../components/foundfeed/logo'; 
import { useDbData } from '../utilities/firebase';
import './FoundFeedPage.css';

const FoundFeedPage = () => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [data, error] = useDbData('foundItems');
  const [users, setUsers] = useState({});
  const [userData, userError] = useDbData('users');

  useEffect(() => {
    if (data) {
      // Transform data into an array of items
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

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery) ||
    item.description.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="found-feed">
      {/* <HamburgerMenu /> */}
      <header className="found-feed-header">
        {/* <Logo /> */}
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
              <ItemCard key={item.id} item={item} user={users[item.postedBy]} onViewMap={openModal} />
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
