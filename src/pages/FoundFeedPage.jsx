import React, { useState } from 'react';
import ItemCard from '../components/foundfeed/Itemcard';
import Modal from '../components/foundfeed/modal';
import MapView from '../components/foundfeed/mapview';
import HamburgerMenu from '../components/foundfeed/hamburgermenu';
import SearchBar from '../components/foundfeed/searchbar';
import Logo from '../components/foundfeed/logo'; 
import './FoundFeedPage.css';

const FoundFeedPage = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      title: 'Pikachu Plushie',
      description: 'Lost yellow pikachu plushie, about 7" tall',
      image: 'images/pikachu.jpg',
      timestamp: '2025-01-13T09:00:00Z', // Updated timestamp
      latitude: 42.05353219296991,
      longitude: -87.67261584023835,

    },
    {
      id: 2,
      title: 'Airpods',
      description: 'White case with initials AO on the side. Found in spac',
      image: 'images/airpods.jpeg',
      timestamp: '2025-01-13T13:30:00Z', // Updated timestamp
      latitude: 42.059454450657405,
      longitude: -87.67212895136183,
    },
    {
      id: 3,
      title: 'Water Bottle',
      description: 'Black hydroflask found in Tech LR3 at around 11am Tuesday 1/10',
      image: 'images/hydroflask.jpg',
      timestamp: '2025-01-12T11:00:00Z', // Updated timestamp
      latitude: 42.057546315505526,
      longitude: -87.67603257548079,
    },
    // Add more items as needed
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [searchQuery, setSearchQuery] = useState('');

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
      <HamburgerMenu />
      <header className="found-feed-header">
        <Logo />
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
              <ItemCard key={item.id} item={item} onViewMap={openModal} />
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
