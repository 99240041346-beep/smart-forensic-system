import { Router, Request, Response } from 'express';
import { AdbManager } from '../adb/AdbManager';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';
import { SecurityEngine } from '@smart-forensic/security-engine';
import { AuditLogger } from '../audit/AuditLogger';
import { prisma } from '../db/client';
import { AppInfo, ContactInfo, ProcessInfo, SmsInfo } from '@smart-forensic/shared';

export const devicesRouter = Router();
const adbManager = new AdbManager();
const securityEngine = new SecurityEngine();

devicesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { lastSeenAt: 'desc' }
    });
    return res.json(devices);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

devicesRouter.get('/:serial', async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const isDemo = serial.startsWith('DEMO');

    let info;
    if (isDemo) {
      info = DemoDataGenerator.getDemoDeviceInfo(serial);
    } else {
      info = await adbManager.getDeviceInfo(serial);
    }

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'DEVICE_INFO_COLLECTED',
      targetDeviceSerial: adbManager.maskSerial(serial),
      status: 'SUCCESS',
      details: `Collected device specifications for ${info.model} (Android ${info.androidVersion})`,
      ipAddress: req.ip
    });

    return res.json(info);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

devicesRouter.get('/:serial/apps', async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const isDemo = serial.startsWith('DEMO');

    let apps: AppInfo[] = [];
    if (isDemo) {
      apps = DemoDataGenerator.getDemoApplications();
    } else {
      const rawPackages = await adbManager.getInstalledPackages(serial);
      apps = [];
      for (const item of rawPackages.slice(0, 50)) {
        const meta = await adbManager.getPackageMetadata(serial, item.packageName);
        const nameParts = item.packageName.split('.');
        const appName = nameParts[nameParts.length - 1].replace(/^[a-z]/, c => c.toUpperCase());
        const appData = {
          packageName: item.packageName,
          appName,
          versionName: meta.versionName,
          versionCode: meta.versionCode,
          apkPath: item.apkPath,
          installSource: meta.installSource,
          isSystemApp: item.isSystem,
          isSideloaded: meta.isSideloaded,
          isDebuggable: meta.isDebuggable,
          requestedPermissions: meta.requestedPermissions,
          grantedPermissions: meta.grantedPermissions,
          dangerousPermissions: meta.requestedPermissions.filter(p => p.includes('SMS') || p.includes('CONTACTS') || p.includes('ACCESSIBILITY'))
        };
        const risk = securityEngine.analyzeApplication(appData);
        apps.push({ ...appData, risk });
      }
    }

    return res.json({
      apps,
      total: apps.length,
      suspicious: apps.filter(a => a.risk.riskLevel === 'SUSPICIOUS' || a.risk.riskLevel === 'HIGH_RISK' || a.risk.riskLevel === 'CRITICAL').length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

devicesRouter.get('/:serial/contacts', async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const isDemo = serial.startsWith('DEMO');

    let contacts: ContactInfo[] = [];
    if (isDemo) {
      contacts = DemoDataGenerator.getDemoContacts();
    }

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'CONTACT_COLLECTION',
      targetDeviceSerial: adbManager.maskSerial(serial),
      status: 'SUCCESS',
      details: `Retrieved ${contacts.length} authorized contact records`,
      ipAddress: req.ip
    });

    return res.json({
      contacts,
      total: contacts.length,
      permissionGranted: isDemo || contacts.length > 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

devicesRouter.get('/:serial/sms', async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const isDemo = serial.startsWith('DEMO');

    let sms: SmsInfo[] = [];
    if (isDemo) {
      sms = DemoDataGenerator.getDemoSms();
    }

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'SMS_COLLECTION',
      targetDeviceSerial: adbManager.maskSerial(serial),
      status: 'SUCCESS',
      details: `Retrieved ${sms.length} authorized SMS records`,
      ipAddress: req.ip
    });

    return res.json({
      sms,
      total: sms.length,
      suspiciousCount: sms.filter(s => s.isSuspicious).length,
      permissionGranted: isDemo || sms.length > 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

devicesRouter.get('/:serial/processes', async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const isDemo = serial.startsWith('DEMO');

    let processes: ProcessInfo[] = [];
    if (isDemo) {
      processes = DemoDataGenerator.getDemoProcesses();
    } else {
      const rawProc = await adbManager.getRunningProcesses(serial);
      processes = rawProc.map(p => ({
        ...p,
        ...securityEngine.analyzeProcess(p)
      }));
    }

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'PROCESS_SCAN',
      targetDeviceSerial: adbManager.maskSerial(serial),
      status: 'SUCCESS',
      details: `Audited ${processes.length} legitimately exposed running processes`,
      ipAddress: req.ip
    });

    return res.json({
      processes,
      total: processes.length,
      suspiciousCount: processes.filter(p => p.isSuspicious).length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

devicesRouter.get('/:serial/security', async (req: Request, res: Response) => {
  try {
    const { serial } = req.params;
    const isDemo = serial.startsWith('DEMO');

    const deviceInfo = isDemo
      ? DemoDataGenerator.getDemoDeviceInfo(serial)
      : await adbManager.getDeviceInfo(serial);

    const integrity = securityEngine.evaluateDeviceIntegrity(deviceInfo);

    return res.json({
      deviceInfo,
      securityScore: integrity.securityScore,
      riskLevel: integrity.riskLevel,
      indicators: integrity.indicators,
      scoreBreakdown: integrity.scoreBreakdown
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
