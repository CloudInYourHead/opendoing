import React from 'react';

function ClipItem({ clip, onCopy, onDelete }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  const handleCopy = () => {
    onCopy(clip.content);
  };

  const handleDelete = () => {
    onDelete(clip.id);
  };

  const preview = clip.content.length > 200 
    ? clip.content.substring(0, 200) + '...' 
    : clip.content;

  return (
    <div className="clip-item">
      <div className="clip-content" onClick={handleCopy}>
        <pre>{preview}</pre>
      </div>
      <div className="clip-footer">
        <span className="clip-time">{formatDate(clip.timestamp)}</span>
        <div className="clip-actions">
          <button className="copy-btn" onClick={handleCopy} title="Copy">
            Copy
          </button>
          <button className="delete-btn" onClick={handleDelete} title="Delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClipItem;
