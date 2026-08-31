import {
  AppInfo,
  AppRiskAnalysis,
  DeviceInfo,
  ProcessInfo,
  RiskLevel,
  SecurityFinding,
  SecurityIndicator,
  SmsInfo
} from '@smart-forensic/shared';
import {
  DANGEROUS_PERMISSIONS,
  KNOWN_SECURITY_TESTING_TOOLS,
  SUSPICIOUS_PERMISSION_COMBINATIONS,
  SUSPICIOUS_SMS_KEYWORDS
} from '@smart-forensic/shared';
import permissionRulesData from '../rules/suspicious_permissions.json';
import securityToolsData from '../rules/security_tools.json';
import threatSignaturesData from '../rules/known_threat_patterns.json';

export class SecurityEngine {
  /**
   * Evaluates an application's risk profile based on transparent heuristics.
   */
  public analyzeApplication(
    app: {
      packageName: string;
      appName: string;
      versionName: string;
      versionCode: number;
      apkPath: string;
      installSource: string;
      isSystemApp: boolean;
      isSideloaded: boolean;
      isDebuggable: boolean;
      grantedPermissions: string[];
      requestedPermissions: string[];
      sha256?: string;
    }
  ): AppRiskAnalysis {
    let score = 0;
    const reasons: string[] = [];
    const flags: string[] = [];
    const sensitivePerms: string[] = [];
    let isPotentialSecurityTool = false;
    let toolCategory: string | undefined = undefined;

    const allPerms = Array.from(new Set([...app.requestedPermissions, ...app.grantedPermissions]));

    // Check known security/testing tools
    const toolMatch = securityToolsData.tools.find(
      t => app.packageName.startsWith(t.package) || app.appName.toLowerCase().includes(t.name.toLowerCase())
    );
    if (toolMatch) {
      isPotentialSecurityTool = true;
      toolCategory = toolMatch.category;
      flags.push(`SECURITY_TOOL:${toolMatch.category}`);
      reasons.push(`Potential security/testing utility detected (${toolMatch.category})`);
      score += toolMatch.riskScore * 0.4; // Weighted moderately
    }

    // Check threat intelligence signatures
    if (app.sha256) {
      const threatMatch = threatSignaturesData.signatures.find(s => s.sha256.toLowerCase() === app.sha256?.toLowerCase());
      if (threatMatch) {
        flags.push(`THREAT_INTEL_MATCH:${threatMatch.threatName}`);
        reasons.push(`Matches threat intelligence hash signature: ${threatMatch.threatName} (${threatMatch.category})`);
        score += 85;
      }
    }

    // Sideloaded detection
    if (app.isSideloaded && !app.isSystemApp) {
      score += 15;
      flags.push('SIDELOADED_APK');
      reasons.push('Application was sideloaded / installed outside the official app store');
    }

    // Debuggable build
    if (app.isDebuggable) {
      score += 15;
      flags.push('DEBUGGABLE_FLAG_ENABLED');
      reasons.push('Application has android:debuggable="true" enabled');
    }

    // Dangerous permissions evaluation
    let dangerousCount = 0;
    for (const perm of allPerms) {
      const permMeta = DANGEROUS_PERMISSIONS[perm];
      if (permMeta) {
        dangerousCount++;
        sensitivePerms.push(perm);
        score += permMeta.weight * 0.4;
      }
    }

    if (dangerousCount > 5) {
      score += 10;
      flags.push('EXCESSIVE_DANGEROUS_PERMISSIONS');
      reasons.push(`Requests a high number of dangerous permissions (${dangerousCount} sensitive permissions)`);
    }

    const hasOverlay = allPerms.includes('android.permission.SYSTEM_ALERT_WINDOW');
    const hasAccessibility = allPerms.includes('android.permission.BIND_ACCESSIBILITY_SERVICE');
    const hasDeviceAdmin = allPerms.includes('android.permission.BIND_DEVICE_ADMIN');

    if (hasOverlay) {
      flags.push('OVERLAY_CAPABILITY');
      reasons.push('Possesses screen overlay drawing capability');
    }
    if (hasAccessibility) {
      flags.push('ACCESSIBILITY_SERVICE_CAPABILITY');
      reasons.push('Possesses accessibility service inspection and interaction capability');
    }
    if (hasDeviceAdmin) {
      flags.push('DEVICE_ADMIN_CAPABILITY');
      reasons.push('Requests device administrator privileged controls');
    }

    // Check suspicious combinations
    for (const combo of SUSPICIOUS_PERMISSION_COMBINATIONS) {
      const matches = combo.requiredPermissions.every(p => allPerms.includes(p));
      if (matches) {
        score += combo.additionalRisk;
        flags.push(`COMBO:${combo.name.toUpperCase().replace(/\s+/g, '_')}`);
        reasons.push(`Suspicious permission cluster: ${combo.name} - ${combo.description}`);
      }
    }

    // System apps default reduction unless explicit threat match
    if (app.isSystemApp && !toolMatch) {
      score = Math.max(0, score * 0.3);
    }

    // Clamp score
    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    let riskLevel: RiskLevel = 'SAFE';
    if (finalScore >= 80) riskLevel = 'CRITICAL';
    else if (finalScore >= 60) riskLevel = 'HIGH_RISK';
    else if (finalScore >= 40) riskLevel = 'SUSPICIOUS';
    else if (finalScore >= 20) riskLevel = 'INFORMATIONAL';

    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (flags.length >= 3 || toolMatch || finalScore > 70) confidence = 'HIGH';
    else if (flags.length >= 1 || finalScore > 30) confidence = 'MEDIUM';

    if (reasons.length === 0) {
      reasons.push('Standard application profile with no elevated risk indicators identified.');
    }

    return {
      riskScore: finalScore,
      riskLevel,
      confidence,
      flags,
      reasons,
      sensitivePermissions: sensitivePerms,
      isSideloaded: app.isSideloaded,
      isDebuggable: app.isDebuggable,
      hasOverlayCapability: hasOverlay,
      hasAccessibilityService: hasAccessibility,
      hasDeviceAdmin: hasDeviceAdmin,
      isPotentialSecurityTool,
      toolCategory
    };
  }

  /**
   * Analyzes an SMS message for smishing, OTP harvesting, or scam indicators.
   */
  public analyzeSms(message: { id: string; address: string; body: string; date: string }): {
    isSuspicious: boolean;
    suspiciousReasons: string[];
    riskScore: number;
  } {
    let score = 0;
    const reasons: string[] = [];
    const lowerBody = message.body.toLowerCase();

    for (const item of SUSPICIOUS_SMS_KEYWORDS) {
      if (lowerBody.includes(item.word)) {
        score += item.weight;
        reasons.push(item.reason);
      }
    }

    // Check for external link presence
    if (/(https?:\/\/[^\s]+)/gi.test(message.body)) {
      score += 15;
      reasons.push('Contains hyperlink in message text');
    }

    // Check alphanumeric sender ID or short code
    if (/^[A-Za-z0-9]{3,8}$/.test(message.address) && score > 20) {
      score += 10;
      reasons.push('Sent from alphanumeric / short-code sender ID with urgent call to action');
    }

    const finalScore = Math.min(100, Math.max(0, score));
    const isSuspicious = finalScore >= 35;

    return {
      isSuspicious,
      suspiciousReasons: reasons,
      riskScore: finalScore
    };
  }

  /**
   * Inspects running process list and flags suspicious background processes.
   */
  public analyzeProcess(process: {
    pid: number;
    user: string;
    processName: string;
    cpuPercent: number;
    memoryKb: number;
  }): { isSuspicious: boolean; suspiciousReason?: string } {
    const lowerName = process.processName.toLowerCase();

    // Check for suspicious root or terminal payloads
    if (lowerName.includes('meterpreter') || lowerName.includes('reverse_tcp') || lowerName.includes('frida-server')) {
      return {
        isSuspicious: true,
        suspiciousReason: 'Process name matches known instrumentation or remote payload signature'
      };
    }

    if (process.user === 'root' && (lowerName.includes('su') || lowerName.includes('magisk') || lowerName.includes('daemonsu'))) {
      return {
        isSuspicious: true,
        suspiciousReason: 'Privileged root supervisor process active'
      };
    }

    if (process.cpuPercent > 80) {
      return {
        isSuspicious: true,
        suspiciousReason: `Unusually high CPU consumption (${process.cpuPercent}%)`
      };
    }

    return { isSuspicious: false };
  }

  /**
   * Generates comprehensive device integrity indicators and overall security posture score.
   */
  public evaluateDeviceIntegrity(device: Partial<DeviceInfo>): {
    securityScore: number;
    riskLevel: RiskLevel;
    indicators: SecurityIndicator[];
    scoreBreakdown: Array<{ factor: string; points: number; description: string }>;
  } {
    let penaltyScore = 0; // Starts from 0 penalty, score = 100 - penaltyScore
    const indicators: SecurityIndicator[] = [];
    const scoreBreakdown: Array<{ factor: string; points: number; description: string }> = [];

    // 1. Root detection
    if (device.rootDetected) {
      penaltyScore += 30;
      scoreBreakdown.push({
        factor: 'Root Privileges Detected',
        points: -30,
        description: `Device is rooted or su binaries were located (${(device.rootIndicators || []).join(', ')})`
      });
      indicators.push({
        id: 'root-detected',
        category: 'OS_INTEGRITY',
        title: 'Root / Superuser Access',
        status: 'DETECTED',
        severity: 'CRITICAL',
        scoreImpact: -30,
        details: `Root binary presence verified: ${(device.rootIndicators || []).join(', ')}`,
        recommendation: 'Verify if rooting was authorized for device testing; rooting bypasses Android sandbox security.'
      });
    } else {
      indicators.push({
        id: 'root-not-detected',
        category: 'OS_INTEGRITY',
        title: 'Root / Superuser Access',
        status: 'NOT_DETECTED',
        severity: 'LOW',
        scoreImpact: 0,
        details: 'No standard root binaries or Superuser managers detected in system paths.',
        recommendation: 'Android application sandbox isolation remains intact.'
      });
    }

    // 2. Verified Boot State
    const vBoot = (device.verifiedBootState || '').toLowerCase();
    if (vBoot === 'orange' || vBoot === 'red' || device.bootloaderUnlocked) {
      penaltyScore += 20;
      scoreBreakdown.push({
        factor: 'Bootloader Unlocked / Tampered',
        points: -20,
        description: `Verified boot state is '${vBoot || 'unlocked'}'`
      });
      indicators.push({
        id: 'bootloader-unlocked',
        category: 'OS_INTEGRITY',
        title: 'Android Verified Boot',
        status: 'DETECTED',
        severity: 'HIGH',
        scoreImpact: -20,
        details: `Bootloader is unlocked. Verified boot state: ${vBoot || 'unlocked'}`,
        recommendation: 'Lock the bootloader to ensure kernel and partition integrity verification at boot time.'
      });
    } else {
      indicators.push({
        id: 'verified-boot-green',
        category: 'OS_INTEGRITY',
        title: 'Android Verified Boot',
        status: 'NOT_DETECTED',
        severity: 'LOW',
        scoreImpact: 0,
        details: `Verified boot is active (State: ${device.verifiedBootState || 'green'})`,
        recommendation: 'Hardware cryptographic chain of trust is active.'
      });
    }

    // 3. Security Patch Age
    const patchAgeDays = device.securityPatchAgeDays || 0;
    if (patchAgeDays > 365) {
      penaltyScore += 25;
      scoreBreakdown.push({
        factor: 'Critically Outdated Security Patch',
        points: -25,
        description: `Security patch is ${Math.round(patchAgeDays / 30)} months old (${device.securityPatchLevel})`
      });
      indicators.push({
        id: 'patch-critically-outdated',
        category: 'OS_INTEGRITY',
        title: 'Security Patch Level',
        status: 'DETECTED',
        severity: 'HIGH',
        scoreImpact: -25,
        details: `Patch level: ${device.securityPatchLevel || 'Unknown'} (${patchAgeDays} days old)`,
        recommendation: 'Update device firmware to the latest available vendor security bulletin patch.'
      });
    } else if (patchAgeDays > 120) {
      penaltyScore += 10;
      scoreBreakdown.push({
        factor: 'Outdated Security Patch',
        points: -10,
        description: `Security patch is ${Math.round(patchAgeDays / 30)} months old (${device.securityPatchLevel})`
      });
      indicators.push({
        id: 'patch-outdated',
        category: 'OS_INTEGRITY',
        title: 'Security Patch Level',
        status: 'DETECTED',
        severity: 'MODERATE',
        scoreImpact: -10,
        details: `Patch level: ${device.securityPatchLevel} (${patchAgeDays} days old)`,
        recommendation: 'Check for available system updates.'
      });
    } else {
      indicators.push({
        id: 'patch-current',
        category: 'OS_INTEGRITY',
        title: 'Security Patch Level',
        status: 'NOT_DETECTED',
        severity: 'LOW',
        scoreImpact: 0,
        details: `Recent security patch level (${device.securityPatchLevel || 'Current'})`,
        recommendation: 'Firmware is running up-to-date security patches.'
      });
    }

    // 4. Developer Options / USB Debugging
    if (device.developerOptionsEnabled || device.adbEnabled) {
      penaltyScore += 10;
      scoreBreakdown.push({
        factor: 'Developer Mode / ADB Active',
        points: -10,
        description: 'USB Debugging and Developer options are active on the device'
      });
      indicators.push({
        id: 'dev-options-enabled',
        category: 'DEBUG_ACCESS',
        title: 'Developer Options & USB Debugging',
        status: 'DETECTED',
        severity: 'MODERATE',
        scoreImpact: -10,
        details: 'USB debugging is currently enabled to allow authorized forensic interaction.',
        recommendation: 'Disable USB debugging when forensic acquisition is concluded.'
      });
    }

    // 5. Encryption State
    const encState = (device.encryptionState || '').toLowerCase();
    if (encState === 'unencrypted') {
      penaltyScore += 20;
      scoreBreakdown.push({
        factor: 'Storage Not Encrypted',
        points: -20,
        description: 'Device file-based or full-disk encryption is inactive'
      });
      indicators.push({
        id: 'storage-unencrypted',
        category: 'DEVICE_HARDWARE',
        title: 'Filesystem Encryption',
        status: 'DETECTED',
        severity: 'HIGH',
        scoreImpact: -20,
        details: 'Device storage is unencrypted.',
        recommendation: 'Enable File-Based Encryption (FBE) to safeguard data at rest.'
      });
    } else {
      indicators.push({
        id: 'storage-encrypted',
        category: 'DEVICE_HARDWARE',
        title: 'Filesystem Encryption',
        status: 'NOT_DETECTED',
        severity: 'LOW',
        scoreImpact: 0,
        details: 'Device storage encryption (FBE/FDE) is active.',
        recommendation: 'Data partition is hardware-backed encrypted.'
      });
    }

    const calculatedScore = Math.min(100, Math.max(0, 100 - penaltyScore));

    let riskLevel: RiskLevel = 'SAFE';
    if (calculatedScore < 40) riskLevel = 'CRITICAL';
    else if (calculatedScore < 60) riskLevel = 'HIGH_RISK';
    else if (calculatedScore < 75) riskLevel = 'SUSPICIOUS';
    else if (calculatedScore < 90) riskLevel = 'INFORMATIONAL';

    return {
      securityScore: calculatedScore,
      riskLevel,
      indicators,
      scoreBreakdown
    };
  }
}
