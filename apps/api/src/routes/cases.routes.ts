import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { AuditLogger } from '../audit/AuditLogger';

export const casesRouter = Router();

casesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const cases = await prisma.case.findMany({
      include: {
        scans: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = cases.map(c => ({
      ...c,
      tags: c.tags ? c.tags.split(',').filter(Boolean) : [],
      scansCount: c.scans.length,
      latestScan: c.scans[0] || null
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

casesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, investigatorName, deviceSerial, deviceModel, tags, notes } = req.body;
    if (!title || !deviceSerial) {
      return res.status(400).json({ error: 'Case title and device serial are required' });
    }

    const count = await prisma.case.count();
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Ensure device exists in DB
    await prisma.device.upsert({
      where: { serial: deviceSerial },
      update: {},
      create: {
        serial: deviceSerial,
        maskedSerial: deviceSerial.substring(0, 4) + '••••' + deviceSerial.substring(deviceSerial.length - 4),
        manufacturer: 'Android',
        model: deviceModel || 'Android Target Device',
        marketName: deviceModel || 'Android Target Device',
        androidVersion: '14',
        apiLevel: 34,
        securityPatchLevel: '2024-08-05',
        isDemo: deviceSerial.startsWith('DEMO')
      }
    });

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title,
        description: description || 'Authorized Mobile Forensic Investigation',
        investigatorName: investigatorName || 'Lead Forensics Investigator',
        deviceSerial,
        deviceModel: deviceModel || 'Android Device',
        status: 'OPEN',
        riskLevel: 'UNKNOWN',
        notes: notes || '',
        tags: Array.isArray(tags) ? tags.join(',') : (tags || 'Mobile,Forensics')
      }
    });

    await AuditLogger.log({
      investigator: newCase.investigatorName,
      action: 'CASE_CREATED',
      caseId: newCase.id,
      targetDeviceSerial: deviceSerial,
      status: 'SUCCESS',
      details: `Created new forensic case ${caseNumber} for target ${deviceModel || deviceSerial}`,
      ipAddress: req.ip
    });

    return res.status(201).json(newCase);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

casesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const forensicCase = await prisma.case.findUnique({
      where: { id },
      include: {
        device: true,
        scans: {
          orderBy: { startedAt: 'desc' },
          include: {
            securityFindings: true
          }
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    });

    if (!forensicCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    return res.json(forensicCase);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

casesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, riskLevel, notes, tags } = req.body;

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(riskLevel && { riskLevel }),
        ...(notes !== undefined && { notes }),
        ...(tags && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
        ...(status === 'CLOSED' ? { closedAt: new Date() } : {})
      }
    });

    await AuditLogger.log({
      investigator: updated.investigatorName,
      action: 'CASE_UPDATED',
      caseId: updated.id,
      status: 'SUCCESS',
      details: `Updated case details (Status: ${updated.status}, Risk: ${updated.riskLevel})`,
      ipAddress: req.ip
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

casesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Case not found' });

    await prisma.case.delete({ where: { id } });

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'CASE_DELETED',
      caseId: id,
      status: 'SUCCESS',
      details: `Permanently removed case ${existing.caseNumber}`,
      ipAddress: req.ip
    });

    return res.json({ success: true, message: `Case ${existing.caseNumber} deleted` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
