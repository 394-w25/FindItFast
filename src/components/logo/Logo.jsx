import React from 'react';
import './Logo.css';
import magnifyingGlass from '../images/magnifyingglass.svg';

const Logo = () => {
  return (
    <div className="logo-container">
      <img src={magnifyingGlass} alt="Magnifying Glass" className="logo-icon" />
      <span className="logo-text">
        Find<span className="highlight">It</span>Fast
      </span>
    </div>
  );
};

export default Logo;
