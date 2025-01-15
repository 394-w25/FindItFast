import React, { useState } from 'react';
import './hamburgermenu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="hamburger-menu">
      <button className="hamburger-button" onClick={toggleMenu}>
        ☰
      </button>
      {isOpen && (
        <div className="menu-dropdown" onClick={() => setIsOpen(false)}>
          <ul>
            <li><a href="/found">Found Items</a></li>
            <li><a href="/signin">Log Out</a></li>
            {/* Add more menu items as needed */}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
