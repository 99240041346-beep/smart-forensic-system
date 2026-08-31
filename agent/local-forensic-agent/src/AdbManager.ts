import { execFile } from 'child_process';
import { promisify } from 'util';
import { CommandAllowlist } from './CommandAllowlist';
import { AdbDevice, AdbStatus } from '@smart-forensic/shared';

const execFileAsync = promisify(execFile);

export class AdbManager {
  private adbPath: string;

  constructor(customPath?: string) {
    this.adbPath = customPath || process.env.ADB_PATH || 'adb';
  }

  public setAdbPath(p: string) {
    this.adbPath = p;
  }

  public async executeRaw(args: string[]): Promise<{ stdout: string; stderr: string }> {
    if (!CommandAllowlist.isAuthorized(args)) {
      throw new Error(`Execution Denied: Command arguments outside strict forensic allowlist (${args.join(' ')})`);
    }

    try {
      const { stdout, stderr } = await execFileAsync(this.adbPath, args, {
        timeout: 15000,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true
      });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(`ADB binary not found at '${this.adbPath}'.`);
      }
      throw err;
    }
  }

  public async checkAdb(): Promise<AdbStatus> {
    try {
      const { stdout } = await this.executeRaw(['version']);
      const devices = await this.getDevices();
      return {
        isInstalled: true,
        version: stdout.split('\n')[0],
        executablePath: this.adbPath,
        serverRunning: true,
        deviceCount: devices.length,
        lastChecked: new Date().toISOString()
      };
    } catch (err: any) {
      return {
        isInstalled: false,
        version: null,
        executablePath: this.adbPath,
        serverRunning: false,
        deviceCount: 0,
        lastChecked: new Date().toISOString(),
        error: err.message
      };
    }
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

        let model = 'Android Device';
        let product = 'Generic';
        let device = 'Android';

        for (const token of parts.slice(2)) {
          if (token.startsWith('model:')) model = token.replace('model:', '').replace(/_/g, ' ');
          if (token.startsWith('product:')) product = token.replace('product:', '');
          if (token.startsWith('device:')) device = token.replace('device:', '');
        }

        const maskedSerial = serial.length > 6
          ? `${serial.substring(0, 4)}••••${serial.substring(serial.length - 3)}`
          : serial;

        devices.push({
          serial,
          maskedSerial,
          state,
          model,
          product,
          device,
          isDemo: false
        });
      }

      return devices;
    } catch {
      return [];
    }
  }
}
