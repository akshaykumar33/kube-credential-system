import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import  bodyParser from 'body-parser';
import { IssuanceController } from './controllers/issuanceController';
import { logger } from './middlewares/logger';

export class App {
  public app: express.Application;
  private issuanceController: IssuanceController;

  constructor() {
    this.app = express();
    this.issuanceController = new IssuanceController();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
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