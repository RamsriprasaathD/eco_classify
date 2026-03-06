"use client";
import React, { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function OrgPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/') }>
            <span className="text-emerald-300 font-bold text-2xl mr-2">EcoClassify</span>
            <span className="hidden md:inline bg-emerald-900/50 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full border border-emerald-800">INSTITUTIONAL</span>
          </div>
          {session && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden sm:inline">Welcome, <span className="text-emerald-300">{session.user?.name}</span></span>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg text-sm hover:bg-red-900/40 transition-colors">Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      <main>
        <div className="mt-16">
          <div className="text-center py-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Welcome to <span className="text-emerald-400">EcoClassify</span></h1>
            <p className="text-gray-400 max-w-3xl mx-auto">The comprehensive waste management solution designed to help organizations classify items, schedule disposals, and manage timely reminders — all in one place.</p>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 pb-8">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-800 p-3 rounded-md mr-4">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18"/></svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Bulk CSV Upload</h2>
              </div>
              <p className="text-gray-400 mb-6">Upload organization CSVs and access the disposal calendar and scheduling tools in one place.</p>
              <div>
                <button onClick={() => router.push('/org/bulk-upload')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-500">Open Upload</button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-800 p-3 rounded-md mr-4">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M7 21h10M12 3v4"/></svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Smart Bin Monitoring</h2>
              </div>
              <p className="text-gray-400 mb-6">View live bin status, overflows, and alerts across your organization locations.</p>
              <div>
                <button onClick={() => router.push('/monitoring')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-500">Open Monitoring</button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-lg md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-800 p-3 rounded-md mr-4">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h6"/></svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Predictive Analytics</h2>
              </div>
              <p className="text-gray-400 mb-4">Upload historical data and get fill-level predictions and scheduling recommendations.</p>
              <div>
                <button onClick={() => router.push('/predictive-monitoring')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-500">Open Predictions</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
