import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Test',
  description: 'Admin test page'
};

// Move themeColor to viewport config
export const viewport = {
  themeColor: '#000000'
};

export default function AdminTestPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Test</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Admin test content here</p>
      </div>
    </div>
  );
} 