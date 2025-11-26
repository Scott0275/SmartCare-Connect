"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useRoleGuard from "@/hooks/useRoleGuard";
import { getConflictById } from "@/lib/conflictService";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function ConflictReviewPage() {
  const { loading } = useRoleGuard(["admin"]);
  const { conflictId } = useParams() as { conflictId: string };
  const { user } = useAuth();
  const router = useRouter();
  const [conflict, setConflict] = useState<any>(null);
  const [mergedData, setMergedData] = useState<any>({});
  const [note, setNote] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (conflictId) {
      loadConflict();
    }
  }, [conflictId]);

  const loadConflict = async () => {
    try {
      const data = await getConflictById(conflictId);
      setConflict(data);
      setMergedData((data as any)?.offlineData || {});
    } catch (error) {
      console.error("Error loading conflict:", error);
    }
  };

  const handleResolve = async (resolutionType: "apply" | "merge" | "ignore") => {
    if (!user || !conflict) return;
    
    setResolving(true);
    try {
      // obtain a bearer token from either Firebase User or Cognito user
      let idToken: string | null = null;
      if ((user as any)?.getIdToken && typeof (user as any).getIdToken === 'function') {
        idToken = await (user as any).getIdToken();
      } else if ((user as any)?.idToken) {
        idToken = (user as any).idToken;
      } else if (typeof window !== 'undefined') {
        idToken = localStorage.getItem('aws_id_token');
      }

      const response = await fetch('/api/admin/conflicts/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken ?? ''}`
        },
        body: JSON.stringify({
          conflictId,
          resolutionType,
          mergedData: resolutionType === 'merge' ? mergedData : undefined,
          note
        })
      });

      if (response.ok) {
        toast.success(`Conflict ${resolutionType}d successfully`);
        router.push('/admin/conflicts');
      } else {
        toast.error('Failed to resolve conflict');
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Error resolving conflict');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!conflict) return <div className="p-6">Conflict not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Resolve Conflict</h1>
        <button
          onClick={() => router.push('/admin/conflicts')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Conflicts
        </button>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Collection:</strong> {conflict.collection}</div>
          <div><strong>Document ID:</strong> {conflict.docId}</div>
          <div><strong>User:</strong> {conflict.username || conflict.userId}</div>
          <div><strong>Created:</strong> {new Date(conflict.createdAt?.toDate ? conflict.createdAt.toDate() : conflict.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3 text-green-700">Server Data (Current)</h3>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(conflict.serverData, null, 2)}
          </pre>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3 text-blue-700">Offline Data (Submitted)</h3>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(conflict.offlineData, null, 2)}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <label className="block text-sm font-medium mb-2">Resolution Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Add a note about this resolution..."
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => handleResolve("apply")}
          disabled={resolving}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Apply Offline Data
        </button>
        <button
          onClick={() => handleResolve("ignore")}
          disabled={resolving}
          className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Ignore (Keep Server)
        </button>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(conflict, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conflict-${conflictId}.json`;
            a.click();
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}