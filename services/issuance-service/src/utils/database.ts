import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

interface CredentialRow {
  id: string;
  holderName: string;
  credentialType: string;
  issueDate: string;
  expiryDate: string | null;
  issuerName: string;
  workerId: string;
  timestamp: string;
  issuedBy: string;
  metadata: string | null;
}

interface CountResult {
  count: number;
}

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private initialized: boolean = false;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'credentials.db');
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }

        this.createTables()
          .then(() => {
            this.initialized = true;
            console.log('Database initialized successfully');
            resolve();
          })
          .catch((error) => {
            console.error('Error creating tables:', error);
            reject(error);
          });
      });
    });
  }

  private createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS credentials (
          id TEXT PRIMARY KEY,
          holderName TEXT NOT NULL,
          credentialType TEXT NOT NULL,
          issueDate TEXT NOT NULL,
          expiryDate TEXT,
          issuerName TEXT NOT NULL,
          workerId TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          issuedBy TEXT NOT NULL,
          metadata TEXT
        )
      `;

      this.db!.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async insertCredential(credential: any): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const sql = `
      INSERT INTO credentials 
      (id, holderName, credentialType, issueDate, expiryDate, issuerName, workerId, timestamp, issuedBy, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      credential.id,
      credential.holderName,
      credential.credentialType,
      credential.issueDate,
      credential.expiryDate || null,
      credential.issuerName,
      credential.workerId,
      credential.timestamp,
      credential.issuedBy,
      credential.metadata ? JSON.stringify(credential.metadata) : null
    ];

    return new Promise((resolve, reject) => {
      this.db!.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getCredentialById(id: string): Promise<any | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'SELECT * FROM credentials WHERE id = ?';

    return new Promise((resolve, reject) => {
      this.db!.get(sql, [id], (err, row: CredentialRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        if (row && row.metadata) {
          try {
            (row as any).metadata = JSON.parse(row.metadata);
          } catch (e) {
            (row as any).metadata = null;
          }
        }

        resolve(row || null);
      });
    });
  }

  async checkIfCredentialExists(holderName: string, credentialType: string, issuerName: string): Promise<boolean> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const sql = 'SELECT COUNT(*) as count FROM credentials WHERE holderName = ? AND credentialType = ? AND issuerName = ?';

    return new Promise((resolve, reject) => {
      this.db!.get(sql, [holderName, credentialType, issuerName], (err, row: CountResult | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row ? row.count > 0 : false);
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            this.initialized = false;
            resolve();
          }
        });
      });
    }
  }
}

export const database = new Database();