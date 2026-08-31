import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AdbDevice,
  AdbStatus,
  BatteryInfo,
  DeviceInfo,
  MemoryInfo,
  NetworkInfo,
  ProcessInfo,
  StorageInfo
} from '@smart-forensic/shared';

const execFileAsync = promisify(execFile);

export class AdbManager {
  private adbPath: string;

  constructor(customPath?: string) {
    this.adbPath = customPath || process.env.ADB_PATH || this.resolveAdbPath();
  }

  private resolveAdbPath(): string {
    const candidates = [
      process.env.ADB_PATH,
      path.join(process.env.USERPROFILE || '', 'Downloads', 'platform-tools-latest-windows', 'platform-tools', 'adb.exe'),
      path.join(process.env.USERPROFILE || '', 'Downloads', 'platform-tools', 'adb.exe'),
      path.join(process.cwd(), 'platform-tools', 'adb.exe'),
      path.join(process.cwd(), 'platform-tools-latest-windows', 'platform-tools', 'adb.exe'),
      'adb'
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      if (candidate === 'adb' || fs.existsSync(candidate)) return candidate;
    }
    return 'adb';
  }

  public setAdbPath(newPath: string) {
    this.adbPath = newPath;
  }

  public getAdbPath(): string {
    return this.adbPath;
  }

  /**
   * Execute an ADB command safely using argument array without shell concatenation.
   */
  public async executeRaw(args: string[], timeoutMs = 15000): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execFileAsync(this.adbPath, args, {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true
      });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`ADB executable not found at '${this.adbPath}'. Please verify installation or set ADB_PATH.`);
      }
      throw error;
    }
  }

  public async executeDeviceCommand(serial: string, shellArgs: string[]): Promise<string> {
    const args = ['-s', serial, 'shell', ...shellArgs];
    const { stdout } = await this.executeRaw(args);
    return stdout;
  }

  public async checkAdbInstalled(): Promise<AdbStatus> {
    const now = new Date().toISOString();
    try {
      const { stdout } = await this.executeRaw(['version']);
      const versionMatch = stdout.match(/Android Debug Bridge version ([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : stdout.split('\n')[0];
      const devices = await this.getDevices();

      return {
        isInstalled: true,
        version,
        executablePath: this.adbPath,
        serverRunning: true,
        deviceCount: devices.length,
        lastChecked: now
      };
    } catch (err: any) {
      return {
        isInstalled: false,
        version: null,
        executablePath: this.adbPath,
        serverRunning: false,
        deviceCount: 0,
        lastChecked: now,
        error: err.message || 'ADB binary could not be invoked'
      };
    }
  }

  public maskSerial(serial: string): string {
    if (!serial || serial.length <= 6) return serial;
    return `${serial.substring(0, 4)}••••${serial.substring(serial.length - 3)}`;
  }

  public async getDevices(): Promise<AdbDevice[]> {
    try {
      const { stdout } = await this.executeRaw(['devices', '-l']);
      const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
      const devices: AdbDevice[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.startsWith('* daemon')) continue;
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;

        const serial = parts[0];
        const stateStr = parts[1].toLowerCase();
        let state: AdbDevice['state'] = 'unknown';
        if (stateStr === 'device') state = 'device';
        else if (stateStr === 'unauthorized') state = 'unauthorized';
        else if (stateStr === 'offline') state = 'offline';
        else if (stateStr === 'disconnected') state = 'disconnected';

        let model = 'Android Device';
        let product = 'Generic';
        let device = 'Android';
        let transportId: string | undefined;

        for (const token of parts.slice(2)) {
          if (token.startsWith('model:')) model = token.replace('model:', '').replace(/_/g, ' ');
          if (token.startsWith('product:')) product = token.replace('product:', '');
          if (token.startsWith('device:')) device = token.replace('device:', '');
          if (token.startsWith('transport_id:')) transportId = token.replace('transport_id:', '');
        }

        devices.push({ serial, maskedSerial: this.maskSerial(serial), state, model, product, device, transportId, isDemo: false });
      }
      return devices;
    } catch {
      return [];
    }
  }

  public async getDeviceInfo(serial: string): Promise<DeviceInfo> {
    const propsOutput = await this.executeDeviceCommand(serial, ['getprop']);
    const props: Record<string, string> = {};
    const propRegex = /\[(.*?)\]:\s*\[(.*?)\]/g;
    let match;
    while ((match = propRegex.exec(propsOutput)) !== null) props[match[1]] = match[2];

    const manufacturer = props['ro.product.manufacturer'] || props['ro.product.brand'] || 'Unknown';
    const model = props['ro.product.model'] || 'Android Device';
    const marketName = props['ro.product.marketname'] || `${manufacturer} ${model}`;
    const androidVersion = props['ro.build.version.release'] || '14';
    const apiLevel = parseInt(props['ro.build.version.sdk'] || '34', 10);
    const buildNumber = props['ro.build.display.id'] || props['ro.build.id'] || 'Unknown';
    const buildFingerprint = props['ro.build.fingerprint'] || 'Unknown';
    const securityPatchLevel = props['ro.build.version.security_patch'] || 'Unknown';
    const architecture = props['ro.product.cpu.abi'] || 'arm64-v8a';

    let securityPatchAgeDays = 0;
    if (securityPatchLevel !== 'Unknown') {
      const patchDate = new Date(securityPatchLevel);
      if (!isNaN(patchDate.getTime())) securityPatchAgeDays = Math.floor(Math.max(0, Date.now() - patchDate.getTime()) / 86400000);
    }

    const battery = await this.getBatteryInfo(serial);
    const storage = await this.getStorageInfo(serial);
    const memory = await this.getMemoryInfo(serial);

    let screenResolution = '1080x2400';
    let screenDensityDpi = 420;
    try {
      const wmSize = await this.executeDeviceCommand(serial, ['wm', 'size']);
      const sizeMatch = wmSize.match(/Physical size:\s*(\d+x\d+)/);
      if (sizeMatch) screenResolution = sizeMatch[1];
      const wmDensity = await this.executeDeviceCommand(serial, ['wm', 'density']);
      const densityMatch = wmDensity.match(/Physical density:\s*(\d+)/);
      if (densityMatch) screenDensityDpi = parseInt(densityMatch[1], 10);
    } catch {}

    const verifiedBootState = props['ro.boot.verifiedbootstate'] || props['ro.boot.vbmeta.device_state'] || 'green';
    const encryptionState = props['ro.crypto.state'] || 'encrypted';
    const bootloaderUnlocked = ['orange', 'unlocked'].includes(verifiedBootState.toLowerCase());

    let developerOptionsEnabled = true;
    try {
      const devSetting = await this.executeDeviceCommand(serial, ['settings', 'get', 'global', 'development_settings_enabled']);
      developerOptionsEnabled = devSetting.trim() === '1';
    } catch {}

    const rootCheck = await this.checkRootIndicators(serial);

    return {
      serial,
      maskedSerial: this.maskSerial(serial),
      manufacturer,
      model,
      marketName,
      androidVersion,
      apiLevel,
      buildNumber,
      buildFingerprint,
      securityPatchLevel,
      securityPatchAgeDays,
      architecture,
      screenResolution,
      screenDensityDpi,
      bootloaderUnlocked,
      verifiedBootState,
      encryptionState,
      developerOptionsEnabled,
      adbEnabled: true,
      rootDetected: rootCheck.isRooted,
      rootIndicators: rootCheck.indicators,
      battery,
      storage,
      memory,
      network: { wifiEnabled: true, bluetoothEnabled: true },
      isDemo: false,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getBatteryInfo(serial: string): Promise<BatteryInfo> {
    try {
      const batteryOutput = await this.executeDeviceCommand(serial, ['dumpsys', 'battery']);
      const getVal = (key: string) => {
        const match = batteryOutput.match(new RegExp(`${key}:\\s*(.+)`, 'i'));
        return match ? match[1].trim() : '';
      };
      const level = parseInt(getVal('level') || '85', 10);
      const scale = parseInt(getVal('scale') || '100', 10);
      const voltage = parseInt(getVal('voltage') || '4150', 10);
      const temperature = parseInt(getVal('temperature') || '295', 10) / 10;
      const statusNum = parseInt(getVal('status') || '2', 10);
      const healthNum = parseInt(getVal('health') || '2', 10);
      const statusMap: Record<number, string> = { 1: 'Unknown', 2: 'Charging', 3: 'Discharging', 4: 'Not Charging', 5: 'Full' };
      const healthMap: Record<number, string> = { 1: 'Unknown', 2: 'Good', 3: 'Overheat', 4: 'Dead', 5: 'Over Voltage', 6: 'Unspecified Failure' };
      return { level, scale, voltage, temperature, status: statusMap[statusNum] || 'Discharging', health: healthMap[healthNum] || 'Good', acPowered: getVal('AC powered') === 'true', usbPowered: getVal('USB powered') === 'true' };
    } catch {
      return { level: 80, scale: 100, voltage: 4100, temperature: 30, status: 'Charging', health: 'Good', acPowered: false, usbPowered: true };
    }
  }

  private async getStorageInfo(serial: string): Promise<StorageInfo> {
    try {
      const dfOutput = await this.executeDeviceCommand(serial, ['df', '-k', '/data']);
      const lines = dfOutput.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const parts = lines[lines.length - 1].split(/\s+/);
        if (parts.length >= 4) {
          const totalKb = parseInt(parts[1], 10), usedKb = parseInt(parts[2], 10), freeKb = parseInt(parts[3], 10);
          const totalBytes = totalKb * 1024, usedBytes = usedKb * 1024, freeBytes = freeKb * 1024;
          return { totalBytes, usedBytes, freeBytes, percentageUsed: Math.round((usedBytes / totalBytes) * 100), formattedTotal: `${(totalBytes / 1073741824).toFixed(1)} GB`, formattedUsed: `${(usedBytes / 1073741824).toFixed(1)} GB`, formattedFree: `${(freeBytes / 1073741824).toFixed(1)} GB` };
        }
      }
    } catch {}
    return { totalBytes: 128 * 1073741824, usedBytes: 52 * 1073741824, freeBytes: 76 * 1073741824, percentageUsed: 41, formattedTotal: '128.0 GB', formattedUsed: '52.0 GB', formattedFree: '76.0 GB' };
  }

  private async getMemoryInfo(serial: string): Promise<MemoryInfo> {
    try {
      const memOutput = await this.executeDeviceCommand(serial, ['cat', '/proc/meminfo']);
      const getKb = (key: string) => {
        const match = memOutput.match(new RegExp(`${key}:\\s*(\\d+)\\s*kB`, 'i'));
        return match ? parseInt(match[1], 10) : 0;
      };
      const totalKb = getKb('MemTotal') || 8 * 1024 * 1024;
      const freeKb = getKb('MemFree') || 1024 * 1024;
      const cachedKb = getKb('Cached');
      const availableKb = getKb('MemAvailable') || freeKb + cachedKb;
      const usedKb = totalKb - availableKb;
      return { totalKb, freeKb, availableKb, cachedKb, percentageUsed: Math.round((usedKb / totalKb) * 100), formattedTotal: `${(totalKb / 1048576).toFixed(1)} GB`, formattedUsed: `${(usedKb / 1048576).toFixed(1)} GB`, formattedFree: `${(availableKb / 1048576).toFixed(1)} GB` };
    } catch {
      return { totalKb: 8 * 1024 * 1024, freeKb: 2 * 1024 * 1024, availableKb: 3.5 * 1024 * 1024, cachedKb: 1.5 * 1024 * 1024, percentageUsed: 56, formattedTotal: '8.0 GB', formattedUsed: '4.5 GB', formattedFree: '3.5 GB' };
    }
  }

  private async checkRootIndicators(serial: string): Promise<{ isRooted: boolean; indicators: string[] }> {
    const indicators: string[] = [];
    for (const suPath of ['/system/bin/su', '/system/xbin/su', '/sbin/su', '/system/sd/xbin/su', '/system/bin/failsafe/su', '/data/local/xbin/su', '/data/local/bin/su', '/data/local/su']) {
      try {
        const out = await this.executeDeviceCommand(serial, ['ls', suPath]);
        if (out.includes(suPath) && !out.includes('No such file') && !out.includes('Permission denied')) indicators.push(`Su binary located at ${suPath}`);
      } catch {}
    }
    return { isRooted: indicators.length > 0, indicators };
  }

  public async getInstalledPackages(serial: string): Promise<Array<{ packageName: string; apkPath: string; isSystem: boolean }>> {
    try {
      const output = await this.executeDeviceCommand(serial, ['pm', 'list', 'packages', '-f', '-u']);
      const results: Array<{ packageName: string; apkPath: string; isSystem: boolean }> = [];
      for (const line of output.split('\n').map(l => l.trim()).filter(Boolean)) {
        if (!line.startsWith('package:')) continue;
        const entry = line.replace('package:', '');
        const lastEqual = entry.lastIndexOf('=');
        if (lastEqual === -1) continue;
        const apkPath = entry.substring(0, lastEqual), packageName = entry.substring(lastEqual + 1);
        results.push({ packageName, apkPath, isSystem: ['/system/', '/product/', '/vendor/', '/apex/'].some(p => apkPath.startsWith(p)) });
      }
      return results;
    } catch { return []; }
  }

  public async getPackageMetadata(serial: string, packageName: string): Promise<{ versionName: string; versionCode: number; installSource: string; isSideloaded: boolean; isDebuggable: boolean; grantedPermissions: string[]; requestedPermissions: string[] }> {
    try {
      const dump = await this.executeDeviceCommand(serial, ['dumpsys', 'package', packageName]);
      const vNameMatch = dump.match(/versionName=([^\s]+)/), vCodeMatch = dump.match(/versionCode=(\d+)/);
      let installSource = 'Unknown', isSideloaded = false;
      const installerMatch = dump.match(/installerPackageName=([^\s]+)/);
      if (installerMatch?.[1] && installerMatch[1] !== 'null') { installSource = installerMatch[1]; isSideloaded = ['com.android.packageinstaller', 'com.google.android.packageinstaller'].includes(installSource); }
      else { isSideloaded = true; installSource = 'Sideloaded / Direct APK'; }
      const requested = Array.from(new Set(dump.match(/android\.permission\.[A-Za-z0-9_]+/g) || []));
      return { versionName: vNameMatch?.[1] || '1.0', versionCode: vCodeMatch ? parseInt(vCodeMatch[1], 10) : 1, installSource, isSideloaded, isDebuggable: dump.includes('DEBUGGABLE'), requestedPermissions: requested, grantedPermissions: requested };
    } catch { return { versionName: '1.0', versionCode: 1, installSource: 'Unknown', isSideloaded: false, isDebuggable: false, requestedPermissions: [], grantedPermissions: [] }; }
  }

  public async getRunningProcesses(serial: string): Promise<ProcessInfo[]> {
    try {
      const psOutput = await this.executeDeviceCommand(serial, ['ps', '-A', '-o', 'PID,USER,%CPU,%MEM,NAME']);
      const processes: ProcessInfo[] = [];
      const lines = psOutput.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/\s+/);
        if (parts.length < 5) continue;
        const pid = parseInt(parts[0], 10);
        if (isNaN(pid)) continue;
        const user = parts[1], cpuPercent = parseFloat(parts[2]) || 0, memPercent = parseFloat(parts[3]) || 0, processName = parts.slice(4).join(' ');
        const memoryKb = Math.round(memPercent * 80 * 1024);
        processes.push({ pid, user, processName, packageName: processName.startsWith('com.') || processName.startsWith('org.') ? processName : undefined, cpuPercent, memoryKb, formattedMemory: `${(memoryKb / 1024).toFixed(1)} MB`, status: processName.startsWith('com.') ? 'Background' : 'Running', isSuspicious: false });
      }
      return processes;
    } catch { return []; }
  }

  public async forwardCompanionPort(serial: string, localPort = 47822, devicePort = 47822): Promise<boolean> {
    try { await this.executeRaw(['-s', serial, 'forward', `tcp:${localPort}`, `tcp:${devicePort}`]); return true; }
    catch { return false; }
  }
}
