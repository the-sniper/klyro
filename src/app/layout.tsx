import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Klyro - Turn Your Content Into Conversations",
  description:
    "Add a custom AI chatbot to any website in minutes. Klyro learns from your content to answer visitor questions 24/7 with your unique persona.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        {children}
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
      </body>
    </html>
  );
}
