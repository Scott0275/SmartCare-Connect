"use client";

import React from "react";

const Register = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Registration Disabled</h2>
        <p className="text-center text-gray-700">Self-registration is disabled. Accounts must be created by an administrator.</p>
        <div className="text-center">
          <a href="/login" className="text-sm text-teal-600 underline">Return to login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
