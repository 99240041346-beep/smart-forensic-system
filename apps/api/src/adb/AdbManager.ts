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
    this.adbPath = customPath || process.env.ADB_PATH || 'adb';
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
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large package dumps
        windowsHide: true
      });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`ADB executable not found at '${this.adbPath}'. Please verify installation.`);
      }
      throw error;
    }
  }

  /**
   * Executes a command targeting a specific authorized device.
   */
  public async executeDeviceCommand(serial: string, shellArgs: string[]): Promise<string> {
    const args = ['-s', serial, 'shell', ...shellArgs];
    const { stdout } = await this.executeRaw(args);
    return stdout;
  }

  /**
   * Checks whether ADB is installed, locates the binary, and checks status.
   */
  public async checkAdbInstalled(): Promise<AdbStatus> {
    const now = new Date().toISOString();
    try {
      const { stdout } = await this.executeRaw(['version']);
      const versionMatch = stdout.match(/Android Debug Bridge version ([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : stdout.split('\n')[0];

      // Check connected devices count
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

  /**
   * Masks a serial number for privacy/security display (e.g. "R58M...32A").
   */
  public maskSerial(serial: string): string {
    if (!serial || serial.length <= 6) return serial;
    const start = serial.substring(0, 4);
    const end = serial.substring(serial.length - 3);
    return `${start}••••${end}`;
  }

  /**
   * Scans and returns all connected Android devices with parsed connection states.
   */
  public async getDevices(): Promise<AdbDevice[]> {
    try {
      const { stdout } = await this.executeRaw(['devices', '-l']);
      const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
      const devices: AdbDevice[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.startsWith('* daemon')) continue;

        // Line format: <serial> <state> product:<product> model:<model> device:<device> transport_id:<id>
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
        let transportId: string | undefined = undefined;

        for (const token of parts.slice(2)) {
          if (token.startsWith('model:')) model = token.replace('model:', '').replace(/_/g, ' ');
          if (token.startsWith('product:')) product = token.replace('product:', '');
          if (token.startsWith('device:')) device = token.replace('device:', '');
          if (token.startsWith('transport_id:')) transportId = token.replace('transport_id:', '');
        }

        devices.push({
          serial,
          maskedSerial: this.maskSerial(serial),
          state,
          model,
          product,
          device,
          transportId,
          isDemo: false
        });
      }

      return devices;
    } catch (error: any) {
      return [];
    }
  }

  /**
   * Collects comprehensive hardware, OS, and security posture information from an authorized device.
   */
  public async getDeviceInfo(serial: string): Promise<DeviceInfo> {
    // 1. Get properties
    const propsOutput = await this.executeDeviceCommand(serial, ['getprop']);
    const props: Record<string, string> = {};
    const propRegex = /\[(.*?)\]:\s*\[(.*?)\]/g;
    let match;
    while ((match = propRegex.exec(propsOutput)) !== null) {
      props[match[1]] = match[2];
    }

    const manufacturer = props['ro.product.manufacturer'] || props['ro.product.brand'] || 'Unknown';
    const model = props['ro.product.model'] || 'Android Device';
    const marketName = props['ro.product.marketname'] || `${manufacturer} ${model}`;
    const androidVersion = props['ro.build.version.release'] || '14';
    const apiLevel = parseInt(props['ro.build.version.sdk'] || '34', 10);
    const buildNumber = props['ro.build.display.id'] || props['ro.build.id'] || 'Unknown';
    const buildFingerprint = props['ro.build.fingerprint'] || 'Unknown';
    const securityPatchLevel = props['ro.build.version.security_patch'] || 'Unknown';
    const architecture = props['ro.product.cpu.abi'] || 'arm64-v8a';

    // Calculate patch age
    let securityPatchAgeDays = 0;
    if (securityPatchLevel && securityPatchLevel !== 'Unknown') {
      const patchDate = new Date(securityPatchLevel);
      if (!isNaN(patchDate.getTime())) {
        const diffMs = Math.max(0, Date.now() - patchDate.getTime());
        securityPatchAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    // 2. Battery info
    const battery = await this.getBatteryInfo(serial);

    // 3. Storage info
    const storage = await this.getStorageInfo(serial);

    // 4. Memory info
    const memory = await this.getMemoryInfo(serial);

    // 5. Screen resolution
    let screenResolution = '1080x2400';
    let screenDensityDpi = 420;
    try {
      const wmSize = await this.executeDeviceCommand(serial, ['wm', 'size']);
      const sizeMatch = wmSize.match(/Physical size:\s*(\d+x\d+)/);
      if (sizeMatch) screenResolution = sizeMatch[1];

      const wmDensity = await this.executeDeviceCommand(serial, ['wm', 'density']);
      const densityMatch = wmDensity.match(/Physical density:\s*(\d+)/);
      if (densityMatch) screenDensityDpi = parseInt(densityMatch[1], 10);
    } catch {
      // Ignored if wm command unavailable
    }

    // 6. Security posture indicators
    const verifiedBootState = props['ro.boot.verifiedbootstate'] || props['ro.boot.vbmeta.device_state'] || 'green';
    const encryptionState = props['ro.crypto.state'] || 'encrypted';
    const bootloaderUnlocked = verifiedBootState.toLowerCase() === 'orange' || verifiedBootState.toLowerCase() === 'unlocked';

    // Developer options
    let developerOptionsEnabled = true;
    try {
      const devSetting = await this.executeDeviceCommand(serial, ['settings', 'get', 'global', 'development_settings_enabled']);
      developerOptionsEnabled = devSetting.trim() === '1';
    } catch {
      // fallback
    }

    // Root indicators check
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
      network: {
        wifiEnabled: true,
        bluetoothEnabled: true
      },
      isDemo: false,
      lastUpdated: new Date().toISOString()
    };
  }

  private async getBatteryInfo(serial: string): Promise<BatteryInfo> {
    try {
      const batteryOutput = await this.executeDeviceCommand(serial, ['dumpsys', 'battery']);
      const getVal = (key: string): string => {
        const regex = new RegExp(`${key}:\\s*(.+)`, 'i');
        const match = batteryOutput.match(regex);
        return match ? match[1].trim() : '';
      };

      const level = parseInt(getVal('level') || '85', 10);
      const scale = parseInt(getVal('scale') || '100', 10);
      const voltage = parseInt(getVal('voltage') || '4150', 10);
      const temperature = parseInt(getVal('temperature') || '295', 10) / 10;
      const statusNum = parseInt(getVal('status') || '2', 10);
      const healthNum = parseInt(getVal('health') || '2', 10);

      const statusMap: Record<number, string> = {
        1: 'Unknown',
        2: 'Charging',
        3: 'Discharging',
        4: 'Not Charging',
        5: 'Full'
      };
      const healthMap: Record<number, string> = {
        1: 'Unknown',
        2: 'Good',
        3: 'Overheat',
        4: 'Dead',
        5: 'Over Voltage',
        6: 'Unspecified Failure'
      };

      return {
        level,
        scale,
        voltage,
        temperature,
        status: statusMap[statusNum] || 'Discharging',
        health: healthMap[healthNum] || 'Good',
        acPowered: getVal('AC powered') === 'true',
        usbPowered: getVal('USB powered') === 'true'
      };
    } catch {
      return {
        level: 80,
        scale: 100,
        voltage: 4100,
        temperature: 30,
        status: 'Charging',
        health: 'Good',
        acPowered: false,
        usbPowered: true
      };
    }
  }

  private async getStorageInfo(serial: string): Promise<StorageInfo> {
    try {
      const dfOutput = await this.executeDeviceCommand(serial, ['df', '-k', '/data']);
      const lines = dfOutput.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const parts = lines[lines.length - 1].split(/\s+/);
        if (parts.length >= 4) {
          const totalKb = parseInt(parts[1], 10);
          const usedKb = parseInt(parts[2], 10);
          const freeKb = parseInt(parts[3], 10);
          const totalBytes = totalKb * 1024;
          const usedBytes = usedKb * 1024;
          const freeBytes = freeKb * 1024;
          const pct = Math.round((usedBytes / totalBytes) * 100);

          return {
            totalBytes,
            usedBytes,
            freeBytes,
            percentageUsed: pct,
            formattedTotal: `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
            formattedUsed: `${(usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
            formattedFree: `${(freeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
          };
        }
      }
    } catch {
      // fallback
    }

    return {
      totalBytes: 128 * 1024 * 1024 * 1024,
      usedBytes: 52 * 1024 * 1024 * 1024,
      freeBytes: 76 * 1024 * 1024 * 1024,
      percentageUsed: 41,
      formattedTotal: '128.0 GB',
      formattedUsed: '52.0 GB',
      formattedFree: '76.0 GB'
    };
  }

  private async getMemoryInfo(serial: string): Promise<MemoryInfo> {
    try {
      const memOutput = await this.executeDeviceCommand(serial, ['cat', '/proc/meminfo']);
      const getKb = (key: string): number => {
        const regex = new RegExp(`${key}:\\s*(\\d+)\\s*kB`, 'i');
        const match = memOutput.match(regex);
        return match ? parseInt(match[1], 10) : 0;
      };

      const totalKb = getKb('MemTotal') || 8 * 1024 * 1024;
      const freeKb = getKb('MemFree') || 1024 * 1024;
      const availableKb = getKb('MemAvailable') || freeKb + getKb('Cached');
      const cachedKb = getKb('Cached');
      const usedKb = totalKb - availableKb;
      const percentageUsed = Math.round((usedKb / totalKb) * 100);

      return {
        totalKb,
        freeKb,
        availableKb,
        cachedKb,
        percentageUsed,
        formattedTotal: `${(totalKb / (1024 * 1024)).toFixed(1)} GB`,
        formattedUsed: `${(usedKb / (1024 * 1024)).toFixed(1)} GB`,
        formattedFree: `${(availableKb / (1024 * 1024)).toFixed(1)} GB`
      };
    } catch {
      return {
        totalKb: 8 * 1024 * 1024,
        freeKb: 2 * 1024 * 1024,
        availableKb: 3.5 * 1024 * 1024,
        cachedKb: 1.5 * 1024 * 1024,
        percentageUsed: 56,
        formattedTotal: '8.0 GB',
        formattedUsed: '4.5 GB',
        formattedFree: '3.5 GB'
      };
    }
  }

  private async checkRootIndicators(serial: string): Promise<{ isRooted: boolean; indicators: string[] }> {
    const indicators: string[] = [];
    const pathsToCheck = [
      '/system/bin/su',
      '/system/xbin/su',
      '/sbin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/data/local/su'
    ];

    for (const suPath of pathsToCheck) {
      try {
        const out = await this.executeDeviceCommand(serial, ['ls', suPath]);
        if (out.includes(suPath) && !out.includes('No such file') && !out.includes('Permission denied')) {
          indicators.push(`Su binary located at ${suPath}`);
        }
      } catch {
        // no-op
      }
    }

    return {
      isRooted: indicators.length > 0,
      indicators
    };
  }

  /**
   * Retrieves list of installed applications with package paths and metadata.
   */
  public async getInstalledPackages(serial: string): Promise<Array<{
    packageName: string;
    apkPath: string;
    isSystem: boolean;
  }>> {
    try {
      // Execute 'pm list packages -f -u' to get APK path and package name
      const output = await this.executeDeviceCommand(serial, ['pm', 'list', 'packages', '-f', '-u']);
      const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
      const results: Array<{ packageName: string; apkPath: string; isSystem: boolean }> = [];

      for (const line of lines) {
        if (!line.startsWith('package:')) continue;
        const entry = line.replace('package:', '');
        const lastEqual = entry.lastIndexOf('=');
        if (lastEqual === -1) continue;

        const apkPath = entry.substring(0, lastEqual);
        const packageName = entry.substring(lastEqual + 1);
        const isSystem = apkPath.startsWith('/system/') || apkPath.startsWith('/product/') || apkPath.startsWith('/vendor/') || apkPath.startsWith('/apex/');

        results.push({
          packageName,
          apkPath,
          isSystem
        });
      }

      return results;
    } catch (err) {
      return [];
    }
  }

  /**
   * Retrieves package metadata and declared permissions via dumpsys package.
   */
  public async getPackageMetadata(serial: string, packageName: string): Promise<{
    versionName: string;
    versionCode: number;
    installSource: string;
    isSideloaded: boolean;
    isDebuggable: boolean;
    grantedPermissions: string[];
    requestedPermissions: string[];
  }> {
    try {
      const dump = await this.executeDeviceCommand(serial, ['dumpsys', 'package', packageName]);
      
      const vNameMatch = dump.match(/versionName=([^\s]+)/);
      const versionName = vNameMatch ? vNameMatch[1] : '1.0';

      const vCodeMatch = dump.match(/versionCode=(\d+)/);
      const versionCode = vCodeMatch ? parseInt(vCodeMatch[1], 10) : 1;

      // Install source
      let installSource = 'Unknown';
      let isSideloaded = false;
      const installerMatch = dump.match(/installerPackageName=([^\s]+)/);
      if (installerMatch && installerMatch[1] && installerMatch[1] !== 'null') {
        installSource = installerMatch[1];
        if (installSource === 'com.android.packageinstaller' || installSource === 'com.google.android.packageinstaller') {
          isSideloaded = true;
        }
      } else {
        isSideloaded = true;
        installSource = 'Sideloaded / Direct APK';
      }

      const isDebuggable = dump.includes('DEBUGGABLE') || dump.includes('flags=[ ... DEBUGGABLE');

      // Permissions extraction
      const requested: string[] = [];
      const granted: string[] = [];

      const reqRegex = /android\.permission\.[A-Za-z0-9_]+/g;
      let pMatch;
      while ((pMatch = reqRegex.exec(dump)) !== null) {
        requested.push(pMatch[0]);
      }

      // Granted permissions section
      const grantedSectionMatch = dump.match(/grantedPermissions:([\s\S]*?)(?:runtime permissions:|$)/i);
      if (grantedSectionMatch) {
        let gMatch;
        while ((gMatch = reqRegex.exec(grantedSectionMatch[1])) !== null) {
          granted.push(gMatch[0]);
        }
      }

      return {
        versionName,
        versionCode,
        installSource,
        isSideloaded,
        isDebuggable,
        requestedPermissions: Array.from(new Set(requested)),
        grantedPermissions: Array.from(new Set(granted.length > 0 ? granted : requested))
      };
    } catch {
      return {
        versionName: '1.0',
        versionCode: 1,
        installSource: 'Unknown',
        isSideloaded: false,
        isDebuggable: false,
        requestedPermissions: [],
        grantedPermissions: []
      };
    }
  }

  /**
   * Retrieves legitimately exposed running processes and statistics via `ps -A` or `top`.
   */
  public async getRunningProcesses(serial: string): Promise<ProcessInfo[]> {
    try {
      const psOutput = await this.executeDeviceCommand(serial, ['ps', '-A', '-o', 'PID,USER,%CPU,%MEM,NAME']);
      const lines = psOutput.split('\n').map(l => l.trim()).filter(Boolean);
      const processes: ProcessInfo[] = [];

      if (lines.length > 1) {
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(/\s+/);
          if (parts.length < 5) continue;

          const pid = parseInt(parts[0], 10);
          if (isNaN(pid)) continue;

          const user = parts[1];
          const cpuPercent = parseFloat(parts[2]) || 0;
          const memPercent = parseFloat(parts[3]) || 0;
          const processName = parts.slice(4).join(' ');

          const memoryKb = Math.round(memPercent * 80 * 1024); // Estimated KB
          const formattedMemory = `${(memoryKb / 1024).toFixed(1)} MB`;

          let status: ProcessInfo['status'] = 'Running';
          if (processName.startsWith('com.')) {
            status = 'Background';
          }

          processes.push({
            pid,
            user,
            processName,
            packageName: processName.startsWith('com.') || processName.startsWith('org.') ? processName : undefined,
            cpuPercent,
            memoryKb,
            formattedMemory,
            status,
            isSuspicious: false
          });
        }
      }

      return processes;
    } catch {
      return [];
    }
  }

  /**
   * Forwards a local TCP port to the Android companion app on the device.
   */
  public async forwardCompanionPort(serial: string, localPort = 47822, devicePort = 47822): Promise<boolean> {
    try {
      await this.executeRaw(['-s', serial, 'forward', `tcp:${localPort}`, `tcp:${devicePort}`]);
      return true;
    } catch {
      return false;
    }
  }
}
