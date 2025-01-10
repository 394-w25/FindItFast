import React from 'react';
import './App.css';

const App = () => {
  // Sample data for lost items
  const items = [
    {
      id: 1,
      title: 'Pikachu Plushie',
      description: 'Lost yellow pikachu plushie, about 7" tall',
      image: 'images/pikachu.jpg', 
    },
    {
      id: 2,
      title: 'Airpods',
      description: 'White case with initials AO on the side. Found in back table of periodicals',
      image: 'images/airpods.jpeg', 
    },
    {
      id: 3,
      title: 'Water Bottle',
      description: 'Black hydroflask found in Tech LR3 at aorund 11am Tuesday 1/10',
      image: 'images/hydroflask.jpg', 
    },
  ];

  return (
    <div className="App">
      <header className="header">
        <input
          type="text"
          placeholder="Search an item..."
          className="search-bar"
        />
        <div className="profile-icon">👤</div>
      </header>
      <main className="item-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <img src={item.image} alt={item.title} class="found-image" />
            <button className="claim-button">Claim</button>
          </div>
        ))}
      </main>
    </div>
  );
};

export default App;
