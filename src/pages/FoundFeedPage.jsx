import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ItemCard from '../components/foundfeed/Itemcard';
import Modal from '../components/foundfeed/modal';
import MapView from '../components/foundfeed/mapview';
import SearchBar from '../components/foundfeed/searchbar';
import { database, useDbData } from '../utilities/firebase';
import { ref, set, update, get, push } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import './FoundFeedPage.css';
import DisputePage from './DisputePage';

const FoundFeedPage = ({ currentUser }) => {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('found');
  const [data, error] = useDbData('foundItems');
  const [users, setUsers] = useState({});
  const [userData, userError] = useDbData('users');
  const [claimedItems, setClaimedItems] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      const transformedItems = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      setItems(transformedItems.reverse());
    }
  }, [data]);

  useEffect(() => {
    if (userData) {
      setUsers(userData);
    }
  }, [userData]);

  useEffect(() => {
    const conversationsRef = ref(database, 'messages');
    get(conversationsRef).then((snapshot) => {
      const conversations = snapshot.val() || {};
      let claimedItemsMap = {};

      Object.values(conversations).forEach((conversation) => {
        if (conversation.claimedItems) {
          Object.keys(conversation.claimedItems).forEach((itemId) => {
            claimedItemsMap[itemId] = conversation.claimedItems[itemId];
          });
        }
      });

      setClaimedItems(claimedItemsMap);
    });
  }, []);

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
    const posterId = item.postedBy;
    const itemId = item.id;
    if (!posterId || posterId === currentUser.uid) {
      alert("You can't claim your own item!");
      return;
    }

    const conversationId = [currentUser.uid, posterId].sort().join('_');
    const conversationRef = ref(database, `messages/${conversationId}`);

    try {
      const snapshot = await get(conversationRef);
      let conversationData = snapshot.val();

      if (conversationData) {
        let updatedItemIds = conversationData.itemIds || [];
        if (!updatedItemIds.includes(itemId)) {
          updatedItemIds.push(itemId);
        }

        await update(conversationRef, {
          itemIds: updatedItemIds,
        });
      } else {
        await set(conversationRef, {
          itemIds: [itemId],
          claimedItems: {},
        });
      }

      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error('Error handling claim:', error);
    }
  };

  const handleDispute = (item) => {
    navigate(`/dispute/${item.id}`); // Navigate to the dispute page with the item ID
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery)
  );

  const displayedItems = filteredItems.filter((item) =>
    activeTab === 'found' ? !item.isClaimed : item.isClaimed
  );

  return (
    <div className="found-feed">
      <header className="found-feed-header">
        <Tabs activeKey={activeTab} onSelect={(key) => setActiveTab(key)} className="found-feed-tabs">
          <Tab eventKey="found" title={<span className="custom-tab-title">Found Items</span>} />
          <Tab eventKey="claimed" title={<span className="custom-tab-title">Claimed Items</span>} />
        </Tabs>

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
            {displayedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                user={users[item.postedBy]}
                onViewMap={openModal}
                onClaim={handleClaim}
                onDispute={() => handleDispute(item)}
                showClaimButton={!item.isClaimed}
                showDisputeButton={item.isClaimed}
              />
            ))}
          </div>
        ) : (
          <MapView items={displayedItems} />
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
