"use client";
import React, { useState, useEffect } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { getConflicts } from "@/lib/conflictService";

export default function AdminConflictsPage() {
  const { loading } = useRoleGuard(["admin"]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [collectionFilter, setCollectionFilter] = useState("");

  useEffect(() => {
    loadConflicts();
  }, [statusFilter, collectionFilter]);

  const loadConflicts = async () => {
    try {
      const data = await getConflicts({
        status: statusFilter || undefined,
        collection: collectionFilter || undefined,
        limit: 50,
      });
      setConflicts(data);
    } catch (error) {
      console.error("Error loading conflicts:", error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Conflict Resolution</h1>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">All Collections</option>
            <option value="patients">Patients</option>
            <option value="billing">Billing</option>
            <option value="prescriptions">Prescriptions</option>
            <option value="visits">Visits</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Collection</th>
              <th className="px-4 py-2 text-left">Document ID</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.map((conflict) => (
              <tr key={conflict.id} className="border-t">
                <td className="px-4 py-2">{conflict.collection}</td>
                <td className="px-4 py-2 font-mono text-sm">{conflict.docId}</td>
                <td className="px-4 py-2">{conflict.username || conflict.userId}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    conflict.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    conflict.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {conflict.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(conflict.createdAt?.toDate ? conflict.createdAt.toDate() : conflict.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <div className="flex space-x-2">
                    <a
                      href={`/admin/conflicts/${conflict.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      Review
                    </a>
                    {conflict.status === 'pending' && (
                      <button
                        onClick={async () => {
                          // Quick ignore action
                          try {
                            const response = await fetch('/api/admin/conflicts/resolve', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                conflictId: conflict.id,
                                resolutionType: 'ignore',
                                note: 'Quick ignore from dashboard'
                              })
                            });
                            if (response.ok) {
                              loadConflicts();
                            }
                          } catch (error) {
                            console.error('Error ignoring conflict:', error);
                          }
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Ignore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {conflicts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No conflicts found
          </div>
        )}
      </div>
    </div>
  );
}