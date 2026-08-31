import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AdbManager } from './AdbManager';
import { AgentAuth } from './AgentAuth';

export class AgentServer {
  private app: express.Application;
  private adbManager: AdbManager;
  private port: number;

  constructor(port = 47821) {
    this.port = port;
    this.app = express();
    this.adbManager = new AdbManager();

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({ origin: 'http://localhost:3000' }));
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ONLINE',
        agent: 'Smart Forensic Local ADB Agent',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Authenticated Allowlisted ADB Operations
    this.app.get('/api/agent/adb/status', AgentAuth.middleware, async (req: Request, res: Response) => {
      const status = await this.adbManager.checkAdb();
      res.json(status);
    });

    this.app.get('/api/agent/adb/devices', AgentAuth.middleware, async (req: Request, res: Response) => {
      const devices = await this.adbManager.getDevices();
      res.json({ devices, count: devices.length });
    });

    this.app.post('/api/agent/adb/execute', AgentAuth.middleware, async (req: Request, res: Response) => {
      const { args } = req.body;
      if (!Array.isArray(args)) {
        return res.status(400).json({ error: 'args must be an array of string parameters' });
      }

      try {
        const result = await this.adbManager.executeRaw(args);
        res.json(result);
      } catch (err: any) {
        res.status(403).json({ error: err.message });
      }
    });
  }

  public start() {
    this.app.listen(this.port, '127.0.0.1', () => {
      console.log(`[Local Agent] Listening on http://127.0.0.1:${this.port}`);
      console.log(`[Local Agent] Allowlist security active.`);
    });
  }
}
