import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignInPage from './pages/SignInPage';
import MessagesPage from './pages/MessagesPage';
import FoundFeedPage from './pages/FoundFeedPage';
import ProfilePage from './pages/ProfilePage';
import PostFoundItemPage from './pages/PostFoundItemPage';
import SignUp from './components/auth/signup';
import NavigationBar from './components/navigation/NavigationBar';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/found" element={<FoundFeedPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/postfound" element={<PostFoundItemPage />} />
        </Routes>
      </div>
      <NavigationBar />
    </Router>
  );
};

export default App;