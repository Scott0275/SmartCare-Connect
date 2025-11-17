"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LabTechSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/labtech/dashboard", label: "Dashboard", icon: "🏠" },
    { href: "/labtech/requests", label: "Lab Requests", icon: "🧪" },
    { href: "/labtech/pending", label: "Pending", icon: "⏳" },
    { href: "/labtech/in-progress", label: "In Progress", icon: "🔄" },
    { href: "/labtech/completed", label: "Completed", icon: "✅" },
    { href: "/labtech/imaging", label: "Imaging", icon: "📷" },
  ];

  return (
    <div className="w-64 bg-teal-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Lab Technician</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm hover:bg-teal-700 ${
              pathname === item.href ? "bg-teal-700 border-r-4 border-teal-300" : ""
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