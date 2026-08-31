import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { authRouter } from './routes/auth.routes';
import { adbRouter } from './routes/adb.routes';
import { devicesRouter } from './routes/devices.routes';
import { casesRouter } from './routes/cases.routes';
import { scansRouter } from './routes/scans.routes';
import { reportsRouter } from './routes/reports.routes';
import { auditRouter } from './routes/audit.routes';
import { settingsRouter } from './routes/settings.routes';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Security and middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Token']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/adb', adbRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/scans', scansRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Smart Forensic Local Agent & API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Android Forensic & Security Analysis API',
    status: 'online',
    adbStatusEndpoint: '/api/adb/status',
    documentation: '/docs'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path
  });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`=======================================================`);
  console.log(` SMART FORENSIC SYSTEM - LOCAL AGENT & API SERVICE    `);
  console.log(` Service URL : http://${HOST}:${PORT}               `);
  console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(` Database    : ${process.env.DATABASE_URL || 'dev.db'} `);
  console.log(`=======================================================`);
});

export default app;
