import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatfolio - AI Portfolio Assistant",
  description: "An embeddable AI chatbot for your portfolio website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
