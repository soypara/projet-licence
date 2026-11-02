"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/admin" },
  { label: "Lieux touristiques", href: "/admin/places" },
  { label: "Circuits", href: "/admin/circuits" },
  { label: "Hôtels", href: "/admin/hotels" },
  { label: "Commentaires", href: "/admin/comments" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white p-5">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Madagascar Tour</h1>
        <p className="text-sm text-gray-500">Administration</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                active
                  ? "bg-green-100 text-green-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}