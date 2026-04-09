import React, { useState, useEffect } from 'react';
import ClipList from './components/ClipList';
import SearchBar from './components/SearchBar';

function App() {
  const [clips, setClips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClips();

    const unsubscribe = window.electronAPI.onClipsUpdated(() => {
      loadClips();
    });

    return () => unsubscribe();
  }, []);

  const loadClips = async () => {
    try {
      const data = searchQuery 
        ? await window.electronAPI.searchClips(searchQuery)
        : await window.electronAPI.getClips();
      setClips(data);
    } catch (err) {
      console.error('Failed to load clips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      const data = query 
        ? await window.electronAPI.searchClips(query)
        : await window.electronAPI.getClips();
      setClips(data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCopy = async (content) => {
    try {
      await window.electronAPI.copyClip(content);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await window.electronAPI.deleteClip(id);
      setClips(clips.filter(clip => clip.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all clipboard history?')) {
      try {
        await window.electronAPI.clearAll();
        setClips([]);
      } catch (err) {
        console.error('Clear failed:', err);
      }
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Clipboard History</h1>
        <button className="clear-btn" onClick={handleClearAll}>
          Clear All
        </button>
      </header>
      <SearchBar onSearch={handleSearch} />
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <ClipList 
          clips={clips} 
          onCopy={handleCopy} 
          onDelete={handleDelete} 
        />
      )}
    </div>
  );
}

export default App;
