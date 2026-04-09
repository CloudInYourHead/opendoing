import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search clips..."
        value={query}
        onChange={handleChange}
      />
      {query && (
        <button className="clear-search" onClick={handleClear}>
          &times;
        </button>
      )}
    </div>
  );
}

export default SearchBar;
