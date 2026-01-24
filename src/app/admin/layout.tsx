"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useBodyScrollLock(isSidebarOpen);

  return (
    <div className="admin-layout">
      <div className="mobile-header">
        <Link href="/admin" className="mobile-logo">
          <Image
            src="/logo.svg"
            alt="Klyro Logo"
            width={100}
            height={40}
            style={{ objectFit: "contain" }}
          />
        </Link>
        <button
          className="mobile-nav-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
