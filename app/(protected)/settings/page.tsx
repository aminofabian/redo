import { auth } from "@/auth";
import { signOut } from "@/lib/auth";

async function SettingsPage() {
  const session = await auth();
  
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