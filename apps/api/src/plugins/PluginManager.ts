import { ForensicPlugin, PluginContext } from './ForensicPlugin';
import { DeviceInfoPlugin } from './DeviceInfoPlugin';
import { ApplicationPlugin } from './ApplicationPlugin';
import { ContactPlugin } from './ContactPlugin';
import { SmsPlugin } from './SmsPlugin';
import { ProcessPlugin } from './ProcessPlugin';
import { SecurityPlugin } from './SecurityPlugin';
import { AdbManager } from '../adb/AdbManager';
import { SecurityEngine } from '@smart-forensic/security-engine';
import { ForensicScanSummary, RiskLevel, SecurityFinding } from '@smart-forensic/shared';

export class PluginManager {
  private plugins: Map<string, ForensicPlugin> = new Map();

  constructor() {
    this.registerPlugin(new DeviceInfoPlugin());
    this.registerPlugin(new ApplicationPlugin());
    this.registerPlugin(new ContactPlugin());
    this.registerPlugin(new SmsPlugin());
    this.registerPlugin(new ProcessPlugin());
    this.registerPlugin(new SecurityPlugin());
  }

  public registerPlugin(plugin: ForensicPlugin) {
    this.plugins.set(plugin.name, plugin);
  }

  public getRegisteredPlugins(): ForensicPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Executes full forensic scan pipeline using all registered plugins.
   */
  public async executePipeline(params: {
    scanId: string;
    caseId: string;
    deviceSerial: string;
    isDemo: boolean;
    adbManager: AdbManager;
    securityEngine: SecurityEngine;
    onProgress: (percent: number, message: string, stage: string) => void;
  }): Promise<{
    collectedData: Record<string, any>;
    findings: SecurityFinding[];
    summary: ForensicScanSummary;
    riskScore: number;
    riskLevel: RiskLevel;
  }> {
    const collectedData: Record<string, any> = {};
    const findings: SecurityFinding[] = [];
    const pluginOrder = [
      'DeviceInfoPlugin',
      'ApplicationPlugin',
      'ContactPlugin',
      'SmsPlugin',
      'ProcessPlugin',
      'SecurityPlugin'
    ];

    const ctx: PluginContext = {
      scanId: params.scanId,
      caseId: params.caseId,
      deviceSerial: params.deviceSerial,
      isDemo: params.isDemo,
      adbManager: params.adbManager,
      securityEngine: params.securityEngine,
      collectedData,
      findings,
      emitProgress: (percent, msg) => params.onProgress(percent, msg, 'IN_PROGRESS')
    };

    for (const pluginName of pluginOrder) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin) continue;

      params.onProgress(0, `Running ${plugin.name}...`, pluginName);
      const collResult = await plugin.collect(ctx);
      collectedData[plugin.name] = collResult.data;

      if (plugin.analyze) {
        const anaResult = await plugin.analyze(ctx, collResult);
        if (anaResult.findings && anaResult.findings.length > 0) {
          findings.push(...anaResult.findings);
        }
      }
    }

    params.onProgress(95, 'Compiling forensic risk metrics and summary report...', 'RISK_SCORING');

    const apps = collectedData['ApplicationPlugin'] || [];
    const contacts = collectedData['ContactPlugin'] || [];
    const sms = collectedData['SmsPlugin'] || [];
    const processes = collectedData['ProcessPlugin'] || [];
    const securityData = collectedData['SecurityPlugin'] || { securityScore: 85 };

    const suspiciousApps = apps.filter((a: any) => a.risk?.riskLevel === 'SUSPICIOUS' || a.risk?.riskLevel === 'HIGH_RISK' || a.risk?.riskLevel === 'CRITICAL');
    const highRiskApps = apps.filter((a: any) => a.risk?.riskLevel === 'HIGH_RISK' || a.risk?.riskLevel === 'CRITICAL');
    const suspiciousSms = sms.filter((s: any) => s.isSuspicious);

    // Calculate final overall risk level
    let overallRiskLevel: RiskLevel = 'SAFE';
    if (highRiskApps.length > 0 || findings.some(f => f.severity === 'CRITICAL')) {
      overallRiskLevel = 'CRITICAL';
    } else if (suspiciousApps.length > 0 || suspiciousSms.length > 0 || findings.some(f => f.severity === 'HIGH_RISK')) {
      overallRiskLevel = 'HIGH_RISK';
    } else if (securityData.securityScore < 70) {
      overallRiskLevel = 'SUSPICIOUS';
    } else if (securityData.securityScore < 90) {
      overallRiskLevel = 'INFORMATIONAL';
    }

    const summary: ForensicScanSummary = {
      totalApps: apps.length,
      systemApps: apps.filter((a: any) => a.isSystemApp).length,
      userApps: apps.filter((a: any) => !a.isSystemApp).length,
      sideloadedApps: apps.filter((a: any) => a.isSideloaded).length,
      suspiciousApps: suspiciousApps.length,
      highRiskApps: highRiskApps.length,
      securityToolsCount: apps.filter((a: any) => a.risk?.isPotentialSecurityTool).length,
      contactsCollected: contacts.length,
      contactsPermissionGranted: contacts.length > 0,
      smsCollected: sms.length,
      smsPermissionGranted: sms.length > 0,
      suspiciousSmsCount: suspiciousSms.length,
      runningProcessesCount: processes.length,
      securityFindingsCount: findings.length,
      securityScore: securityData.securityScore || 85,
      overallRiskLevel
    };

    return {
      collectedData,
      findings,
      summary,
      riskScore: 100 - (securityData.securityScore || 85),
      riskLevel: overallRiskLevel
    };
  }
}
