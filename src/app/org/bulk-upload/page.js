"use client";
import React from 'react';
import BulkWasteUpload from '../../../../src/components/BulkWasteUpload';

export default function OrgBulkUploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-400 mb-6">Organization Bulk CSV Upload</h1>
        <BulkWasteUpload />
      </div>
    </div>
  );
}
