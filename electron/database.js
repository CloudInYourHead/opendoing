const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class ClipDatabase {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'clips.db');
    
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON clips(timestamp DESC)
    `);
  }

  addClip(content, type = 'text') {
    const existing = this.db.prepare(
      'SELECT id FROM clips WHERE content = ? ORDER BY timestamp DESC LIMIT 1'
    ).get(content);

    if (existing) {
      this.db.prepare(
        'UPDATE clips SET timestamp = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(existing.id);
      return existing.id;
    }

    const maxClips = 100;
    const count = this.db.prepare('SELECT COUNT(*) as count FROM clips').get();
    
    if (count.count >= maxClips) {
      this.db.prepare(`
        DELETE FROM clips WHERE id IN (
          SELECT id FROM clips ORDER BY timestamp ASC LIMIT ?
        )
      `).run(count.count - maxClips + 1);
    }

    const result = this.db.prepare(
      'INSERT INTO clips (content, type, timestamp) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).run(content, type);

    return result.lastInsertRowid;
  }

  getClips(limit = 100) {
    return this.db.prepare(
      'SELECT * FROM clips ORDER BY timestamp DESC LIMIT ?'
    ).all(limit);
  }

  searchClips(query) {
    return this.db.prepare(
      'SELECT * FROM clips WHERE content LIKE ? ORDER BY timestamp DESC LIMIT 100'
    ).all(`%${query}%`);
  }

  deleteClip(id) {
    return this.db.prepare('DELETE FROM clips WHERE id = ?').run(id);
  }

  clearAll() {
    return this.db.prepare('DELETE FROM clips').run();
  }

  cleanupOldClips(days = 7) {
    return this.db.prepare(
      'DELETE FROM clips WHERE timestamp < datetime("now", "-" || ? || " days")'
    ).run(days);
  }

  close() {
    this.db.close();
  }
}

module.exports = ClipDatabase;
