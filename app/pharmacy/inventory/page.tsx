"use client";
import React, { useState, useEffect } from 'react';
import useRoleGuard from '@/hooks/useRoleGuard';
import { getInventory, updateInventoryStock } from '@/lib/pharmacyService';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { loading } = useRoleGuard(['pharmacy']);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const items = await getInventory();
      setInventory(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleStockUpdate = async (itemId: string, newStock: number, reason: string) => {
    try {
      await updateInventoryStock(itemId, newStock, reason);
      toast.success(navigator.onLine ? 'Stock updated' : 'Stock updated offline - will sync when online');
      await loadInventory();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error updating stock');
    }
  };

  const getStockStatus = (item: any) => {
    if (item.currentStock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', label: 'Out of Stock' };
    if (item.currentStock <= item.reorderLevel) return { status: 'low', color: 'bg-orange-100 text-orange-800', label: 'Low Stock' };
    return { status: 'good', color: 'bg-green-100 text-green-800', label: 'In Stock' };
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'low') return item.currentStock <= item.reorderLevel;
    if (filter === 'out') return item.currentStock === 0;
    return true;
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Inventory Management</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Add Item
          </button>
          <button onClick={loadInventory} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl font-bold">{inventory.length}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl font-bold text-green-600">{inventory.filter(i => i.currentStock > i.reorderLevel).length}</div>
          <div className="text-sm text-gray-600">In Stock</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl font-bold text-orange-600">{inventory.filter(i => i.currentStock <= i.reorderLevel && i.currentStock > 0).length}</div>
          <div className="text-sm text-gray-600">Low Stock</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-2xl font-bold text-red-600">{inventory.filter(i => i.currentStock === 0).length}</div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
      </div>

      {loadingInventory ? (
        <div className="text-center py-8">Loading inventory...</div>
      ) : filteredInventory.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">📦</div>
            <div>No inventory items found</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Medication</th>
                <th className="px-4 py-2 text-left">Current Stock</th>
                <th className="px-4 py-2 text-left">Reorder Level</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Unit Price</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.name}</div>
                      {item.genericName && (
                        <div className="text-sm text-gray-500">{item.genericName}</div>
                      )}
                      {item.manufacturer && (
                        <div className="text-xs text-gray-400">{item.manufacturer}</div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.currentStock}</div>
                    </td>
                    <td className="px-4 py-2">{item.reorderLevel}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-2">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 mr-2"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Adjust Stock - {editingItem.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <div className="text-lg font-bold">{editingItem.currentStock}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Stock Level</label>
                <input
                  type="number"
                  id="newStock"
                  className="w-full border rounded px-3 py-2"
                  defaultValue={editingItem.currentStock}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select id="reason" className="w-full border rounded px-3 py-2">
                  <option value="restock">Restock</option>
                  <option value="dispensed">Dispensed</option>
                  <option value="expired">Expired</option>
                  <option value="damaged">Damaged</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newStock = parseInt((document.getElementById('newStock') as HTMLInputElement).value);
                  const reason = (document.getElementById('reason') as HTMLSelectElement).value;
                  handleStockUpdate(editingItem.id, newStock, reason);
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}