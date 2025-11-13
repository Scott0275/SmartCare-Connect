'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface AppUser {
  id: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      const newUsers: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        newUsers.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(newUsers);
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const toastId = toast.loading('Updating user role...');
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
      toast.success('User role updated successfully!', { id: toastId });
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
          <ul className="space-y-4">
            {users.map((appUser) => (
              <li key={appUser.id} className="p-4 border border-gray-200 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{appUser.email}</p>
                  <p className="text-sm text-gray-600">Role: {appUser.role}</p>
                </div>
                <select
                  value={appUser.role}
                  onChange={(e) => handleRoleChange(appUser.id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="admin">Admin</option>
                </select>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
