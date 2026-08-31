import { AdbManager } from '../adb/AdbManager';
import { SecurityEngine } from '@smart-forensic/security-engine';
import { RiskLevel } from '@smart-forensic/shared';

export interface PluginContext {
  scanId: string;
  caseId: string;
  deviceSerial: string;
  isDemo: boolean;
  adbManager: AdbManager;
  securityEngine: SecurityEngine;
  collectedData: Record<string, any>;
  findings: any[];
  emitProgress: (percent: number, message: string) => void;
}

export interface PluginCollectionResult<T = any> {
  success: boolean;
  data: T;
  permissionGranted?: boolean;
  message?: string;
  error?: string;
}

export interface PluginAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  findings: any[];
  summary: Record<string, any>;
}

export interface ForensicPlugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly requiredPermissions: string[];
  readonly supportedAndroidVersions: string;

  collect(ctx: PluginContext): Promise<PluginCollectionResult>;
  analyze?(ctx: PluginContext, collectionResult: PluginCollectionResult): Promise<PluginAnalysisResult>;
}
