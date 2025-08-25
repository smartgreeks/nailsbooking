import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Demo Page for Nail Saloons Booking System",
  description: "Modern Next.js scaffold optimized for Nail Saloons Booking System. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Nails", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Greekpapa development", "React"],
  authors: [{ name: "SmartGreeks" }],
  openGraph: {
    title: "SmartGreeks Scaffold",
    description: "Booking System development with modern React stack",
    url: "https://smartgreeks.com",
    siteName: "Smartgreeks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nail Saloons Booking System",
    description: "Nail Saloons Booking System with modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
