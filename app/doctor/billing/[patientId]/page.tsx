"use client";
import React, { useEffect, useState } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useParams } from "next/navigation";
import { getBillsForPatient, addItemToBill, getBillById } from "@/lib/billingService";
import AddBillingItemModal from "@/components/billing/AddBillingItemModal";
import toast from "react-hot-toast";

export default function DoctorBillingPage() {
  const { loading } = useRoleGuard(["doctor"]);
  const { patientId } = useParams() as { patientId: string };
  const [bills, setBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    async function load() {
      const data = await getBillsForPatient(patientId);
      setBills(data);
    }
    load();
  }, [patientId]);

  const openAddToBill = async (billId: string) => {
    const bill = await getBillById(billId);
    setSelectedBill(bill);
    setShowModal(true);
  };

  const handleAdd = async (item: any) => {
    if (!selectedBill) return toast.error("Select a bill");
    try {
      await addItemToBill(selectedBill.id, item);
      toast.success("Item added to bill");
      const data = await getBillsForPatient(patientId);
      setBills(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error adding item");
    }
    setShowModal(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Patient Bills</h1>
      <div className="space-y-3">
        {bills.map((b) => (
          <div key={b.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">Bill #{b.id}</div>
              <div className="text-sm text-gray-500">Total: ${b.totalAmount.toFixed(2)} — Status: {b.status}</div>
            </div>
            <div>
              <button onClick={() => openAddToBill(b.id)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Item</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedBill && (
        <AddBillingItemModal role="doctor" onSubmit={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
