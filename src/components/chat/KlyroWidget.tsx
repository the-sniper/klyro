"use client";

import { useEffect } from "react";
import { initKlyro } from "@klyro/widget";

export default function KlyroWidget() {
  useEffect(() => {
    const isLocal = window.location.hostname === "localhost";
    initKlyro({
      key: "MnK1XElbACpl",
      apiBase: isLocal
        ? "http://localhost:3000"
        : "https://klyro-pro.vercel.app",
    });
  }, []);

  return null;
}
