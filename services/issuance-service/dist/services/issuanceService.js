"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuanceService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../utils/database");
const eventService_1 = require("./eventService");
const logger_1 = require("../middlewares/logger");
const os_1 = __importDefault(require("os"));
class IssuanceService {
    constructor() {
        this.workerId = process.env.POD_NAME ? `worker-${process.env.POD_NAME}` : `${os_1.default.hostname()}-${process.pid}`;
        this.eventService = new eventService_1.EventService();
        logger_1.logger.info(`🚀 Initialized IssuanceService with workerId: ${this.workerId}`);
    }
    async issueCredential(credentialRequest) {
        try {
            logger_1.logger.info(`📋 Processing credential request for: ${credentialRequest.holderName}`);
            // 1. Check if credential already exists
            const exists = await database_1.database.checkIfCredentialExists(credentialRequest.holderName, credentialRequest.credentialType, credentialRequest.issuerName);
            if (exists) {
                logger_1.logger.warn(`⚠️ Credential already exists for ${credentialRequest.holderName}`);
                return {
                    success: false,
                    message: `Credential already exists for ${credentialRequest.holderName} of type ${credentialRequest.credentialType}`,
                    workerId: this.workerId
                };
            }
            // 2. Create the credential
            const credentialId = (0, uuid_1.v4)();
            const timestamp = new Date().toISOString();
            const issueDate = new Date().toISOString().split('T')[0];
            const issuedCredential = {
                id: credentialId,
                holderName: credentialRequest.holderName,
                credentialType: credentialRequest.credentialType,
                issueDate,
                expiryDate: credentialRequest.expiryDate,
                issuerName: credentialRequest.issuerName,
                metadata: credentialRequest.metadata,
                workerId: this.workerId,
                timestamp,
                issuedBy: `worker-${this.workerId}`
            };
            // 3. Store in local database first (source of truth)
            await database_1.database.insertCredential(issuedCredential);
            logger_1.logger.info(`✅ Stored credential ${credentialId} in local database`);
            // 4. 🚀 Publish event to Redis pub/sub for real-time sync
            await this.eventService.publishCredentialIssued(issuedCredential);
            logger_1.logger.info(`🎉 Successfully issued credential ${credentialId} for ${credentialRequest.holderName}`);
            return {
                success: true,
                message: `Credential issued and published by worker-${this.workerId}`,
                credential: issuedCredential,
                workerId: this.workerId
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Error issuing credential:', error);
            throw new Error(`Failed to issue credential: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getMetrics() {
        try {
            const eventMetrics = await this.eventService.getMetrics();
            const queueStats = await this.eventService.getQueueStats();
            return {
                workerId: this.workerId,
                events: eventMetrics,
                queues: queueStats,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.logger.error('❌ Error getting metrics:', error);
            return {
                workerId: this.workerId,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
        }
    }
    async reprocessFailedEvents() {
        try {
            logger_1.logger.info('🔄 Reprocessing failed events from dead letter queue...');
            const reprocessedCount = await this.eventService.reprocessDeadLetterQueue();
            logger_1.logger.info(`✅ Reprocessed ${reprocessedCount} failed events`);
            return reprocessedCount;
        }
        catch (error) {
            logger_1.logger.error('❌ Error reprocessing failed events:', error);
            return 0;
        }
    }
    getWorkerId() {
        return this.workerId;
    }
    async shutdown() {
        logger_1.logger.info('🔌 Shutting down IssuanceService...');
        await this.eventService.shutdown();
        logger_1.logger.info('✅ IssuanceService shut down complete');
    }
}
exports.IssuanceService = IssuanceService;
//# sourceMappingURL=issuanceService.js.map