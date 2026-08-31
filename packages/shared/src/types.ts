export type DeviceConnectionState = 'device' | 'unauthorized' | 'offline' | 'disconnected' | 'unknown';

export type RiskLevel = 'SAFE' | 'INFORMATIONAL' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' | 'UNKNOWN';

export type SecuritySeverity = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface AdbStatus {
  isInstalled: boolean;
  version: string | null;
  executablePath: string | null;
  serverRunning: boolean;
  deviceCount: number;
  lastChecked: string;
  error?: string;
}

export interface AdbDevice {
  serial: string;
  maskedSerial: string;
  state: DeviceConnectionState;
  model: string;
  product: string;
  device: string;
  transportId?: string;
  isDemo?: boolean;
}

export interface BatteryInfo {
  level: number; // 0 - 100
  scale: number;
  voltage: number; // mV
  temperature: number; // Celsius
  status: string; // Charging, Discharging, Full
  health: string; // Good, Overheat, Dead
  acPowered: boolean;
  usbPowered: boolean;
}

export interface StorageInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  percentageUsed: number;
  formattedTotal: string;
  formattedUsed: string;
  formattedFree: string;
}

export interface MemoryInfo {
  totalKb: number;
  freeKb: number;
  availableKb: number;
  cachedKb: number;
  percentageUsed: number;
  formattedTotal: string;
  formattedUsed: string;
  formattedFree: string;
}

export interface NetworkInfo {
  wifiEnabled: boolean;
  wifiSsid?: string;
  wifiIpAddress?: string;
  wifiMacAddress?: string;
  cellularType?: string;
  bluetoothEnabled: boolean;
}

export interface DeviceInfo {
  serial: string;
  maskedSerial: string;
  manufacturer: string;
  model: string;
  marketName: string;
  androidVersion: string;
  apiLevel: number;
  buildNumber: string;
  buildFingerprint: string;
  securityPatchLevel: string;
  securityPatchAgeDays: number;
  architecture: string; // arm64-v8a, armeabi-v7a, x86_64
  screenResolution: string;
  screenDensityDpi: number;
  bootloaderUnlocked: boolean;
  verifiedBootState: string; // green, yellow, orange, red, unknown
  encryptionState: string; // encrypted, unencrypted, unknown
  developerOptionsEnabled: boolean;
  adbEnabled: boolean;
  rootDetected: boolean;
  rootIndicators: string[];
  battery: BatteryInfo;
  storage: StorageInfo;
  memory: MemoryInfo;
  network: NetworkInfo;
  isDemo?: boolean;
  lastUpdated: string;
}

export interface AppPermissionInfo {
  permission: string;
  isGranted: boolean;
  isDangerous: boolean;
  description?: string;
  category?: 'PRIVACY' | 'SECURITY' | 'HARDWARE' | 'SYSTEM' | 'NETWORK' | 'SPECIAL';
}

export interface AppRiskAnalysis {
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  reasons: string[];
  sensitivePermissions: string[];
  isSideloaded: boolean;
  isDebuggable: boolean;
  hasOverlayCapability: boolean;
  hasAccessibilityService: boolean;
  hasDeviceAdmin: boolean;
  isPotentialSecurityTool: boolean;
  toolCategory?: string;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  apkPath: string;
  installSource: string; // com.android.vending, PackageInstaller, Sideloaded, System
  isSystemApp: boolean;
  isSideloaded: boolean;
  isDebuggable: boolean;
  firstInstallTime?: string;
  lastUpdateTime?: string;
  sha256?: string;
  requestedPermissions: string[];
  grantedPermissions: string[];
  dangerousPermissions: string[];
  threatIntelMatch?: {
    isKnownMalicious: boolean;
    threatName?: string;
    detectionSource?: string;
  };
  risk: AppRiskAnalysis;
}

export interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers: Array<{ number: string; type: string }>;
  emails: Array<{ email: string; type: string }>;
  organization?: string;
  photoUri?: string;
  source: string; // Google Account, SIM, Phone Local, WhatsApp
  lastContactedTime?: string;
  isDuplicate?: boolean;
}

export interface SmsInfo {
  id: string;
  threadId?: string;
  address: string;
  date: string;
  read: boolean;
  type: 'INBOX' | 'SENT' | 'DRAFT' | 'OUTBOX' | 'FAILED' | 'UNKNOWN';
  body: string;
  serviceCenter?: string;
  isSuspicious: boolean;
  suspiciousReasons: string[];
  riskScore: number; // 0 - 100
}

export interface ProcessInfo {
  pid: number;
  user: string;
  processName: string;
  packageName?: string;
  cpuPercent: number;
  memoryKb: number;
  formattedMemory: string;
  status: 'Running' | 'Foreground' | 'Background' | 'Service' | 'Zombie' | 'Unknown';
  isSuspicious: boolean;
  suspiciousReason?: string;
}

export interface SecurityIndicator {
  id: string;
  category: 'DEVICE_HARDWARE' | 'OS_INTEGRITY' | 'PERMISSION_SURFACE' | 'NETWORK' | 'DEBUG_ACCESS';
  title: string;
  status: 'DETECTED' | 'NOT_DETECTED' | 'UNKNOWN' | 'UNAVAILABLE';
  severity: SecuritySeverity;
  scoreImpact: number;
  details: string;
  recommendation: string;
}

export interface SecurityFinding {
  id: string;
  scanId: string;
  category: 'APPLICATION' | 'PERMISSIONS' | 'ROOT_TAMPERING' | 'OS_VULNERABILITY' | 'SMS_PHISHING' | 'NETWORK';
  title: string;
  description: string;
  severity: RiskLevel;
  evidence: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  affectedItem: string;
  recommendation: string;
}

export type ScanStage =
  | 'INITIALIZE'
  | 'ADB_CHECK'
  | 'DEVICE_IDENTIFICATION'
  | 'PERMISSION_CHECK'
  | 'DEVICE_INFO'
  | 'APPLICATION_ENUMERATION'
  | 'CONTACT_COLLECTION'
  | 'SMS_COLLECTION'
  | 'PROCESS_INFORMATION'
  | 'SECURITY_ANALYSIS'
  | 'RISK_SCORING'
  | 'GENERATE_REPORT'
  | 'COMPLETED'
  | 'FAILED';

export interface ScanProgressEvent {
  scanId: string;
  stage: ScanStage;
  percent: number;
  message: string;
  timestamp: string;
  stageStatus: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  error?: string;
}

export interface ForensicScanSummary {
  totalApps: number;
  systemApps: number;
  userApps: number;
  sideloadedApps: number;
  suspiciousApps: number;
  highRiskApps: number;
  securityToolsCount: number;
  contactsCollected: number;
  contactsPermissionGranted: boolean;
  smsCollected: number;
  smsPermissionGranted: boolean;
  suspiciousSmsCount: number;
  runningProcessesCount: number;
  securityFindingsCount: number;
  securityScore: number; // 0 - 100
  overallRiskLevel: RiskLevel;
}

export interface ForensicCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  investigatorName: string;
  investigatorEmail?: string;
  deviceSerial: string;
  deviceModel: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';
  riskLevel: RiskLevel;
  notes: string;
  tags: string[];
  scansCount: number;
  latestScanId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  investigator: string;
  action:
    | 'ADMIN_LOGIN'
    | 'ADMIN_LOGOUT'
    | 'ADB_REFRESH'
    | 'DEVICE_CONNECTED'
    | 'DEVICE_DISCONNECTED'
    | 'DEVICE_SELECTED'
    | 'DEVICE_INFO_COLLECTED'
    | 'APPLICATION_SCAN_STARTED'
    | 'APPLICATION_SCAN_COMPLETED'
    | 'CONTACT_COLLECTION'
    | 'SMS_COLLECTION'
    | 'PROCESS_SCAN'
    | 'SECURITY_SCAN'
    | 'CASE_CREATED'
    | 'CASE_UPDATED'
    | 'CASE_CLOSED'
    | 'CASE_DELETED'
    | 'REPORT_GENERATED'
    | 'REPORT_EXPORTED_JSON'
    | 'REPORT_EXPORTED_CSV'
    | 'REPORT_EXPORTED_PDF'
    | 'SETTINGS_UPDATED';
  targetDeviceSerial?: string;
  caseId?: string;
  scanId?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
  details: string;
  ipAddress?: string;
}

export interface ForensicReportData {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  caseInfo: ForensicCase;
  deviceInfo: DeviceInfo;
  scanSummary: ForensicScanSummary;
  riskScore: number;
  riskLevel: RiskLevel;
  scoreBreakdown: Array<{ factor: string; points: number; description: string }>;
  findings: SecurityFinding[];
  suspiciousApps: AppInfo[];
  allAppsSummary: {
    total: number;
    user: number;
    system: number;
    sideloaded: number;
    debuggable: number;
  };
  securityIndicators: SecurityIndicator[];
  contactsStatus: {
    granted: boolean;
    count: number;
    message?: string;
  };
  smsStatus: {
    granted: boolean;
    count: number;
    suspiciousCount: number;
    message?: string;
  };
  processesSummary: {
    total: number;
    running: number;
    suspicious: number;
  };
  disclaimer: string;
}
