import { ForensicPlugin, PluginAnalysisResult, PluginCollectionResult, PluginContext } from './ForensicPlugin';
import { RiskLevel, SmsInfo } from '@smart-forensic/shared';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';

export class SmsPlugin implements ForensicPlugin {
  readonly name = 'SmsPlugin';
  readonly version = '1.0.0';
  readonly description = 'Collects authorized SMS messages via Android Companion Agent and analyzes for smishing/phishing indicators';
  readonly requiredPermissions = ['android.permission.READ_SMS'];
  readonly supportedAndroidVersions = 'Android 7.0 - 15+ (API 24 - 35)';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult<SmsInfo[]>> {
    ctx.emitProgress(68, 'Checking Android companion SMS authorization...');

    if (ctx.isDemo) {
      const demoSms = DemoDataGenerator.getDemoSms();
      return {
        success: true,
        data: demoSms,
        permissionGranted: true,
        message: `Collected ${demoSms.length} authorized SMS messages (Demo Mode)`
      };
    }

    try {
      const response = await fetch('http://127.0.0.1:47822/api/companion/sms', {
        headers: { 'X-Agent-Token': process.env.LOCAL_AGENT_TOKEN || 'forensic-agent-token-local-auth' },
        signal: AbortSignal.timeout(3000)
      }).catch(() => null);

      if (response && response.ok) {
        const payload: any = await response.json();
        const rawMessages = payload.sms || [];
        const analyzed = rawMessages.map((m: any) => {
          const analysis = ctx.securityEngine.analyzeSms(m);
          return { ...m, ...analysis };
        });

        return {
          success: true,
          data: analyzed,
          permissionGranted: true,
          message: `Collected and analyzed ${analyzed.length} authorized SMS messages`
        };
      }

      return {
        success: true,
        data: [],
        permissionGranted: false,
        message: 'SMS collection unavailable or permission was not granted on this device/configuration.'
      };
    } catch {
      return {
        success: true,
        data: [],
        permissionGranted: false,
        message: 'SMS permission not granted. Non-invasive collection skipped.'
      };
    }
  }

  async analyze(ctx: PluginContext, result: PluginCollectionResult<SmsInfo[]>): Promise<PluginAnalysisResult> {
    const messages = result.data || [];
    const suspicious = messages.filter(m => m.isSuspicious);

    const findings: any[] = [];
    for (const msg of suspicious) {
      findings.push({
        id: `fnd-sms-${msg.id}`,
        category: 'SMS_PHISHING',
        title: `Smishing / Phishing Indicator in SMS (${msg.address})`,
        description: `Message flagged for: ${msg.suspiciousReasons.join(', ')}`,
        severity: msg.riskScore > 60 ? 'HIGH_RISK' : 'SUSPICIOUS',
        evidence: [
          `Sender: ${msg.address}`,
          `Date: ${msg.date}`,
          `Risk Score: ${msg.riskScore}/100`,
          `Flagged Keywords/Links: ${msg.suspiciousReasons.join(', ')}`
        ],
        confidence: 'HIGH',
        affectedItem: `SMS from ${msg.address}`,
        recommendation: 'Do not click external links or provide authentication OTPs in response to unsolicited SMS requests.'
      });
    }

    let riskLevel: RiskLevel = 'SAFE';
    if (suspicious.some(s => s.riskScore >= 70)) riskLevel = 'HIGH_RISK';
    else if (suspicious.length > 0) riskLevel = 'SUSPICIOUS';

    return {
      riskScore: suspicious.length > 0 ? 55 : 0,
      riskLevel,
      findings,
      summary: {
        total: messages.length,
        suspiciousCount: suspicious.length,
        permissionGranted: result.permissionGranted ?? false
      }
    };
  }
}
