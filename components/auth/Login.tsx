"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("patient");
  const { login, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (user) {
    // Redirect logic is handled in AuthContext
    return null;
  }

  const demoCredentials = {
    admin: { email: 'admin@smartcare.demo', password: 'demo123' },
    doctor: { email: 'doctor@smartcare.demo', password: 'demo123' },
    nurse: { email: 'nurse@smartcare.demo', password: 'demo123' },
    patient: { email: 'patient@smartcare.demo', password: 'demo123' },
    labtech: { email: 'labtech@smartcare.demo', password: 'demo123' },
    pharmacy: { email: 'pharmacy@smartcare.demo', password: 'demo123' }
  };

  const fillDemoCredentials = () => {
    const creds = demoCredentials[selectedRole as keyof typeof demoCredentials];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500">{error}</p>}
      <div className="p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700 mb-2">Demo Credentials Available:</p>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
        >
          Fill {selectedRole} demo credentials
        </button>
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role (for selection only)
        </label>
        <select
          id="role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="labtech">Lab Technician</option>
          <option value="pharmacy">Pharmacist</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md shadow-sm"
      >
        Login
      </button>
    </form>
  );
};

export default Login;
