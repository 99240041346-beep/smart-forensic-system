import {
  AdbDevice,
  AdbStatus,
  AppInfo,
  AuditLogEntry,
  ContactInfo,
  DeviceInfo,
  ForensicCase,
  ProcessInfo,
  SecurityIndicator,
  SmsInfo
} from '@smart-forensic/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  // ADB Operations
  async getAdbStatus(): Promise<AdbStatus> {
    const res = await fetch(`${API_BASE}/api/adb/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to get ADB status');
    return res.json();
  },

  async getDevices(): Promise<{ devices: AdbDevice[]; count: number; realCount: number; demoCount: number }> {
    const res = await fetch(`${API_BASE}/api/adb/devices`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to get connected devices');
    return res.json();
  },

  async refreshAdb(): Promise<{ status: AdbStatus; devices: AdbDevice[]; refreshedAt: string }> {
    const res = await fetch(`${API_BASE}/api/adb/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to refresh ADB');
    }
    return res.json();
  },

  // Device Inspection
  async getDeviceInfo(serial: string): Promise<DeviceInfo> {
    const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(serial)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch device specifications');
    return res.json();
  },

  async getDeviceApps(serial: string): Promise<{ apps: AppInfo[]; total: number; suspicious: number }> {
    const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(serial)}/apps`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch installed applications');
    return res.json();
  },

  async getDeviceContacts(serial: string): Promise<{ contacts: ContactInfo[]; total: number; permissionGranted: boolean }> {
    const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(serial)}/contacts`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  },

  async getDeviceSms(serial: string): Promise<{ sms: SmsInfo[]; total: number; suspiciousCount: number; permissionGranted: boolean }> {
    const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(serial)}/sms`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch SMS records');
    return res.json();
  },

  async getDeviceProcesses(serial: string): Promise<{ processes: ProcessInfo[]; total: number; suspiciousCount: number }> {
    const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(serial)}/processes`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch running processes');
    return res.json();
  },

  async getDeviceSecurity(serial: string): Promise<{
    deviceInfo: DeviceInfo;
    securityScore: number;
    riskLevel: string;
    indicators: SecurityIndicator[];
    scoreBreakdown: any[];
  }> {
    const res = await fetch(`${API_BASE}/api/devices/${encodeURIComponent(serial)}/security`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch security posture');
    return res.json();
  },

  // Case Management
  async getCases(): Promise<ForensicCase[]> {
    const res = await fetch(`${API_BASE}/api/cases`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch cases');
    return res.json();
  },

  async createCase(data: {
    title: string;
    description?: string;
    investigatorName?: string;
    deviceSerial: string;
    deviceModel?: string;
    tags?: string[];
    notes?: string;
  }): Promise<ForensicCase> {
    const res = await fetch(`${API_BASE}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create case');
    return res.json();
  },

  async getCase(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/cases/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch case details');
    return res.json();
  },

  // Scans
  async startScan(caseId: string, deviceSerial: string): Promise<{ scanId: string; status: string; streamUrl: string }> {
    const res = await fetch(`${API_BASE}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, deviceSerial })
    });
    if (!res.ok) throw new Error('Failed to start forensic scan');
    return res.json();
  },

  async getScan(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/scans/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch scan results');
    return res.json();
  },

  // Reports
  async getReport(scanId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/reports/${scanId}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    const res = await fetch(`${API_BASE}/api/audit?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/api/settings`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch system settings');
    return res.json();
  },

  async updateSetting(key: string, value: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) throw new Error('Failed to update setting');
    return res.json();
  }
};
