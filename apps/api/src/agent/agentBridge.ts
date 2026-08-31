import { AdbManager } from '../adb/AdbManager';

const apiUrl = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '');
const token = process.env.LOCAL_AGENT_TOKEN || '';
const agentId = process.env.LOCAL_AGENT_ID || `${process.env.COMPUTERNAME || 'windows'}-${process.pid}`;
const pollMs = Number(process.env.AGENT_POLL_MS || 2000);

let running = false;

async function request(path: string, init: RequestInit = {}) {
  if (!apiUrl || !token) return null;
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Agent-Token': token, ...(init.headers || {}) }
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

async function handleCommand(command: any, adb: AdbManager) {
  switch (command.type) {
    case 'ADB_STATUS':
    case 'ADB_REFRESH': {
      const status = await adb.checkAdbInstalled();
      const devices = await adb.getDevices();
      return { status, devices, refreshedAt: new Date().toISOString() };
    }
    default:
      return { error: `Unsupported command: ${command.type}` };
  }
}

export async function startAgentBridge() {
  if (running || process.env.LOCAL_AGENT_MODE !== 'true') return;
  if (!apiUrl || !token) {
    console.warn('[Agent Bridge] PUBLIC_API_URL or LOCAL_AGENT_TOKEN is missing; cloud bridge disabled.');
    return;
  }

  running = true;
  const adb = new AdbManager();
  console.log(`[Agent Bridge] Connecting to ${apiUrl} as ${agentId}`);

  while (running) {
    try {
      await request('/api/agent/register', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          hostname: process.env.COMPUTERNAME || 'windows'
        })
      });

      const payload = await request(`/api/agent/commands?agentId=${encodeURIComponent(agentId)}`);
      for (const command of payload?.commands || []) {
        try {
          const result = await handleCommand(command, adb);
          await request(`/api/agent/commands/${encodeURIComponent(command.id)}/result`, {
            method: 'POST',
            body: JSON.stringify({ agentId, result })
          });
        } catch (error: any) {
          await request(`/api/agent/commands/${encodeURIComponent(command.id)}/result`, {
            method: 'POST',
            body: JSON.stringify({ agentId, error: error.message })
          });
        }
      }
    } catch (error: any) {
      console.warn(`[Agent Bridge] reconnecting: ${error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, pollMs));
  }
}
