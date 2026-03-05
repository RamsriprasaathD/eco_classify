"use client";
import React from 'react';
import CSVUploadForm from '../../../components/CSVUploadForm.jsx';
import Link from 'next/link';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
      <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer" onClick={() => window.location.href = '/'}>
                <span className="text-emerald-500 font-bold text-xl mr-2">EcoClassify</span>
                <span className="hidden sm:inline-block text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">
                  CSV Prediction Upload
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/predictive-monitoring">
                <button className="px-3 py-1 rounded-md text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600">
                  Default View
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
        <h1 className="text-3xl font-bold text-white mb-8">Upload Bin Fill Data for Prediction</h1>
        <CSVUploadForm />
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Expected CSV Format</h3>
            <pre className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-x-auto">
{`bin_id,zone,time_of_day,day_type,fill_level
BIN-01,Canteen,08:00,weekday,10
BIN-01,Canteen,09:00,weekday,20
BIN-01,Canteen,10:00,weekday,25
BIN-02,Library,08:00,weekday,5
BIN-02,Library,10:00,weekday,15`}
            </pre>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4">What You will Get</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Predicted fill thresholds
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Current fill estimates
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Bin condition classifications
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
