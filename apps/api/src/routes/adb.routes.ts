import { Router, Request, Response } from 'express';
import { AdbManager } from '../adb/AdbManager';
import { AuditLogger } from '../audit/AuditLogger';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';
import { prisma } from '../db/client';

export const adbRouter = Router();
const adbManager = new AdbManager();

adbRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await adbManager.checkAdbInstalled();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adbRouter.get('/devices', async (req: Request, res: Response) => {
  try {
    const realDevices = await adbManager.getDevices();
    const demoDevices = DemoDataGenerator.getDemoDevices();

    // Check if demo mode setting is enabled
    const demoSetting = await prisma.systemSetting.findUnique({
      where: { key: 'DEMO_MODE' }
    });
    const demoEnabled = demoSetting ? demoSetting.value === 'true' : true; // Default true if no physical device

    let allDevices = [...realDevices];
    if (demoEnabled || realDevices.length === 0) {
      allDevices = [...realDevices, ...demoDevices];
    }

    return res.json({
      devices: allDevices,
      count: allDevices.length,
      realCount: realDevices.length,
      demoCount: demoEnabled ? demoDevices.length : 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

adbRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const status = await adbManager.checkAdbInstalled();
    const realDevices = await adbManager.getDevices();
    const demoDevices = DemoDataGenerator.getDemoDevices();

    const demoSetting = await prisma.systemSetting.findUnique({
      where: { key: 'DEMO_MODE' }
    });
    const demoEnabled = demoSetting ? demoSetting.value === 'true' : true;

    const allDevices = (demoEnabled || realDevices.length === 0)
      ? [...realDevices, ...demoDevices]
      : realDevices;

    // Sync devices to database
    for (const dev of allDevices) {
      await prisma.device.upsert({
        where: { serial: dev.serial },
        update: {
          maskedSerial: dev.maskedSerial,
          model: dev.model,
          marketName: dev.model,
          isDemo: dev.isDemo || false,
          lastSeenAt: new Date()
        },
        create: {
          serial: dev.serial,
          maskedSerial: dev.maskedSerial,
          manufacturer: dev.isDemo ? (dev.serial.includes('S24') ? 'Samsung' : 'Google') : 'Android',
          model: dev.model,
          marketName: dev.model,
          androidVersion: dev.isDemo ? (dev.serial.includes('S24') ? '14' : '15') : '14',
          apiLevel: dev.isDemo ? (dev.serial.includes('S24') ? 34 : 35) : 34,
          securityPatchLevel: '2024-08-05',
          isDemo: dev.isDemo || false,
          lastSeenAt: new Date()
        }
      });
    }

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'ADB_REFRESH',
      status: 'SUCCESS',
      details: `Refreshed ADB status. Discovered ${realDevices.length} physical device(s) and ${allDevices.length} total active target(s).`,
      ipAddress: req.ip
    });

    return res.json({
      status,
      devices: allDevices,
      refreshedAt: new Date().toISOString()
    });
  } catch (err: any) {
    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'ADB_REFRESH',
      status: 'FAILURE',
      details: `ADB Refresh failed: ${err.message}`,
      ipAddress: req.ip
    });
    return res.status(500).json({ error: err.message });
  }
});
