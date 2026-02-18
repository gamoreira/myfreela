const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIndexes() {
  try {
    const result = await prisma.$queryRaw`SHOW INDEXES FROM tasks`;
    console.log('Tasks table indexes:');
    result.forEach(index => {
      console.log(`Index: ${index.Key_name}, Column: ${index.Column_name}, Non_unique: ${index.Non_unique}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkIndexes();
