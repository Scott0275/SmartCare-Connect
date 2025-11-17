"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PharmacySidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/pharmacy/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/pharmacy/prescriptions", label: "Prescriptions", icon: "💊" },
    { href: "/pharmacy/pending", label: "Pending", icon: "⏳" },
    { href: "/pharmacy/in-progress", label: "In Progress", icon: "🔄" },
    { href: "/pharmacy/inventory", label: "Inventory", icon: "📦" },
    { href: "/pharmacy/reports", label: "Reports", icon: "📊" },
  ];

  return (
    <div className="w-64 bg-green-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Pharmacy</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm hover:bg-green-700 ${
              pathname === item.href ? "bg-green-700 border-r-4 border-green-300" : ""
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}