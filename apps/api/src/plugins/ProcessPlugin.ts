import { ForensicPlugin, PluginAnalysisResult, PluginCollectionResult, PluginContext } from './ForensicPlugin';
import { ProcessInfo, RiskLevel } from '@smart-forensic/shared';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';

export class ProcessPlugin implements ForensicPlugin {
  readonly name = 'ProcessPlugin';
  readonly version = '1.0.0';
  readonly description = 'Enumerates legitimately exposed running processes and correlates with suspicious applications';
  readonly requiredPermissions = ['ADB Shell ps/top access'];
  readonly supportedAndroidVersions = 'Android 7.0 - 15+ (API 24 - 35)';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult<ProcessInfo[]>> {
    ctx.emitProgress(80, 'Auditing running system and application processes...');

    if (ctx.isDemo) {
      const demoProcesses = DemoDataGenerator.getDemoProcesses();
      return {
        success: true,
        data: demoProcesses,
        permissionGranted: true,
        message: `Audited ${demoProcesses.length} running processes (Demo Mode)`
      };
    }

    try {
      const processes = await ctx.adbManager.getRunningProcesses(ctx.deviceSerial);
      const evaluated = processes.map(p => {
        const check = ctx.securityEngine.analyzeProcess(p);
        return {
          ...p,
          ...check
        };
      });

      return {
        success: true,
        data: evaluated,
        permissionGranted: true,
        message: `Audited ${evaluated.length} running processes`
      };
    } catch (err: any) {
      return {
        success: false,
        data: [],
        error: err.message || 'Failed to enumerate running processes'
      };
    }
  }

  async analyze(ctx: PluginContext, result: PluginCollectionResult<ProcessInfo[]>): Promise<PluginAnalysisResult> {
    const processes = result.data || [];
    const suspicious = processes.filter(p => p.isSuspicious);

    const findings: any[] = [];
    for (const proc of suspicious) {
      findings.push({
        id: `fnd-proc-${proc.pid}`,
        category: 'ROOT_TAMPERING',
        title: `Suspicious Process Activity: ${proc.processName} (PID ${proc.pid})`,
        description: proc.suspiciousReason || 'Flagged for abnormal resource or permission behavior',
        severity: 'HIGH_RISK',
        evidence: [
          `PID: ${proc.pid}`,
          `User: ${proc.user}`,
          `Process: ${proc.processName}`,
          `CPU: ${proc.cpuPercent}%`,
          `Memory: ${proc.formattedMemory}`
        ],
        confidence: 'HIGH',
        affectedItem: proc.processName,
        recommendation: 'Inspect associated application package and termination trace.'
      });
    }

    let riskLevel: RiskLevel = 'SAFE';
    if (suspicious.length > 0) riskLevel = 'HIGH_RISK';

    return {
      riskScore: suspicious.length > 0 ? 60 : 0,
      riskLevel,
      findings,
      summary: {
        total: processes.length,
        running: processes.filter(p => p.status === 'Running' || p.status === 'Foreground').length,
        suspiciousCount: suspicious.length
      }
    };
  }
}
