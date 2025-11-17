import React from 'react';

interface RevenueBreakdownProps {
  data: {
    consultations: number;
    lab: number;
    pharmacy: number;
  };
  total: number;
}

export default function RevenueBreakdown({ data, total }: RevenueBreakdownProps) {
  const categories = [
    { name: 'Consultations', value: data.consultations, color: '#3b82f6' },
    { name: 'Lab Tests', value: data.lab, color: '#10b981' },
    { name: 'Pharmacy', value: data.pharmacy, color: '#f59e0b' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
      
      <div className="space-y-4">
        {categories.map((category) => {
          const percentage = total > 0 ? (category.value / total) * 100 : 0;
          return (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">${category.value.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Revenue</span>
          <span className="text-xl font-bold">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}