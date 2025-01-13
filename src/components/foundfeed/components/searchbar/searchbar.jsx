import React, { useState } from 'react';
import './searchbar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if(onSearch){
      onSearch(query);
    }
  };

  return (
    <div className="search-bar-card">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for an item..."
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
    </div>
  );
};

export default SearchBar;
