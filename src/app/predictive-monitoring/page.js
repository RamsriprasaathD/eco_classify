"use client";
import React from 'react';
import Link from 'next/link';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
      <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer" onClick={() => window.location.href = '/'}>
                <span className="text-emerald-500 font-bold text-xl mr-2">EcoClassify</span>
                <span className="hidden sm:inline-block text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
                  Predictive Peak Time Bin Monitoring
                </span>
              </div>
            </div>
            <div className="flex items-center">
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto pt-24 px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-8">Predictive Peak Time Bin Monitoring</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/predictive-monitoring/upload">
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-700 group cursor-pointer">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 border-b border-gray-700 group-hover:from-emerald-900 group-hover:to-emerald-800 transition-all duration-300">
                <div className="flex items-center">
                  <div className="bg-emerald-800 p-2 rounded-lg mr-3">
                    <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold">Upload CSV Data</h2>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-gray-300 mb-6">
                  Upload a CSV file with historical bin fill data to generate predictive analytics and forecasts for waste collection scheduling.
                </p>
                <ul className="text-gray-400 mb-8 pl-5 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Process custom bin data
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Predict fill thresholds
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Generate reports
                  </li>
                </ul>
                <div className="mt-auto flex justify-center">
                  <div className="relative bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-500 transition-all duration-300 shadow-md group-hover:scale-105 overflow-hidden">
                    <span className="relative z-10">Upload CSV</span>
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 border-b border-gray-700">
              <div className="flex items-center">
                <div className="bg-emerald-800 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">How It Works</h2>
              </div>
            </div>
            <div className="p-6">
              <ol className="text-gray-300 space-y-4">
                <li className="flex">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-700 text-white text-sm font-semibold mr-3">1</span>
                  <span>Prepare a CSV with bin_id, zone, time_of_day, day_type, fill_level columns</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-700 text-white text-sm font-semibold mr-3">2</span>
                  <span>Upload the CSV file using the form</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-700 text-white text-sm font-semibold mr-3">3</span>
                  <span>View predictive results with fill thresholds and conditions</span>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-700 text-white text-sm font-semibold mr-3">4</span>
                  <span>Schedule collection based on predictions</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
