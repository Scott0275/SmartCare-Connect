"use client";
import Login from "@/components/auth/Login";
import { AuthProvider } from "@/context/AuthContext";

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Login
          </h1>
          <Login />
        </div>
      </div>
    </AuthProvider>
  );
}
