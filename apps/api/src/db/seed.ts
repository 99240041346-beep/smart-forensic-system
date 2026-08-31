import bcrypt from 'bcryptjs';
import { prisma } from './client';
import { DemoDataGenerator } from '../demo/DemoDataGenerator';

async function main() {
  console.log('[Seed] Initializing Smart Forensic System database...');

  // 1. Create Default Admin Investigator
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartforensic.local' },
    update: {},
    create: {
      email: 'admin@smartforensic.local',
      name: 'Lead Forensics Investigator',
      passwordHash,
      role: 'ADMIN'
    }
  });
  console.log(`[Seed] Created admin user: ${admin.email}`);

  // 2. Create Default System Settings
  const defaultSettings = [
    { key: 'DEMO_MODE', value: 'true' },
    { key: 'RETENTION_DAYS', value: '30' },
    { key: 'THREAT_INTEL_PROVIDER', value: 'offline_heuristics' },
    { key: 'AUTO_REFRESH_INTERVAL_SEC', value: '10' }
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }

  // 3. Populate Demo Devices
  const demoDevices = DemoDataGenerator.getDemoDevices();
  for (const d of demoDevices) {
    await prisma.device.upsert({
      where: { serial: d.serial },
      update: {
        maskedSerial: d.maskedSerial,
        model: d.model,
        marketName: d.model,
        isDemo: true
      },
      create: {
        serial: d.serial,
        maskedSerial: d.maskedSerial,
        manufacturer: d.serial.includes('S24') ? 'Samsung' : 'Google',
        model: d.model,
        marketName: d.model,
        androidVersion: d.serial.includes('S24') ? '14' : '15',
        apiLevel: d.serial.includes('S24') ? 34 : 35,
        securityPatchLevel: d.serial.includes('S24') ? '2024-02-01' : '2024-08-05',
        isDemo: true
      }
    });
  }
  console.log(`[Seed] Seeded ${demoDevices.length} demo devices`);

  // 4. Create Initial Benchmark Forensic Case
  const initialCase = await prisma.case.upsert({
    where: { caseNumber: 'CASE-2026-0001' },
    update: {},
    create: {
      caseNumber: 'CASE-2026-0001',
      title: 'Mobile Banking Malware & Smishing Triage Investigation',
      description: 'Authorized non-invasive forensic acquisition of corporate endpoint suspecting credential theft and SMS OTP interception.',
      investigatorId: admin.id,
      investigatorName: admin.name,
      deviceSerial: 'DEMO-PIXEL8-SEC01',
      deviceModel: 'Google Pixel 8 Pro',
      status: 'OPEN',
      riskLevel: 'CRITICAL',
      notes: 'Initial scan revealed high-risk Banking Trojan Profile in sideloaded application and urgent smishing message from SBI-ALERTS.',
      tags: 'Malware,Smishing,BankingTrojan,Critical'
    }
  });

  // 5. Populate Initial Audit Log
  await prisma.auditLog.createMany({
    data: [
      {
        investigator: admin.name,
        action: 'ADMIN_LOGIN',
        status: 'SUCCESS',
        details: 'System initialization and admin credentials setup',
        ipAddress: '127.0.0.1'
      },
      {
        investigator: admin.name,
        action: 'CASE_CREATED',
        caseId: initialCase.id,
        targetDeviceSerial: 'DEMO••••EC01',
        status: 'SUCCESS',
        details: 'Created benchmark investigation case CASE-2026-0001',
        ipAddress: '127.0.0.1'
      }
    ]
  });

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch(e => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
