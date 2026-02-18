import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('test123456', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@freelas.com' },
    update: {},
    create: {
      email: 'test@freelas.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✅ Test user created:', testUser.email);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'guilhermeintegrado@gmail.com' },
    update: { isAdmin: true },
    create: {
      email: 'guilhermeintegrado@gmail.com',
      password: adminPassword,
      name: 'Guilherme (Admin)',
      isAdmin: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create default task types
  const defaultTaskTypes = [
    { name: 'Development', color: '#3B82F6' },
    { name: 'Design', color: '#8B5CF6' },
    { name: 'Meeting', color: '#F59E0B' },
    { name: 'Review', color: '#10B981' },
    { name: 'Bug Fix', color: '#EF4444' },
    { name: 'Documentation', color: '#6B7280' },
    { name: 'Research', color: '#14B8A6' },
    { name: 'Planning', color: '#EC4899' },
  ];

  for (const taskType of defaultTaskTypes) {
    await prisma.taskType.upsert({
      where: {
        userId_name: {
          userId: testUser.id,
          name: taskType.name,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        name: taskType.name,
        color: taskType.color,
      },
    });
  }

  console.log(`✅ ${defaultTaskTypes.length} default task types created`);

  // Create sample clients
  const sampleClients = [
    { name: 'Acme Corp' },
    { name: 'Tech Startup Inc' },
    { name: 'Design Studio' },
  ];

  for (const client of sampleClients) {
    await prisma.client.upsert({
      where: {
        userId_name: {
          userId: testUser.id,
          name: client.name,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        name: client.name,
      },
    });
  }

  console.log(`✅ ${sampleClients.length} sample clients created`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
