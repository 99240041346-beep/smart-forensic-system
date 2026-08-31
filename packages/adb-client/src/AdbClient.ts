import { AdbDevice, AdbStatus } from '@smart-forensic/shared';

export interface AdbClientConfig {
  agentUrl?: string;
  agentToken?: string;
}

export class AdbClient {
  private agentUrl: string;
  private agentToken: string;

  constructor(config: AdbClientConfig = {}) {
    this.agentUrl = config.agentUrl || 'http://127.0.0.1:47821';
    this.agentToken = config.agentToken || process.env.LOCAL_AGENT_TOKEN || 'forensic-agent-token-local-auth';
  }

  private async fetchAgent(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.agentUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Token': this.agentToken,
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Agent request failed with HTTP ${res.status}`);
    }

    return res.json();
  }

  public async getStatus(): Promise<AdbStatus> {
    return this.fetchAgent('/api/agent/adb/status');
  }

  public async getDevices(): Promise<{ devices: AdbDevice[]; count: number }> {
    return this.fetchAgent('/api/agent/adb/devices');
  }

  public async executeCommand(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return this.fetchAgent('/api/agent/adb/execute', {
      method: 'POST',
      body: JSON.stringify({ args })
    });
  }
}
