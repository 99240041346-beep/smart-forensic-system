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
import { agentRouter } from './routes/agent.routes';
import { devicesRouter } from './routes/devices.routes';
import { casesRouter } from './routes/cases.routes';
import { scansRouter } from './routes/scans.routes';
import { reportsRouter } from './routes/reports.routes';
import { auditRouter } from './routes/audit.routes';
import { settingsRouter } from './routes/settings.routes';
import { startAgentBridge } from './agent/agentBridge';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','X-Agent-Token'] }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/auth', authRouter);
app.use('/api/agent', agentRouter);
app.use('/api/adb', adbRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/cases', casesRouter);
app.use('/api/scans', scansRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => res.json({
  status: 'healthy',
  service: 'Smart Forensic API',
  mode: 'adb-first',
  version: '1.2.0',
  timestamp: new Date().toISOString()
}));

app.get('/', (req, res) => res.json({
  name: 'Smart Android Forensic & Security Analysis API',
  status: 'online',
  mode: 'adb-first',
  adbStatusEndpoint: '/api/adb/status',
  agentEndpoint: '/api/agent/status',
  documentation: '/docs'
}));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API Server Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error', path: req.path });
});

const server = app.listen(Number(PORT), HOST, () => {
  console.log(`SMART FORENSIC SYSTEM - API SERVICE on ${HOST}:${PORT}`);
  void startAgentBridge();
});

server.on('error', (error: any) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`[API] Port ${PORT} is already in use.`);
    process.exit(1);
  }
  throw error;
});

export default app;
