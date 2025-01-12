import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/login';
import FoundFeed from './components/foundfeed';
import SignUp from './components/signup';
import './App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/found" element={<FoundFeed />} />
      </Routes>
    </Router>
  );
};

export default App;