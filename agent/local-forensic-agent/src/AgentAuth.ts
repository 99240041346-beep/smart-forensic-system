import { Request, Response, NextFunction } from 'express';

export class AgentAuth {
  private static token = process.env.LOCAL_AGENT_TOKEN || '';

  public static setToken(newToken: string) { this.token = newToken; }
  public static getToken() { return this.token; }

  public static middleware(req: Request, res: Response, next: NextFunction) {
    if (!AgentAuth.token) return res.status(503).json({ error: 'Local agent authentication is not configured' });
    const authHeader = req.headers['x-agent-token'] || req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing agent authentication token' });
    const provided = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : String(authHeader);
    if (provided !== AgentAuth.token) return res.status(403).json({ error: 'Invalid agent authentication token' });
    next();
  }
}
