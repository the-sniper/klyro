import React from "react";
import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { Outfit } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  PWAProvider,
  InstallBanner,
  ServiceWorkerRegistration,
} from "@/components/pwa";
import "./globals.css";
import KlyroWidget from "@/components/chat/KlyroWidget";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Klyro | AI Portfolio Chatbot & Personal Digital Twin",
  description:
    "Transform your portfolio with Klyro. Add a custom AI chatbot that learns from your GitHub, resume, and projects to engage visitors with your unique persona 24/7.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://klyro.com"), // Replace with actual production URL when available
  keywords: [
    "AI portfolio chatbot",
    "personal AI assistant",
    "interactive portfolio",
    "digital twin for developers",
    "AI persona for website",
    "embeddable chat widget",
    "RAG chatbot for portfolios",
    "GitHub integrated AI assistant",
    "website visitor engagement",
    "custom AI agent",
    "AI-powered professional profile",
    "automated portfolio inquiries",
    "intelligent resume assistant",
    "conversational portfolio",
    "AI brand voice",
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
    title: "Klyro | The Ultimate AI Portfolio Chatbot",
    description:
      "Showcase your work better with an AI digital twin. Klyro trains on your data to represent you to recruiters and clients 24/7.",
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
    title: "Klyro | AI Portfolio Assistant",
    description:
      "Define your persona, let AI tell your story. The easiest way to add an intelligent chatbot to your personal website.",
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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
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
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Klyro is an AI-powered portfolio chatbot platform that helps developers and creatives engage visitors through a custom digital twin trained on their professional data.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "88",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={outfit.className}>
        <PWAProvider>
          {children}
          <InstallBanner />
          <ServiceWorkerRegistration />
          <Toaster
            position="bottom-right"
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
