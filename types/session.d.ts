// Add this new file to fix the session type issue globally
declare module '@/lib/auth' {
  export const auth: () => Promise<{
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
      [key: string]: any;
    };
    expires: string;
    [key: string]: any;
  } | null>;
} 