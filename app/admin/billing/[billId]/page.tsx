"use client";
import React, { useEffect, useState } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { useParams, useRouter } from "next/navigation";
import { getBillById, updateBillItem, deleteBillItem, markBillAsPaid, addItemToBill } from "@/lib/billingService";
import AddBillingItemModal from "@/components/billing/AddBillingItemModal";
import toast from "react-hot-toast";

export default function AdminBillingControlPage() {
  const { loading } = useRoleGuard(["admin"]);
  const { billId } = useParams() as { billId: string };
  const [bill, setBill] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!billId) return;
    async function load() {
      const b = await getBillById(billId);
      setBill(b);
    }
    load();
  }, [billId]);

  const handleEdit = (itemId: string) => {
    const index = bill.items.findIndex((item: any) => item.id === itemId);
    setEditingIndex(index);
    setShowModal(true);
  };

  const handleSaveItem = async (item: any) => {
    if (editingIndex !== null && bill) {
      await updateBillItem(bill.id, editingIndex, item);
      const b = await getBillById(bill.id);
      setBill(b);
      toast.success("Item updated");
    } else if (bill) {
      await addItemToBill(bill.id, item);
      const b = await getBillById(bill.id);
      setBill(b);
      toast.success("Item added");
    }
    setShowModal(false);
    setEditingIndex(null);
  };

  const handleDelete = async (itemId: string) => {
    if (!bill) return;
    const index = bill.items.findIndex((item: any) => item.id === itemId);
    await deleteBillItem(bill.id, index);
    const b = await getBillById(bill.id);
    setBill(b);
    toast.success("Item deleted");
  };

  const handleMarkPaid = async () => {
    if (!bill) return;
    await markBillAsPaid(bill.id, 'admin');
    const b = await getBillById(bill.id);
    setBill(b);
    toast.success("Marked as paid");
    router.refresh();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Billing - Bill #{billId}</h1>
      {!bill && <div>Loading bill...</div>}
      {bill && (
        <div>
          <div className="bg-white rounded shadow p-4 mb-4">
            <div className="mb-2">Patient: {bill.patientId}</div>
            <div className="mb-2">Status: {bill.status}</div>
            <div className="mb-2">Total: ${bill.totalAmount.toFixed(2)}</div>
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
                {bill.items.map((it: any, idx: number) => (
                  <tr key={it.id || idx} className="border-t">
                    <td className="px-4 py-2">{it.name}</td>
                    <td className="px-4 py-2">${it.cost.toFixed(2)}</td>
                    <td className="px-4 py-2">{it.quantity}</td>
                    <td className="px-4 py-2">${it.total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => { handleEdit(it.id); }} className="text-sm text-indigo-600 mr-2">Edit</button>
                      <button onClick={() => handleDelete(it.id)} className="text-sm text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-lg font-medium">Total: ${bill.totalAmount.toFixed(2)}</div>
            <div className="space-x-2">
              <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded">Add Item</button>
              <button onClick={handleMarkPaid} className="bg-green-600 text-white px-3 py-1 rounded">Mark Paid</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AddBillingItemModal
          role="admin"
          existingItem={editingIndex !== null ? bill.items[editingIndex] : undefined}
          onSubmit={handleSaveItem}
          onClose={() => { setShowModal(false); setEditingIndex(null); }}
        />
      )}
    </div>
  );
}
