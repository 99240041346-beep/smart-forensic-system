import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

export const auditRouter = Router();

auditRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' }
    });
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
