import path from 'path';
import dotenv from 'dotenv';

// Load the local agent's own .env regardless of the current working directory.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { AgentServer } from './AgentServer';
import { CloudBridge } from './CloudBridge';

const PORT = parseInt(process.env.AGENT_PORT || '47821', 10);
const server = new AgentServer(PORT);
server.start();

const bridge = new CloudBridge();
void bridge.start();
