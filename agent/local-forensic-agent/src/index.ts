import dotenv from 'dotenv';
dotenv.config();

import { AgentServer } from './AgentServer';

const PORT = parseInt(process.env.AGENT_PORT || '47821', 10);
const server = new AgentServer(PORT);

server.start();
