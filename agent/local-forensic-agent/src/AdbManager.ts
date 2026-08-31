import { execFile } from 'child_process';
import { promisify } from 'util';
import { CommandAllowlist } from './CommandAllowlist';
import { AdbDevice, AdbStatus } from '@smart-forensic/shared';

const execFileAsync = promisify(execFile);
const SERIAL_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export class AdbManager {
  private adbPath: string;
  constructor(customPath?: string) { this.adbPath = customPath || process.env.ADB_PATH || 'adb'; }
  public setAdbPath(p: string) { this.adbPath = p; }
  public getAdbPath() { return this.adbPath; }
  private validateSerial(serial: string) { if (!SERIAL_RE.test(serial)) throw new Error('Invalid ADB device serial'); }

  public async executeRaw(args: string[], timeoutMs = 15000) {
    if (!CommandAllowlist.isAuthorized(args)) throw new Error('Execution denied: command is outside the forensic allowlist');
    try {
      const { stdout, stderr } = await execFileAsync(this.adbPath, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, windowsHide: true });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err: any) {
      if (err?.code === 'ENOENT') throw new Error(`ADB executable not found at '${this.adbPath}'`);
      if (err?.killed || err?.code === 'ETIMEDOUT') throw new Error('ADB operation timed out');
      throw new Error(err?.stderr?.trim() || err?.message || 'ADB operation failed');
    }
  }

  private async shell(serial: string, args: string[]) {
    this.validateSerial(serial);
    const target = (await this.getDevices()).find(d => d.serial === serial);
    if (!target) throw new Error('Device serial is not currently reported by ADB');
    if (target.state !== 'device') throw new Error(`Device ${serial} is ${target.state}`);
    return (await this.executeRaw(['-s', serial, 'shell', ...args])).stdout;
  }

  public async checkAdb(): Promise<AdbStatus> {
    const lastChecked = new Date().toISOString();
    try {
      const { stdout } = await this.executeRaw(['version']); const devices = await this.getDevices();
      return { isInstalled: true, version: stdout.match(/Android Debug Bridge version\s+([\d.]+)/)?.[1] || stdout.split('\n')[0] || null, executablePath: this.adbPath, serverRunning: true, deviceCount: devices.length, lastChecked };
    } catch (err: any) {
      return { isInstalled: false, version: null, executablePath: this.adbPath, serverRunning: false, deviceCount: 0, lastChecked, error: err?.message || 'ADB unavailable' };
    }
  }

  public async getDevices(): Promise<AdbDevice[]> {
    const { stdout } = await this.executeRaw(['devices', '-l']); const lines = stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean); const devices: AdbDevice[] = [];
    for (const line of lines.slice(1)) {
      if (line.startsWith('* daemon')) continue; const parts = line.split(/\s+/); if (parts.length < 2) continue;
      const serial = parts[0]; const rawState = parts[1].toLowerCase(); const state: AdbDevice['state'] = ['device','unauthorized','offline','disconnected'].includes(rawState) ? rawState as any : 'unknown';
      let model = 'Android Device', product = 'Generic', device = 'Android', transportId: string | undefined;
      for (const token of parts.slice(2)) { if (token.startsWith('model:')) model = token.slice(6).replace(/_/g, ' '); else if (token.startsWith('product:')) product = token.slice(8); else if (token.startsWith('device:')) device = token.slice(7); else if (token.startsWith('transport_id:')) transportId = token.slice(13); }
      devices.push({ serial, maskedSerial: serial.length > 6 ? `${serial.slice(0,4)}••••${serial.slice(-3)}` : serial, state, model, product, device, transportId, isDemo: false });
    }
    return devices;
  }

  public async getDeviceProperties(serial: string) { const output = await this.shell(serial, ['getprop']); const props: Record<string,string> = {}; for (const line of output.split(/\r?\n/)) { const m = line.match(/^\[([^\]]+)\]:\s*\[([^\]]*)\]$/); if (m) props[m[1]] = m[2]; } return props; }

  public async getDeviceInfo(serial: string): Promise<any> {
    const props = await this.getDeviceProperties(serial); const manufacturer = props['ro.product.manufacturer'] || props['ro.product.brand'] || 'Unknown'; const model = props['ro.product.model'] || 'Android Device'; const androidVersion = props['ro.build.version.release'] || 'Unknown'; const apiLevel = Number.parseInt(props['ro.build.version.sdk'] || '0',10) || 0; const verifiedBootState = props['ro.boot.verifiedbootstate'] || props['ro.boot.vbmeta.device_state'] || 'unknown'; const encryptionState = props['ro.crypto.state'] || 'unknown';
    const storage = await this.storageSummary(serial); const memory = await this.memorySummary(serial); const battery = await this.batterySummary(serial); let screenResolution='Unknown', screenDensityDpi=0;
    try { screenResolution=(await this.shell(serial,['wm','size'])).match(/Physical size:\s*(\d+x\d+)/)?.[1] || screenResolution; } catch {} try { screenDensityDpi=Number.parseInt((await this.shell(serial,['wm','density'])).match(/Physical density:\s*(\d+)/)?.[1] || '0',10); } catch {}
    let developerOptionsEnabled=false; try { developerOptionsEnabled=(await this.shell(serial,['settings','get','global','development_settings_enabled'])).trim()==='1'; } catch {}
    return { serial, maskedSerial: serial.length>6?`${serial.slice(0,4)}••••${serial.slice(-3)}`:serial, manufacturer, model, marketName: props['ro.product.marketname'] || `${manufacturer} ${model}`, androidVersion, apiLevel, buildNumber: props['ro.build.display.id'] || props['ro.build.id'] || 'Unknown', buildFingerprint: props['ro.build.fingerprint'] || 'Unknown', securityPatchLevel: props['ro.build.version.security_patch'] || 'Unknown', securityPatchAgeDays: 0, architecture: props['ro.product.cpu.abi'] || 'Unknown', screenResolution, screenDensityDpi, bootloaderUnlocked: ['orange','unlocked'].includes(verifiedBootState.toLowerCase()), verifiedBootState, encryptionState, developerOptionsEnabled, adbEnabled:true, rootDetected:false, rootIndicators:[], battery, storage, memory, network:{wifiEnabled:false,bluetoothEnabled:false}, isDemo:false, lastUpdated:new Date().toISOString() };
  }

  public async listPackages(serial: string) { const output=await this.shell(serial,['pm','list','packages']); return output.split(/\r?\n/).map(x=>x.trim().replace(/^package:/,'')).filter(Boolean); }
  public async listProcesses(serial: string) { return this.shell(serial,['ps']); }
  public async storageSummary(serial: string) { const output=await this.shell(serial,['df','-k','/data']); const parts=output.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).at(-1)?.split(/\s+/)||[]; const totalKb=Number(parts[1])||0, usedKb=Number(parts[2])||0, freeKb=Number(parts[3])||0; const totalBytes=totalKb*1024, usedBytes=usedKb*1024, freeBytes=freeKb*1024; return { totalBytes, usedBytes, freeBytes, percentageUsed: totalBytes?Math.round(usedBytes/totalBytes*100):0 }; }
  private async memorySummary(serial:string){const output=await this.shell(serial,['cat','/proc/meminfo']); const v=(k:string)=>Number(output.match(new RegExp(`^${k}:\\s*(\\d+)\\s*kB`,'m'))?.[1]||0); const totalKb=v('MemTotal'), availableKb=v('MemAvailable'), freeKb=v('MemFree'), cachedKb=v('Cached'), usedKb=Math.max(0,totalKb-availableKb); return {totalKb,freeKb,availableKb,cachedKb,percentageUsed:totalKb?Math.round(usedKb/totalKb*100):0,formattedTotal:`${(totalKb/1048576).toFixed(1)} GB`,formattedUsed:`${(usedKb/1048576).toFixed(1)} GB`,formattedFree:`${(availableKb/1048576).toFixed(1)} GB`};}
  private async batterySummary(serial:string){const output=await this.shell(serial,['dumpsys','battery']); const v=(k:string)=>output.match(new RegExp(`^${k}:\\s*(.+)$`,'mi'))?.[1]?.trim()||''; const sm:any={'1':'Unknown','2':'Charging','3':'Discharging','4':'Not Charging','5':'Full'},hm:any={'1':'Unknown','2':'Good','3':'Overheat','4':'Dead','5':'Over Voltage','6':'Failure'}; return {level:Number(v('level'))||0,scale:Number(v('scale'))||100,voltage:Number(v('voltage'))||0,temperature:(Number(v('temperature'))||0)/10,status:sm[v('status')]||'Unknown',health:hm[v('health')]||'Unknown',acPowered:v('AC powered')==='true',usbPowered:v('USB powered')==='true'};}
}
