import React from 'react';
import './Logo.css';
import magnifyingGlass from '../images/magnifyingglass.svg';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="logo-container">
      <img src={magnifyingGlass} alt="Magnifying Glass" className="logo-icon" />
      <span className="logo-text">
        Find<span className="highlight">It</span>Fast
      </span>
      </Link>
  );
};

export default Logo;
