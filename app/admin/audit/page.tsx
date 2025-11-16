"use client";
import React, { useState, useEffect } from "react";
import useRoleGuard from "@/hooks/useRoleGuard";
import { getAuditLogs } from "@/lib/auditService";

export default function AdminAuditPage() {
  const { loading } = useRoleGuard(["admin"]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  const loadAuditLogs = async () => {
    try {
      const data = await getAuditLogs({
        action: actionFilter || undefined,
        limit: 100,
      });
      setAuditLogs(data);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="">All Actions</option>
          <option value="conflict-apply">Conflict Applied</option>
          <option value="conflict-merge">Conflict Merged</option>
          <option value="conflict-ignore">Conflict Ignored</option>
        </select>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Actor</th>
              <th className="px-4 py-2 text-left">Target</th>
              <th className="px-4 py-2 text-left">Note</th>
              <th className="px-4 py-2 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-2">
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2">{log.actorName || log.actorId}</td>
                <td className="px-4 py-2">
                  <div className="text-sm">
                    <div>{log.targetCollection}</div>
                    <div className="text-gray-500 font-mono text-xs">{log.targetDocId}</div>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm">{log.note || "-"}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(log.createdAt?.toDate ? log.createdAt.toDate() : log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {auditLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found
          </div>
        )}
      </div>
    </div>
  );
}