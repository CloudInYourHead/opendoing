import React from 'react';
import ClipItem from './ClipItem';

function ClipList({ clips, onCopy, onDelete }) {
  if (clips.length === 0) {
    return (
      <div className="empty-state">
        <p>No clipboard history yet.</p>
        <p className="hint">Copy something to get started!</p>
      </div>
    );
  }

  return (
    <div className="clip-list">
      {clips.map(clip => (
        <ClipItem
          key={clip.id}
          clip={clip}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default ClipList;
