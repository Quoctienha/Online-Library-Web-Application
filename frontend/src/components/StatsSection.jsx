import React from 'react';

const StatsSection = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
        <h3 className="text-gray-500 text-sm font-medium">Tổng số sách</h3>
        <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalBooks}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
        <h3 className="text-gray-500 text-sm font-medium">Tổng lượt tải</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalDownloads}</p>
      </div>
    </div>
  );
};

export default StatsSection;