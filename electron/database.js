const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class ClipDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'clips.db');
  }

  async init() {
    const SQL = await initSqlJs();
    
    try {
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } else {
        this.db = new SQL.Database();
      }
    } catch (err) {
      this.db = new SQL.Database();
    }

    this.db.run(`
      CREATE TABLE IF NOT EXISTS clips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON clips(timestamp DESC)`);
  }

  save() {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    }
  }

  addClip(content, type = 'text') {
    const maxLength = 10000;
    const truncated = content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;

    const existing = this.db.exec(
      `SELECT id FROM clips WHERE content = '${this.escape(truncated)}' ORDER BY timestamp DESC LIMIT 1`
    );

    if (existing.length > 0 && existing[0].values.length > 0) {
      const id = existing[0].values[0][0];
      this.db.run(`UPDATE clips SET timestamp = datetime('now') WHERE id = ${id}`);
      this.save();
      return id;
    }

    const count = this.db.exec('SELECT COUNT(*) FROM clips');
    const numClips = count[0].values[0][0];

    if (numClips >= 100) {
      const deleteCount = numClips - 99;
      this.db.run(`DELETE FROM clips WHERE id IN (SELECT id FROM clips ORDER BY timestamp ASC LIMIT ${deleteCount})`);
    }

    this.db.run(`INSERT INTO clips (content, type, timestamp) VALUES ('${this.escape(truncated)}', '${type}', datetime('now'))`);
    this.save();

    const result = this.db.exec('SELECT last_insert_rowid()');
    return result[0].values[0][0];
  }

  escape(str) {
    return str.replace(/'/g, "''");
  }

  getClips(limit = 100) {
    const result = this.db.exec(`SELECT * FROM clips ORDER BY timestamp DESC LIMIT ${limit}`);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  searchClips(query) {
    const result = this.db.exec(`SELECT * FROM clips WHERE content LIKE '%${this.escape(query)}%' ORDER BY timestamp DESC LIMIT 100`);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  deleteClip(id) {
    this.db.run(`DELETE FROM clips WHERE id = ${id}`);
    this.save();
  }

  clearAll() {
    this.db.run('DELETE FROM clips');
    this.save();
  }

  cleanupOldClips(days = 7) {
    this.db.run(`DELETE FROM clips WHERE timestamp < datetime('now', '-${days} days')`);
    this.save();
  }
}

module.exports = ClipDatabase;
