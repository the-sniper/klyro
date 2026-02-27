"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  MessageSquare,
  MessageCircle,
  Code2,
  Fingerprint,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/persona", label: "AI Persona", icon: Fingerprint },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/admin/test-chat", label: "Test Chat", icon: MessageSquare },
  { href: "/admin/integrations", label: "Integrations", icon: Code2 },
  { href: "/admin/conversations", label: "Conversations", icon: MessageCircle },
];

import { WhatsNewModal } from "./WhatsNewModal";
import { useState } from "react";

export function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const NavLink = ({
    item,
    onClick,
  }: {
    item: (typeof navItems)[0];
    onClick?: () => void;
  }) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href));

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`sidebar-link ${isActive ? "active" : ""}`}
        onClick={onClick}
      >
        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className={`admin-sidebar glass ${isOpen ? "open" : ""}`}>
      {" "}
      <Link href="/admin" className="sidebar-logo" onClick={onClose}>
        <Image
          src="/logo.svg"
          alt="Klyro Logo"
          width={120}
          height={60}
          className="sidebar-logo-image"
          style={{ objectFit: "contain" }}
        />
      </Link>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: "24px" }}>
        {/* NEW: What's New Button */}
        <button
          onClick={() => setIsWhatsNewOpen(true)}
          className="sidebar-link w-full"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
          }}
        >
          <Sparkles size={22} className="text-warning text-accent" />
          <span>What's New</span>
        </button>

        <Link
          href="/admin/profile"
          className={`sidebar-link ${pathname === "/admin/profile" ? "active" : ""}`}
          onClick={onClose}
        >
          <User
            size={22}
            strokeWidth={pathname === "/admin/profile" ? 2.5 : 2}
          />
          <span>Profile</span>
        </Link>
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
      {/* NEW: The Modal Itself */}
      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
      />
    </aside>
  );
}
