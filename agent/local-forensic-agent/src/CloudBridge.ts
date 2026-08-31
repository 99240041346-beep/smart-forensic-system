import os from 'os';
import { AdbManager } from './AdbManager';

type CloudCommand = { id: string; type: string };

export class CloudBridge {
  private running = false;
  private readonly apiUrl = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '');
  private readonly token = process.env.LOCAL_AGENT_TOKEN || '';
  private readonly agentId = process.env.LOCAL_AGENT_ID || `${os.hostname()}-${process.pid}`;
  private readonly pollMs = Math.max(1000, Number(process.env.AGENT_POLL_MS || 2000));
  private readonly adb = new AdbManager();

  public async start() {
    if (this.running) return;
    if (!this.apiUrl || !this.token) {
      console.warn('[Cloud Bridge] Set PUBLIC_API_URL and LOCAL_AGENT_TOKEN in the local agent .env file.');
      return;
    }
    this.running = true;
    console.log(`[Cloud Bridge] Agent ${this.agentId} -> ${this.apiUrl}`);

    while (this.running) {
      try {
        await this.request('/api/agent/register', {
          method: 'POST',
          body: JSON.stringify({ agentId: this.agentId, hostname: os.hostname() })
        });
        const payload = await this.request(`/api/agent/commands?agentId=${encodeURIComponent(this.agentId)}`) as { commands?: CloudCommand[] };
        for (const command of payload?.commands || []) await this.handle(command);
      } catch (error: any) {
        console.warn(`[Cloud Bridge] ${error?.message || error}`);
      }
      await new Promise(resolve => setTimeout(resolve, this.pollMs));
    }
  }

  private async handle(command: CloudCommand) {
    try {
      let result: any;
      if (command.type === 'ADB_STATUS' || command.type === 'ADB_REFRESH') {
        result = {
          status: await this.adb.checkAdb(),
          devices: await this.adb.getDevices(),
          refreshedAt: new Date().toISOString()
        };
      } else if (command.type === 'ADB_FORENSIC_SNAPSHOT') {
        const devices = (await this.adb.getDevices()).filter(d => d.state === 'device');
        const deviceDetails = [];
        for (const device of devices) {
          const run = async (args: string[]) => (await this.adb.executeRaw(['-s', device.serial, 'shell', ...args])).stdout;
          const [model, manufacturer, androidVersion, apiLevel, storage, processes, battery, memory, packages] = await Promise.all([
            run(['getprop', 'ro.product.model']),
            run(['getprop', 'ro.product.manufacturer']),
            run(['getprop', 'ro.build.version.release']),
            run(['getprop', 'ro.build.version.sdk']),
            run(['df', '-h', '/data']),
            run(['ps']),
            run(['dumpsys', 'battery']),
            run(['dumpsys', 'meminfo']),
            run(['pm', 'list', 'packages'])
          ]);
          deviceDetails.push({ serial: device.serial, model, manufacturer, androidVersion, apiLevel, storage, processes, battery, memory, packages });
        }
        result = { capturedAt: new Date().toISOString(), devices, deviceDetails };
      } else {
        result = { error: `Unsupported command: ${command.type}` };
      }
      await this.request(`/api/agent/commands/${encodeURIComponent(command.id)}/result`, {
        method: 'POST', body: JSON.stringify({ agentId: this.agentId, result })
      });
    } catch (error: any) {
      await this.request(`/api/agent/commands/${encodeURIComponent(command.id)}/result`, {
        method: 'POST', body: JSON.stringify({ agentId: this.agentId, error: error?.message || String(error) })
      });
    }
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Agent-Token': this.token, ...(init.headers || {}) }
    });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
    return response.json();
  }
}
