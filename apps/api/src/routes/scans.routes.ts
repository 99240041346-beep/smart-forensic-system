import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { PluginManager } from '../plugins/PluginManager';
import { AdbManager } from '../adb/AdbManager';
import { SecurityEngine } from '@smart-forensic/security-engine';
import { AuditLogger } from '../audit/AuditLogger';
import { ScanEventHub } from '../sse/ScanEventHub';
import { ScanStage } from '@smart-forensic/shared';

export const scansRouter = Router();
const pluginManager = new PluginManager();
const adbManager = new AdbManager();
const securityEngine = new SecurityEngine();

// SSE streaming endpoint
scansRouter.get('/:id/events', (req: Request, res: Response) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  ScanEventHub.addClient(id, res);
});

scansRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { caseId, deviceSerial } = req.body;
    if (!caseId || !deviceSerial) {
      return res.status(400).json({ error: 'caseId and deviceSerial are required' });
    }

    const isDemo = deviceSerial.startsWith('DEMO');

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        caseId,
        deviceSerial,
        status: 'IN_PROGRESS',
        progress: 5,
        currentStage: 'INITIALIZE',
        riskScore: 0,
        riskLevel: 'UNKNOWN',
        startedAt: new Date()
      }
    });

    await AuditLogger.log({
      investigator: 'Lead Forensics Investigator',
      action: 'SECURITY_SCAN',
      caseId,
      scanId: scan.id,
      targetDeviceSerial: adbManager.maskSerial(deviceSerial),
      status: 'SUCCESS',
      details: `Initiated forensic acquisition pipeline for scan ${scan.id}`,
      ipAddress: req.ip
    });

    // Run execution pipeline asynchronously
    (async () => {
      try {
        const result = await pluginManager.executePipeline({
          scanId: scan.id,
          caseId,
          deviceSerial,
          isDemo,
          adbManager,
          securityEngine,
          onProgress: (percent, msg, stage) => {
            ScanEventHub.emitEvent(scan.id, {
              stage: stage as ScanStage,
              percent,
              message: msg,
              stageStatus: 'in_progress'
            });
          }
        });

        // Persist collected data to database
        const apps = result.collectedData['ApplicationPlugin'] || [];
        for (const app of apps) {
          await prisma.appScanRecord.create({
            data: {
              scanId: scan.id,
              packageName: app.packageName,
              appName: app.appName,
              versionName: app.versionName || '1.0',
              versionCode: app.versionCode || 1,
              apkPath: app.apkPath || '',
              installSource: app.installSource || 'Unknown',
              isSystemApp: app.isSystemApp || false,
              isSideloaded: app.isSideloaded || false,
              isDebuggable: app.isDebuggable || false,
              sha256: app.sha256,
              riskScore: app.risk?.riskScore || 0,
              riskLevel: app.risk?.riskLevel || 'SAFE',
              confidence: app.risk?.confidence || 'LOW',
              flagsJson: JSON.stringify(app.risk?.flags || []),
              reasonsJson: JSON.stringify(app.risk?.reasons || []),
              sensitivePermsJson: JSON.stringify(app.risk?.sensitivePermissions || []),
              isSecurityTool: app.risk?.isPotentialSecurityTool || false,
              toolCategory: app.risk?.toolCategory
            }
          });
        }

        const contacts = result.collectedData['ContactPlugin'] || [];
        for (const cnt of contacts) {
          await prisma.contactRecord.create({
            data: {
              scanId: scan.id,
              name: cnt.name,
              phoneNumbersJson: JSON.stringify(cnt.phoneNumbers || []),
              emailsJson: JSON.stringify(cnt.emails || []),
              organization: cnt.organization,
              source: cnt.source || 'Device',
              isDuplicate: cnt.isDuplicate || false
            }
          });
        }

        const smsList = result.collectedData['SmsPlugin'] || [];
        for (const sms of smsList) {
          await prisma.smsRecord.create({
            data: {
              scanId: scan.id,
              address: sms.address,
              date: sms.date,
              type: sms.type || 'INBOX',
              body: sms.body,
              isSuspicious: sms.isSuspicious || false,
              suspiciousReasonsJson: JSON.stringify(sms.suspiciousReasons || []),
              riskScore: sms.riskScore || 0
            }
          });
        }

        const processes = result.collectedData['ProcessPlugin'] || [];
        for (const proc of processes) {
          await prisma.processRecord.create({
            data: {
              scanId: scan.id,
              pid: proc.pid,
              user: proc.user,
              processName: proc.processName,
              packageName: proc.packageName,
              cpuPercent: proc.cpuPercent || 0,
              memoryKb: proc.memoryKb || 0,
              status: proc.status || 'Running',
              isSuspicious: proc.isSuspicious || false,
              suspiciousReason: proc.suspiciousReason
            }
          });
        }

        for (const fnd of result.findings) {
          await prisma.securityFindingRecord.create({
            data: {
              scanId: scan.id,
              category: fnd.category,
              title: fnd.title,
              description: fnd.description,
              severity: fnd.severity,
              evidenceJson: JSON.stringify(fnd.evidence || []),
              confidence: fnd.confidence || 'LOW',
              affectedItem: fnd.affectedItem || 'System',
              recommendation: fnd.recommendation || ''
            }
          });
        }

        // Update Scan completion status
        await prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: 'COMPLETED',
            progress: 100,
            currentStage: 'COMPLETED',
            riskScore: result.summary.securityScore,
            riskLevel: result.riskLevel,
            summaryJson: JSON.stringify(result.summary),
            completedAt: new Date()
          }
        });

        // Update parent case risk level
        await prisma.case.update({
          where: { id: caseId },
          data: {
            riskLevel: result.riskLevel,
            status: 'IN_PROGRESS'
          }
        });

        ScanEventHub.emitEvent(scan.id, {
          stage: 'COMPLETED',
          percent: 100,
          message: 'Forensic scan pipeline completed successfully',
          stageStatus: 'completed'
        });

        await AuditLogger.log({
          investigator: 'Lead Forensics Investigator',
          action: 'SECURITY_SCAN',
          caseId,
          scanId: scan.id,
          targetDeviceSerial: adbManager.maskSerial(deviceSerial),
          status: 'SUCCESS',
          details: `Completed forensic scan (Score: ${result.summary.securityScore}/100, Risk: ${result.riskLevel}, Findings: ${result.findings.length})`,
          ipAddress: '127.0.0.1'
        });
      } catch (err: any) {
        console.error('[Scan Pipeline Error]', err);
        await prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: 'FAILED',
            currentStage: 'FAILED',
            completedAt: new Date()
          }
        });

        ScanEventHub.emitEvent(scan.id, {
          stage: 'FAILED',
          percent: 100,
          message: `Scan pipeline encountered an error: ${err.message}`,
          stageStatus: 'failed',
          error: err.message
        });
      }
    })();

    return res.status(202).json({
      scanId: scan.id,
      status: 'IN_PROGRESS',
      streamUrl: `/api/scans/${scan.id}/events`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

scansRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        case: true,
        device: true,
        applications: true,
        contacts: true,
        smsMessages: true,
        processes: true,
        securityFindings: true
      }
    });

    if (!scan) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const formattedApps = scan.applications.map(a => ({
      ...a,
      flags: JSON.parse(a.flagsJson),
      reasons: JSON.parse(a.reasonsJson),
      sensitivePermissions: JSON.parse(a.sensitivePermsJson),
      risk: {
        riskScore: a.riskScore,
        riskLevel: a.riskLevel,
        confidence: a.confidence,
        flags: JSON.parse(a.flagsJson),
        reasons: JSON.parse(a.reasonsJson),
        sensitivePermissions: JSON.parse(a.sensitivePermsJson),
        isSideloaded: a.isSideloaded,
        isDebuggable: a.isDebuggable,
        hasOverlayCapability: a.flagsJson.includes('OVERLAY'),
        hasAccessibilityService: a.flagsJson.includes('ACCESSIBILITY'),
        hasDeviceAdmin: a.flagsJson.includes('DEVICE_ADMIN'),
        isPotentialSecurityTool: a.isSecurityTool,
        toolCategory: a.toolCategory || undefined
      }
    }));

    const formattedContacts = scan.contacts.map(c => ({
      ...c,
      phoneNumbers: JSON.parse(c.phoneNumbersJson),
      emails: JSON.parse(c.emailsJson)
    }));

    const formattedSms = scan.smsMessages.map(s => ({
      ...s,
      suspiciousReasons: JSON.parse(s.suspiciousReasonsJson)
    }));

    const formattedFindings = scan.securityFindings.map(f => ({
      ...f,
      evidence: JSON.parse(f.evidenceJson)
    }));

    return res.json({
      ...scan,
      summary: JSON.parse(scan.summaryJson || '{}'),
      applications: formattedApps,
      contacts: formattedContacts,
      smsMessages: formattedSms,
      processes: scan.processes,
      securityFindings: formattedFindings
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

scansRouter.get('/:id/findings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const findings = await prisma.securityFindingRecord.findMany({
      where: { scanId: id }
    });
    return res.json(findings.map(f => ({ ...f, evidence: JSON.parse(f.evidenceJson) })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
