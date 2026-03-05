"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CSVUploadForm() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/predict-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text })
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Prediction failed');
        setLoading(false);
        return;
      }

      // Store results in sessionStorage and navigate
      sessionStorage.setItem('csvPredictionResults', JSON.stringify(json.data));
      router.push('/predictive-monitoring/results');
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-6">Upload Bin Fill Data CSV</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <label className="block">
            <span className="sr-only">Choose CSV file</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-700 file:text-white
                hover:file:bg-emerald-600"
            />
          </label>
          {file && (
            <p className="mt-4 text-sm text-emerald-400">Selected: {file.name}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-blue-900 border border-blue-700 text-blue-300 px-4 py-3 rounded text-sm">
          <strong>CSV Format:</strong> bin_id, zone, time_of_day, day_type, fill_level
          <br />
          Example: BIN-01, Canteen Area, 08:00, weekday, 10
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-600 transition-all"
        >
          {loading ? 'Processing...' : 'Generate Predictions'}
        </button>
      </form>
    </div>
  );
}