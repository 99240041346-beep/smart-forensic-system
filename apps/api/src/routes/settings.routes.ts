import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { AuditLogger } from '../audit/AuditLogger';

export const settingsRouter = Router();

settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {
      DEMO_MODE: 'true',
      RETENTION_DAYS: '30',
      ADB_PATH: process.env.ADB_PATH || 'adb',
      THREAT_INTEL_PROVIDER: 'offline_heuristics'
    };

    for (const s of settings) {
      map[s.key] = s.value;
    }

    return res.json(map);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

settingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'SETTINGS_UPDATED',
      status: 'SUCCESS',
      details: `Updated configuration parameter: ${key} = ${value}`,
      ipAddress: req.ip
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
