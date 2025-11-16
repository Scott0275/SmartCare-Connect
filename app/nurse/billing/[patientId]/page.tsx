"use client";
import React, { useState } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useRouter, useParams } from "next/navigation";
import AddBillingItemModal from "@/components/billing/AddBillingItemModal";
import { createBill } from "@/lib/offlineBillingService";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function NurseBillingCreatePage() {
  const { loading } = useRoleGuard(["nurse"]);
  const { user } = useAuth();
  const router = useRouter();
  const { patientId } = useParams() as { patientId: string };

  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  if (loading) return <div className="p-6">Loading...</div>;

  const addItem = (item: any) => setItems((s) => [...s, item]);
  const editItem = (index: number, updated: any) => setItems((s) => s.map((it, i) => (i === index ? updated : it)));
  const deleteItem = (index: number) => setItems((s) => s.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!user) return toast.error("Not authenticated");
    if (items.length === 0) return toast.error("Add at least one item");
    try {
      await createBill(patientId, user.uid, items);
      toast.success(navigator.onLine ? "Bill saved" : "Bill saved offline - will sync when online");
      router.push(`/patient/${patientId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error saving bill");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Create Bill for Patient</h1>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Item</button>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Cost</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{it.name}</td>
                <td className="px-4 py-2">${it.cost.toFixed(2)}</td>
                <td className="px-4 py-2">{it.quantity}</td>
                <td className="px-4 py-2">${it.total.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <button onClick={() => { const copy = { ...it }; editItem(idx, copy); setShowModal(true); }} className="text-sm text-indigo-600 mr-2">Edit</button>
                  <button onClick={() => deleteItem(idx)} className="text-sm text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-right">
        <div className="mb-2">Total: ${items.reduce((s, it) => s + (it.total || 0), 0).toFixed(2)}</div>
        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save Bill</button>
      </div>

      {showModal && (
        <AddBillingItemModal
          role="nurse"
          onSubmit={(item) => { addItem(item); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
