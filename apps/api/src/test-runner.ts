import { SecurityEngine } from '@smart-forensic/security-engine';

export function runSecurityEngineTests() {
  console.log('--- Running SecurityEngine Heuristic Tests ---');
  const engine = new SecurityEngine();

  // Test 1: Sideloaded Banking Trojan Profile with Accessibility & Overlay
  const bankingTrojan = {
    packageName: 'com.fakebank.trojan',
    appName: 'Bank Login Helper',
    versionName: '1.0.0',
    versionCode: 1,
    apkPath: '/data/app/~~fake==/base.apk',
    installSource: 'com.android.packageinstaller',
    isSystemApp: false,
    isSideloaded: true,
    isDebuggable: true,
    grantedPermissions: [
      'android.permission.BIND_ACCESSIBILITY_SERVICE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS'
    ],
    requestedPermissions: [
      'android.permission.BIND_ACCESSIBILITY_SERVICE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_SMS',
      'android.permission.RECEIVE_SMS'
    ]
  };

  const trojanRisk = engine.analyzeApplication(bankingTrojan);
  console.log(`[Test 1] Banking Trojan Score: ${trojanRisk.riskScore}/100, Level: ${trojanRisk.riskLevel}`);
  if (trojanRisk.riskScore < 60 || (trojanRisk.riskLevel !== 'HIGH_RISK' && trojanRisk.riskLevel !== 'CRITICAL')) {
    throw new Error(`Expected High Risk or Critical for banking trojan profile, got: ${trojanRisk.riskLevel}`);
  }
  console.log('✓ Test 1 Passed: Correctly flagged high-risk accessibility/overlay banking trojan.');

  // Test 2: Standard Benign Application
  const benignApp = {
    packageName: 'com.example.calculator',
    appName: 'Simple Calculator',
    versionName: '1.2.0',
    versionCode: 12,
    apkPath: '/data/app/~~calc==/base.apk',
    installSource: 'com.android.vending',
    isSystemApp: false,
    isSideloaded: false,
    isDebuggable: false,
    grantedPermissions: ['android.permission.VIBRATE'],
    requestedPermissions: ['android.permission.VIBRATE']
  };

  const benignRisk = engine.analyzeApplication(benignApp);
  console.log(`[Test 2] Benign App Score: ${benignRisk.riskScore}/100, Level: ${benignRisk.riskLevel}`);
  if (benignRisk.riskLevel !== 'SAFE' && benignRisk.riskLevel !== 'INFORMATIONAL') {
    throw new Error(`Expected Safe or Informational for benign calculator, got: ${benignRisk.riskLevel}`);
  }
  console.log('✓ Test 2 Passed: Correctly categorized benign app.');

  // Test 3: SMS Phishing Heuristics
  const phishingSms = {
    id: 'sms-test-1',
    address: 'SBI-ALERT',
    date: '2026-08-31 12:00:00',
    body: 'URGENT: Your bank account is suspended. Update KYC now at bit.ly/verify-kyc to unblock.'
  };

  const smsAnalysis = engine.analyzeSms(phishingSms);
  console.log(`[Test 3] Phishing SMS Score: ${smsAnalysis.riskScore}/100, Flagged: ${smsAnalysis.isSuspicious}`);
  if (!smsAnalysis.isSuspicious) {
    throw new Error('Expected SMS smishing message to be flagged as suspicious');
  }
  console.log('✓ Test 3 Passed: Correctly identified SMS smishing with KYC urgency and shortened URL.');

  // Test 4: Device Integrity Score
  const device = {
    rootDetected: false,
    bootloaderUnlocked: false,
    verifiedBootState: 'green',
    securityPatchAgeDays: 30,
    developerOptionsEnabled: true,
    encryptionState: 'encrypted'
  };

  const integrity = engine.evaluateDeviceIntegrity(device);
  console.log(`[Test 4] Device Security Score: ${integrity.securityScore}/100, Level: ${integrity.riskLevel}`);
  if (integrity.securityScore < 80) {
    throw new Error(`Expected clean device security score >= 80, got ${integrity.securityScore}`);
  }
  console.log('✓ Test 4 Passed: Device security integrity evaluation passed.');

  console.log('--- All SecurityEngine Tests Passed Successfully! ---');
}

runSecurityEngineTests();
