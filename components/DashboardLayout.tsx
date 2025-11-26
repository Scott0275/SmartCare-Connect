import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { FiMenu, FiX, FiGrid, FiUsers, FiUser, FiBarChart2 } from 'react-icons/fi';
import SyncStatus from './SyncStatus';
import { Toaster } from 'react-hot-toast';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const navLinks = {
    admin: [
        { name: 'Overview', href: '/admin/dashboard', icon: FiGrid },
        { name: 'Manage Users', href: '/admin/manage-users', icon: FiUsers },
        { name: 'Analytics', href: '#', icon: FiBarChart2 },
    ],
    doctor: [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: FiGrid },
        { name: 'My Patients', href: '/doctor/my-patients', icon: FiUsers },
        { name: 'Appointments', href: '#', icon: FiUser },
    ],
    nurse: [
        { name: 'Dashboard', href: '/nurse/dashboard', icon: FiGrid },
        { name: 'Patient Vitals', href: '#', icon: FiBarChart2 },
        { name: 'Rounds', href: '#', icon: FiUsers },
    ],
    patient: [
        { name: 'Dashboard', href: '/patient/dashboard', icon: FiGrid },
        { name: 'My Records', href: '#', icon: FiUser },
        { name: 'Appointments', href: '#', icon: FiUsers },
    ],
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, role, loading, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const links = role ? navLinks[role as keyof typeof navLinks] : [];

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Toaster position="top-center" />
            <SyncStatus />
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0 md:flex md:flex-col md:justify-between`}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-teal-600">SmartCare</h2>
                    <nav className="mt-10">
                        {links.map((link) => (
                            <Link key={link.name} href={link.href} className="flex items-center py-3 px-4 my-2 text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-600 transition-colors">
                                <link.icon className="mr-3" />
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="p-6 border-t border-gray-200">
                    <button onClick={logout} className="w-full text-left py-2 px-4 rounded-lg hover:bg-red-50 text-red-500 font-semibold">Logout</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:ml-64 flex flex-col flex-1">
                {/* Top Navbar */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-600">
                        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                    <div className="text-right">
                        <p className="font-semibold">{(user as any)?.displayName ?? (user as any)?.email ?? (user as any)?.username ?? 'User'}</p>
                        <p className="text-sm text-gray-500">{(user as any)?.email ?? (user as any)?.username}</p>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
