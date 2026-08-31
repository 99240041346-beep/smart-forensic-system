import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { AuditLogger } from '../audit/AuditLogger';
import { DISCLAIMER_NOTICE } from '@smart-forensic/shared';

export const reportsRouter = Router();

async function compileReportData(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
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

  if (!scan) return null;

  const summary = JSON.parse(scan.summaryJson || '{}');
  const findings = scan.securityFindings.map(f => ({
    ...f,
    evidence: JSON.parse(f.evidenceJson)
  }));

  const applications = scan.applications.map(a => ({
    ...a,
    flags: JSON.parse(a.flagsJson),
    reasons: JSON.parse(a.reasonsJson),
    sensitivePermissions: JSON.parse(a.sensitivePermsJson)
  }));

  return {
    reportId: `RPT-${scan.id.substring(0, 8).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    generatedBy: scan.case.investigatorName || 'Authorized Investigator',
    caseInfo: {
      caseNumber: scan.case.caseNumber,
      title: scan.case.title,
      description: scan.case.description,
      investigator: scan.case.investigatorName,
      status: scan.case.status,
      riskLevel: scan.case.riskLevel,
      notes: scan.case.notes
    },
    deviceInfo: {
      serial: scan.device.serial,
      maskedSerial: scan.device.maskedSerial,
      manufacturer: scan.device.manufacturer,
      model: scan.device.model,
      androidVersion: scan.device.androidVersion,
      apiLevel: scan.device.apiLevel,
      securityPatchLevel: scan.device.securityPatchLevel,
      isDemo: scan.device.isDemo
    },
    scanSummary: summary,
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    findings,
    applications,
    suspiciousApps: applications.filter(a => a.riskLevel === 'SUSPICIOUS' || a.riskLevel === 'HIGH_RISK' || a.riskLevel === 'CRITICAL'),
    contactsCount: scan.contacts.length,
    smsCount: scan.smsMessages.length,
    processesCount: scan.processes.length,
    disclaimer: DISCLAIMER_NOTICE
  };
}

reportsRouter.get('/:scanId', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const report = await compileReportData(scanId);
    if (!report) return res.status(404).json({ error: 'Scan or Report not found' });

    await AuditLogger.log({
      investigator: report.generatedBy,
      action: 'REPORT_GENERATED',
      scanId,
      status: 'SUCCESS',
      details: `Accessed forensic report for case ${report.caseInfo.caseNumber}`,
      ipAddress: req.ip
    });

    return res.json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

reportsRouter.get('/:scanId/export/json', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const report = await compileReportData(scanId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    await AuditLogger.log({
      investigator: report.generatedBy,
      action: 'REPORT_EXPORTED_JSON',
      scanId,
      status: 'SUCCESS',
      details: `Exported JSON forensic dossier for case ${report.caseInfo.caseNumber}`,
      ipAddress: req.ip
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="forensic-report-${report.caseInfo.caseNumber}.json"`);
    return res.send(JSON.stringify(report, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

reportsRouter.get('/:scanId/export/csv', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const report = await compileReportData(scanId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // Generate CSV of applications & findings
    const rows = [
      ['SECTION', 'ITEM / PACKAGE', 'TITLE / APP NAME', 'RISK LEVEL', 'RISK SCORE', 'DETAILS / FLAGS'],
      ...report.findings.map(f => ['SECURITY_FINDING', f.affectedItem, `"${f.title.replace(/"/g, '""')}"`, f.severity, '', `"${f.description.replace(/"/g, '""')}"`]),
      ...report.applications.map(a => ['APPLICATION', a.packageName, `"${a.appName.replace(/"/g, '""')}"`, a.riskLevel, a.riskScore.toString(), `"${a.reasons.join('; ').replace(/"/g, '""')}"`])
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');

    await AuditLogger.log({
      investigator: report.generatedBy,
      action: 'REPORT_EXPORTED_CSV',
      scanId,
      status: 'SUCCESS',
      details: `Exported CSV dataset for case ${report.caseInfo.caseNumber}`,
      ipAddress: req.ip
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="forensic-data-${report.caseInfo.caseNumber}.csv"`);
    return res.send(csvContent);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
