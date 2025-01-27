import React, { useState, useEffect } from 'react';
import { signOut, useAuthState, useDbData, useDbUpdate } from '../utilities/firebase';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Tabs, Tab, Card } from 'react-bootstrap';
import ItemCard from '../components/foundfeed/Itemcard';
import Modal from '../components/foundfeed/modal';
import MapView from '../components/foundfeed/mapview';
import { PersonCircle } from 'react-bootstrap-icons';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user] = useAuthState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [about, setAbout] = useState('');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [updateUserData] = useDbUpdate(`users/${user?.uid}`);
  const [claimedItemsKeys, claimedError] = useDbData(`users/${user?.uid}/claimedItems`);
  const [foundItemsKeys, foundError] = useDbData(`users/${user?.uid}/foundItems`);
  const [dbUserData, dbUserDataError] = useDbData(`users/${user?.uid}`);
  const [allFoundItems, foundItemsError] = useDbData(`foundItems`);
  const [allUsers, usersError] = useDbData(`users`);

  // Error handling
  if (dbUserDataError) {
    console.error("Error fetching user data:", dbUserDataError);
    return <div>Error loading profile information. Please try again later.</div>;
  }
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return <div>Error loading user details. Please try again later.</div>;
  }

  const getItemsFromKeys = (itemKeys, itemsCollection) => {
    if (!itemKeys || !itemsCollection) return [];
    return itemKeys
      .map((id) => ({ id, ...itemsCollection[id] }))
      .filter((item) => item)
      .reverse();
  };

  const foundItems = getItemsFromKeys(foundItemsKeys, allFoundItems);
  const claimedItems = getItemsFromKeys(claimedItemsKeys, allFoundItems);

  const handleSaveAbout = async () => {
    try {
      await updateUserData({ about });
      setIsEditingAbout(false);
      alert('About section updated successfully.');
    } catch (error) {
      console.error('Failed to update about:', error);
      alert('Failed to update the about section. Please try again.');
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  // console.log('userPhotoURL:', user?.photoURL);
  return (
    <Container className="profile-page">
      <Row className="justify-content-center">
        <Col xs={12} md={8} className="text-center">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              className="profile-picture"
            />
          ) : (
            <PersonCircle className="profile-picture" />
          )}
          <h3>{user?.displayName || 'Anonymous'}</h3>
          <p>{user?.email}</p>
          <div className="about-section">
            {isEditingAbout ? (
              <>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
                <div className="about-buttons">
                  <Button variant="primary" onClick={handleSaveAbout}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditingAbout(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>{dbUserData?.about || about || 'Add details about yourself.'}</p>
                <Button variant="link" onClick={() => setIsEditingAbout(true)}>
                  Edit About
                </Button>
              </>
            )}
          </div>
          <Button variant="danger" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Tabs defaultActiveKey="claimed" className="mt-4">
            <Tab eventKey="claimed" title="Your Claimed Items">
              <div className="items-tab">
                {claimedError && <p>Error loading claimed items: {claimedError.message}</p>}
                {claimedItems.length > 0 ? (
                  claimedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      user={allUsers?.[item.postedBy]}
                      onViewMap={openModal}
                      showClaimButton={false}
                      showUserWhoClaimed={false}
                    />
                  ))
                ) : (
                  <p>No claimed items yet.</p>
                )}
              </div>
            </Tab>
            <Tab eventKey="found" title="Found Items">
              <div className="items-tab">
                {foundError && <p>Error loading found items: {foundError.message}</p>}
                {foundItems.length > 0 ? (
                  foundItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      user={allUsers?.[item.postedBy]}
                      onViewMap={openModal}
                      showClaimButton={false}
                    />
                  ))
                ) : (
                  <p>No found items yet.</p>
                )}
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>
      {isModalOpen && selectedItem && (
        <Modal onClose={closeModal}>
          <MapView
            items={[selectedItem]}
            center={[selectedItem.latitude, selectedItem.longitude]}
            zoom={15}
          />
        </Modal>
      )}
    </Container>
  );
};

export default ProfilePage;
