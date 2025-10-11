export declare class Database {
    private db;
    private dbPath;
    private initialized;
    constructor();
    private initialize;
    private createTables;
    insertCredential(credential: any): Promise<void>;
    getCredentialById(id: string): Promise<any | null>;
    checkIfCredentialExists(holderName: string, credentialType: string, issuerName: string): Promise<boolean>;
    close(): Promise<void>;
}
export declare const database: Database;
