// This file tells Next.js not to statically generate these routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Fallback() {
  return null;
} 