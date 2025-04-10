import { auth } from "@/auth";
import { signOut } from "next-auth/react";

// Define the session type to match what auth() returns
interface UserSession {
  user?: {
    name?: string;
    email?: string;
    id?: string;
    role?: string;
    emailVerified?: Date | null;
  };
}

async function SettingsPage() {
  // Type assertion to help TypeScript understand the session structure
  const session = await auth() as UserSession | null;
  
  return (
    <div>
    <table>
    <thead>
    <tr>
    <th>Property</th>
    <th>Value</th>
    </tr>
    </thead>
    <tbody>
    <tr><td>Name</td><td>{session?.user?.name || 'N/A'}</td></tr>
    <tr><td>Email</td><td>{session?.user?.email || 'N/A'}</td></tr>
    <tr><td>ID</td><td>{session?.user?.id || 'N/A'}</td></tr>
    <tr><td>Role</td><td>{session?.user?.role || 'N/A'}</td></tr>
    <tr><td>Email Verified</td><td>{session?.user?.emailVerified ? 'Yes' : 'No'}</td></tr>
    {/* Add more rows for other properties */}
    </tbody>
    </table>
    
    <form
    action={async () => {
      "use server";
      await signOut();
    }}
    >
    <button type="submit">Sign Out</button>
    </form>
    </div>
  );
}

export default SettingsPage;