import {
  AdbDevice,
  AppInfo,
  ContactInfo,
  DeviceInfo,
  ProcessInfo,
  SecurityFinding,
  SecurityIndicator,
  SmsInfo
} from '@smart-forensic/shared';
import { SecurityEngine } from '@smart-forensic/security-engine';

export class DemoDataGenerator {
  private static securityEngine = new SecurityEngine();

  public static getDemoDevices(): AdbDevice[] {
    return [
      {
        serial: 'DEMO-PIXEL8-SEC01',
        maskedSerial: 'DEMO••••EC01',
        state: 'device',
        model: 'Pixel 8 Pro',
        product: 'husky',
        device: 'husky',
        isDemo: true
      },
      {
        serial: 'DEMO-S24U-FORENSIC02',
        maskedSerial: 'DEMO••••IC02',
        state: 'device',
        model: 'Galaxy S24 Ultra',
        product: 'e3q',
        device: 'SM-S928B',
        isDemo: true
      }
    ];
  }

  public static getDemoDeviceInfo(serial = 'DEMO-PIXEL8-SEC01'): DeviceInfo {
    const isSamsung = serial.includes('S24');

    return {
      serial,
      maskedSerial: serial.substring(0, 4) + '••••' + serial.substring(serial.length - 4),
      manufacturer: isSamsung ? 'Samsung' : 'Google',
      model: isSamsung ? 'Galaxy S24 Ultra' : 'Pixel 8 Pro',
      marketName: isSamsung ? 'Samsung Galaxy S24 Ultra' : 'Google Pixel 8 Pro',
      androidVersion: isSamsung ? '14' : '15',
      apiLevel: isSamsung ? 34 : 35,
      buildNumber: isSamsung ? 'UP1A.231005.007.S928BXXU1AXB5' : 'AP2A.240805.005',
      buildFingerprint: isSamsung
        ? 'samsung/e3qxxx/e3q:14/UP1A.231005.007/S928BXXU1AXB5:user/release-keys'
        : 'google/husky/husky:15/AP2A.240805.005/11993414:user/release-keys',
      securityPatchLevel: isSamsung ? '2024-02-01' : '2024-08-05',
      securityPatchAgeDays: isSamsung ? 210 : 25,
      architecture: 'arm64-v8a',
      screenResolution: isSamsung ? '1440x3120' : '1344x2992',
      screenDensityDpi: isSamsung ? 505 : 489,
      bootloaderUnlocked: false,
      verifiedBootState: 'green',
      encryptionState: 'encrypted',
      developerOptionsEnabled: true,
      adbEnabled: true,
      rootDetected: false,
      rootIndicators: [],
      battery: {
        level: 88,
        scale: 100,
        voltage: 4210,
        temperature: 29.4,
        status: 'Charging',
        health: 'Good',
        acPowered: false,
        usbPowered: true
      },
      storage: {
        totalBytes: 256 * 1024 * 1024 * 1024,
        usedBytes: 94 * 1024 * 1024 * 1024,
        freeBytes: 162 * 1024 * 1024 * 1024,
        percentageUsed: 37,
        formattedTotal: '256.0 GB',
        formattedUsed: '94.0 GB',
        formattedFree: '162.0 GB'
      },
      memory: {
        totalKb: 12 * 1024 * 1024,
        freeKb: 2.8 * 1024 * 1024,
        availableKb: 5.4 * 1024 * 1024,
        cachedKb: 2.6 * 1024 * 1024,
        percentageUsed: 55,
        formattedTotal: '12.0 GB',
        formattedUsed: '6.6 GB',
        formattedFree: '5.4 GB'
      },
      network: {
        wifiEnabled: true,
        wifiSsid: 'ForensicLab_Secure_5G',
        wifiIpAddress: '192.168.1.142',
        cellularType: '5G NR',
        bluetoothEnabled: true
      },
      isDemo: true,
      lastUpdated: new Date().toISOString()
    };
  }

  public static getDemoApplications(): AppInfo[] {
    const rawApps = [
      {
        packageName: 'com.quickcredit.loanapp',
        appName: 'QuickPay Instant Loan',
        versionName: '2.4.1',
        versionCode: 24,
        apkPath: '/data/app/~~t8z9Q==/com.quickcredit.loanapp-1/base.apk',
        installSource: 'com.android.packageinstaller',
        isSystemApp: false,
        isSideloaded: true,
        isDebuggable: true,
        sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        requestedPermissions: [
          'android.permission.READ_SMS',
          'android.permission.RECEIVE_SMS',
          'android.permission.READ_CONTACTS',
          'android.permission.WRITE_CONTACTS',
          'android.permission.SYSTEM_ALERT_WINDOW',
          'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.RECEIVE_BOOT_COMPLETED',
          'android.permission.RECORD_AUDIO',
          'android.permission.INTERNET'
        ],
        grantedPermissions: [
          'android.permission.READ_SMS',
          'android.permission.RECEIVE_SMS',
          'android.permission.READ_CONTACTS',
          'android.permission.SYSTEM_ALERT_WINDOW',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.RECEIVE_BOOT_COMPLETED',
          'android.permission.INTERNET'
        ],
        dangerousPermissions: [
          'android.permission.READ_SMS',
          'android.permission.RECEIVE_SMS',
          'android.permission.READ_CONTACTS',
          'android.permission.SYSTEM_ALERT_WINDOW',
          'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.RECORD_AUDIO'
        ]
      },
      {
        packageName: 'com.system.security.optimizer',
        appName: 'Phone Boost & Clean Master',
        versionName: '1.0.8',
        versionCode: 108,
        apkPath: '/data/app/~~m4v2A==/com.system.security.optimizer-1/base.apk',
        installSource: 'Sideloaded / Direct APK',
        isSystemApp: false,
        isSideloaded: true,
        isDebuggable: false,
        requestedPermissions: [
          'android.permission.REQUEST_INSTALL_PACKAGES',
          'android.permission.RECEIVE_BOOT_COMPLETED',
          'android.permission.MANAGE_EXTERNAL_STORAGE',
          'android.permission.BIND_DEVICE_ADMIN',
          'android.permission.INTERNET'
        ],
        grantedPermissions: [
          'android.permission.REQUEST_INSTALL_PACKAGES',
          'android.permission.RECEIVE_BOOT_COMPLETED',
          'android.permission.MANAGE_EXTERNAL_STORAGE',
          'android.permission.INTERNET'
        ],
        dangerousPermissions: [
          'android.permission.REQUEST_INSTALL_PACKAGES',
          'android.permission.MANAGE_EXTERNAL_STORAGE',
          'android.permission.BIND_DEVICE_ADMIN'
        ]
      },
      {
        packageName: 'com.emanuelef.remote_capture',
        appName: 'PCAPdroid',
        versionName: '1.7.2',
        versionCode: 172,
        apkPath: '/data/app/~~pcap88==/com.emanuelef.remote_capture-1/base.apk',
        installSource: 'com.android.vending',
        isSystemApp: false,
        isSideloaded: false,
        isDebuggable: false,
        requestedPermissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.POST_NOTIFICATIONS',
          'android.permission.FOREGROUND_SERVICE'
        ],
        grantedPermissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_NETWORK_STATE',
          'android.permission.POST_NOTIFICATIONS',
          'android.permission.FOREGROUND_SERVICE'
        ],
        dangerousPermissions: []
      },
      {
        packageName: 'com.termux',
        appName: 'Termux',
        versionName: '0.118.0',
        versionCode: 118,
        apkPath: '/data/app/~~termux1==/com.termux-1/base.apk',
        installSource: 'com.android.vending',
        isSystemApp: false,
        isSideloaded: false,
        isDebuggable: false,
        requestedPermissions: [
          'android.permission.INTERNET',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
          'android.permission.WAKE_LOCK'
        ],
        grantedPermissions: [
          'android.permission.INTERNET',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE'
        ],
        dangerousPermissions: [
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE'
        ]
      },
      {
        packageName: 'com.whatsapp',
        appName: 'WhatsApp',
        versionName: '2.24.16.76',
        versionCode: 241676001,
        apkPath: '/data/app/~~wa991==/com.whatsapp-1/base.apk',
        installSource: 'com.android.vending',
        isSystemApp: false,
        isSideloaded: false,
        isDebuggable: false,
        requestedPermissions: [
          'android.permission.READ_CONTACTS',
          'android.permission.CAMERA',
          'android.permission.RECORD_AUDIO',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.INTERNET',
          'android.permission.VIBRATE'
        ],
        grantedPermissions: [
          'android.permission.READ_CONTACTS',
          'android.permission.CAMERA',
          'android.permission.RECORD_AUDIO',
          'android.permission.INTERNET'
        ],
        dangerousPermissions: [
          'android.permission.READ_CONTACTS',
          'android.permission.CAMERA',
          'android.permission.RECORD_AUDIO',
          'android.permission.ACCESS_FINE_LOCATION'
        ]
      },
      {
        packageName: 'com.google.android.apps.messaging',
        appName: 'Messages',
        versionName: '20240801_01_RC00',
        versionCode: 24080100,
        apkPath: '/system/priv-app/Messages/Messages.apk',
        installSource: 'System Firmware',
        isSystemApp: true,
        isSideloaded: false,
        isDebuggable: false,
        requestedPermissions: [
          'android.permission.READ_SMS',
          'android.permission.RECEIVE_SMS',
          'android.permission.SEND_SMS',
          'android.permission.READ_CONTACTS'
        ],
        grantedPermissions: [
          'android.permission.READ_SMS',
          'android.permission.RECEIVE_SMS',
          'android.permission.SEND_SMS',
          'android.permission.READ_CONTACTS'
        ],
        dangerousPermissions: [
          'android.permission.READ_SMS',
          'android.permission.RECEIVE_SMS',
          'android.permission.SEND_SMS',
          'android.permission.READ_CONTACTS'
        ]
      },
      {
        packageName: 'com.android.chrome',
        appName: 'Google Chrome',
        versionName: '127.0.6533.103',
        versionCode: 653310332,
        apkPath: '/system/app/Chrome/Chrome.apk',
        installSource: 'System Firmware',
        isSystemApp: true,
        isSideloaded: false,
        isDebuggable: false,
        requestedPermissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.CAMERA'
        ],
        grantedPermissions: [
          'android.permission.INTERNET',
          'android.permission.ACCESS_FINE_LOCATION'
        ],
        dangerousPermissions: [
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.CAMERA'
        ]
      }
    ];

    return rawApps.map(app => {
      const risk = this.securityEngine.analyzeApplication(app);
      return {
        ...app,
        risk
      };
    });
  }

  public static getDemoContacts(): ContactInfo[] {
    return [
      {
        id: 'cnt-001',
        name: 'Sarah Jenkins',
        phoneNumbers: [{ number: '+1 (555) 234-5678', type: 'Mobile' }],
        emails: [{ email: 's.jenkins@corpsec.io', type: 'Work' }],
        organization: 'Cyber Defense Corp',
        source: 'Google Account',
        lastContactedTime: '2026-08-30 14:22:00',
        isDuplicate: false
      },
      {
        id: 'cnt-002',
        name: 'Sarah Jenkins',
        phoneNumbers: [{ number: '+1 (555) 234-5678', type: 'Mobile' }],
        emails: [{ email: 'sarah.j@gmail.com', type: 'Personal' }],
        organization: 'Cyber Defense Corp',
        source: 'WhatsApp',
        lastContactedTime: '2026-08-29 18:10:00',
        isDuplicate: true
      },
      {
        id: 'cnt-003',
        name: 'David Vance (Lead Investigator)',
        phoneNumbers: [{ number: '+1 (555) 876-5432', type: 'Work' }],
        emails: [{ email: 'd.vance@govsec.gov', type: 'Work' }],
        organization: 'Federal Cyber Forensics',
        source: 'Google Account',
        lastContactedTime: '2026-08-31 09:15:00',
        isDuplicate: false
      },
      {
        id: 'cnt-004',
        name: 'Elena Rostova',
        phoneNumbers: [{ number: '+44 7700 900123', type: 'Mobile' }],
        emails: [{ email: 'elena.rostova@techvault.org', type: 'Work' }],
        organization: 'TechVault UK',
        source: 'SIM Card',
        lastContactedTime: '2026-08-25 11:45:00',
        isDuplicate: false
      },
      {
        id: 'cnt-005',
        name: 'Bank Support Helpline',
        phoneNumbers: [{ number: '1800-425-3800', type: 'Toll-Free' }],
        emails: [{ email: 'support@hdfcbank.com', type: 'Support' }],
        organization: 'HDFC Bank',
        source: 'Phone Local',
        isDuplicate: false
      }
    ];
  }

  public static getDemoSms(): SmsInfo[] {
    const rawSms = [
      {
        id: 'sms-001',
        address: 'SBI-ALERTS',
        date: '2026-08-31 16:42:10',
        read: true,
        type: 'INBOX' as const,
        body: 'URGENT: Your SBI Bank account is suspended due to pending KYC update. Click bit.ly/sbi-kyc-verify immediately to avoid deactivation.'
      },
      {
        id: 'sms-002',
        address: 'HDFC-OTP',
        date: '2026-08-31 14:15:02',
        read: true,
        type: 'INBOX' as const,
        body: 'Your HDFC Bank net banking OTP is 894102 for payment of $120.00 to AWS Cloud. Do NOT share your verification code.'
      },
      {
        id: 'sms-003',
        address: '+15559876543',
        date: '2026-08-30 20:04:18',
        read: true,
        type: 'INBOX' as const,
        body: 'Hey, I have uploaded the forensic image dumps to the secure server. Let me know once you verify the SHA256 hash.'
      },
      {
        id: 'sms-004',
        address: 'WINNER-NOTIF',
        date: '2026-08-29 11:32:45',
        read: false,
        type: 'INBOX' as const,
        body: 'Congratulations! You are the winner of a $5,000 crypto prize reward. Claim your prize now at tinyurl.com/claim-reward-gift'
      },
      {
        id: 'sms-005',
        address: '+15552345678',
        date: '2026-08-29 09:12:00',
        read: true,
        type: 'SENT' as const,
        body: 'Confirming our 10 AM triage meeting in Conference Room 4.'
      }
    ];

    return rawSms.map(s => {
      const analysis = this.securityEngine.analyzeSms(s);
      return {
        ...s,
        ...analysis
      };
    });
  }

  public static getDemoProcesses(): ProcessInfo[] {
    return [
      {
        pid: 1,
        user: 'root',
        processName: 'init',
        cpuPercent: 0.1,
        memoryKb: 14200,
        formattedMemory: '13.8 MB',
        status: 'Running',
        isSuspicious: false
      },
      {
        pid: 842,
        user: 'system',
        processName: 'system_server',
        cpuPercent: 3.4,
        memoryKb: 284000,
        formattedMemory: '277.3 MB',
        status: 'Foreground',
        isSuspicious: false
      },
      {
        pid: 2194,
        user: 'u0_a188',
        processName: 'com.quickcredit.loanapp',
        packageName: 'com.quickcredit.loanapp',
        cpuPercent: 12.8,
        memoryKb: 142800,
        formattedMemory: '139.4 MB',
        status: 'Background',
        isSuspicious: true,
        suspiciousReason: 'Active background process with accessibility service & overlay flags'
      },
      {
        pid: 3108,
        user: 'u0_a145',
        processName: 'com.termux',
        packageName: 'com.termux',
        cpuPercent: 0.8,
        memoryKb: 48900,
        formattedMemory: '47.7 MB',
        status: 'Background',
        isSuspicious: false
      },
      {
        pid: 4012,
        user: 'u0_a112',
        processName: 'com.whatsapp',
        packageName: 'com.whatsapp',
        cpuPercent: 1.2,
        memoryKb: 182400,
        formattedMemory: '178.1 MB',
        status: 'Background',
        isSuspicious: false
      },
      {
        pid: 5890,
        user: 'u0_a199',
        processName: 'com.system.security.optimizer',
        packageName: 'com.system.security.optimizer',
        cpuPercent: 4.5,
        memoryKb: 92100,
        formattedMemory: '89.9 MB',
        status: 'Service',
        isSuspicious: true,
        suspiciousReason: 'Persistent background service requesting APK package installer rights'
      }
    ];
  }

  public static getDemoSecurityFindings(): SecurityFinding[] {
    return [
      {
        id: 'fnd-001',
        scanId: 'scan-demo-001',
        category: 'APPLICATION',
        title: 'Banking Trojan Profile Identified (QuickPay Instant Loan)',
        description: 'Application combines Accessibility Service and Screen Overlay permissions with Sideloaded install origin and debug build flags.',
        severity: 'CRITICAL',
        evidence: [
          'Package: com.quickcredit.loanapp',
          'Install Source: com.android.packageinstaller (Sideloaded)',
          'Flags: android:debuggable="true"',
          'Sensitive Permissions: BIND_ACCESSIBILITY_SERVICE, SYSTEM_ALERT_WINDOW, READ_SMS, RECEIVE_SMS',
          'Threat Signature Match: Android.Trojan.Banker.FakeToken'
        ],
        confidence: 'HIGH',
        affectedItem: 'com.quickcredit.loanapp',
        recommendation: 'Isolate package for sandbox analysis. Check whether unauthorized financial OTP interception or screen overlay attempts occurred.'
      },
      {
        id: 'fnd-002',
        scanId: 'scan-demo-001',
        category: 'SMS_PHISHING',
        title: 'High-Risk SMS Smishing Message Detected',
        description: 'Incoming SMS from alphanumeric sender contains urgent suspension notice and shortened URL.',
        severity: 'HIGH_RISK',
        evidence: [
          'Sender: SBI-ALERTS',
          'Shortened Link: bit.ly/sbi-kyc-verify',
          'Keywords: URGENT, suspended, KYC update'
        ],
        confidence: 'HIGH',
        affectedItem: 'SMS Message #sms-001',
        recommendation: 'Alert device owner to not open malicious links or provide bank account credentials.'
      },
      {
        id: 'fnd-003',
        scanId: 'scan-demo-001',
        category: 'PERMISSIONS',
        title: 'Silent Dropper Profile (Phone Boost & Clean Master)',
        description: 'Application requests package installation privileges with boot auto-start and full disk storage access.',
        severity: 'SUSPICIOUS',
        evidence: [
          'Package: com.system.security.optimizer',
          'Permissions: REQUEST_INSTALL_PACKAGES, RECEIVE_BOOT_COMPLETED, MANAGE_EXTERNAL_STORAGE',
          'Origin: Direct Sideloaded APK'
        ],
        confidence: 'MEDIUM',
        affectedItem: 'com.system.security.optimizer',
        recommendation: 'Inspect download folder for secondary payload APKs dropped by this application.'
      }
    ];
  }
}
