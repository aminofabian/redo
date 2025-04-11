import { DirectLoginForm } from "@/components/admin/DirectLoginForm";

export default function DirectLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Access Check</h1>
        <p className="text-center mb-8 text-gray-600">
          Use this form to bypass middleware and test admin authentication
        </p>
        <DirectLoginForm />
      </div>
    </div>
  );
} 