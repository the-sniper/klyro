import React from "react";
import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  PWAProvider,
  InstallBanner,
  ServiceWorkerRegistration,
} from "@/components/pwa";
import "./globals.css";
import KlyroWidget from "@/components/chat/KlyroWidget";

export const metadata: Metadata = {
  title: "Klyro | Embeddable AI Website Copilot",
  description:
    "Train an embeddable AI copilot on your GitHub, resume, docs, and website content. Shape its persona, test every answer, and deploy it anywhere.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://klyro.com"), // Replace with actual production URL when available
  keywords: [
    "embeddable AI widget",
    "AI website copilot",
    "AI portfolio chatbot",
    "website chatbot",
    "AI persona for website",
    "embeddable chat widget",
    "RAG chatbot",
    "GitHub integrated AI assistant",
    "knowledge based chatbot",
    "custom AI agent",
    "AI brand voice",
    "website visitor engagement",
  ],
  authors: [{ name: "Areef Syed", url: "https://www.areefsyed.com/" }],
  creator: "Klyro",
  publisher: "Klyro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Klyro",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://klyro.com",
    siteName: "Klyro",
    title: "Klyro | Embeddable AI Website Copilot",
    description:
      "Turn your content into a grounded AI website copilot. Train it on your sources, shape the persona, test it, and deploy it anywhere.",
    images: [
      {
        url: "/og-image.png", // Added placeholder for OG image
        width: 1200,
        height: 630,
        alt: "Klyro - AI Portfolio Chatbot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Klyro | Embeddable AI Website Copilot",
    description:
      "Train an AI copilot on your own content and deploy a polished website widget that answers in your voice.",
    images: ["/og-image.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#050816" },
    { media: "(prefers-color-scheme: dark)", color: "#050816" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Klyro",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description:
      "Klyro is an embeddable AI website copilot that learns from your content, follows your persona, and helps visitors get grounded answers.",
    featureList: [
      "Persona configuration",
      "Knowledge-based answers",
      "GitHub and URL ingestion",
      "Test chat with strict mode",
      "Embeddable website widget",
      "Conversation transcripts",
    ],
    url: "https://klyro.com",
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Fonts - Sora + Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA meta tags for iOS */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Klyro" />

        {/* Android/Chrome meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Klyro" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#050816" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="bg-[#060609] text-white">
        <PWAProvider>
          {children}
          <InstallBanner />
          <ServiceWorkerRegistration />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "toast-container",
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </PWAProvider>
        <KlyroWidget />
        {/* <script
          src="http://localhost:3000/widget.js"
          data-widget-key="MnK1XElbACpl"
          async
        ></script> */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
