
"use client";
import { useState } from "react";

export default function CreateUserPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", role: "" });
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/createUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ User created. Temp password: ${data.tempPassword}`);
    } else {
      setMessage(`❌ ${data.error}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Create New User</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Full Name"
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="border p-2 rounded"
        />
        <select
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          required
          className="border p-2 rounded"
        >
          <option value="">Select Role</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="patient">Patient</option>
          <option value="admin">Admin</option>
        </select>
        <button className="bg-blue-600 text-white p-2 rounded" type="submit">
          Create User
        </button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
