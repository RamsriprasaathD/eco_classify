"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ResultsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const results = sessionStorage.getItem('csvPredictionResults');
    if (results) {
      setData(JSON.parse(results));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="text-center text-gray-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
      <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer" onClick={() => window.location.href = '/'}>
                <span className="text-emerald-500 font-bold text-xl mr-2">EcoClassify</span>
                <span className="hidden sm:inline-block text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
                  Prediction Results
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/predictive-monitoring/upload">
                <button className="px-3 py-1 rounded-md text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600">
                  Upload New CSV
                </button>
              </Link>
              <Link href="/">
                <button className="px-3 py-1 rounded-md text-sm font-medium text-white bg-gray-700 hover:bg-gray-600">
                  Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto pt-24 px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-2">CSV Prediction Results</h1>
        <p className="text-gray-400 mb-8">Based on your uploaded bin fill data</p>

        {data.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400 mb-4">No prediction results available</p>
            <Link href="/predictive-monitoring/upload">
              <button className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg">
                Upload CSV
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="text-xs text-gray-400 uppercase bg-gray-900">
                <tr>
                  <th className="px-4 py-3">Bin ID</th>
                  <th className="px-4 py-3">Bin Zone</th>
                  <th className="px-4 py-3">Half Filled Time</th>
                  <th className="px-4 py-3">Fully Filled Time</th>
                  <th className="px-4 py-3">Overflow Risk Time</th>
                  <th className="px-4 py-3">Current Fill Level</th>
                  <th className="px-4 py-3">Condition</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.binId} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-emerald-400">{row.binId || '—'}</td>
                    <td className="px-4 py-3">{row.zone || '—'}</td>
                    <td className="px-4 py-3">{row.halfTime || '—'}</td>
                    <td className="px-4 py-3">{row.fullTime || '—'}</td>
                    <td className="px-4 py-3">{row.overflowTime || '—'}</td>
                    <td className="px-4 py-3">{typeof row.currentFill === 'number' ? `${row.currentFill}%` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.condition === 'Peak Usage' ? 'bg-red-900 text-red-300' :
                        row.condition === 'Overflow Risk' ? 'bg-red-900 text-red-300' :
                        row.condition === 'High Activity' ? 'bg-orange-900 text-orange-300' :
                        row.condition === 'Moderate' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-green-900 text-green-300'
                      }`}>
                        {row.condition || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link href="/predictive-monitoring/upload">
            <button className="bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium">
              Upload Another CSV
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
