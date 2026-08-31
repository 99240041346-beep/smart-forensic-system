export interface ForensicPluginMetadata {
  name: string;
  version: string;
  category: 'DEVICE' | 'APPS' | 'COMMUNICATIONS' | 'PROCESSES' | 'SECURITY' | 'THREAT_INTEL';
  description: string;
}

export const CORE_PLUGINS: ForensicPluginMetadata[] = [
  { name: 'DeviceInfoPlugin', version: '1.0.0', category: 'DEVICE', description: 'Collects OS build, battery, memory, and hardware telemetry' },
  { name: 'ApplicationPlugin', version: '1.0.0', category: 'APPS', description: 'Enumerates packages and evaluates permission risk scores' },
  { name: 'ContactPlugin', version: '1.0.0', category: 'COMMUNICATIONS', description: 'Audits authorized address book entries' },
  { name: 'SmsPlugin', version: '1.0.0', category: 'COMMUNICATIONS', description: 'Audits authorized SMS messages and flags smishing threats' },
  { name: 'ProcessPlugin', version: '1.0.0', category: 'PROCESSES', description: 'Audits running tasks and background services' },
  { name: 'SecurityPlugin', version: '1.0.0', category: 'SECURITY', description: 'Computes explainable device security integrity posture' }
];
