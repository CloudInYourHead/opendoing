const Store = require('electron-store');

class ClipDatabase {
  constructor() {
    this.store = new Store({
      name: 'clips',
      defaults: {
        clips: [],
        nextId: 1
      }
    });
  }

  init() {
    return Promise.resolve();
  }

  addClip(content, type = 'text') {
    const maxLength = 10000;
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;

    const clips = this.store.get('clips', []);
    const nextId = this.store.get('nextId', 1);

    const existingIndex = clips.findIndex(c => c.content === truncated);
    if (existingIndex !== -1) {
      clips[existingIndex].timestamp = new Date().toISOString();
      this.store.set('clips', clips);
      return clips[existingIndex].id;
    }

    if (clips.length >= 100) {
      clips.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      clips.shift();
    }

    const newClip = {
      id: nextId,
      content: truncated,
      type: type,
      timestamp: new Date().toISOString()
    };

    clips.push(newClip);
    this.store.set('clips', clips);
    this.store.set('nextId', nextId + 1);

    return newClip.id;
  }

  getClips(limit = 100) {
    const clips = this.store.get('clips', []);
    return clips
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  searchClips(query) {
    const clips = this.store.get('clips', []);
    const lowerQuery = query.toLowerCase();
    return clips
      .filter(c => c.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);
  }

  deleteClip(id) {
    const clips = this.store.get('clips', []);
    const filtered = clips.filter(c => c.id !== id);
    this.store.set('clips', filtered);
  }

  clearAll() {
    this.store.set('clips', []);
  }

  cleanupOldClips(days = 7) {
    const clips = this.store.get('clips', []);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const filtered = clips.filter(c => new Date(c.timestamp) > cutoff);
    this.store.set('clips', filtered);
  }
}

module.exports = ClipDatabase;
