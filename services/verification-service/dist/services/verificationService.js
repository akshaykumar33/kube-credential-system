"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const database_1 = require("../utils/database");
const logger_1 = require("../middlewares/logger");
const os_1 = __importDefault(require("os"));
class VerificationService {
    constructor() {
        this.workerId = process.env.POD_NAME ? `worker-${process.env.POD_NAME}` : `${os_1.default.hostname()}-${process.pid}`;
    }
    async verifyCredential(verificationRequest) {
        try {
            const timestamp = new Date().toISOString();
            logger_1.logger.info(`🔍 Verifying credential: ${verificationRequest.id}`);
            const credential = await database_1.database.getCredentialById(verificationRequest.id);
            if (credential) {
                logger_1.logger.info(`✅ Credential ${verificationRequest.id} found and valid`);
                return {
                    success: true,
                    message: `Credential verified by worker-${this.workerId}`,
                    credential,
                    workerId: this.workerId,
                    timestamp,
                    isValid: true
                };
            }
            logger_1.logger.warn(`❌ Credential ${verificationRequest.id} not found`);
            return {
                success: false,
                message: `Credential with ID ${verificationRequest.id} not found or invalid`,
                workerId: this.workerId,
                timestamp,
                isValid: false
            };
        }
        catch (error) {
            logger_1.logger.error('Error verifying credential:', error);
            throw new Error('Failed to verify credential');
        }
    }
    async getMetrics() {
        // Could add more verification-specific metrics here
        return {
            workerId: this.workerId,
            status: 'active',
            timestamp: new Date().toISOString()
        };
    }
    getWorkerId() {
        return this.workerId;
    }
}
exports.VerificationService = VerificationService;
//# sourceMappingURL=verificationService.js.map