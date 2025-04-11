import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'leilakitto@gmail.com';
  
  try {
    // Get all users to check
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    console.log("All users in system:", allUsers);
    
    // Look for our specific user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.error(`User ${email} not found in database!`);
      return;
    }
    
    console.log("Found user:", user);
    console.log(`Current role: ${user.role}`);
    
    if (user.role !== UserRole.ADMIN) {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: UserRole.ADMIN },
      });
      
      console.log("Updated user role to ADMIN:", updated);
    } else {
      console.log("User is already an ADMIN, no update needed");
    }
    
    // Verify again after update
    const verifiedUser = await prisma.user.findUnique({
      where: { email },
    });
    
    console.log("Final user state:", verifiedUser);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 