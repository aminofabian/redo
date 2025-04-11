import { PrismaClient } from '@prisma/client';
import { UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'leilakitto@gmail.com';
  
  console.log(`Starting admin role update for ${email}...`);
  
  try {
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!existingUser) {
      console.error(`User with email ${email} not found!`);
      return;
    }
    
    console.log(`Found user: ${existingUser.id}, current role: ${existingUser.role}`);
    
    // Update the user role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
    });
    
    console.log(`User ${email} has been updated to ADMIN role:`, updatedUser);
    
    // Verify the update
    const verifiedUser = await prisma.user.findUnique({
      where: { email },
    });
    
    console.log(`Verification: User now has role: ${verifiedUser.role}`);
  } catch (error) {
    console.error(`Error updating user ${email}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 