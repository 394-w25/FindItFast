import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/auth/login/login';
import FoundFeed from './components/foundfeed/foundfeed';
import SignUp from './components/auth/signup/signup';
import PostItemPage from './components/postItem/postItemPage';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/found" element={<FoundFeed />} />
        <Route path="/post-item" element={<PostItemPage />} />  

      </Routes>
    </Router>
  );
};

export default App;