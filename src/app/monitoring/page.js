"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const generateInitial = () => {
  const items = [];
  for (let i = 1; i <= 10; i++) {
    items.push({
      id: i,
      name: `Dustbin ${i}`,
      location: `Zone ${Math.ceil(i/2)}`,
      status: i % 4 === 0 ? "Overflow" : "Normal",
      lastAlert: i % 4 === 0 ? "5:30 PM" : "-",
      fill: Math.floor(Math.random() * 40) + 40
    });
  }
  return items;
};

const Monitoring = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [bins, setBins] = useState(generateInitial);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!session) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    const iv = setInterval(() => {
      // pick a random bin and toggle its status sometimes
      setBins(prev => {
        const copy = prev.map(b => ({ ...b }));
        const idx = Math.floor(Math.random() * copy.length);
        const bin = copy[idx];
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // randomly decide overflow or normal
        const willOverflow = Math.random() > 0.7;
        bin.status = willOverflow ? "Overflow" : "Normal";
        bin.fill = Math.min(100, Math.max(10, bin.fill + (willOverflow ? 20 : -10)));
        bin.lastAlert = willOverflow ? timeStr : bin.lastAlert;
        setLastEvent({ name: bin.name, status: bin.status, time: timeStr });
        return copy;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const overflowCount = bins.filter(b => b.status === "Overflow").length;

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200">
      <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer" onClick={() => router.push("/") }>
                <span className="text-emerald-500 font-bold text-xl mr-2">EcoClassify</span>
                <span className="hidden sm:inline-block text-xs bg-emerald-900 text-emerald-300 px-2 py-1 rounded-full">Smart Waste Management</span>
              </div>
            </div>
            <div className="flex items-center">
              {session && (
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-gray-300 text-sm">Welcome back,</span>
                    <span className="text-emerald-400 font-medium">{session.user?.name || "User"}</span>
                  </div>
                  <button onClick={handleSignOut} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-opacity-50 transition-all duration-200 ease-in-out shadow-sm">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-24 px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Bin Monitoring</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">Live monitoring of smart bins, overflow alerts and fill-levels across your locations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overflowing Bins</p>
                <p className="text-2xl font-semibold text-white">{overflowCount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Last Event</p>
                <p className="text-sm text-emerald-300">{lastEvent ? `${lastEvent.name} • ${lastEvent.status} @ ${lastEvent.time}` : '—'}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Live Feed</p>
              <p className="text-lg font-medium text-white">Simulated live updates every few seconds</p>
            </div>
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-700 text-emerald-100 text-sm">
                <span className="h-2 w-2 bg-emerald-300 rounded-full mr-2 animate-pulse" /> Live
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Bin Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Last Alert</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">Fill Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {bins.map(bin => (
                <tr key={bin.id} className="hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{bin.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{bin.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bin.status === 'Overflow' ? 'bg-red-700 text-red-100' : 'bg-emerald-800 text-emerald-100'}`}>
                      {bin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{bin.lastAlert}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{bin.fill}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-between">
          <Link href="/">
            <button className="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600">Back</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
