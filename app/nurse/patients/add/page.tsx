"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useAuth } from "@/context/AuthContext";
import { addPatient } from "@/services/patients";
import toast from "react-hot-toast";

export default function AddPatientPage() {
  const { loading } = useRoleGuard(["nurse"]);
  const { user } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return <div className="p-6">Loading...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addPatient({
        firstName,
        lastName,
        gender,
        dateOfBirth,
        phone,
        address,
        createdBy: user?.uid || null,
      });
      toast.success("Patient created");
      router.push("/nurse/patients");
    } catch (err) {
      console.error(err);
      toast.error("Error creating patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Add Patient</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border rounded px-3 py-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <select required value={gender} onChange={(e) => setGender(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input required type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="border rounded px-3 py-2" />
          <input required placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded px-3 py-2" />
        </div>

        <div>
          <textarea required placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded">
            {saving ? "Saving..." : "Create Patient"}
          </button>
        </div>
      </form>
    </div>
  );
}
