"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Database {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.dbPath = path_1.default.join(process.cwd(), 'data', 'credentials.db');
        // Ensure data directory exists
        const dataDir = path_1.default.dirname(this.dbPath);
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
    }
    async initialize() {
        if (this.initialized)
            return;
        return new Promise((resolve, reject) => {
            this.db = new sqlite3_1.default.Database(this.dbPath, (err) => {
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
    createTables() {
        if (!this.db)
            throw new Error('Database not connected');
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
            this.db.run(sql, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async insertCredential(credential) {
        await this.initialize();
        if (!this.db)
            throw new Error('Database not initialized');
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
            this.db.run(sql, values, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async getCredentialById(id) {
        await this.initialize();
        if (!this.db)
            throw new Error('Database not initialized');
        const sql = 'SELECT * FROM credentials WHERE id = ?';
        return new Promise((resolve, reject) => {
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (row && row.metadata) {
                    try {
                        row.metadata = JSON.parse(row.metadata);
                    }
                    catch (e) {
                        row.metadata = null;
                    }
                }
                resolve(row || null);
            });
        });
    }
    async checkIfCredentialExists(holderName, credentialType, issuerName) {
        await this.initialize();
        if (!this.db)
            throw new Error('Database not initialized');
        const sql = 'SELECT COUNT(*) as count FROM credentials WHERE holderName = ? AND credentialType = ? AND issuerName = ?';
        return new Promise((resolve, reject) => {
            this.db.get(sql, [holderName, credentialType, issuerName], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row ? row.count > 0 : false);
            });
        });
    }
    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        this.db = null;
                        this.initialized = false;
                        resolve();
                    }
                });
            });
        }
    }
}
exports.Database = Database;
exports.database = new Database();
//# sourceMappingURL=database.js.map