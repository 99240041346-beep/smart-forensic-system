import { Router, Request, Response } from 'express';
import crypto from 'crypto';

export const agentRouter = Router();

type AgentState = { agentId: string; hostname?: string; lastSeen: number; status?: any; devices?: any[]; refreshedAt?: string; forensicSnapshot?: any };
type Command = { id: string; type: 'ADB_STATUS' | 'ADB_REFRESH' | 'ADB_FORENSIC_SNAPSHOT'; createdAt: number; result?: any; error?: string };

const agents = new Map<string, AgentState>();
const commands = new Map<string, Command[]>();

function authorized(req: Request) {
  const expected = process.env.LOCAL_AGENT_TOKEN;
  const supplied = req.header('X-Agent-Token');
  if (!expected || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

agentRouter.use((req, res, next) => {
  if (!authorized(req)) return res.status(401).json({ error: 'Invalid local agent token' });
  next();
});

agentRouter.post('/register', (req, res) => {
  const agentId = String(req.body?.agentId || 'default');
  const old = agents.get(agentId);
  agents.set(agentId, { agentId, hostname: req.body?.hostname, lastSeen: Date.now(), status: old?.status, devices: old?.devices, refreshedAt: old?.refreshedAt, forensicSnapshot: old?.forensicSnapshot });
  return res.json({ ok: true, agentId, serverTime: new Date().toISOString() });
});

agentRouter.get('/status', (req, res) => {
  const agentId = String(req.query.agentId || 'default');
  const agent = agents.get(agentId);
  if (!agent) return res.json({ connected: false, agentId });
  const connected = Date.now() - agent.lastSeen < Number(process.env.AGENT_OFFLINE_MS || 10000);
  return res.json({ connected, agentId, lastSeen: new Date(agent.lastSeen).toISOString(), status: agent.status, devices: agent.devices || [], refreshedAt: agent.refreshedAt });
});

agentRouter.post('/commands', (req, res) => {
  const agentId = String(req.body?.agentId || 'default');
  const agent = agents.get(agentId);
  if (!agent || Date.now() - agent.lastSeen >= Number(process.env.AGENT_OFFLINE_MS || 10000)) return res.status(409).json({ error: 'Local forensic agent is offline' });
  const requestedType = req.body?.type;
  const type: Command['type'] = requestedType === 'ADB_STATUS' ? 'ADB_STATUS' : requestedType === 'ADB_FORENSIC_SNAPSHOT' ? 'ADB_FORENSIC_SNAPSHOT' : 'ADB_REFRESH';
  const command: Command = { id: crypto.randomUUID(), type, createdAt: Date.now() };
  const queue = commands.get(agentId) || [];
  queue.push(command);
  commands.set(agentId, queue);
  return res.status(202).json({ queued: true, commandId: command.id, type });
});

agentRouter.get('/commands', (req, res) => {
  const agentId = String(req.query.agentId || 'default');
  const agent = agents.get(agentId);
  if (agent) agent.lastSeen = Date.now();
  const queue = commands.get(agentId) || [];
  commands.set(agentId, []);
  return res.json({ commands: queue });
});

agentRouter.post('/commands/:id/result', (req, res) => {
  const agentId = String(req.body?.agentId || 'default');
  const agent = agents.get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not registered' });
  agent.lastSeen = Date.now();
  if (req.body?.error) agent.status = { error: req.body.error };
  else {
    const result = req.body.result || {};
    agent.status = result.status || agent.status;
    agent.devices = result.devices || agent.devices || [];
    agent.refreshedAt = result.refreshedAt || agent.refreshedAt;
    if (result.capturedAt && result.deviceDetails) agent.forensicSnapshot = result;
  }
  return res.json({ ok: true });
});

export function getDefaultAgentSnapshot() {
  const agent = Array.from(agents.values())[0];
  if (!agent) return { connected: false, devices: [] };
  return { connected: Date.now() - agent.lastSeen < Number(process.env.AGENT_OFFLINE_MS || 10000), agentId: agent.agentId, lastSeen: new Date(agent.lastSeen).toISOString(), status: agent.status, devices: agent.devices || [], refreshedAt: agent.refreshedAt, forensicSnapshot: agent.forensicSnapshot };
}

export function queueDefaultAgentCommand(type: Command['type']) {
  const agent = Array.from(agents.values())[0];
  if (!agent || Date.now() - agent.lastSeen >= Number(process.env.AGENT_OFFLINE_MS || 10000)) return null;
  const command: Command = { id: crypto.randomUUID(), type, createdAt: Date.now() };
  const queue = commands.get(agent.agentId) || [];
  queue.push(command);
  commands.set(agent.agentId, queue);
  return command.id;
}
