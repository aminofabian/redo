import 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    firstName?: string;
    lastName?: string;
    role?: string;
    id?: string;
    // Add any other custom properties here
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: UserRole;
    }
  }
} 