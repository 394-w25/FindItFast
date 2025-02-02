import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import MessagingApp from './pages/MessagesPage';
import FoundFeedPage from './pages/FoundFeedPage';
import ProfilePage from './pages/ProfilePage';
import PostItemPage from './pages/PostItemPage';
import NavigationBar from './components/navigation/NavigationBar';
import DisputePage from './pages/DisputePage';
import Header from './components/header/Header';
import { useAuthState } from './utilities/firebase';
import SmartphoneFrame from './components/phoneframe/SmartphoneFrame';
import './App.css';

const App = () => {
  const [user, loading, error] = useAuthState();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      {!user ? (
        <SignInPage />
      ) : (
        <>
          <Header />
          <div className="main-content">
            <Routes>
              {/* Public Routes */}
              {/* <Route path="/" element={<SignInPage />} /> */}
              <Route path="/" element={<FoundFeedPage currentUser={user} />} />
              <Route path="/messages" element={<MessagingApp user={user} />} />
              <Route path="/messages/:conversationId" element={<MessagingApp user={user} />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/postfound" element={<PostItemPage />} />
              <Route path="/dispute/:itemId" element={<DisputePage user={user} />} />
            </Routes>
          </div>
          <NavigationBar />
        </>
      )};
    </>
  );
};

const AppWrapper = () => (
  <Router>
    <SmartphoneFrame>
      <App />
    </SmartphoneFrame>
  </Router>
);

export default AppWrapper;