import 'next-auth';

declare module 'next-auth' {
  interface User {
    firstName?: string;
    lastName?: string;
    role?: string;
    id?: string;
    // Add any other custom properties here
  }
  
  interface Session {
    user?: User;
  }
} 