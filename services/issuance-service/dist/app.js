"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = __importDefault(require("body-parser"));
const issuanceController_1 = require("./controllers/issuanceController");
const logger_1 = require("./middlewares/logger");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.issuanceController = new issuanceController_1.IssuanceController();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use(body_parser_1.default.json());
        // Request logging
        this.app.use((req, res, next) => {
            logger_1.logger.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    initializeRoutes() {
        this.app.get('/health', this.issuanceController.getHealth);
        this.app.post('/api/v1/credentials/issue', this.issuanceController.issueCredential);
        // Admin routes
        this.app.get('/admin/metrics', this.issuanceController.getMetrics);
        this.app.post('/admin/reprocess-failed', this.issuanceController.reprocessFailedEvents);
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Kube Credential - Issuance Service (Redis Edition)',
                version: '2.0.0',
                status: 'running',
                features: [
                    'Redis Pub/Sub Event Publishing',
                    'Automatic Retry with Exponential Backoff',
                    'Dead Letter Queue',
                    'Comprehensive Metrics',
                    'Admin APIs'
                ],
                endpoints: {
                    health: '/health',
                    issue: '/api/v1/credentials/issue',
                    metrics: '/admin/metrics',
                    reprocessFailed: '/admin/reprocess-failed'
                }
            });
        });
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map