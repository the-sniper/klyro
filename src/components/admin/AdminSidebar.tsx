"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  Code2,
  Fingerprint,
  LogOut,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/admin/persona", label: "AI Persona", icon: Fingerprint },
  { href: "/admin/test-chat", label: "Test Chat", icon: MessageSquare },
  { href: "/admin/integrations", label: "Integrations", icon: Code2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside className="admin-sidebar glass">
      <Link href="/admin" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sparkles size={24} />
        </div>
        <span className="sidebar-logo-text">Chatfolio</span>
      </Link>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "24px" }}>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
          }}
        >
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
