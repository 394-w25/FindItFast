import React, { useState } from 'react';
import ItemCard from './components/itemcard/Itemcard';
import Modal from './components/modal/modal';
import MapView from './components/mapview/mapview';
import HamburgerMenu from './components/hamburgermenu/hamburgermenu';
import SearchBar from './components/searchbar/searchbar';
import './foundfeed.css';

const FoundFeed = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      title: 'Pikachu Plushie',
      description: 'Lost yellow pikachu plushie, about 7" tall',
      image: 'images/pikachu.jpg',
      timestamp: '2025-01-10T11:00:00Z',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    {
      id: 2,
      title: 'Airpods',
      description: 'White case with initials AO on the side. Found in back table of periodicals',
      image: 'images/airpods.jpeg',
      timestamp: '2025-01-11T15:30:00Z',
      latitude: 34.0522,
      longitude: -118.2437,
    },
    {
      id: 3,
      title: 'Water Bottle',
      description: 'Black hydroflask found in Tech LR3 at around 11am Tuesday 1/10',
      image: 'images/hydroflask.jpg',
      timestamp: '2025-01-09T11:00:00Z',
      latitude: 40.7128,
      longitude: -74.0060,
    },
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

export default FoundFeed;
