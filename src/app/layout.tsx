import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { Outfit } from "next/font/google";
import {
  PWAProvider,
  InstallBanner,
  ServiceWorkerRegistration,
} from "@/components/pwa";
import "./globals.css";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Klyro - Turn Your Content Into Conversations",
  description:
    "Add a custom AI chatbot to any website in minutes. Klyro learns from your content to answer visitor questions 24/7 with your unique persona.",
  manifest: "/manifest.json",
  keywords: [
    "AI chatbot",
    "website chatbot",
    "portfolio chatbot",
    "digital twin",
    "AI persona",
    "embeddable chat widget",
    "AI assistant",
    "conversational AI",
    "customer engagement",
    "AI-powered website",
    "chat widget",
    "portfolio AI",
    "developer portfolio",
    "personal website chatbot",
    "RAG chatbot",
    "knowledge base chatbot",
    "custom AI assistant",
    "website automation",
    "visitor engagement",
    "24/7 chatbot",
    "AI customer support",
    "no-code chatbot",
    "embed chatbot",
    "AI widget",
    "smart chatbot",
    "content-trained AI",
    "personalized chatbot",
    "brand voice AI",
    "interactive portfolio",
    "AI-powered FAQ",
  ],
  authors: [{ name: "Areef Syed", url: "https://www.areefsyed.com/" }],
  creator: "Klyro",
  publisher: "Klyro",
  robots: {
    index: true,
    follow: true,
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
    siteName: "Klyro",
    title: "Klyro - Turn Your Content Into Conversations",
    description:
      "Add a custom AI chatbot to any website. Learns from your content to engage visitors 24/7.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klyro - Turn Your Content Into Conversations",
    description:
      "Add an intelligent AI chatbot to your website. Trained on your content to engage visitors with your unique persona.",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <Script
          src="http://localhost:3000/widget.js"
          data-widget-key="MnK1XElbACpl"
        />
      </body>
    </html>
  );
}
