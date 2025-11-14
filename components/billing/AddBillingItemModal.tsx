"use client";
import React, { useEffect, useState } from "react";

export default function AddBillingItemModal({
  role,
  onSubmit,
  existingItem,
  onClose,
}: {
  role: "nurse" | "doctor" | "admin";
  onSubmit: (item: any) => void | Promise<void>;
  existingItem?: any;
  onClose?: () => void;
}) {
  const [name, setName] = useState(existingItem?.name || "");
  const [cost, setCost] = useState<number>(existingItem?.cost || 0);
  const [quantity, setQuantity] = useState<number>(existingItem?.quantity || 1);
  const total = Number((cost * quantity).toFixed(2));

  useEffect(() => {
    setName(existingItem?.name || "");
    setCost(existingItem?.cost || 0);
    setQuantity(existingItem?.quantity || 1);
  }, [existingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = { name, cost: Number(cost), quantity: Number(quantity), total };
    await onSubmit(item);
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{existingItem ? "Edit Item" : "Add Item"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full border rounded px-3 py-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Cost</label>
              <input type="number" step="0.01" value={cost} onChange={(e) => setCost(Number(e.target.value))} required className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} required className="mt-1 block w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Total</label>
            <div className="mt-1">${total.toFixed(2)}</div>
          </div>

          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => onClose && onClose()} className="px-3 py-1 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
