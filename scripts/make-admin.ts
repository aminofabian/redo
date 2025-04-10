import { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'leilakitto@gmail.com';
  
  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
    });
    
    console.log(`User ${email} has been updated to ADMIN role:`, updatedUser);
  } catch (error) {
    console.error(`Error updating user ${email}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 