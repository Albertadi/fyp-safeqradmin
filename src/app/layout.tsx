// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/sidebar";
import { createClient } from "@/utils/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeQR Admin Dashboard",
  description: "Admin Dashboard for SafeQR Application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1️⃣ Create a server‐side Supabase client
  const supabase = await createClient();

  // 2️⃣ Check the current user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // (optional) you could log or handle error here:
  // if (error) console.error("Auth error in RootLayout:", error);

  return (
    <html lang="en" className="bg-white">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >

        <div className="flex min-h-screen">
          {/* only show sidebar when there is a user */}
          {user && <Sidebar />}

          {/* main content area */}
          <main className="flex-1 overflow-auto relative z-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
