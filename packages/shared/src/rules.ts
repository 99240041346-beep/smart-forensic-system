export const DANGEROUS_PERMISSIONS: Record<string, { weight: number; category: string; description: string }> = {
  'android.permission.READ_SMS': { weight: 15, category: 'PRIVACY', description: 'Read SMS messages containing OTPs and sensitive communications' },
  'android.permission.RECEIVE_SMS': { weight: 15, category: 'PRIVACY', description: 'Intercept incoming SMS text messages' },
  'android.permission.SEND_SMS': { weight: 20, category: 'FINANCIAL', description: 'Send unauthorized premium or intercept SMS' },
  'android.permission.READ_CONTACTS': { weight: 10, category: 'PRIVACY', description: 'Access full address book and personal contacts' },
  'android.permission.WRITE_CONTACTS': { weight: 10, category: 'PRIVACY', description: 'Modify address book records' },
  'android.permission.READ_CALL_LOG': { weight: 12, category: 'PRIVACY', description: 'Inspect telephony call history' },
  'android.permission.PROCESS_OUTGOING_CALLS': { weight: 15, category: 'PRIVACY', description: 'Monitor and redirect outgoing phone calls' },
  'android.permission.RECORD_AUDIO': { weight: 15, category: 'SURVEILLANCE', description: 'Record microphone audio in background' },
  'android.permission.CAMERA': { weight: 12, category: 'SURVEILLANCE', description: 'Capture photos and video' },
  'android.permission.ACCESS_FINE_LOCATION': { weight: 8, category: 'TRACKING', description: 'Precision GPS geographic tracking' },
  'android.permission.ACCESS_BACKGROUND_LOCATION': { weight: 15, category: 'TRACKING', description: 'Continuous location tracking without active app usage' },
  'android.permission.SYSTEM_ALERT_WINDOW': { weight: 20, category: 'OVERLAY', description: 'Draw on top of other applications (Overlay / Phishing)' },
  'android.permission.BIND_ACCESSIBILITY_SERVICE': { weight: 30, category: 'CONTROL', description: 'Full automated device control & keystroke logging' },
  'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE': { weight: 18, category: 'INTERCEPTION', description: 'Read all notifications including 2FA tokens' },
  'android.permission.BIND_DEVICE_ADMIN': { weight: 25, category: 'PERSISTENCE', description: 'Device administrator privileges & remote lock/wipe' },
  'android.permission.REQUEST_INSTALL_PACKAGES': { weight: 20, category: 'DROPPER', description: 'Silently trigger or request installation of unknown APKs' },
  'android.permission.WRITE_SECURE_SETTINGS': { weight: 30, category: 'SYSTEM_TAMPERING', description: 'Modify core Android OS security flags' },
  'android.permission.READ_EXTERNAL_STORAGE': { weight: 5, category: 'STORAGE', description: 'Read shared storage documents and media' },
  'android.permission.WRITE_EXTERNAL_STORAGE': { weight: 8, category: 'STORAGE', description: 'Write or modify shared storage files' },
  'android.permission.MANAGE_EXTERNAL_STORAGE': { weight: 15, category: 'STORAGE', description: 'Unrestricted access to all filesystem files' },
  'android.permission.RECEIVE_BOOT_COMPLETED': { weight: 5, category: 'PERSISTENCE', description: 'Auto-start service immediately upon device boot' }
};

export const SUSPICIOUS_PERMISSION_COMBINATIONS = [
  {
    name: 'Banking Trojan Profile',
    requiredPermissions: ['android.permission.BIND_ACCESSIBILITY_SERVICE', 'android.permission.SYSTEM_ALERT_WINDOW'],
    additionalRisk: 35,
    description: 'Accessibility Service combined with Overlay Window capabilities is a high-risk signature of screen-scraping banking trojans.'
  },
  {
    name: 'SMS Interceptor / OTP Stealer',
    requiredPermissions: ['android.permission.RECEIVE_SMS', 'android.permission.READ_SMS', 'android.permission.RECEIVE_BOOT_COMPLETED'],
    additionalRisk: 25,
    description: 'SMS reception, reading, and boot persistence can silently capture incoming one-time authentication codes.'
  },
  {
    name: 'Stealth Surveillance Profile',
    requiredPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA', 'android.permission.ACCESS_BACKGROUND_LOCATION'],
    additionalRisk: 30,
    description: 'Concurrent access to microphone, camera, and background location without prominent foreground purpose.'
  },
  {
    name: 'Credential Dropper Profile',
    requiredPermissions: ['android.permission.REQUEST_INSTALL_PACKAGES', 'android.permission.RECEIVE_BOOT_COMPLETED'],
    additionalRisk: 20,
    description: 'Package installation capabilities with boot persistence typical of malicious payload droppers.'
  }
];

export const KNOWN_SECURITY_TESTING_TOOLS = [
  { packagePrefix: 'com.topjohnwu.magisk', name: 'Magisk Root Manager', category: 'Root Management Tool', riskLevel: 'HIGH_RISK' },
  { packagePrefix: 'eu.chainfire.supersu', name: 'SuperSU', category: 'Root Management Tool', riskLevel: 'HIGH_RISK' },
  { packagePrefix: 'com.koushikdutta.superuser', name: 'Superuser', category: 'Root Management Tool', riskLevel: 'HIGH_RISK' },
  { packagePrefix: 'org.sandrop.sandromirror', name: 'SandroProxy', category: 'Proxy / Traffic Analyzer', riskLevel: 'INFORMATIONAL' },
  { packagePrefix: 'app.greyshirts.sslcapture', name: 'Packet Capture', category: 'Network Packet Sniffer', riskLevel: 'INFORMATIONAL' },
  { packagePrefix: 'com.emanuelef.remote_capture', name: 'PCAPdroid', category: 'Network Packet Sniffer', riskLevel: 'INFORMATIONAL' },
  { packagePrefix: 'com.termux', name: 'Termux', category: 'Terminal / Developer Environment', riskLevel: 'INFORMATIONAL' },
  { packagePrefix: 'jackpal.androidterm', name: 'Terminal Emulator', category: 'Developer Utility', riskLevel: 'INFORMATIONAL' },
  { packagePrefix: 'com.wireguard.android', name: 'WireGuard VPN', category: 'VPN / Network Security', riskLevel: 'SAFE' },
  { packagePrefix: 'org.torproject.android', name: 'Orbot (Tor Proxy)', category: 'Anonymity / Proxy Utility', riskLevel: 'INFORMATIONAL' },
  { packagePrefix: 'com.metasploit.stage', name: 'Metasploit Meterpreter Payload', category: 'Remote Administration / Pentest Tool', riskLevel: 'CRITICAL' },
  { packagePrefix: 'com.keramidas.TitaniumBackup', name: 'Titanium Backup', category: 'Backup / Root Utility', riskLevel: 'INFORMATIONAL' }
];

export const SUSPICIOUS_SMS_KEYWORDS = [
  { word: 'otp', weight: 15, reason: 'Contains OTP/2FA keyword' },
  { word: 'verification code', weight: 15, reason: 'Contains verification code keyword' },
  { word: 'bank account', weight: 20, reason: 'References financial account' },
  { word: 'blocked', weight: 15, reason: 'Urgency keyword (blocked account/card)' },
  { word: 'suspended', weight: 15, reason: 'Urgency keyword (suspended services)' },
  { word: 'urgent', weight: 10, reason: 'High urgency language' },
  { word: 'click here', weight: 20, reason: 'Call to action link prompt' },
  { word: 'bit.ly', weight: 25, reason: 'Shortened URL commonly used in SMS smishing' },
  { word: 'tinyurl.com', weight: 25, reason: 'Shortened URL' },
  { word: 'is.gd', weight: 25, reason: 'Shortened URL' },
  { word: 't.co', weight: 20, reason: 'Shortened URL' },
  { word: 'crypto', weight: 10, reason: 'Cryptocurrency solicitation' },
  { word: 'winner', weight: 20, reason: 'Lottery / Prize scam trigger' },
  { word: 'prize', weight: 20, reason: 'Lottery / Prize scam trigger' },
  { word: 'kyc update', weight: 30, reason: 'High probability financial KYC phishing' },
  { word: 'pan card', weight: 20, reason: 'Identity document solicitation' }
];

export const DISCLAIMER_NOTICE = 
  "DISCLAIMER: This report is generated through authorized, non-invasive forensic inspection via ADB and official Android APIs. " +
  "Heuristic findings, risk scores, and security indicator assessments represent risk factors and behavioral anomalies rather than definitive proof of malicious intent. " +
  "All collections must strictly comply with organizational policies, applicable legal jurisdiction, and authorized custody standards.";
