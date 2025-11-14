"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBillById } from "@/lib/billingService";
import useRoleGuard from "@/hooks/useRoleGuard";

export default function PatientBillingView() {
  const { billId } = useParams() as { billId: string };
  const { loading } = useRoleGuard(["patient", "nurse", "doctor", "admin"]);
  const [bill, setBill] = useState<any | null>(null);

  useEffect(() => {
    if (!billId) return;
    async function load() {
      const b = await getBillById(billId);
      setBill(b);
    }
    load();
  }, [billId]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!bill) return <div className="p-6">Bill not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Bill #{bill.id}</h1>
      <div className="bg-white rounded shadow p-4 mb-4">
        <div>Patient: {bill.patientId}</div>
        <div>Status: {bill.status}</div>
        <div>Total: ${bill.totalAmount.toFixed(2)}</div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Cost</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((it: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{it.name}</td>
                <td className="px-4 py-2">${it.cost.toFixed(2)}</td>
                <td className="px-4 py-2">{it.quantity}</td>
                <td className="px-4 py-2">${it.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
