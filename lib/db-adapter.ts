import db from "@/lib/db";

// Safe create user function to avoid createdAt/updatedAt errors
export const createUser = async (data: any) => {
  try {
    // Use raw SQL query to avoid Prisma's automatic field handling
    const result = await db.$queryRaw`
      INSERT INTO users (
        id, name, email, password, role, 
        "firstName", "lastName", "isTwoFactorEnabled", 
        "emailVerified", image
      ) 
      VALUES (
        ${data.id || db.$string(db.$raw('gen_random_uuid()'))}, 
        ${data.name}, 
        ${data.email}, 
        ${data.password}, 
        ${data.role || 'USER'}::public."UserRole", 
        ${data.firstName || null}, 
        ${data.lastName || null}, 
        ${data.isTwoFactorEnabled || false}, 
        ${data.emailVerified || null}, 
        ${data.image || null}
      )
      RETURNING id, email, name, role;
    `;
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}; 