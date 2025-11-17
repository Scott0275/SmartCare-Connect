import React from 'react';

interface AnalyticsChartProps {
  title: string;
  data: { [key: string]: number };
  type: 'bar' | 'pie' | 'line';
  isOffline?: boolean;
}

export default function AnalyticsChart({ title, data, type, isOffline }: AnalyticsChartProps) {
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, value]) => value));

  if (isOffline) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Offline</span>
        </div>
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">{key}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {type === 'bar' && (
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center space-x-3">
              <div className="w-20 text-sm text-gray-600 truncate">{key}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm font-medium text-right">{value}</div>
            </div>
          ))}
        </div>
      )}

      {type === 'pie' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {entries.map(([key, value], index) => (
              <div key={key} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span className="text-sm text-gray-600">{key}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{entries.reduce((sum, [, value]) => sum + value, 0)}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}