import { ForensicPlugin, PluginAnalysisResult, PluginCollectionResult, PluginContext } from './ForensicPlugin';
import { DeviceInfo, RiskLevel, SecurityIndicator } from '@smart-forensic/shared';

export class SecurityPlugin implements ForensicPlugin {
  readonly name = 'SecurityPlugin';
  readonly version = '1.0.0';
  readonly description = 'Evaluates device integrity, verified boot, patch age, ADB/developer mode, and root status';
  readonly requiredPermissions = ['ADB Properties Inspection'];
  readonly supportedAndroidVersions = 'Android 7.0 - 15+ (API 24 - 35)';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult<{ indicators: SecurityIndicator[]; securityScore: number; scoreBreakdown: any[] }>> {
    ctx.emitProgress(88, 'Calculating device integrity and security posture score...');

    const deviceInfo: DeviceInfo = ctx.collectedData['DeviceInfoPlugin'] || {};
    const integrity = ctx.securityEngine.evaluateDeviceIntegrity(deviceInfo);

    return {
      success: true,
      data: {
        indicators: integrity.indicators,
        securityScore: integrity.securityScore,
        scoreBreakdown: integrity.scoreBreakdown
      },
      permissionGranted: true,
      message: `Security score calculated: ${integrity.securityScore}/100`
    };
  }

  async analyze(ctx: PluginContext, result: PluginCollectionResult<any>): Promise<PluginAnalysisResult> {
    const data = result.data;
    const indicators: SecurityIndicator[] = data.indicators || [];
    const criticals = indicators.filter(i => i.severity === 'CRITICAL' && i.status === 'DETECTED');
    const highs = indicators.filter(i => i.severity === 'HIGH' && i.status === 'DETECTED');

    const findings: any[] = [];
    for (const ind of indicators.filter(i => i.status === 'DETECTED' && (i.severity === 'HIGH' || i.severity === 'CRITICAL'))) {
      findings.push({
        id: `fnd-sec-${ind.id}`,
        category: 'OS_VULNERABILITY',
        title: ind.title,
        description: ind.details,
        severity: ind.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH_RISK',
        evidence: [ind.details],
        confidence: 'HIGH',
        affectedItem: 'Device OS / Firmware',
        recommendation: ind.recommendation
      });
    }

    let riskLevel: RiskLevel = 'SAFE';
    if (criticals.length > 0) riskLevel = 'CRITICAL';
    else if (highs.length > 0) riskLevel = 'HIGH_RISK';
    else if (data.securityScore < 70) riskLevel = 'SUSPICIOUS';

    return {
      riskScore: 100 - data.securityScore,
      riskLevel,
      findings,
      summary: {
        securityScore: data.securityScore,
        totalIndicators: indicators.length,
        detectedCount: indicators.filter(i => i.status === 'DETECTED').length
      }
    };
  }
}
