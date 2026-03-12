"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initKlyro } from "@klyro/widget";

export default function KlyroWidget() {
  const pathname = usePathname();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (pathname === "/" || initializedRef.current) return;

    const isLocal = window.location.hostname === "localhost";
    initKlyro({
      key: "MnK1XElbACpl",
      apiBase: isLocal
        ? "http://localhost:3000"
        : "https://klyro-pro.vercel.app",
    });
    initializedRef.current = true;
  }, [pathname]);

  return null;
}
