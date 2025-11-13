'use client';

import DashboardLayout from "@/components/DashboardLayout";
import useRoleGuard from "@/hooks/useRoleGuard";
import { FiEdit, FiTrash, FiUserPlus } from 'react-icons/fi';

// Mock data for users
const mockUsers = [
    { id: 1, name: 'Dr. Alice Smith', email: 'alice.smith@example.com', role: 'doctor' },
    { id: 2, name: 'Nurse Betty Jones', email: 'betty.jones@example.com', role: 'nurse' },
    { id: 3, name: 'John Doe', email: 'john.doe@example.com', role: 'patient' },
    { id: 4, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { id: 5, name: 'Dr. Charles Brown', email: 'charles.brown@example.com', role: 'doctor' },
];

const ManageUsersPage = () => {
    const { isAuthorized, loading } = useRoleGuard(['admin']);

    if (loading || !isAuthorized) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
                <button className="bg-teal-500 text-white py-2 px-4 rounded-lg flex items-center hover:bg-teal-600 transition-colors">
                    <FiUserPlus className="mr-2" />
                    Add New User
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{user.name}</p>
                                    <p className="text-gray-600 whitespace-no-wrap">{user.email}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight`}>
                                        <span aria-hidden className={`absolute inset-0 ${user.role === 'admin' ? 'bg-red-200' : 'bg-green-200'} opacity-50 rounded-full`}></span>
                                        <span className="relative">{user.role}</span>
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button className="text-gray-600 hover:text-teal-600 mr-4">
                                        <FiEdit />
                                    </button>
                                    <button className="text-gray-600 hover:text-red-600">
                                        <FiTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
};

export default ManageUsersPage;
