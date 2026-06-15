import Database from 'better-sqlite3';
import path from 'path';

export class DatabaseFactory {
  private static instance: Database.Database | null = null;

  public static getConnection(): Database.Database {
    if (!this.instance) {
      const isTest = process.env.NODE_ENV === 'test';
      const dbPath = isTest ? ':memory:' : path.resolve(__dirname, '../../database.db');
      
      const db = new Database(dbPath);
      db.pragma('foreign_keys = ON');
      
      this.initSchema(db);
      this.instance = db;
    }
    return this.instance;
  }

  public static resetConnection(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  }

  private static initSchema(db: Database.Database): void {
    const setup = db.transaction(() => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS records (
          id TEXT PRIMARY KEY,
          url_or_email TEXT UNIQUE NOT NULL,
          source TEXT NOT NULL,
          date_collected TEXT NOT NULL,
          label TEXT CHECK (label IN ('benign', 'suspicious', 'phishing', 'malware') OR label IS NULL),
          notes TEXT DEFAULT '',
          status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'needs_second_review')),
          imported_at TEXT NOT NULL,
          reviewed_at TEXT
        )
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL
        )
      `).run();

      db.prepare(`
        CREATE TABLE IF NOT EXISTS record_evidence_tags (
          record_id TEXT NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (record_id, tag_id),
          FOREIGN KEY (record_id) REFERENCES records (id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
        )
      `).run();

      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_records_status ON records(status)
      `).run();

      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_records_label ON records(label)
      `).run();

      db.prepare(`
        CREATE VIRTUAL TABLE IF NOT EXISTS records_fts
        USING fts5(url_or_email, notes, content=records, content_rowid=rowid)
      `).run();

      db.prepare(`
        CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON records BEGIN
          INSERT INTO records_fts(rowid, url_or_email, notes)
          VALUES (new.rowid, new.url_or_email, new.notes);
        END
      `).run();

      db.prepare(`
        CREATE TRIGGER IF NOT EXISTS records_ad AFTER DELETE ON records BEGIN
          INSERT INTO records_fts(records_fts, rowid, url_or_email, notes)
          VALUES ('delete', old.rowid, old.url_or_email, old.notes);
        END
      `).run();

      db.prepare(`
        CREATE TRIGGER IF NOT EXISTS records_au AFTER UPDATE ON records BEGIN
          INSERT INTO records_fts(records_fts, rowid, url_or_email, notes)
          VALUES ('delete', old.rowid, old.url_or_email, old.notes);
          INSERT INTO records_fts(rowid, url_or_email, notes)
          VALUES (new.rowid, new.url_or_email, new.notes);
        END
      `).run();

      const insertTag = db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`);
      const initialTags = [
        'suspicious_domain',
        'credential_form',
        'url_shortener',
        'brand_impersonation',
        'suspicious_attachment_reference',
      ];
      for (const tag of initialTags) {
        insertTag.run(tag);
      }
    });

    setup();
    console.log('[DatabaseFactory] Schema initialized');
  }
}