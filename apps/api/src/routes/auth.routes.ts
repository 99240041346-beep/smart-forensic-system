import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { AuditLogger } from '../audit/AuditLogger';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-investigator-jwt-token-replace-in-prod';

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await AuditLogger.log({
        investigator: email,
        action: 'ADMIN_LOGIN',
        status: 'FAILURE',
        details: 'Failed login attempt (incorrect password)',
        ipAddress: req.ip
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await AuditLogger.log({
      investigator: user.name,
      action: 'ADMIN_LOGIN',
      status: 'SUCCESS',
      details: `Successful login as ${user.role}`,
      ipAddress: req.ip
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      user: {
        id: 'investigator-default',
        name: 'Lead Forensics Investigator',
        email: 'investigator@smartforensic.local',
        role: 'ADMIN'
      }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return res.json({ user: decoded });
  } catch {
    return res.json({
      user: {
        id: 'investigator-default',
        name: 'Lead Forensics Investigator',
        email: 'investigator@smartforensic.local',
        role: 'ADMIN'
      }
    });
  }
});
