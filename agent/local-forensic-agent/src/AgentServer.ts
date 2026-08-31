import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AdbManager } from './AdbManager';
import { AgentAuth } from './AgentAuth';

export class AgentServer {
  private app: express.Application;
  private adbManager = new AdbManager();
  private port: number;

  constructor(port = 47821) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({ origin: 'http://localhost:3000' }));
    this.app.use(express.json({ limit: '1mb' }));
  }

  private setupRoutes() {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ONLINE', agent: 'Smart Forensic Local ADB Agent', version: '2.0.0', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/agent/adb/status', AgentAuth.middleware, async (_req, res) => {
      res.json(await this.adbManager.checkAdb());
    });

    this.app.get('/api/agent/adb/devices', AgentAuth.middleware, async (_req, res) => {
      const devices = await this.adbManager.getDevices();
      res.json({ devices, count: devices.length });
    });

    this.app.get('/api/agent/adb/device/:serial/info', AgentAuth.middleware, async (req, res) => {
      try { res.json(await this.adbManager.getDeviceInfo(req.params.serial)); }
      catch (err: any) { res.status(400).json({ error: err.message }); }
    });

    this.app.get('/api/agent/adb/device/:serial/properties', AgentAuth.middleware, async (req, res) => {
      try { res.json(await this.adbManager.getDeviceProperties(req.params.serial)); }
      catch (err: any) { res.status(400).json({ error: err.message }); }
    });

    this.app.get('/api/agent/adb/device/:serial/packages', AgentAuth.middleware, async (req, res) => {
      try { res.json({ packages: await this.adbManager.listPackages(req.params.serial) }); }
      catch (err: any) { res.status(400).json({ error: err.message }); }
    });

    this.app.get('/api/agent/adb/device/:serial/storage', AgentAuth.middleware, async (req, res) => {
      try { res.json(await this.adbManager.storageSummary(req.params.serial)); }
      catch (err: any) { res.status(400).json({ error: err.message }); }
    });
  }

  public start() {
    this.app.listen(this.port, '127.0.0.1', () => {
      console.log(`[Local Agent] Listening on http://127.0.0.1:${this.port}`);
      console.log(`[Local Agent] ADB_PATH=${this.adbManager.getAdbPath()}`);
      console.log('[Local Agent] Read-only forensic allowlist active.');
    });
  }
}
