import { ForensicPlugin, PluginCollectionResult, PluginContext, PluginAnalysisResult } from './ForensicPlugin';
import { AppInfo, RiskLevel } from '@smart-forensic/shared';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';

export class ApplicationPlugin implements ForensicPlugin {
  readonly name = 'ApplicationPlugin';
  readonly version = '1.0.0';
  readonly description = 'Enumerates installed packages, extracts permissions, detects sideloading, and computes heuristic risk scores';
  readonly requiredPermissions = ['ADB Package Manager Access'];
  readonly supportedAndroidVersions = 'Android 7.0 - 15+ (API 24 - 35)';

  async collect(ctx: PluginContext): Promise<PluginCollectionResult<AppInfo[]>> {
    ctx.emitProgress(25, 'Enumerating installed packages and application permissions...');

    if (ctx.isDemo) {
      const demoApps = DemoDataGenerator.getDemoApplications();
      return {
        success: true,
        data: demoApps,
        permissionGranted: true,
        message: `Enumerated ${demoApps.length} demo applications`
      };
    }

    try {
      const rawPackages = await ctx.adbManager.getInstalledPackages(ctx.deviceSerial);
      const apps: AppInfo[] = [];

      // Limit to 60 apps for fast interactive scan or full scan
      const targetList = rawPackages.slice(0, 60);

      for (let i = 0; i < targetList.length; i++) {
        const item = targetList[i];
        const progressPct = 25 + Math.round((i / targetList.length) * 20);
        ctx.emitProgress(progressPct, `Inspecting permissions for ${item.packageName}...`);

        const meta = await ctx.adbManager.getPackageMetadata(ctx.deviceSerial, item.packageName);
        
        // Clean app name from package
        const nameParts = item.packageName.split('.');
        const appName = nameParts[nameParts.length - 1]
          .replace(/^[a-z]/, (c) => c.toUpperCase())
          .replace(/_/g, ' ');

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
          dangerousPermissions: meta.requestedPermissions.filter(p =>
            p.includes('SMS') || p.includes('CONTACTS') || p.includes('LOCATION') ||
            p.includes('CAMERA') || p.includes('RECORD_AUDIO') || p.includes('ACCESSIBILITY') ||
            p.includes('SYSTEM_ALERT_WINDOW') || p.includes('STORAGE') || p.includes('INSTALL_PACKAGES')
          )
        };

        const risk = ctx.securityEngine.analyzeApplication(appData);

        apps.push({
          ...appData,
          risk
        });
      }

      return {
        success: true,
        data: apps,
        permissionGranted: true,
        message: `Successfully analyzed ${apps.length} applications`
      };
    } catch (err: any) {
      return {
        success: false,
        data: [],
        error: err.message || 'Failed to enumerate installed packages'
      };
    }
  }

  async analyze(ctx: PluginContext, result: PluginCollectionResult<AppInfo[]>): Promise<PluginAnalysisResult> {
    const apps = result.data || [];
    const suspicious = apps.filter(a => a.risk.riskLevel === 'SUSPICIOUS' || a.risk.riskLevel === 'HIGH_RISK' || a.risk.riskLevel === 'CRITICAL');
    const highRisk = apps.filter(a => a.risk.riskLevel === 'HIGH_RISK' || a.risk.riskLevel === 'CRITICAL');

    let totalScore = 0;
    if (apps.length > 0) {
      const topScores = apps.map(a => a.risk.riskScore).sort((a, b) => b - a).slice(0, 5);
      totalScore = Math.round(topScores.reduce((sum, s) => sum + s, 0) / Math.max(1, topScores.length));
    }

    let riskLevel: RiskLevel = 'SAFE';
    if (highRisk.length > 0) riskLevel = 'CRITICAL';
    else if (suspicious.length > 0) riskLevel = 'SUSPICIOUS';

    const findings: any[] = [];
    for (const sApp of suspicious) {
      findings.push({
        id: `fnd-app-${sApp.packageName}`,
        category: 'APPLICATION',
        title: `Suspicious Application Profile: ${sApp.appName}`,
        description: sApp.risk.reasons.join('. '),
        severity: sApp.risk.riskLevel,
        evidence: sApp.risk.flags,
        confidence: sApp.risk.confidence,
        affectedItem: sApp.packageName,
        recommendation: 'Review application necessity and inspect background runtime behaviors.'
      });
    }

    return {
      riskScore: totalScore,
      riskLevel,
      findings,
      summary: {
        total: apps.length,
        userApps: apps.filter(a => !a.isSystemApp).length,
        systemApps: apps.filter(a => a.isSystemApp).length,
        sideloaded: apps.filter(a => a.isSideloaded).length,
        suspiciousCount: suspicious.length,
        highRiskCount: highRisk.length
      }
    };
  }
}
