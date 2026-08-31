import { Request, Response, NextFunction } from 'express';

export class AgentAuth {
  private static token: string = process.env.LOCAL_AGENT_TOKEN || 'forensic-agent-token-local-auth';

  public static setToken(newToken: string) {
    this.token = newToken;
  }

  public static getToken(): string {
    return this.token;
  }

  public static middleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['x-agent-token'] || req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Missing X-Agent-Token' });
    }

    const providedToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (providedToken !== AgentAuth.token) {
      return res.status(403).json({ error: 'Forbidden: Invalid Agent Authentication Token' });
    }

    next();
  }
}
